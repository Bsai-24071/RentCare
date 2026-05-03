const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addReview, getContractorReviews, getTenantReviews } = require("../controllers/reviewController");

const router = express.Router();

// POST - Add a review (protected)
router.post("/add", protect, addReview);

// GET - Get reviews submitted by a tenant
router.get("/tenant/:tenantId", protect, getTenantReviews);

// GET - Get reviews for a contractor (reviews they received)
router.get("/contractor/:contractorId", protect, getContractorReviews);

module.exports = router;
