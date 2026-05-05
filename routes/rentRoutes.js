const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addRentPayment,
  getAllRentPayments,
  verifyRentPayment,
  getTenantRentPayments,
} = require("../controllers/rentController");

const router = express.Router();

router.post("/add", protect, addRentPayment);
router.get("/", protect, getAllRentPayments);
router.get("/tenant/:tenantId", protect, getTenantRentPayments);
router.put("/verify/:id", protect, verifyRentPayment);

module.exports = router;

