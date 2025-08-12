const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  distanceKm: {
    type: Number,
    required: true,
    min: 0
  },
  trafficLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  baseTimeMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  startLocation: {
    type: String,
    trim: true
  },
  endLocation: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate fuel cost based on business rules
routeSchema.methods.calculateFuelCost = function () {
  let baseCost = this.distanceKm * 5; // ₹5/km base cost

  // Add traffic surcharge for high traffic
  if (this.trafficLevel === 'High') {
    baseCost += this.distanceKm * 2; // +₹2/km for high traffic
  }

  return baseCost;
};

// Calculate expected delivery time with traffic consideration
routeSchema.methods.getExpectedDeliveryTime = function (isFatigued = false) {
  let deliveryTime = this.baseTimeMinutes;

  // Adjust for traffic
  if (this.trafficLevel === 'Medium') {
    deliveryTime *= 1.2; // 20% increase
  } else if (this.trafficLevel === 'High') {
    deliveryTime *= 1.5; // 50% increase
  }

  // Apply fatigue penalty (30% slower)
  if (isFatigued) {
    deliveryTime *= 1.3;
  }

  return Math.ceil(deliveryTime);
};

module.exports = mongoose.model('Route', routeSchema);
