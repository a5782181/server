import db from "../../config/db.js";
import { createResponse } from "../../common/response.js";

// 获取商品规格列表
export const getSpecs = async (req, res) => {
    try {
        const { productId } = req.params;
        const [specs] = await db.query(
            "SELECT * FROM product_spec WHERE product_id = ? ORDER BY create_time DESC",
            [productId]
        );
        return res.json(createResponse(200, "success", specs));
    } catch (error) {
        console.error("获取规格列表失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "获取规格列表失败"));
    }
};

// 添加规格
export const addSpec = async (req, res) => {
    try {
        const { product_id, name, price, stock } = req.body;

        if (!product_id || !name || price === undefined) {
            return res.status(400).json(createResponse(400, "error", null, "缺少必要参数"));
        }

        const [result] = await db.query(
            "INSERT INTO product_spec (product_id, name, price, stock) VALUES (?, ?, ?, ?)",
            [product_id, name, price, stock || 0]
        );

        return res.status(201).json(
            createResponse(201, "success", { id: result.insertId }, "规格添加成功")
        );
    } catch (error) {
        console.error("添加规格失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "添加规格失败"));
    }
};

// 更新规格
export const updateSpec = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json(createResponse(400, "error", null, "缺少必要参数"));
        }

        await db.query(
            "UPDATE product_spec SET name = ?, price = ?, stock = ? WHERE id = ?",
            [name, price, stock || 0, id]
        );

        return res.json(createResponse(200, "success", null, "规格更新成功"));
    } catch (error) {
        console.error("更新规格失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "更新规格失败"));
    }
};

// 删除规格
export const deleteSpec = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM product_spec WHERE id = ?", [id]);
        return res.json(createResponse(200, "success", null, "规格删除成功"));
    } catch (error) {
        console.error("删除规格失败:", error);
        return res.status(500).json(createResponse(500, "error", null, "删除规格失败"));
    }
}; 