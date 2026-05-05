const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const Property = require("../models/Property");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gfsBucket;
let io;

mongoose.connection.on('connected', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'rentcare_files' });
});

async function _notify(userId, message, type, refId) {
  try {
    const notif = await Notification.create({ userId, message, type, refId });
    if (!io) io = require("../server").io;
    if (io) {
      io.to(userId.toString()).emit('notification', {
        message: notif.message,
        type: notif.type,
        refId: notif.refId,
        timestamp: notif.createdAt,
      });
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

const addComplaint = async (req, res) => {
  try {
    const { title, description, category, tenantId, propertyId, contractorId, deadline, imageIds } = req.body;

    const newComplaint = await Complaint.create({
      title, description, category, tenantId, propertyId,
      contractorId, deadline, imageIds: imageIds || [],
    });

    const property = await Property.findById(propertyId).lean();
    if (property && property.landlordId) {
      await _notify(
        property.landlordId,
        `🔔 New complaint filed: "${title}" (${category}) — awaiting your review.`,
        'complaint',
        newComplaint._id
      );
    }

    res.status(201).json({ message: "Complaint created successfully", complaint: newComplaint });
  } catch (error) {
    res.status(500).json({ message: "Error creating complaint", error: error.message });
  }
};

const addComplaintWithImage = async (req, res) => {
  try {
    const { title, description, category, tenantId, propertyId, contractorId, deadline } = req.body;
    const imageIds = [];

    if (req.file) {
      try {
        if (!gfsBucket) return res.status(500).json({ message: 'GridFS not ready' });
        const { ObjectId } = require('mongodb');
        const fileId = new ObjectId();
        const filename = `${Date.now()}-${req.file.originalname}`;
        const uploadStream = gfsBucket.openUploadStreamWithId(fileId, filename, {
          metadata: { originalName: req.file.originalname, mimeType: req.file.mimetype, uploadDate: new Date() }
        });
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => { imageIds.push(fileId); resolve(); });
          uploadStream.on('error', reject);
          uploadStream.end(req.file.buffer);
        });
      } catch (uploadError) {
        return res.status(500).json({ message: 'File upload failed', error: uploadError.message });
      }
    }

    const newComplaint = await Complaint.create({
      title, description, category, tenantId, propertyId, contractorId, deadline, imageIds,
    });

    const property = await Property.findById(propertyId).lean();
    if (property && property.landlordId) {
      await _notify(
        property.landlordId,
        `🔔 New complaint filed: "${title}" (${category}) — awaiting your review.`,
        'complaint',
        newComplaint._id
      );
    }

    res.status(201).json({ message: "Complaint created successfully", complaint: newComplaint });
  } catch (error) {
    res.status(500).json({ message: "Error creating complaint", error: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, contractorId, deadline } = req.body;

    const complaint = await Complaint.findById(id)
      .populate('tenantId')
      .populate('contractorId')
      .populate('propertyId');

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const tenantIdValue = complaint.tenantId._id || complaint.tenantId;

    const updateData = { status };
    if (contractorId) updateData.contractorId = contractorId;
    if (deadline) updateData.deadline = deadline;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const updatedComplaint = await Complaint.findByIdAndUpdate(id, updateData, { new: true })
      .populate('tenantId')
      .populate('contractorId')
      .populate('propertyId');

    await _notify(
      tenantIdValue,
      `Your complaint "${updatedComplaint.title}" status changed to: ${status}`,
      'complaint',
      updatedComplaint._id
    );


    const assignedContractorId = contractorId || updatedComplaint.contractorId?._id?.toString();
    if (assignedContractorId && (status === 'assigned' || status === 'in-progress')) {
      await _notify(
        assignedContractorId,
        `🔧 You have been assigned: "${updatedComplaint.title}" (${status}). Check your dashboard.`,
        'complaint',
        updatedComplaint._id
      );
    }


    if (status === 'resolved') {
      const propId = updatedComplaint.propertyId?._id || updatedComplaint.propertyId;
      const property = await Property.findById(propId).lean();
      if (property && property.landlordId) {
        await _notify(
          property.landlordId,
          `✅ Complaint "${updatedComplaint.title}" has been resolved by ${updatedComplaint.contractorId?.name || 'the contractor'}.`,
          'complaint',
          updatedComplaint._id
        );
      }
    }

    res.status(200).json({ message: "Complaint status updated successfully", complaint: updatedComplaint });
  } catch (error) {
    res.status(500).json({ message: "Error updating complaint status", error: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const landlordId = req.user?.id || req.user?._id;
    if (!landlordId) return res.status(401).json({ message: "Unauthorized" });

    const properties = await Property.find({ landlordId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const complaints = await Complaint.find({ propertyId: { $in: propertyIds } })
      .populate("tenantId", "name email role")
      .populate("propertyId", "address landlordId")
      .populate("contractorId", "name email");
    res.status(200).json({ message: "All complaints fetched successfully", complaints });
  } catch (error) {
    res.status(500).json({ message: "Error fetching complaints", error: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("tenantId", "name email role")
      .populate("propertyId", "address")
      .populate("contractorId", "name email");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.status(200).json({ message: "Complaint fetched successfully", complaint });
  } catch (error) {
    res.status(500).json({ message: "Error fetching complaint", error: error.message });
  }
};

module.exports = { addComplaint, addComplaintWithImage, updateComplaintStatus, getAllComplaints, getComplaintById };