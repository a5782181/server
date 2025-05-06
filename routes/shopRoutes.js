import express from "express";
import {
  getProducts,
  getProductById,
  getCategories,
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getProductSpecs,
  setDefaultAddress,
  getOrderPreview,
  clearCart,
} from "../controllers/shopController.js";
import {
  createOrder,
  getOrderDetail,
  updateOrderAddress,
  getOrders,
  deleteOrder,
  clearOrders,
  updateOrderStatus,
  createShareOrder,
  getShareOrder,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 商品相关接口
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.get("/categories", getCategories);
router.get("/products/:id/specs", getProductSpecs);

// 购物车相关接口
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.put("/cart/:id", authMiddleware, updateCartItem);
router.delete("/cart/:id", authMiddleware, deleteCartItem);
router.delete('/cart', authMiddleware, clearCart);

// 收货地址相关接口
router.get("/addresses", authMiddleware, getAddresses);
router.post("/addresses", authMiddleware, addAddress);
router.put("/addresses/:id", authMiddleware, updateAddress);
router.delete("/addresses/:id", authMiddleware, deleteAddress);
router.put("/addresses/:id/default", authMiddleware, setDefaultAddress);

// 订单相关接口
router.post("/orders/preview", authMiddleware, getOrderPreview);
router.post("/orders", authMiddleware, createOrder);
router.get("/orders/:orderNo", authMiddleware, getOrderDetail);
router.put("/orders/:orderNo/address", authMiddleware, updateOrderAddress);
router.get("/orders", authMiddleware, getOrders);
router.delete("/orders/:orderNo", authMiddleware, deleteOrder);
router.delete("/orders", authMiddleware, clearOrders);
router.put("/orders/:orderNo/status", authMiddleware, updateOrderStatus);

// 分享相关接口
router.post("/orders/:orderNo/share", authMiddleware, createShareOrder);
router.get("/share/:shareCode", getShareOrder);

export default router;
