const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addComplaint,
  addComplaintWithImage,
  updateComplaintStatus,
  getAllComplaints,
  getComplaintById,
} = require("../controllers/complaintController");
const upload = require("../config/gridfs");

const router = express.Router();

// Add complaint without image
router.post("/add", addComplaint);

// Add complaint with image (using GridFS)
router.post("/add-with-image", upload.single('image'), addComplaintWithImage);

// Update complaint status
router.put("/update-status/:id", updateComplaintStatus);

// Get all complaints
router.get("/", protect, getAllComplaints);

// Get complaint by ID
router.get("/:id", protect, getComplaintById);

module.exports = router;