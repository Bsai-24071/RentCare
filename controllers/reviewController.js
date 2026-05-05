const Review = require("../models/Review");

const addReview = async (req, res) => {
  try {
    const { tenantId, contractorId, complaintId, rating, comment } = req.body;

    if (!tenantId || !contractorId || !complaintId || !rating) {
      return res.status(400).json({
        message: "Missing required fields: tenantId, contractorId, complaintId, rating",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const newReview = await Review.create({
      tenantId,
      contractorId,
      complaintId,
      rating,
      comment: comment || "",
    });

    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding review",
      error: error.message,
    });
  }
};

const getContractorReviews = async (req, res) => {
  try {
    const { contractorId } = req.params;

    const reviews = await Review.find({ contractorId }).populate("tenantId", "name email");

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        message: "No reviews found for this contractor",
        reviews: [],
        averageRating: 0,
      });
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

    res.status(200).json({
      message: "Contractor reviews retrieved successfully",
      reviews,
      averageRating,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

const getTenantReviews = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const reviews = await Review.find({ tenantId })
      .populate("contractorId", "name email")
      .populate("complaintId", "title");

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        message: "No reviews submitted by this tenant",
        reviews: [],
      });
    }

    res.status(200).json({
      message: "Tenant reviews retrieved successfully",
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

const getLandlordContractorReviews = async (req, res) => {
  try {
    const landlordId = req.user?.id || req.user?._id;
    if (!landlordId) return res.status(401).json({ message: "Unauthorized" });

    const Property = require("../models/Property");
    const Complaint = require("../models/Complaint");

    const properties = await Property.find({ landlordId }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const complaints = await Complaint.find({ propertyId: { $in: propertyIds } }).select('_id contractorId');
    const complaintIds = complaints.map(c => c._id);

    const reviews = await Review.find({ complaintId: { $in: complaintIds } })
      .populate("contractorId", "name email")
      .populate("tenantId", "name email")
      .populate("complaintId", "title");

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        message: "No reviews for your contractors",
        reviews: [],
      });
    }

    res.status(200).json({
      message: "Landlord contractor reviews retrieved successfully",
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

module.exports = {
  addReview,
  getContractorReviews,
  getTenantReviews,
  getLandlordContractorReviews,
};
