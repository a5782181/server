import {
  getWechatAccessToken,
  getWechatUserInfo,
} from "../utils/wechatUtils.js";
import { generateToken } from "../utils/tokenUtils.js";
import { createResponse } from "../common/response.js";
import db from "../config/db.js";

export const login = async (req, res) => {
  try {
    const { code } = req.body;

    console.log("====================================");
    console.log("login", code);
    console.log("====================================");

    if (!code) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, "缺少微信授权码"));
    }

    // 获取微信 access_token 和 openid
    const tokenResult = await getWechatAccessToken(code);
    if (!tokenResult.success) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, tokenResult.message));
    }

    const { access_token, openid } = tokenResult.data;

    // 检查用户是否存在
    const [existingUsers] = await db.query(
      "SELECT id, openid, nickname, avatar FROM user WHERE openid = ?",
      [openid]
    );

    let userId;

    // 新用户，获取微信信息并创建用户
    const userInfoResult = await getWechatUserInfo(access_token, openid);
    if (!userInfoResult.success) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, userInfoResult.message));
    }

    const { nickname, headimgurl: avatar } = userInfoResult.data;

    if (existingUsers.length === 0) {
      // 插入新用户
      const [insertResult] = await db.query(
        "INSERT INTO user (openid, nickname, avatar) VALUES (?, ?, ?)",
        [openid, nickname, avatar]
      );
      userId = insertResult.insertId;
    } else {
      // 更新用户信息
      userId = existingUsers[0].id;
      await db.query(
        "UPDATE user SET nickname = ?, avatar = ? WHERE id = ?",
        [nickname, avatar, userId]
      );
    }

    // 生成 JWT token（3个月过期）
    const payload = {
      user_id: userId,
      openid: openid,
    };
    const { token } = generateToken(payload);

    // 计算 token 过期时间
    const tokenExpireTime = new Date();
    tokenExpireTime.setMonth(tokenExpireTime.getMonth() + 3);

    // 更新用户的 token 信息
    await db.query(
      "UPDATE user SET access_token = ?, token_expire_time = ? WHERE id = ?",
      [token, tokenExpireTime, userId]
    );

    // 获取最新的用户信息
    const [users] = await db.query(
      "SELECT id, openid, nickname, avatar FROM user WHERE id = ?",
      [userId]
    );

    const userData = {
      ...users[0],
      token,
      expire_time: tokenExpireTime,
    };

    return res.json(createResponse(200, "success", userData, "登录成功"));
  } catch (error) {
    console.error("登录失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "登录失败，请稍后重试"));
  }
};

// 测试用登录接口
export const testLogin = async (req, res) => {
  try {
    const { code } = req.body;

    // 模拟微信返回的数据
    const mockWechatData = {
      access_token: "test_access_token",
      openid: "test_openid_" + Math.random().toString(36).substr(2, 9),
      nickname: "测试用户",
      headimgurl: "https://placekitten.com/200/200", // 使用随机猫咪图片作为测试头像
    };

    // 检查用户是否存在
    const [existingUsers] = await db.query(
      "SELECT id, openid, nickname, avatar FROM user WHERE openid = ?",
      [mockWechatData.openid]
    );

    let userId;

    if (existingUsers.length === 0) {
      // 新用户，创建用户记录
      const [insertResult] = await db.query(
        "INSERT INTO user (openid, nickname, avatar) VALUES (?, ?, ?)",
        [mockWechatData.openid, mockWechatData.nickname, mockWechatData.headimgurl]
      );
      userId = insertResult.insertId;
    } else {
      userId = existingUsers[0].id;
    }

    // 生成 JWT token（3个月过期）
    const payload = {
      user_id: userId,
      openid: mockWechatData.openid,
    };
    const { token } = generateToken(payload);

    // 计算 token 过期时间
    const tokenExpireTime = new Date();
    tokenExpireTime.setMonth(tokenExpireTime.getMonth() + 3);

    // 更新用户的 token 信息
    await db.query(
      "UPDATE user SET access_token = ?, token_expire_time = ? WHERE id = ?",
      [token, tokenExpireTime, userId]
    );

    // 获取最新的用户信息
    const [users] = await db.query(
      "SELECT id, openid, nickname, avatar FROM user WHERE id = ?",
      [userId]
    );

    const userData = {
      ...users[0],
      token,
      expire_time: tokenExpireTime,
    };

    return res.json(createResponse(200, "success", userData, "登录成功"));
  } catch (error) {
    console.error("登录失败:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "登录失败，请稍后重试"));
  }
};

// 获取用户信息和订单统计
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    console.log("====================================");
    console.log("getUserProfile", userId);
    console.log("====================================");

    // 获取用户基本信息
    const [userInfo] = await db.query(
      "SELECT id, nickname, avatar FROM user WHERE id = ?",
      [userId]
    );

    // 获取订单统计
    const [orderStats] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 0 THEN 1 END) as pending_payment,
        COUNT(CASE WHEN status = 1 THEN 1 END) as paid,
        COUNT(CASE WHEN status = 2 THEN 1 END) as shipped,
        COUNT(CASE WHEN status = 3 THEN 1 END) as completed
      FROM \`order\` 
      WHERE user_id = ?`,
      [userId]
    );

    // 获取收货地址数量
    const [addressCount] = await db.query(
      "SELECT COUNT(*) as count FROM address WHERE user_id = ?",
      [userId]
    );

    const profileData = {
      userInfo: userInfo[0],
      orderStats: orderStats[0],
      addressCount: addressCount[0].count
    };

    return res.json(createResponse(200, "success", profileData));
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return res.status(500).json(
      createResponse(500, "error", null, "获取用户信息失败")
    );
  }
};

// 登出
export const logout = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 清除用户的 token 信息
        await db.query(
            "UPDATE user SET access_token = NULL, token_expire_time = NULL WHERE id = ?",
            [userId]
        );

        return res.json(
            createResponse(200, "success", null, "登出成功")
        );
    } catch (error) {
        console.error("登出失败:", error);
        return res.status(500).json(
            createResponse(500, "error", null, "登出失败")
        );
    }
};
