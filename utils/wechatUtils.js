import axios from "axios";
import crypto from "crypto";
import fetch from "node-fetch";
import { config } from "../config/config.js";

// 缓存 access_token
let accessTokenCache = {
  token: "",
  expires: 0,
};

// 缓存 jsapi_ticket
let jsapiTicketCache = {
  ticket: "",
  expires: 0,
};

// 微信验证函数
export const verifyWechatToken = (timestamp, nonce, signature) => {
  const sortedParams = [config.wechat.token, timestamp, nonce].sort().join("");
  const hash = crypto.createHash("sha1").update(sortedParams).digest("hex");
  return hash === signature;
};

// 生成签名
function generateSignature(ticket, noncestr, timestamp, url) {
  const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
  return crypto.createHash("sha1").update(str).digest("hex");
}

// 获取微信 Access Token 和 OpenID
export const getWechatAccessToken = async (code) => {
  try {
    const response = await axios.get(
      `https://api.weixin.qq.com/sns/oauth2/access_token`,
      {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.appSecret,
          code,
          grant_type: "authorization_code",
        },
      }
    );

    // Check if there's an error in the response data
    if (response.data.errcode) {
      console.warn("微信 Access Token 错误:", response.data.errmsg);
      return { success: false, message: response.data.errmsg || "未知错误" };
    }

    return { success: true, data: response.data };
  } catch (error) {
    // Handle network errors and unexpected responses
    if (error.response) {
      console.error("微信 API 响应错误:", error.response.data);
      return {
        success: false,
        message: error.response.data.errmsg || "API 响应错误",
      };
    } else if (error.request) {
      console.error("网络错误:", error.request);
      return { success: false, message: "网络错误，请检查您的连接" };
    } else {
      console.error("获取微信 Access Token 失败:", error.message);
      return { success: false, message: "微信授权失败，请稍后重试" };
    }
  }
};

// 获取微信用户信息
export const getWechatUserInfo = async (accessToken, openid) => {
  try {
    const response = await axios.get(`https://api.weixin.qq.com/sns/userinfo`, {
      params: {
        access_token: accessToken,
        openid,
      },
    });

    // Check if there's an error in the response data
    if (response.data.errcode) {
      console.warn("微信用户信息错误:", response.data.errmsg);
      return { success: false, message: response.data.errmsg || "未知错误" };
    }

    return { success: true, data: response.data };
  } catch (error) {
    // Handle network errors and unexpected responses
    if (error.response) {
      console.error("微信用户信息响应错误:", error.response.data);
      return {
        success: false,
        message: error.response.data.errmsg || "API 响应错误",
      };
    } else if (error.request) {
      console.error("网络错误:", error.request);
      return { success: false, message: "网络错误，请检查您的连接" };
    } else {
      console.error("获取微信用户信息失败:", error.message);
      return { success: false, message: "获取用户信息失败，请稍后重试" };
    }
  }
};

// 获取 access_token
async function getAccessToken() {
  if (accessTokenCache.token && accessTokenCache.expires > Date.now()) {
    return accessTokenCache.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.appSecret}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("Access token response:", data);

    if (data.errcode) {
      throw new Error(`WeChat API error: ${data.errmsg} (${data.errcode})`);
    }

    if (data.access_token) {
      accessTokenCache = {
        token: data.access_token,
        expires: Date.now() + data.expires_in * 1000 - 60000,
      };
      return data.access_token;
    }
    throw new Error("Access token not found in response");
  } catch (error) {
    console.error("Get access_token error details:", {
      error: error.message,
      appId: config.wechat.appId,
    });
    throw error;
  }
}

// 获取 jsapi_ticket
async function getJsapiTicket() {
  if (jsapiTicketCache.ticket && jsapiTicketCache.expires > Date.now()) {
    return jsapiTicketCache.ticket;
  }

  try {
    const accessToken = await getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("Jsapi ticket response:", data);

    if (data.errcode !== 0) {
      throw new Error(`WeChat API error: ${data.errmsg} (${data.errcode})`);
    }

    if (data.ticket) {
      jsapiTicketCache = {
        ticket: data.ticket,
        expires: Date.now() + data.expires_in * 1000 - 60000,
      };
      return data.ticket;
    }
    throw new Error("Jsapi ticket not found in response");
  } catch (error) {
    console.error("Get jsapi_ticket error:", error);
    throw error;
  }
}

// 获取 JS-SDK 配置
export async function getJsConfig(url) {
  try {
    const jsapiTicket = await getJsapiTicket();
    const nonceStr = Math.random().toString(36).substr(2, 15);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = generateSignature(jsapiTicket, nonceStr, timestamp, url);

    return {
      nonceStr,
      timestamp,
      signature,
    };
  } catch (error) {
    console.error("Get JS config error:", error);
    throw error;
  }
}
