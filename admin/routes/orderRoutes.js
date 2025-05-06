import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getOrders,
    updateOrderStatus,
    deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router; 