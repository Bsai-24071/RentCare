const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gfsBucket;

// Initialize GridFS bucket
mongoose.connection.on('connected', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'rentcare_files'
  });
});

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
      imageIds: [],
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

const addComplaintWithImage = async (req, res) => {
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

    const imageIds = [];

    // Handle file upload to GridFS if file exists
    if (req.file) {
      try {
        if (!gfsBucket) {
          return res.status(500).json({ message: 'GridFS not ready' });
        }

        const { ObjectId } = require('mongodb');
        const fileId = new ObjectId();
        const filename = `${Date.now()}-${req.file.originalname}`;

        // Upload file buffer to GridFS with custom ID
        const uploadStream = gfsBucket.openUploadStreamWithId(
          fileId,
          filename,
          {
            metadata: {
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              uploadDate: new Date(),
            }
          }
        );

        await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => {
            imageIds.push(fileId);
            resolve();
          });

          uploadStream.on('error', reject);
          uploadStream.end(req.file.buffer);
        });
      } catch (uploadError) {
        return res.status(500).json({ 
          message: 'File upload failed', 
          error: uploadError.message 
        });
      }
    }

    const newComplaint = await Complaint.create({
      title,
      description,
      category,
      tenantId,
      propertyId,
      contractorId,
      deadline,
      imageIds,
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

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await Complaint.findById(id)
      .populate("tenantId", "name email role")
      .populate("propertyId", "address")
      .populate("contractorId", "name email");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      message: "Complaint fetched successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching complaint",
      error: error.message,
    });
  }
};

module.exports = {
  addComplaint,
  addComplaintWithImage,
  updateComplaintStatus,
  getAllComplaints,
  getComplaintById,
};