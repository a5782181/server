import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { config } from "./config/config.js";
import { getJsConfig } from "./utils/wechatUtils.js";
import { createResponse } from "./common/response.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import payRoutes from "./routes/payRoutes.js";
import session from "express-session";
import MySQLStore from "express-mysql-session";

const app = express();

// ES modules 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置静态资源文件夹
app.use(express.static(path.join(__dirname, "public")));

// 允许所有跨域请求的配置
app.use(
  cors({
    origin: "*", // 允许任何域名
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 允许的 HTTP 方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
    credentials: true, // 允许发送认证信息（cookies等）
  })
);

// 现有的中间件设置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 如果不想安装 cors 包，也可以直接使用以下中间件
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  // 处理 OPTIONS 请求
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 配置 MySQL session 存储
const MySQLStoreSession = MySQLStore(session);
const sessionStore = new MySQLStoreSession({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database
});

// 添加 session 中间件
app.use(session({
  key: 'mini_shop_sid',
  secret: 'mini_shop_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24小时
    httpOnly: true,
  }
}));

// 添加获取 JS-SDK 配置的路由
app.get("/v1/wx/jsconfig", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res
        .status(400)
        .json(createResponse(400, "error", null, "缺少 url 参数"));
    }

    const config = await getJsConfig(url);
    return res.json(createResponse(200, "success", config, "获取配置成功"));
  } catch (error) {
    console.error("Get JS config error:", error);
    return res
      .status(500)
      .json(createResponse(500, "error", null, "获取配置失败"));
  }
});

// 添加用户路由
app.use("/v1/user", userRoutes);

// 添加商品路由
app.use("/v1/shop", shopRoutes);

// 添加支付路由 
app.use("/v1/pay", payRoutes);

// 添加管理后台路由
import adminCategoryRoutes from "./admin/routes/categoryRoutes.js";
import adminAuthRoutes from "./admin/routes/authRoutes.js";
import adminProductRoutes from "./admin/routes/productRoutes.js";
import adminSpecRoutes from "./admin/routes/specRoutes.js";
import adminOrderRoutes from "./admin/routes/orderRoutes.js";
app.use("/admin/api/auth", adminAuthRoutes);
app.use("/admin/api/categories", adminCategoryRoutes);
app.use("/admin/api/products", adminProductRoutes);
app.use("/admin/api/specs", adminSpecRoutes);
app.use("/admin/api/orders", adminOrderRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    status: "error",
    message: "服务器内部错误",
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
