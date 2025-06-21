const mongoose = require("mongoose");

const BestSellerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      unique: true,
      required: true,
    },
    soldQuantity: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BestSeller", BestSellerSchema);
