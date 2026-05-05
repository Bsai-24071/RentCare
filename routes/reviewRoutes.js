const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addReview, getContractorReviews, getTenantReviews } = require("../controllers/reviewController");

const router = express.Router();

router.post("/add", protect, addReview);

router.get("/tenant/:tenantId", protect, getTenantReviews);

router.get("/contractor/:contractorId", protect, getContractorReviews);

module.exports = router;
