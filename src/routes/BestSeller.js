const express = require("express");
const {
  addBestSellers,
  getBestSellers,
  removeBestSellers,
} = require("../controller/BestSeller");
const { protect, authorize } = require("../middleware/Auth");
const router = express.Router();

// Route to add multiple best sellers
router.post("/", protect, authorize("owner", "admin", "user"), addBestSellers);

// Route to get all best sellers
router.get("/", getBestSellers);

// Route to remove multiple best sellers
router.delete(
  "/remove",
  protect,
  authorize("owner", "admin", "user"),
  removeBestSellers
);

module.exports = router;
