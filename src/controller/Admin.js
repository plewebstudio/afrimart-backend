const { User } = require("../model/User");
const bcrypt = require("bcryptjs");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email } = req.body;

    // Find the user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user's role is admin or owner
    if (user.role !== "admin" && user.role !== "owner") {
      return res.status(403).json({
        error: "Only users with the admin or owner role can be updated",
      });
    }

    // Update allowed fields if provided
    if (username) user.username = username;
    if (email) user.email = email;

    // Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.toggleUserRole = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent toggling if the user is an "owner"
    if (user.role === "owner") {
      return res.status(403).json({ message: "Owner role cannot be changed" });
    }

    // Toggle role between "admin" and "user"
    user.role = user.role === "admin" ? "user" : "admin";

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: `User role updated to ${user.role}`,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to delete a user by ID
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // First, find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion if the user is the owner
    if (user.role === "owner") {
      return res.status(403).json({ error: "Cannot delete owner" });
    }

    // Delete the user if not the owner
    const deletedUser = await User.findByIdAndDelete(userId);
    return res
      .status(200)
      .json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.changeAdminPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ message: "User ID and new password are required" });
    }

    // Fetch the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (targetUser.role !== "admin") {
      return res
        .status(400)
        .json({ message: "Only admin passwords can be changed" });
    }

    // ✅ Update the password (Mongoose `pre("save")` hook will hash it)
    targetUser.password = newPassword;
    await targetUser.save();

    res.status(200).json({ message: "Admin password updated successfully" });
  } catch (error) {
    console.error("Error changing admin password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
