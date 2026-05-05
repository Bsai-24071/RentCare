const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthlyRent: {
      type: Number,
      default: null,
    },
    tenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;