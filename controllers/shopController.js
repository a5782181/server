import db from "../config/db.js";
import { createResponse } from "../common/response.js";

// 获取所有商品
export const getProducts = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = category_id
      ? "SELECT * FROM product WHERE category_id = ? LIMIT ? OFFSET ?"
      : "SELECT * FROM product LIMIT ? OFFSET ?";
    const params = category_id ? [category_id, limit, offset] : [limit, offset];

    const [products] = await db.query(query, params);
    return res.json(createResponse(200, "success", products, "获取商品成功"));
  } catch (error) {
    console.error("获取商品失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取商品失败"));
  }
};

// 获取单个商品
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db.query("SELECT * FROM product WHERE id = ?", [
      id,
    ]);

    if (product.length === 0) {
      return res
        .status(404)
        .json(createResponse(404, "error", null, "商品未找到"));
    }

    return res.json(createResponse(200, "success", product[0], "获取商品成功"));
  } catch (error) {
    console.error("获取商品失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取商品失败"));
  }
};

// 获取所有分类
export const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query("SELECT * FROM category");
    return res.json(createResponse(200, "success", categories, "获取分类成功"));
  } catch (error) {
    console.error("获取分类失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取分类失败"));
  }
};

// 获取用户购物车
export const getCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [cartItems] = await db.query(
      `SELECT c.id, c.quantity, c.product_id, c.spec_id, 
              p.name as product_name, p.image as product_image,
              ps.name as spec_name, ps.price 
       FROM cart c
       LEFT JOIN product p ON p.id = c.product_id
       LEFT JOIN product_spec ps ON ps.id = c.spec_id
       WHERE c.user_id = ?`,
      [userId]
    );
    return res.json(createResponse(200, "success", cartItems, "获取购物车成功"));
  } catch (error) {
    console.error("获取购物车失败:", error);
    return res.status(500).json(createResponse(500, "error", null, "获取购物车失败"));
  }
};

// 添加商品到购物车
export const addToCart = async (req, res) => {
  try {
    const { product_id, spec_id, quantity } = req.body;
    const userId = req.user.user_id;

    // 检查商品和规格是否存在
    const [product] = await db.query("SELECT * FROM product WHERE id = ?", [
      product_id,
    ]);

    if (product.length === 0) {
      return res
        .status(404)
        .json(createResponse(404, "error", null, "商品不存在"));
    }

    const [spec] = await db.query(
      "SELECT * FROM product_spec WHERE id = ? AND product_id = ?",
      [spec_id, product_id]
    );

    if (spec.length === 0) {
      return res
        .status(404)
        .json(createResponse(404, "error", null, "商品规格不存在"));
    }

    // 检查库存
    if (spec[0].stock < quantity) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, "商品库存不足"));
    }

    // 更新或插入购物车记录
    await db.query(
      `INSERT INTO cart (user_id, product_id, spec_id, quantity) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [userId, product_id, spec_id, quantity, quantity]
    );

    return res
      .status(201)
      .json(createResponse(201, "success", null, "商品已添加到购物车"));
  } catch (error) {
    console.error("添加商品到购物车失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "添加商品到购物车失败"));
  }
};

// 更新购物车商品数量
export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    await db.query("UPDATE cart SET quantity = ? WHERE id = ?", [quantity, id]);
    return res.json(
      createResponse(200, "success", null, "购物车商品数量已更新")
    );
  } catch (error) {
    console.error("更新购物车商品数量失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "更新购物车商品数量失败"));
  }
};

// 删除购物车商品
export const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM cart WHERE id = ?", [id]);
    return res.json(createResponse(200, "success", null, "购物车商品已删除"));
  } catch (error) {
    console.error("删除购物车商品失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "删除购物车商品失败"));
  }
};

// 获取用户收货地址
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.user_id; // 假设用户ID从请求中获取
    const [addresses] = await db.query(
      "SELECT * FROM address WHERE user_id = ?",
      [userId]
    );
    return res.json(
      createResponse(200, "success", addresses, "获取收货地址成功")
    );
  } catch (error) {
    console.error("获取收货地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取收货地址失败"));
  }
};

// 添加收货地址
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.user_id; // 假设用户ID从请求中获取
    const { receiver, phone, province, city, district, detail, is_default } =
      req.body;

    await db.query(
      "INSERT INTO address (user_id, receiver, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, receiver, phone, province, city, district, detail, is_default]
    );

    return res
      .status(201)
      .json(createResponse(201, "success", null, "收货地址已添加"));
  } catch (error) {
    console.error("添加收货地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "添加收货地址失败"));
  }
};

// 更新收货地址
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const { receiver, phone, province, city, district, detail, is_default } =
      req.body;

    // 验证地址是否属于当前用户
    const [address] = await db.query(
      "SELECT * FROM address WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (address.length === 0) {
      return res
        .status(404)
        .json(createResponse(404, "error", null, "地址不存在或无权限修改"));
    }

    // 如果设置为默认地址，先将其他地址设为非默认
    if (is_default) {
      await db.query("UPDATE address SET is_default = 0 WHERE user_id = ?", [
        userId,
      ]);
    }

    // 更新地址信息
    await db.query(
      `UPDATE address 
       SET receiver = ?, phone = ?, province = ?, 
           city = ?, district = ?, detail = ?, 
           is_default = ? 
       WHERE id = ? AND user_id = ?`,
      [
        receiver,
        phone,
        province,
        city,
        district,
        detail,
        is_default,
        id,
        userId,
      ]
    );

    return res.json(createResponse(200, "success", null, "收货地址已更新"));
  } catch (error) {
    console.error("更新收货地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "更新收货地址失败"));
  }
};

// 删除收货地址
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM address WHERE id = ?", [id]);
    return res.json(createResponse(200, "success", null, "收货地址已删除"));
  } catch (error) {
    console.error("删除收货地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "删除收货地址失败"));
  }
};

// 获取商品规格
export const getProductSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    const [specs] = await db.query(
      "SELECT * FROM product_spec WHERE product_id = ?",
      [id]
    );
    return res.json(createResponse(200, "success", specs, "获取商品规格成功"));
  } catch (error) {
    console.error("获取商品规格失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取商品规格失败"));
  }
};

// 设置默认地址
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // 先将所有地址设为非默认
    await db.query("UPDATE address SET is_default = 0 WHERE user_id = ?", [
      userId,
    ]);

    // 设置新的默认地址
    await db.query(
      "UPDATE address SET is_default = 1 WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    return res.json(createResponse(200, "success", null, "设置默认地址成功"));
  } catch (error) {
    console.error("设置默认地址失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "设置默认地址失败"));
  }
};

// 获取订单预览信息
export const getOrderPreview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { items } = req.body; // [{product_id, spec_id, quantity}]

    // 获取商品信息
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const [product] = await db.query(
        `SELECT p.*, ps.price as spec_price, ps.name as spec_name 
         FROM product p 
         JOIN product_spec ps ON ps.product_id = p.id 
         WHERE p.id = ? AND ps.id = ?`,
        [item.product_id, item.spec_id]
      );

      if (product.length > 0) {
        const productInfo = product[0];
        const itemAmount = productInfo.spec_price * item.quantity;
        totalAmount += itemAmount;

        orderItems.push({
          product_id: item.product_id,
          spec_id: item.spec_id,
          quantity: item.quantity,
          name: productInfo.name,
          image: productInfo.image,
          spec_name: productInfo.spec_name,
          price: productInfo.spec_price,
          amount: itemAmount,
        });
      }
    }

    // 获取默认地址
    const [address] = await db.query(
      "SELECT * FROM address WHERE user_id = ? AND is_default = 1",
      [userId]
    );

    return res.json(
      createResponse(
        200,
        "success",
        {
          items: orderItems,
          total_amount: totalAmount,
          address: address[0] || null,
        },
        "获取订单预览成功"
      )
    );
  } catch (error) {
    console.error("获取订单预览失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取订单预览失败"));
  }
};

// 清空用户购物车
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await db.query("DELETE FROM cart WHERE user_id = ?", [userId]);
    return res.json(createResponse(200, "success", null, "购物车已清空"));
  } catch (error) {
    console.error("清空购物车失败:", error);
    return res.status(500).json(createResponse(500, "error", null, "清空购物车失败"));
  }
};
