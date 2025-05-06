import { createResponse } from "../../common/response.js";
import { config } from "../../config/config.js";

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 这里简单处理，实际项目中应该从数据库验证
        if (username === config.admin.username && password === config.admin.password) {
            req.session.adminId = 1;
            req.session.username = username;
            return res.json(createResponse(200, "success", null, "登录成功"));
        }

        return res.status(401).json(
            createResponse(401, "error", null, "用户名或密码错误")
        );
    } catch (error) {
        console.error("登录失败:", error);
        return res.status(500).json(
            createResponse(500, "error", null, "登录失败")
        );
    }
};

export const logout = (req, res) => {
    req.session.destroy();
    res.json(createResponse(200, "success", null, "退出成功"));
};

export const checkAuth = (req, res) => {
    if (req.session && req.session.adminId) {
        return res.json(createResponse(200, "success", {
            username: req.session.username
        }));
    }
    return res.status(401).json(
        createResponse(401, "error", null, "未登录")
    );
};