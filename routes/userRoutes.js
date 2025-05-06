import express from "express";
import { login, testLogin, getUserProfile, logout } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 正式的微信登录接口
router.post("/login", login);
// 测试用登录接口
router.post("/test-login", testLogin);
router.get("/profile", authMiddleware, getUserProfile);
// 添加登出接口
router.post("/logout", authMiddleware, logout);

export default router;
