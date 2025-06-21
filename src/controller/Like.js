const Like = require("../model/Like");
const Review = require("../model/Reviews");

exports.toggleLike = async (req, res) => {
  try {
    const { reviewId, productId } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Check if the like exists
    const existingLike = await Like.findOne({ userId, reviewId });

    if (existingLike) {
      // Unlike (remove like)
      await Like.deleteOne({ _id: existingLike._id });
      return res.json({ success: true, message: "Unliked review" });
    }

    // Like the review
    const newLike = new Like({ userId, reviewId, productId });
    await newLike.save();

    return res.json({ success: true, message: "Liked review" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getReviewLikes = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const likeCount = await Like.countDocuments({ reviewId });

    res.json({ success: true, reviewId, totalLikes: likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
