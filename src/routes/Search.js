const express = require("express");
const router = express.Router();
const Product = require("../model/Product"); // Assuming you have a Product model
const Category = require("../model/Category"); // Assuming you have a Category model

// Search Controller
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Search for products and categories that match the query
    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    });
    const categories = await Category.find({
      name: { $regex: query, $options: "i" },
    });

    res.json({ products, categories });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
