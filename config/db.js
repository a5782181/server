import mysql from "mysql2/promise";
import { config } from "./config.js";

const db = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true, // 是否等待连接池的连接可用
  connectionLimit: 30, // 最大连接数，可根据实际应用负载调整
  queueLimit: 0, // 排队的最大请求数，0 表示不限制
  charset: "utf8mb4", // 设置字符集，支持 Emoji
  connectTimeout: 30000, // 连接超时时间，单位为毫秒，默认值10秒
  ssl: false,
});

db.getConnection().then((connection) => {
  console.log("Connected to MySQL database");
  connection.release();
});

export default db;
