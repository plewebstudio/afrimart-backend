const Review = require("../model/Reviews");

// Create a review for a specific product

// exports.createReview = async (req, res) => {
//   try {
//     const { productId, name, email, rating, comment, termsAccepted } = req.body;

//     if (
//       !name ||
//       !email ||
//       !rating ||
//       !comment ||
//       !termsAccepted ||
//       !productId
//     ) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     // Count user's existing reviews for the product
//     const userReviews = await Review.countDocuments({ productId, email });

//     if (userReviews >= 2) {
//       return res
//         .status(400)
//         .json({ message: "You can only submit up to 2 reviews per product." });
//     }

//     // Create a new review if limit is not reached
//     const newReview = new Review({
//       productId,
//       name,
//       email,
//       rating,
//       comment,
//       termsAccepted,
//     });

//     await newReview.save();

//     res
//       .status(201)
//       .json({ message: "Review submitted successfully", review: newReview });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

exports.createReview = async (req, res) => {
  try {
    const { productId, name, email, rating, comment, termsAccepted } = req.body;

    if (
      !name ||
      !email ||
      !rating ||
      !comment ||
      !termsAccepted ||
      !productId
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get the user ID from the authentication middleware (ensure req.user is set)
    const userId = req.user.id;

    // Count user's existing reviews for the product using the user ID
    const userReviews = await Review.countDocuments({
      productId,
      user: userId,
    });
    if (userReviews >= 2) {
      return res
        .status(400)
        .json({ message: "You can only submit up to 2 reviews per product." });
    }

    // Create a new review with the user ID included
    const newReview = new Review({
      productId,
      user: userId,
      name,
      email,
      rating,
      comment,
      termsAccepted,
    });

    await newReview.save();

    res
      .status(201)
      .json({ message: "Review submitted successfully", review: newReview });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all reviews for a specific product
// exports.getReviews = async (req, res) => {
//   try {
//     const { productId } = req.params;

//     if (!productId) {
//       return res.status(400).json({ message: "Product ID is required." });
//     }

//     const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

//     res.status(200).json(reviews);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// exports.getReviews = async (req, res) => {
//   try {
//     const { productId } = req.params;
//     const { cursor, limit = 5 } = req.query; // Get cursor and limit from query params

//     if (!productId) {
//       return res.status(400).json({ message: "Product ID is required." });
//     }

//     let query = { productId };
//     if (cursor) {
//       query._id = { $lt: cursor }; // Fetch reviews with IDs less than the cursor
//     }

//     const reviews = await Review.find(query)
//       .sort({ _id: -1 }) // Sort in descending order
//       .limit(parseInt(limit));

//     const hasMore = reviews.length === parseInt(limit); // If we fetch `limit` records, there's more

//     res.status(200).json({ reviews, hasMore });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { cursor, limit = 5 } = req.query; // Get cursor and limit from query params

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    let query = { productId };
    if (cursor) {
      query._id = { $lt: cursor }; // Fetch reviews with IDs less than the cursor
    }

    // Fetch paginated reviews
    const reviews = await Review.find(query)
      .sort({ _id: -1 }) // Sort in descending order
      .limit(parseInt(limit));

    // Count total reviews for the product
    const totalReviews = await Review.countDocuments({ productId });

    const hasMore = reviews.length === parseInt(limit); // If we fetch `limit` records, there's more

    res.status(200).json({ reviews, hasMore, totalReviews });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
