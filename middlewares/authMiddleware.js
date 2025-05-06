import { createResponse } from "../common/response.js";
import db from "../config/db.js";
import { verifyToken } from "../utils/tokenUtils.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(createResponse(401, "error", null, "Token缺失或格式无效"));
  }

  const token = authHeader.split(" ")[1];
  const verifyResult = verifyToken(token);

  if (!verifyResult.success) {
    return res.status(401).json(verifyResult);
  }

  try {
    const [result] = await db.query(
      "SELECT 1 FROM user WHERE id = ? AND access_token = ? AND token_expire_time > NOW()",
      [verifyResult.decoded.user_id, token]
    );

    if (result.length === 0) {
      return res
        .status(401)
        .json(createResponse(401, "error", null, "Token无效或已过期"));
    }

    req.user = {
      user_id: verifyResult.decoded.user_id,
      openid: verifyResult.decoded.openid,
    };

    next();
  } catch (error) {
    console.error("Token验证数据库查询失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "服务器内部错误"));
  }
};
