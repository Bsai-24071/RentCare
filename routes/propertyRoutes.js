const express = require("express");
const { addProperty } = require("../controllers/propertyController");

const router = express.Router();

router.post("/add", addProperty);

module.exports = router;