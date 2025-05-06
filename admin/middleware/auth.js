export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({
            code: 401,
            status: "error",
            message: "未授权访问"
        });
    }
    next();
}; 