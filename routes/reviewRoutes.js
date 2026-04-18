const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addReview, getContractorReviews } = require("../controllers/reviewController");

const router = express.Router();

// POST - Add a review (protected)
router.post("/add", protect, addReview);

// GET - Get reviews for a contractor (protected)
router.get("/:contractorId", protect, getContractorReviews);

module.exports = router;
