const express = require("express");
const router = express.Router();
const { createOrderSummary } = require("../controller/OrderSummary");
const { protect, authorize } = require("../middleware/Auth");

// When the frontend calls this route (e.g., via a POST request),
// it triggers the creation of a new order summary spreadsheet.
router.post("/", createOrderSummary);

module.exports = router;
