const express = require("express");
const { addProperty, getProperties } = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", addProperty);
router.get("/", protect, getProperties);

module.exports = router;