const Complaint = require("../models/Complaint");

const addComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tenantId,
      propertyId,
      contractorId,
      deadline,
    } = req.body;

    const newComplaint = await Complaint.create({
      title,
      description,
      category,
      tenantId,
      propertyId,
      contractorId,
      deadline,
    });

    res.status(201).json({
      message: "Complaint created successfully",
      complaint: newComplaint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating complaint",
      error: error.message,
    });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      message: "Complaint status updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating complaint status",
      error: error.message,
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("tenantId", "name email role")
      .populate("propertyId", "address")
      .populate("contractorId", "name email");

    res.status(200).json({
      message: "All complaints fetched successfully",
      complaints,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching complaints",
      error: error.message,
    });
  }
};

module.exports = {
  addComplaint,
  updateComplaintStatus,
  getAllComplaints,
};