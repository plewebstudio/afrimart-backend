const express = require("express");

const {
  getCategories,
  getCategory,
  createCategory,
  updateShelf,
  deleteShelf,
  getCategoriesFrontEnd,
  getCategoryFrontend,
} = require("../controller/Category");

const router = express.Router();

//bring the material route
// const foodRouter = require('./Food')

// this will help us to re route any request from the material router to
// the shelf endpoint.
//so we can do //localhost:${PORT}/api/v1/shelf/shelfId/material
// router.use('/:category/food', foodRouter)

const { protect, authorize } = require("../middleware/Auth");

router.post("/", protect, authorize("owner", "admin"), createCategory);

router.route("/").get(getCategories);
router.route("/frontend").get(getCategoriesFrontEnd);

router.route("/:id").get(getCategory);
router.route("/frontend/:id").get(getCategoryFrontend);

// .put(protect, authorize('owner', 'admin'), updateShelf)
// .delete(protect, authorize('owner', 'admin'), deleteShelf)

module.exports = router;
