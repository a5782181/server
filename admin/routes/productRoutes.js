import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getProducts);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router; 