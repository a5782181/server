import db from "../config/db.js";
import { createResponse } from "../common/response.js";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/config.js";

// 生成符合微信支付要求的订单号
const generateOrderNo = () => {
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `WX${timestamp}${random}`;
};

// 创建订单
export const createOrder = async (req, res) => {
  const { items, address_id } = req.body;
  const userId = req.user.user_id;

  try {
    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      let totalAmount = 0;

      // 1. 验证商品信息并计算总价
      for (const item of items) {
        const [products] = await connection.query(
          "SELECT p.price, p.stock, ps.price as spec_price, ps.stock as spec_stock " +
            "FROM product p " +
            "LEFT JOIN product_spec ps ON ps.id = ? AND ps.product_id = p.id " +
            "WHERE p.id = ? AND p.is_on_sale = 1",
          [item.spec_id, item.product_id]
        );

        if (products.length === 0) {
          throw new Error("商品不存在或已下架");
        }

        const product = products[0];
        const price = item.spec_id ? product.spec_price : product.price;
        const stock = item.spec_id ? product.spec_stock : product.stock;

        if (stock < item.quantity) {
          throw new Error("商品库存不足");
        }

        totalAmount += price * item.quantity;
      }

      // 2. 创建订单
      const orderNo = generateOrderNo();
      const [orderResult] = await connection.query(
        "INSERT INTO `order` (order_no, user_id, total_amount, status, address_id) VALUES (?, ?, ?, 0, ?)",
        [orderNo, userId, totalAmount, address_id]
      );
      const orderId = orderResult.insertId;

      // 3. 创建订单项
      for (const item of items) {
        const [productInfo] = await connection.query(
          "SELECT p.name, p.image, COALESCE(ps.price, p.price) as final_price " +
            "FROM product p " +
            "LEFT JOIN product_spec ps ON ps.id = ? AND ps.product_id = p.id " +
            "WHERE p.id = ?",
          [item.spec_id, item.product_id]
        );

        await connection.query(
          "INSERT INTO order_item (order_id, product_id, product_name, product_image, price, quantity) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
          [
            orderId,
            item.product_id,
            productInfo[0].name,
            productInfo[0].image,
            productInfo[0].final_price,
            item.quantity,
          ]
        );
      }

      await connection.commit();

      return res.json(
        createResponse(
          200,
          "success",
          {
            order_id: orderId,
            order_no: orderNo,
            total_amount: totalAmount,
          },
          "订单创建成功"
        )
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("创建订单失败:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "error", null, error.message || "创建订单失败")
      );
  }
};

// 获取订单详情
export const getOrderDetail = async (req, res) => {
  const { orderNo } = req.params;
  const userId = req.user.user_id;

  try {
    // 获取订单基本信息
    const [orders] = await db.query(
      "SELECT o.*, a.receiver, a.phone, a.province, a.city, a.district, a.detail " +
        "FROM `order` o " +
        "LEFT JOIN address a ON o.address_id = a.id " +
        "WHERE o.order_no = ? AND o.user_id = ?",
      [orderNo, userId]
    );

    if (orders.length === 0) {
      return res
        .status(404)
        .json(createResponse(404, "error", null, "订单不存在"));
    }

    // 获取订单项
    const [orderItems] = await db.query(
      "SELECT * FROM order_item WHERE order_id = ?",
      [orders[0].id]
    );

    const orderDetail = {
      ...orders[0],
      items: orderItems,
    };

    return res.json(createResponse(200, "success", orderDetail));
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取订单详情失败"));
  }
};

// 更新订单地址
export const updateOrderAddress = async (req, res) => {
  const { orderNo } = req.params;
  const { addressId } = req.body;
  const userId = req.user.user_id;

  try {
    const [result] = await db.query(
      "UPDATE `order` SET address_id = ? " +
        "WHERE order_no = ? AND user_id = ? AND status = 0",
      [addressId, orderNo, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, "订单不存在或已支付"));
    }

    return res.json(createResponse(200, "success", null, "更新订单地址成功"));
  } catch (error) {
    console.error("更新订单地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "更新订单地址失败"));
  }
};

// 获取订单列表
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { status } = req.query;

    let query = `
      SELECT o.*, 
             a.receiver, a.phone, a.province, a.city, a.district, a.detail
      FROM \`order\` o
      LEFT JOIN address a ON o.address_id = a.id
      WHERE o.user_id = ?
    `;
    const params = [userId];

    if (status !== undefined) {
      query += " AND o.status = ?";
      params.push(status);
    }

    query += " ORDER BY o.create_time DESC";

    const [orders] = await db.query(query, params);

    // 获取每个订单的商品
    for (let order of orders) {
      const [items] = await db.query(
        "SELECT * FROM order_item WHERE order_id = ?",
        [order.id]
      );
      order.items = items;
    }

    return res.json(createResponse(200, "success", orders));
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "获取订单列表失败")
    );
  }
};

// 删除订单
export const deleteOrder = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const userId = req.user.user_id;

    const [result] = await db.query(
      "DELETE FROM `order` WHERE order_no = ? AND user_id = ?",
      [orderNo, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(
        createResponse(404, "error", null, "订单不存在")
      );
    }

    return res.json(createResponse(200, "success", null, "订单已删除"));
  } catch (error) {
    console.error("删除订单失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "删除订单失败")
    );
  }
};

// 清空订单
export const clearOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { status } = req.query;

    let query = "DELETE FROM `order` WHERE user_id = ?";
    const params = [userId];

    if (status !== undefined) {
      query += " AND status = ?";
      params.push(status);
    }

    await db.query(query, params);

    return res.json(createResponse(200, "success", null, "订单已清空"));
  } catch (error) {
    console.error("清空订单失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "清空订单失败")
    );
  }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { status } = req.body;
    const userId = req.user.user_id;

    const [result] = await db.query(
      "UPDATE `order` SET status = ? WHERE order_no = ? AND user_id = ?",
      [status, orderNo, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(
        createResponse(404, "error", null, "订单不存在")
      );
    }

    return res.json(createResponse(200, "success", null, "订单状态已更新"));
  } catch (error) {
    console.error("更新订单状态失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "更新订单状态失败")
    );
  }
};

// 创建分享订单
export const createShareOrder = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { templateId } = req.body;
    const userId = req.user.user_id;


    console.log('Debug - Request body:', req.body);
    console.log('Debug - Request params:', req.params);

    // 检查订单是否存在且属于当前用户
    const [orders] = await db.query(
      "SELECT id FROM `order` WHERE order_no = ? AND user_id = ? AND status = 0",
      [orderNo, userId]
    );

    console.log('Debug - Query params:', { orderNo, userId });
    console.log('Debug - Found orders:', orders);

    if (orders.length === 0) {
      return res.status(404).json(
        createResponse(404, "error", null, "订单不存在或已支付")
      );
    }

    // 生成分享码 (模板ID + 随机字符串)
    const shareCode = `${templateId}_${uuidv4().substring(0, 8)}`;

    // 更新订单的分享码
    await db.query(
      "UPDATE `order` SET share_code = ? WHERE order_no = ? AND user_id = ?",
      [shareCode, orderNo, userId]
    );

    // 生成分享链接
    const shareUrl = `${config.clientUrl}/share/${shareCode}`;

    return res.json(
      createResponse(200, "success", { shareUrl, shareCode }, "创建分享成功")
    );
  } catch (error) {
    console.error("创建分享失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "创建分享失败")
    );
  }
};

// 获取分享订单信息
export const getShareOrder = async (req, res) => {
  try {
    const { shareCode } = req.params;

    // 解析模板ID
    const templateId = shareCode.split('_')[0];

    // 获取订单信息
    const [orders] = await db.query(
      `SELECT o.*, a.receiver, a.phone, a.province, a.city, a.district, a.detail,
              u.nickname as creator_nickname, u.avatar as creator_avatar
       FROM \`order\` o
       LEFT JOIN address a ON o.address_id = a.id
       LEFT JOIN user u ON o.user_id = u.id
       WHERE o.share_code = ?`,
      [shareCode]
    );

    if (orders.length === 0) {
      return res.status(404).json(
        createResponse(404, "error", null, "分享订单不存在")
      );
    }

    // 获取订单项
    const [orderItems] = await db.query(
      "SELECT * FROM order_item WHERE order_id = ?",
      [orders[0].id]
    );

    const orderDetail = {
      ...orders[0],
      items: orderItems,
      templateId
    };

    return res.json(createResponse(200, "success", orderDetail));
  } catch (error) {
    console.error("获取分享订单失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "获取分享订单失败")
    );
  }
};
