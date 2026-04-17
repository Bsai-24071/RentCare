const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addComplaint,
  updateComplaintStatus,
  getAllComplaints
} = require("../controllers/complaintController");

const router = express.Router();

router.post("/add", addComplaint);
router.put("/update-status/:id", updateComplaintStatus);
router.get("/", protect, getAllComplaints);

module.exports = router;