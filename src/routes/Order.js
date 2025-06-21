const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrdersPagination,
  updateByOrderId,
  getDashboardStats,
  getMetrics,
  getMostSoldItems,
  getRecentActivity,
} = require("../controller/Order");
const { protect, authorize } = require("../middleware/Auth");

// Define routes
router.post("/", protect, authorize("admin", "owner"), createOrder);
router.get("/", protect, authorize("admin", "owner"), getOrders);
router.get(
  "/order-items",
  protect,
  authorize("admin", "owner"),
  getMostSoldItems
);
router.get(
  "/order-stats",
  protect,
  authorize("admin", "owner"),
  getDashboardStats
);
router.get("/order-metrics", protect, authorize("admin", "owner"), getMetrics);
router.get(
  "/pagination",
  protect,
  authorize("admin", "owner"),
  getOrdersPagination
);
router.get(
  "/recent-activity",
  protect,
  authorize("admin", "owner"),
  getRecentActivity
);
router.get("/:id", protect, authorize("admin", "owner"), getOrderById);
router.put("/:id", protect, authorize("admin", "owner"), updateByOrderId);
router.put(
  "/status/:id",
  protect,
  authorize("admin", "owner"),
  updateOrderStatus
);
router.delete("/:id", protect, authorize("admin", "owner"), deleteOrder);

module.exports = router;
