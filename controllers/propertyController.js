const Property = require("../models/Property");

const addProperty = async (req, res) => {
  try {
    const { address, landlordId, tenants } = req.body;

    const newProperty = await Property.create({
      address,
      landlordId,
      tenants,
    });

    res.status(201).json({
      message: "Property created successfully",
      property: newProperty,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating property",
      error: error.message,
    });
  }
};

module.exports = {
  addProperty,
};