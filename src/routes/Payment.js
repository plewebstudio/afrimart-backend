const express = require("express");
const router = express.Router();
const { payment } = require("../controller/Payment");
const { protect } = require("../middleware/Auth");

router.post("/create-checkout-session", payment);

module.exports = router;
