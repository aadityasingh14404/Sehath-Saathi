import express from "express";
import {
    getAllMedicines,
    getMedicineById,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addStock,
    updateStock,
    getLowStockMedicines,
    getExpiringMedicines,
    getMedicineAnalytics,
    getMedicineSalesReport,
    searchMedicines
} from "../controllers/medicineController.js";
import {
    createMedicineOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    createPrescription,
    getDoctorPrescriptions,
    getOrderAnalytics
} from "../controllers/medicineOrderController.js";
import authUser from "../middleware/authUser.js";
import authDoctor from "../middleware/authDoctor.js";
import authAdmin from "../middleware/authAdmin.js";

const router = express.Router();

// Medicine routes
router.get("/", getAllMedicines); // Public - for browsing medicines
router.get("/search", searchMedicines); // Public - search medicines
router.get("/analytics", authAdmin, getMedicineAnalytics); // Admin only
router.get("/sales-report", authAdmin, getMedicineSalesReport); // Admin only
router.get("/low-stock", authAdmin, getLowStockMedicines); // Admin only
router.get("/expiring", authAdmin, getExpiringMedicines); // Admin only
router.get("/:id", getMedicineById); // Public - get single medicine

// Admin medicine management
router.post("/", authAdmin, addMedicine); // Admin only
router.put("/:id", authAdmin, updateMedicine); // Admin only
router.delete("/:id", authAdmin, deleteMedicine); // Admin only

// Stock management (Admin only)
router.post("/:medicineId/stock", authAdmin, addStock);
router.put("/stock/:stockId", authAdmin, updateStock);

// Medicine orders
router.post("/orders", authUser, createMedicineOrder); // User creates order
router.get("/orders/user/:userId", authUser, getUserOrders); // User's orders
router.get("/orders", authAdmin, getAllOrders); // Admin - all orders
router.get("/orders/:orderId", authUser, getOrderById); // Get specific order
router.put("/orders/:orderId/status", authAdmin, updateOrderStatus); // Admin updates status
router.put("/orders/:orderId/cancel", authUser, cancelOrder); // User cancels order

// Doctor prescription routes
router.post("/prescriptions", authDoctor, createPrescription); // Doctor creates prescription
router.get("/prescriptions/doctor/:doctorId", authDoctor, getDoctorPrescriptions); // Doctor's prescriptions

// Analytics routes
router.get("/orders/analytics", authAdmin, getOrderAnalytics); // Admin order analytics

export default router;
