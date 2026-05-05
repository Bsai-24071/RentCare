const express = require("express");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const { protect } = require("../middleware/authMiddleware");
const Complaint = require("../models/Complaint");
const RentPayment = require("../models/RentPayment");

const router = express.Router();

function fetchImageBuffer(fileId) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "rentcare_files",
      });
      const id = new mongoose.Types.ObjectId(fileId.toString());
      const chunks = [];
      const stream = bucket.openDownloadStream(id);
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

async function embedImage(doc, fileId, maxWidth = 300, maxHeight = 200) {
  try {
    const buf = await fetchImageBuffer(fileId);
    doc.image(buf, { fit: [maxWidth, maxHeight], align: "left" });
    doc.moveDown(0.5);
    return true;
  } catch {
    doc.fontSize(10).fillColor("red").text("[Image could not be loaded]");
    doc.fillColor("black");
    doc.moveDown(0.3);
    return false;
  }
}

router.get("/complaints", protect, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("tenantId", "name email")
      .populate("contractorId", "name")
      .populate("propertyId", "address")
      .lean();

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ message: "No complaints found" });
    }

    const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
    const chunks = [];

    res.on("close", () => doc.destroy());
    doc.on("data", (chunk) => { if (!res.writableEnded) chunks.push(chunk); });
    doc.on("error", (err) => {
      doc.destroy();
      if (!res.headersSent) res.status(500).json({ message: "PDF error", error: err.message });
    });

    doc.on("end", () => {
      if (!res.headersSent) {
        const pdf = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdf.length);
        res.setHeader("Content-Disposition", 'attachment; filename="complaints-report.pdf"');
        res.end(pdf);
      }
    });

    doc.fontSize(20).text("RentCare - Complaints Report", { align: "center" });
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12).text("Summary", { underline: true });
    doc.fontSize(11);
    doc.text(`Total Complaints: ${complaints.length}`);
    doc.text(`Pending: ${complaints.filter(c => c.status === "pending").length}`);
    doc.text(`In Progress: ${complaints.filter(c => c.status === "in-progress").length}`);
    doc.text(`Resolved: ${complaints.filter(c => c.status === "resolved").length}`);
    doc.moveDown(1);

    for (let i = 0; i < complaints.length; i++) {
      const c = complaints[i];

      if (doc.y > 650) doc.addPage();

      doc.fontSize(12).fillColor("#1a1a2e").text(`Complaint #${i + 1}`, { underline: true });
      doc.fillColor("black").fontSize(11);
      doc.text(`Title:       ${c.title}`);
      doc.text(`Description: ${c.description}`);
      doc.text(`Category:    ${c.category}`);
      doc.text(`Status:      ${c.status}`);
      doc.text(`Tenant:      ${c.tenantId ? `${c.tenantId.name} (${c.tenantId.email})` : "N/A"}`);
      doc.text(`Contractor:  ${c.contractorId ? c.contractorId.name : "Unassigned"}`);
      doc.text(`Property:    ${c.propertyId ? c.propertyId.address : "N/A"}`);
      doc.text(`Filed:       ${new Date(c.createdAt).toLocaleString()}`);
      if (c.deadline) doc.text(`Deadline:    ${new Date(c.deadline).toLocaleDateString()}`);
      if (c.status === "resolved" && c.resolvedAt) {
        doc.text(`Resolved At: ${new Date(c.resolvedAt).toLocaleString()}`);
      }

      if (c.imageIds && c.imageIds.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(11).text("Attached Photo(s):");
        for (const imgId of c.imageIds) {
          if (doc.y > 650) doc.addPage();
          await embedImage(doc, imgId, 300, 200);
        }
      }

      doc.moveDown(1);

      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.5);
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating complaints report", error: error.message });
  }
});

router.get("/rent-payments", protect, async (req, res) => {
  try {
    const payments = await RentPayment.find()
      .populate("tenantId", "name email")
      .populate("propertyId", "address")
      .lean();

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: "No rent payments found" });
    }

    const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
    const chunks = [];

    res.on("close", () => doc.destroy());
    doc.on("data", (chunk) => { if (!res.writableEnded) chunks.push(chunk); });
    doc.on("error", (err) => {
      doc.destroy();
      if (!res.headersSent) res.status(500).json({ message: "PDF error", error: err.message });
    });

    doc.on("end", () => {
      if (!res.headersSent) {
        const pdf = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdf.length);
        res.setHeader("Content-Disposition", 'attachment; filename="rent-payments-report.pdf"');
        res.end(pdf);
      }
    });

    doc.fontSize(20).text("RentCare - Rent Payments Report", { align: "center" });
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const verifiedAmount = payments.filter(p => p.status === "verified").reduce((s, p) => s + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

    doc.fontSize(12).text("Summary", { underline: true });
    doc.fontSize(11);
    doc.text(`Total Payments:   ${payments.length}`);
    doc.text(`Total Amount:     Rs. ${totalAmount}`);
    doc.text(`Verified Amount:  Rs. ${verifiedAmount}`);
    doc.text(`Pending Amount:   Rs. ${pendingAmount}`);
    doc.moveDown(1);

    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];

      if (doc.y > 650) doc.addPage();

      doc.fontSize(12).fillColor("#1a1a2e").text(`Payment #${i + 1}`, { underline: true });
      doc.fillColor("black").fontSize(11);
      doc.text(`Tenant:   ${p.tenantId ? `${p.tenantId.name} (${p.tenantId.email})` : "N/A"}`);
      doc.text(`Property: ${p.propertyId ? p.propertyId.address : "N/A"}`);
      doc.text(`Amount:   Rs. ${p.amount}`);
      doc.text(`Month:    ${p.month}`);
      doc.text(`Status:   ${p.status}`);
      doc.text(`Date:     ${new Date(p.createdAt).toLocaleString()}`);


      if (p.proofImageId) {
        doc.moveDown(0.3);
        doc.fontSize(11).text("Payment Receipt:");
        if (doc.y > 650) doc.addPage();
        await embedImage(doc, p.proofImageId, 300, 220);
      }

      doc.moveDown(1);

      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(0.5);
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating rent payments report", error: error.message });
  }
});

module.exports = router;