const Review = require("../models/Review");

const addReview = async (req, res) => {
  try {
    const { tenantId, contractorId, complaintId, rating, comment } = req.body;

    // Validation
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

    // Create review
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

    // Get all reviews for contractor
    const reviews = await Review.find({ contractorId }).populate("tenantId", "name email");

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        message: "No reviews found for this contractor",
        reviews: [],
        averageRating: 0,
      });
    }

    // Calculate average rating
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

    // Get all reviews submitted by tenant
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

module.exports = {
  addReview,
  getContractorReviews,
  getTenantReviews,
};
