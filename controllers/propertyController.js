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
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userRole = req.user?.role;
    let properties;

    if (userRole === 'landlord') {
      properties = await Property.find({ landlordId: userId })
        .populate("landlordId", "name email")
        .populate("tenants", "name email")
        .lean();
    } else if (userRole === 'tenant') {
      properties = await Property.find({ tenants: userId })
        .populate("landlordId", "name email")
        .populate("tenants", "name email")
        .lean();
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json({ message: "Properties fetched successfully", properties });
  } catch (error) {
    res.status(500).json({ message: "Error fetching properties", error: error.message });
  }
};

module.exports = { addProperty, getProperties };