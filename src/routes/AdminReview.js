const express = require("express");
const router = express.Router();
const { AdminReview } = require("../controller/AdminReview");
const { protect, authorize } = require("../middleware/Auth");

// Define routes
router.post("/", protect, authorize("admin"), AdminReview);

module.exports = router;
