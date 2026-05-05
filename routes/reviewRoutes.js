const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addReview, getContractorReviews, getTenantReviews, getLandlordContractorReviews } = require("../controllers/reviewController");

const router = express.Router();

router.post("/add", protect, addReview);

router.get("/landlord/contractors/reviews", protect, getLandlordContractorReviews);

router.get("/tenant/:tenantId", protect, getTenantReviews);

router.get("/contractor/:contractorId", protect, getContractorReviews);

module.exports = router;
