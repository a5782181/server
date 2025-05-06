import { createResponse } from "../common/response.js";
import db from "../config/db.js";
import WechatPay from "wechatpay-node-v3";
import { config } from "../config/config.js";
import request from "superagent";

// 实例化微信支付对象
const wechatPay = new WechatPay({
    appid: config.wechat.appId,
    mchid: config.pay.mchId,
    serial_no: config.pay.serial_no,
    publicKey: config.pay.cert,
    privateKey: config.pay.mchPrivateKey,
    key: config.pay.apiV3Key,
});

// 获取支付参数
export const getPayParams = async (req, res) => {
    const { order_no } = req.body;
    const userId = req.user.user_id;

    try {
        // 1. 查询订单信息
        const [orders] = await db.query(
            "SELECT * FROM `order` WHERE order_no = ? AND user_id = ? AND status = 0",
            [order_no, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json(
                createResponse(404, "error", null, "订单不存在或已支付")
            );
        }

        const order = orders[0];

        // 2. 调用微信支付统一下单
        const params = {
            appid: config.wechat.appId,
            mchid: config.pay.mchId,
            description: `订单支付-${order.order_no}`,
            out_trade_no: order.order_no,
            notify_url: `${config.baseUrl}/v1/pay/callback`,
            amount: {
                total: Math.round(order.total_amount * 100), // 转换为分
                currency: "CNY",
            },
            payer: { openid: req.user.openid }, // 假设用户信息中包含 openid
        };

        const nonce_str = Math.random().toString(36).substr(2, 15);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const url = "/v3/pay/transactions/jsapi";

        // 3. 获取签名
        const signature = wechatPay.getSignature(
            "POST",
            nonce_str,
            timestamp,
            url,
            params
        );
        const authorization = wechatPay.getAuthorization(
            nonce_str,
            timestamp,
            signature
        );

        // 4. 请求微信支付接口
        const paymentResponse = await request
            .post("https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi")
            .send(params)
            .set({
                Accept: "application/json",
                "Content-Type": "application/json",
                "User-Agent": "request-promise",
                Authorization: authorization,
            })
            .timeout({
                response: 10000,
                deadline: 30000,
            })
            .retry(3);

        const { prepay_id } = paymentResponse.body;
        if (!prepay_id) {
            return res.status(500).json(
                createResponse(500, "error", null, "获取支付参数失败")
            );
        }

        // 5. 生成前端调用支付接口需要的参数
        const packageStr = `prepay_id=${prepay_id}`;
        const stringToSign = `${config.wechat.appId}\n${timestamp}\n${nonce_str}\n${packageStr}\n`;
        const paySign = wechatPay.sign(stringToSign);

        // 6. 返回支付参数
        return res.json(
            createResponse(200, "success", {
                appId: config.wechat.appId,
                timeStamp: timestamp,
                nonceStr: nonce_str,
                package: packageStr,
                signType: "RSA",
                paySign,
            })
        );
    } catch (error) {
        console.error("获取支付参数失败:", error);
        return res.status(500).json(
            createResponse(500, "error", null, "获取支付参数失败")
        );
    }
};

// 处理支付回调
export const handlePayCallback = async (req, res) => {
    try {
        console.log("====================================");
        console.log("handlePayCallback", req.body);
        console.log("====================================");
        // 1. 验证签名
        const wechatpaySignature = req.headers["wechatpay-signature"];
        const wechatpayTimestamp = req.headers["wechatpay-timestamp"];
        const wechatpayNonce = req.headers["wechatpay-nonce"];
        const wechatpaySerial = req.headers["wechatpay-serial"];

        if (!wechatpaySignature || !wechatpayTimestamp || !wechatpayNonce || !wechatpaySerial) {
            return res.status(200).json({ code: "FAIL", message: "缺少必要的签名信息" });
        }

        // 2. 验证签名
        const signatureValid = await wechatPay.verifySign({
            timestamp: wechatpayTimestamp,
            nonce: wechatpayNonce,
            body: JSON.stringify(req.body),
            serial: wechatpaySerial,
            signature: wechatpaySignature,
        });

        if (!signatureValid) {
            console.log("====================================");
            console.log("签名验证失败", req.body);
            console.log("====================================");
            return res.status(200).json({ code: "FAIL", message: "签名验证失败" });
        }

        // 3. 解密回调数据
        const { resource } = req.body;
        const decryptedData = wechatPay.decipher_gcm(
            resource.ciphertext,
            resource.associated_data || "",
            resource.nonce,
            config.pay.apiV3Key
        );

        console.log("====================================");
        console.log("解密回调数据", decryptedData);
        console.log("====================================");

        // 4. 验证支付状态
        if (decryptedData.trade_state === "SUCCESS") {
            console.log("====================================");
            console.log("支付成功", decryptedData);
            console.log("====================================");
            const { out_trade_no, transaction_id, success_time } = decryptedData;

            // 5. 更新订单状态
            await db.query(
                "UPDATE `order` SET status = 1, pay_time = ? WHERE order_no = ? AND status = 0",
                [success_time, out_trade_no]
            );

            return res.status(200).json({ code: "SUCCESS", message: "支付成功" });
        }

        console.log("====================================");
        console.log("支付未成功", decryptedData);
        console.log("====================================");

        return res.status(200).json({ code: "FAIL", message: "支付未成功" });
    } catch (error) {
        console.error("处理支付回调失败:", error);
        console.log("====================================");
        console.log("处理支付回调失败", error);
        console.log("====================================");
        return res.status(200).json({ code: "FAIL", message: "处理支付回调失败" });
    }
}; 