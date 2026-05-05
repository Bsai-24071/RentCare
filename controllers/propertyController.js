const Property = require("../models/Property");

const addProperty = async (req, res) => {
  try {
    const { address, landlordId, monthlyRent, tenants } = req.body;
    if (!address || !landlordId) {
      return res.status(400).json({ message: "address and landlordId are required" });
    }
    const newProperty = await Property.create({
      address,
      landlordId,
      monthlyRent: monthlyRent || null,
      tenants: tenants || [],
    });
    res.status(201).json({ message: "Property created successfully", property: newProperty });
  } catch (error) {
    res.status(500).json({ message: "Error creating property", error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("landlordId", "name email")
      .populate("tenants", "name email")
      .lean();
    res.status(200).json({ message: "Properties fetched successfully", properties });
  } catch (error) {
    res.status(500).json({ message: "Error fetching properties", error: error.message });
  }
};

module.exports = { addProperty, getProperties };