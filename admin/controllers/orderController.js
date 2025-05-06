import db from "../../config/db.js";
import { createResponse } from "../../common/response.js";

// 获取订单列表（带分页）
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, order_no, user_name } = req.query;
        const offset = (page - 1) * limit;

        // 构建基础查询
        let sql = `
SELECT 
    o.*,
    u.nickname as user_name,
    a.province,
    a.city,
    a.district,
    a.detail as address_detail,
    a.receiver as receiver_name,
    a.phone as receiver_phone
FROM \`order\` o
LEFT JOIN user u ON o.user_id = u.id
LEFT JOIN address a ON o.address_id = a.id
WHERE 1=1
`;

        let countSql = `
SELECT COUNT(*) as total
FROM \`order\` o
LEFT JOIN user u ON o.user_id = u.id
WHERE 1=1
`;

        const params = [];
        const countParams = [];

        // 添加查询条件
        if (status !== undefined && status !== '') {
            sql += " AND o.status = ?";
            countSql += " AND o.status = ?";
            params.push(Number(status));
            countParams.push(Number(status));
        }

        if (order_no) {
            sql += " AND o.order_no LIKE ?";
            countSql += " AND o.order_no LIKE ?";
            params.push(`%${order_no}%`);
            countParams.push(`%${order_no}%`);
        }

        if (user_name) {
            sql += " AND u.nickname LIKE ?";
            countSql += " AND u.nickname LIKE ?";
            params.push(`%${user_name}%`);
            countParams.push(`%${user_name}%`);
        }

        // 添加排序和分页
        sql += " ORDER BY o.create_time DESC LIMIT ? OFFSET ?";
        params.push(Number(limit), Number(offset));

        // 执行查询
        const [orders] = await db.query(sql, params);
        const [countResult] = await db.query(countSql, countParams);
        const total = countResult[0].total;

        // 格式化订单状态的显示
        const formattedOrders = orders.map(order => ({
            ...order,
            status_text: getStatusText(order.status),
            status: Number(order.status),
            total_amount: Number(order.total_amount)
        }));

        return res.json(createResponse(200, "success", {
            list: formattedOrders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit)
            }
        }));
    } catch (error) {
        console.error("获取订单列表失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "获取订单列表失败"));
    }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined || ![0, 1, 2, 3, 4].includes(Number(status))) {
            return res.status(400).json(createResponse(400, "error", null, "无效的订单状态"));
        }

        await db.query(
            "UPDATE `order` SET status = ? WHERE id = ?",
            [status, id]
        );

        return res.json(createResponse(200, "success", null, "订单状态更新成功"));
    } catch (error) {
        console.error("更新订单状态失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "更新订单状态失败"));
    }
};

// 删除订单
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM `order` WHERE id = ?", [id]);
        return res.json(createResponse(200, "success", null, "订单删除成功"));
    } catch (error) {
        console.error("删除订单失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "删除订单失败"));
    }
};

// 获取订单状态文本
const getStatusText = (status) => {
    const statusMap = {
        0: '待付款',
        1: '待发货',
        2: '待收货',
        3: '已完成',
        4: '已取消'
    };
    return statusMap[status] || '未知状态';
}; 