import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

// 配置
export const config = {
  // 端口
  port: Number(process.env.PORT),

  // 管理员
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },

  // 数据库
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  // 微信
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },

  // 支付
  pay: {
    mchId: process.env.MCH_ID,
    serial_no: process.env.SERIAL_NO,
    cert: fs.readFileSync(path.resolve(process.env.CERT_PATH || ''), 'utf-8'),
    mchPrivateKey: fs.readFileSync(path.resolve(process.env.PRIVATE_KEY_PATH || ''), 'utf-8'),
    apiV3Key: process.env.API_V3_KEY,
  },

  // 基础URL
  baseUrl: process.env.BASE_URL,

  // 客户端URL
  clientUrl: process.env.CLIENT_URL,
};

// 验证必要的环境变量
const requiredEnvVars = [
  'PORT',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_DATABASE',
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'MCH_ID',
  'SERIAL_NO',
  'API_V3_KEY',
  'BASE_URL',
  'CLIENT_URL',
  'CERT_PATH',
  'PRIVATE_KEY_PATH'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} 环境变量未设置、请项目根目录下的.env文件中设置`);
  }
}