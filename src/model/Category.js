const mongoose = require("mongoose");

// 🔥 Import Product model before using it
require("./Product");

//shelf schema
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description can not be more than 500 characters"],
    },
    categoryDisplay: {
      type: String,
      default:
        "https://i.pinimg.com/736x/e8/03/38/e803386f80706038a57472c2ee48a8f7.jpg",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true,
  }
);

// ✅ Ensure Product model is registered before using it in `populate`
CategorySchema.virtual("product", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

// ✅ Fix: Use correct field `category` in `deleteMany`
CategorySchema.pre("remove", async function (next) {
  console.log(
    `Products associated with Category with ID: ${this._id} is being deleted`
  );
  await this.model("Product").deleteMany({ category: this._id }); // Fixed from `shelf` to `category`
  next();
});

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
