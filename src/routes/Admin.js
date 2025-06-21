const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  toggleUserRole,
  deleteUser,
  changeAdminPassword,
} = require("../controller/Admin");
const { protect, authorize } = require("../middleware/Auth");

// Define routes
router.get("/", getAllUsers);
router.put("/update-user/:id", updateUser);
router.put("/toggle-role/:id", toggleUserRole);
router.put("/change-password", changeAdminPassword);
router.delete("/delete-user/:id", deleteUser);

module.exports = router;
