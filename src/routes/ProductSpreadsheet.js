const express = require("express");
const router = express.Router();
const productController = require("../controller/ProductSpreadsheet");
const { protect, authorize } = require("../middleware/Auth");

router.get("/export", protect, authorize("admin"), productController.exportProducts);


module.exports = router;
