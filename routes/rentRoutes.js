const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addRentPayment,
  getAllRentPayments,
  verifyRentPayment,
} = require("../controllers/rentController");

const router = express.Router();

// POST /api/rent/add - Add new rent payment (protected)
router.post("/add", protect, addRentPayment);

// GET /api/rent - Get all rent payments (protected)
router.get("/", protect, getAllRentPayments);

// PUT /api/rent/verify/:id - Verify/update rent payment status (protected)
router.put("/verify/:id", protect, verifyRentPayment);

module.exports = router;
