const RentPayment = require("../models/RentPayment");

// POST /api/rent/add - Add new rent payment
const addRentPayment = async (req, res) => {
  try {
    const { tenantId, propertyId, amount, month, proofImageId } = req.body;

    // Validate required fields
    if (!tenantId || !propertyId || !amount || !month) {
      return res.status(400).json({
        message: "Missing required fields: tenantId, propertyId, amount, month",
      });
    }

    // Create new rent payment
    const newPayment = await RentPayment.create({
      tenantId,
      propertyId,
      amount,
      month,
      proofImageId: proofImageId || null,
      status: "pending",
    });

    res.status(201).json({
      message: "Rent payment created successfully",
      payment: newPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating rent payment",
      error: error.message,
    });
  }
};

// GET /api/rent - Get all rent payments
const getAllRentPayments = async (req, res) => {
  try {
    const payments = await RentPayment.find()
      .populate("tenantId", "name email")
      .populate("propertyId", "address");

    res.status(200).json({
      message: "All rent payments fetched successfully",
      payments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching rent payments",
      error: error.message,
    });
  }
};

// PUT /api/rent/verify/:id - Verify/update rent payment status
const verifyRentPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    // Update payment status
    const updatedPayment = await RentPayment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        message: "Rent payment not found",
      });
    }

    res.status(200).json({
      message: "Rent payment status updated successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating rent payment",
      error: error.message,
    });
  }
};

module.exports = {
  addRentPayment,
  getAllRentPayments,
  verifyRentPayment,
};
