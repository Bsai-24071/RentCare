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
router.post("/add", addComplaint);
router.post("/add-with-image", upload.single('image'), addComplaintWithImage);
router.put("/update-status/:id", updateComplaintStatus);
router.get("/", protect, getAllComplaints);
router.get("/:id", protect, getComplaintById);

module.exports = router;