const express = require("express");
const PDFDocument = require("pdfkit");
const { protect } = require("../middleware/authMiddleware");
const Complaint = require("../models/Complaint");
const RentPayment = require("../models/RentPayment");

const router = express.Router();

// GET - Generate Complaints Report (protected)
router.get("/complaints", protect, async (req, res) => {
  try {
    // Fetch all complaints with populated data
    const complaints = await Complaint.find()
      .populate("tenantId", "name email")
      .populate("propertyId", "address");

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({
        message: "No complaints found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    // Buffer the PDF
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      
      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdf.length);
      res.setHeader("Content-Disposition", 'attachment; filename="complaints-report.pdf"');
      
      // Send PDF
      res.end(pdf);
    });

    doc.on("error", (error) => {
      res.status(500).json({
        message: "Error generating PDF",
        error: error.message,
      });
    });

    // Write title
    doc.fontSize(20).text("RentCare - Complaints Report", { align: "center" });
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    // Write complaints
    complaints.forEach((complaint, index) => {
      doc.fontSize(12).text(`Complaint #${index + 1}`, { underline: true });
      doc.fontSize(11);
      doc.text(`Title: ${complaint.title}`);
      doc.text(`Description: ${complaint.description}`);
      doc.text(`Category: ${complaint.category}`);
      doc.text(`Status: ${complaint.status}`);
      doc.text(`Tenant: ${complaint.tenantId ? complaint.tenantId.name : "N/A"} (${complaint.tenantId ? complaint.tenantId.email : "N/A"})`);
      doc.text(`Property: ${complaint.propertyId ? complaint.propertyId.address : "N/A"}`);
      doc.text(`Created: ${new Date(complaint.createdAt).toLocaleString()}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({
      message: "Error generating complaints report",
      error: error.message,
    });
  }
});

// GET - Generate Rent Payments Report (protected)
router.get("/rent-payments", protect, async (req, res) => {
  try {
    // Fetch all rent payments with populated data
    const payments = await RentPayment.find()
      .populate("tenantId", "name email")
      .populate("propertyId", "address");

    if (!payments || payments.length === 0) {
      return res.status(404).json({
        message: "No rent payments found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    // Buffer the PDF
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      
      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdf.length);
      res.setHeader("Content-Disposition", 'attachment; filename="rent-payments-report.pdf"');
      
      // Send PDF
      res.end(pdf);
    });

    doc.on("error", (error) => {
      res.status(500).json({
        message: "Error generating PDF",
        error: error.message,
      });
    });

    // Write title
    doc.fontSize(20).text("RentCare - Rent Payments Report", { align: "center" });
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const verifiedAmount = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0);

    doc.fontSize(12).text("Summary", { underline: true });
    doc.fontSize(11);
    doc.text(`Total Payments: ${payments.length}`);
    doc.text(`Total Amount: Rs. ${totalAmount}`);
    doc.text(`Verified Amount: Rs. ${verifiedAmount}`);
    doc.moveDown(1);

    // Write payments
    payments.forEach((payment, index) => {
      doc.fontSize(12).text(`Payment #${index + 1}`, { underline: true });
      doc.fontSize(11);
      doc.text(`Tenant: ${payment.tenantId ? payment.tenantId.name : "N/A"} (${payment.tenantId ? payment.tenantId.email : "N/A"})`);
      doc.text(`Property: ${payment.propertyId ? payment.propertyId.address : "N/A"}`);
      doc.text(`Amount: Rs. ${payment.amount}`);
      doc.text(`Month: ${payment.month}`);
      doc.text(`Status: ${payment.status}`);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({
      message: "Error generating rent payments report",
      error: error.message,
    });
  }
});

module.exports = router;
