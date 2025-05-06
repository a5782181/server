import db from "../../config/db.js";
import { createResponse } from "../../common/response.js";

// 获取商品列表
export const getProducts = async (req, res) => {
    try {
        const { name, category_id, is_on_sale } = req.query;
        
        let sql = `
            SELECT p.*, c.name as category_name 
            FROM product p 
            LEFT JOIN category c ON p.category_id = c.id 
            WHERE 1=1
        `;
        const params = [];

        if (name) {
            sql += " AND p.name LIKE ?";
            params.push(`%${name}%`);
        }

        if (category_id) {
            sql += " AND p.category_id = ?";
            params.push(Number(category_id));
        }

        if (is_on_sale !== undefined && is_on_sale !== '') {
            sql += " AND p.is_on_sale = ?";
            params.push(Number(is_on_sale));
        }

        sql += " ORDER BY p.create_time DESC";

        const [products] = await db.query(sql, params);
        
        // 确保返回的数据类型正确
        const formattedProducts = products.map(product => ({
            ...product,
            category_id: Number(product.category_id),
            is_on_sale: Number(product.is_on_sale)
        }));

        return res.json(createResponse(200, "success", formattedProducts));
    } catch (error) {
        console.error("获取商品列表失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "获取商品列表失败"));
    }
};

// 添加商品
export const addProduct = async (req, res) => {
    try {
        const { name, category_id, image, original_price, price, stock, is_on_sale = 1 } = req.body;

        if (!name || !category_id || !price) {
            return res.status(400).json(createResponse(400, "error", null, "缺少必要参数"));
        }

        const [result] = await db.query(
            "INSERT INTO product (name, category_id, image, original_price, price, stock, is_on_sale) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, category_id, image, original_price, price, stock, is_on_sale]
        );

        return res.status(201).json(
            createResponse(201, "success", { id: result.insertId }, "商品添加成功")
        );
    } catch (error) {
        console.error("添加商品失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "添加商品失败"));
    }
};

// 更新商品
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, image, original_price, price, stock, is_on_sale } = req.body;

        if (!name || !category_id || !price) {
            return res.status(400).json(createResponse(400, "error", null, "缺少必要参数"));
        }

        await db.query(
            "UPDATE product SET name = ?, category_id = ?, image = ?, original_price = ?, price = ?, stock = ?, is_on_sale = ? WHERE id = ?",
            [name, category_id, image, original_price, price, stock, is_on_sale, id]
        );

        return res.json(createResponse(200, "success", null, "商品更新成功"));
    } catch (error) {
        console.error("更新商品失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "更新商品失败"));
    }
};

// 删除商品
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM product WHERE id = ?", [id]);
        return res.json(createResponse(200, "success", null, "商品删除成功"));
    } catch (error) {
        console.error("删除商品失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "删除商品失败"));
    }
}; 