import jwt from "jsonwebtoken";
import { createResponse } from "../common/response.js";

/**
 * 生成 JWT Token
 * @param {Object} payload - 要加密的数据
 * @returns {Object} - 包含生成的 token 或错误信息的对象
 */
export const generateToken = (payload) => {
  try {
    // 生成过期时间：一个月（30天）
    const expiresIn = 30 * 24 * 60 * 60; // 秒

    const token = jwt.sign(
      { ...payload },
      "0youyouquanyouyouquanyouyouquan0", // 替换为你的密钥
      { expiresIn } // 设置过期时间
    );

    return { success: true, token };
  } catch (error) {
    console.error("Token生成失败:", error);
    return createResponse(500, "error", null, "Token生成失败，请稍后重试");
  }
};

/**
 * 验证并解码 JWT Token
 * @param {string} token - 需要验证的 Token
 * @returns {Object} - 包含解码后的数据对象或错误信息的对象
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, "0youyouquanyouyouquanyouyouquan0"); // 替换为你的密钥
    return { success: true, decoded };
  } catch (error) {
    // 根据错误类型返回适当的响应
    if (error instanceof jwt.TokenExpiredError) {
      console.warn("Token已过期:", error.message);
      return createResponse(401, "error", null, "Token已过期，请重新登录");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn("无效的Token:", error.message);
      return createResponse(400, "error", null, "无效的Token");
    } else {
      console.error("Token验证失败:", error.message);
      return createResponse(500, "error", null, "Token验证失败，请稍后重试");
    }
  }
};