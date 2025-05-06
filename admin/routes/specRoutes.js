import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getSpecs,
    addSpec,
    updateSpec,
    deleteSpec,
} from "../controllers/specController.js";

const router = express.Router();

router.use(requireAuth);

// 获取商品规格列表
router.get("/products/:productId/specs", getSpecs);

// 规格管理
router.post("/specs", addSpec);
router.put("/specs/:id", updateSpec);
router.delete("/specs/:id", deleteSpec);

export default router; 