import express from "express";
import { getPayParams, handlePayCallback } from "../controllers/payController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 获取支付参数
router.post("/params", authMiddleware, getPayParams);

// 支付回调通知
router.post("/callback", handlePayCallback);

export default router; 