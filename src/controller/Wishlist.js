const Wishlist = require("../model/Wishlist");
const Product = require("../model/Product");
const mongoose = require("mongoose");

// async function addToWishlist(req, res) {
//   try {
//     const { productId } = req.body;
//     const { id: userId } = req.user;

//     // Check if product exists
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // Find user's wishlist
//     let wishlist = await Wishlist.findOne({ userId });

//     if (!wishlist) {
//       // If no wishlist exists, create one and add the product
//       wishlist = new Wishlist({ userId, products: [productId] });
//       await wishlist.save();

//       // Mark product as wishlisted for this user
//       product.isWishlisted = true;
//       await product.save();

//       return res.status(200).json({ message: "Added to wishlist", wishlist });
//     }

//     // Check if product is already in wishlist
//     const index = wishlist.products.indexOf(productId);
//     if (index !== -1) {
//       // Remove product from wishlist
//       wishlist.products.splice(index, 1);
//       await wishlist.save();

//       // Update product's wishlisted status (only for this user)
//       product.isWishlisted = false;
//       await product.save();

//       return res
//         .status(200)
//         .json({ message: "Removed from wishlist", wishlist });
//     } else {
//       // Add product to wishlist
//       wishlist.products.push(productId);
//       await wishlist.save();

//       // Mark product as wishlisted
//       product.isWishlisted = true;
//       await product.save();

//       return res.status(200).json({ message: "Added to wishlist", wishlist });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// Remove product from wishlist

async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.body;
    const { id: userId } = req.user;

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      (product) => !product.equals(productId)
    );

    await wishlist.save();

    return res
      .status(200)
      .json({ message: "Product removed from wishlist", wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

// Get user's wishlist
// async function getWishlist(req, res) {
//   try {
//     const { id: userId } = req.user;

//     // Find the user's wishlist
//     const wishlist = await Wishlist.findOne({ userId }).populate("products");

//     if (!wishlist) {
//       return res.status(404).json({ message: "Wishlist not found" });
//     }

//     return res.status(200).json({ wishlist });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const { id: userId } = req.user;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(product);
    // Find or create the user's wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [{ productId }] });
      await wishlist.save();
      return res.status(200).json({ message: "Added to wishlist", wishlist });
    }

    // Check if the product is already in the wishlist
    const index = wishlist.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (index !== -1) {
      // Remove the product from the wishlist
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return res
        .status(200)
        .json({ message: "Removed from wishlist", wishlist });
    } else {
      // Add product to wishlist
      wishlist.products.push({ productId });
      await wishlist.save();
      return res.status(200).json({ message: "Added to wishlist", wishlist });
    }
  } catch (error) {
    console.error("Error managing wishlist:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getWishlist(req, res) {
  try {
    const { id: userId } = req.user;

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "products.productId",
      select: "name description file BasePrice category StockQuantity",
      populate: { path: "category", select: "name" },
    });

    if (!wishlist || wishlist.products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Apply pagination
    const totalWishlistItems = wishlist.products.length;
    const totalPages = Math.ceil(totalWishlistItems / limit);
    const paginatedProducts = wishlist.products.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginatedProducts.length,
      data: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// async function displayProducts(req, res) {
//   const currentUserId = req.user.id;
//   console.log(currentUserId);
//   const products = await Product.aggregate([
//     {
//       $lookup: {
//         from: "Wishlist", // make sure this is your actual collection name
//         let: { prodId: "$_id" },
//         pipeline: [
//           // Only consider wishlist documents for the current user
//           { $match: { userId: new mongoose.Types.ObjectId(currentUserId) } },
//           { $unwind: "$products" },
//           // Match the product within the wishlist's products array
//           { $match: { $expr: { $eq: ["$products.productId", "$$prodId"] } } },
//           { $count: "count" },
//         ],
//         as: "wishlistData",
//       },
//     },
//     {
//       $addFields: {
//         wishlistCount: {
//           $ifNull: [{ $arrayElemAt: ["$wishlistData.count", 0] }, 0],
//         },
//       },
//     },
//     {
//       $project: { wishlistData: 0 },
//     },
//   ]);

//   res.status(200).json({ success: true, data: products });
// }

async function displayProducts(req, res) {
  // Use req.user._id instead of req.user.id if your token provides _id
  const currentUserId = req.user._id;
  console.log("Current User ID:", currentUserId);

  const products = await Product.aggregate([
    {
      $lookup: {
        from: "wishlists", // ensure this matches your collection name in MongoDB
        let: { prodId: "$_id" },
        pipeline: [
          // Filter wishlists by the current user
          { $match: { userId: new mongoose.Types.ObjectId(currentUserId) } },
          { $unwind: "$products" },
          // Check if the wishlist's productId matches the product's _id
          { $match: { $expr: { $eq: ["$products.productId", "$$prodId"] } } },
          { $count: "count" },
        ],
        as: "wishlistData",
      },
    },
    {
      $addFields: {
        wishlistCount: {
          $ifNull: [{ $arrayElemAt: ["$wishlistData.count", 0] }, 0],
        },
      },
    },
    // Only include products that are in the current user's wishlist
    {
      $match: { wishlistCount: { $gt: 0 } },
    },
    {
      $project: { wishlistData: 0 },
    },
  ]);

  res.status(200).json({ success: true, data: products });
}

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  displayProducts,
};
