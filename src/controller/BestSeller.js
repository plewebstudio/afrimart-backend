const BestSeller = require("../model/BestSeller"); // Import BestSeller model
const Product = require("../model/Product"); // Assuming you have a Product model
// Remove Best Sellers (Handles multiple products)
const mongoose = require("mongoose");

// Add Best Sellers (Handles multiple products)
exports.addBestSellers = async (req, res) => {
  try {
    const { products } = req.body; // Expecting an array of objects [{ productId, quantity }]

    console.log(products);
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Products must be an array with at least one item" });
    }

    const addedProducts = [];

    for (const { productId, quantity } of products) {
      if (!productId || !quantity) {
        return res
          .status(400)
          .json({ message: "Each product must have an id and quantity" });
      }

      // Check if the product already exists in best sellers
      let bestSeller = await BestSeller.findOne({ productId });

      if (bestSeller) {
        // Update quantity if product exists
        bestSeller.quantity += quantity;
        await bestSeller.save();
      } else {
        // Add new best seller product
        bestSeller = await BestSeller.create({ productId, quantity });
      }
      console.log(bestSeller);
      addedProducts.push(bestSeller);
    }

    res.status(201).json({
      message: "Best sellers updated successfully",
      data: addedProducts,
    });
  } catch (error) {
    console.error("Error adding best sellers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Best Sellers
exports.getBestSellers = async (req, res) => {
  try {
    const bestSellers = await BestSeller.find().populate("productId");
    res.status(200).json({ success: true, data: bestSellers });
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeBestSellers = async (req, res) => {
  try {
    const { products } = req.body; // Extract products array from request
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid products array" });
    }

    // Convert productId strings into ObjectId
    const productIds = products.map(
      (p) => new mongoose.Types.ObjectId(p.productId)
    );

    // Remove products from BestSeller collection
    const result = await BestSeller.deleteMany({
      productId: { $in: productIds },
    });

    return res.json({ message: "Best sellers removed successfully", result });
  } catch (error) {
    console.error("Error removing best sellers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
