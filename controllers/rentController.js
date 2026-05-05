const RentPayment = require("../models/RentPayment");
const Notification = require("../models/Notification");
const Property = require("../models/Property");

let io;

async function _notify(userId, message, type, refId) {
  try {
    const notif = await Notification.create({ userId, message, type, refId });
    if (!io) io = require("../server").io;
    if (io) {
      io.to(userId.toString()).emit('notification', {
        message: notif.message, type: notif.type,
        refId: notif.refId, timestamp: notif.createdAt,
      });
    }
  } catch (err) { console.error('Notification error:', err.message); }
}

const addRentPayment = async (req, res) => {
  try {
    const { tenantId, propertyId, amount, month, proofImageId } = req.body;
    if (!tenantId || !propertyId || !amount || !month) {
      return res.status(400).json({ message: "Missing required fields: tenantId, propertyId, amount, month" });
    }
    const newPayment = await RentPayment.create({
      tenantId, propertyId, amount, month,
      proofImageId: proofImageId || null,
      status: "pending",
    });

    const property = await Property.findById(propertyId).lean();
    if (property && property.landlordId) {
      await _notify(
        property.landlordId,
        `💳 New rent payment of PKR ${amount} for ${month} submitted — awaiting your verification.`,
        'rent',
        newPayment._id
      );
    }

    res.status(201).json({ message: "Rent payment created successfully", payment: newPayment });
  } catch (error) {
    res.status(500).json({ message: "Error creating rent payment", error: error.message });
  }
};

const getAllRentPayments = async (req, res) => {
  try {
    const landlordId = req.user?.id || req.user?._id;
    if (!landlordId) return res.status(401).json({ message: "Unauthorized" });

    const properties = await Property.find({ landlordId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const payments = await RentPayment.find({ propertyId: { $in: propertyIds } })
      .populate("tenantId", "name email")
      .populate("propertyId", "address monthlyRent");
    res.status(200).json({ message: "All rent payments fetched successfully", payments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching rent payments", error: error.message });
  }
};

const verifyRentPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const updatedPayment = await RentPayment.findByIdAndUpdate(id, { status }, { new: true })
      .populate("tenantId", "name email")
      .populate("propertyId", "address");

    if (!updatedPayment) return res.status(404).json({ message: "Rent payment not found" });

    const tenantId = updatedPayment.tenantId?._id || updatedPayment.tenantId;
    const propAddr = updatedPayment.propertyId?.address || "your property";
    const verb = status === "verified" ? "✅ verified" : "❌ rejected";

    await _notify(
      tenantId,
      `Your rent payment of PKR ${updatedPayment.amount} for ${updatedPayment.month} (${propAddr}) has been ${verb} by the landlord.`,
      'rent',
      updatedPayment._id
    );

    res.status(200).json({ message: "Rent payment status updated successfully", payment: updatedPayment });
  } catch (error) {
    res.status(500).json({ message: "Error updating rent payment", error: error.message });
  }
};

const getTenantRentPayments = async (req, res) => {
  try {
    const payments = await RentPayment.find({ tenantId: req.params.tenantId })
      .populate("propertyId", "address monthlyRent")
      .sort({ createdAt: -1 });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenant payments", error: error.message });
  }
};

module.exports = { addRentPayment, getAllRentPayments, verifyRentPayment, getTenantRentPayments };
