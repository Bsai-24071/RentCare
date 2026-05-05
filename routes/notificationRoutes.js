const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/user/:userId", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications", error: err.message });
  }
});

router.put("/read/:userId", protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: "Marked all as read" });
  } catch (err) {
    res.status(500).json({ message: "Error marking notifications", error: err.message });
  }
});

module.exports = router;
