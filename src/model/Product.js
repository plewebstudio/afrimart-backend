const mongoose = require("mongoose");

//material schema
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Please add a name"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    color: {
      type: String,
      default: "red",
    },
    file: {
      type: [String],
      required: true,
    },
    BasePrice: {
      type: Number,
      required: true,
    },
    StockQuantity: {
      type: Number,
      required: true,
    },
    Discount: {
      type: Number,
      default: 0,
      set: (val) => {
        if (typeof val === "string") {
          return parseFloat(val.replace("%", "")); // Remove '%' and convert to number
        }
        return val;
      },
    },
    DiscountType: {
      type: String,
      enum: ["No Discount", "Percentage", "Fixed Amount"],
      default: "No Discount",
    },
    Variants: {
      type: String,
      default: "150kg",
    },
    PackagingType: {
      type: String,
    },
    color: {
      type: String,
      default: "red",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
