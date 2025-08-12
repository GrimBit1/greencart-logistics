const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  valueRs: {
    type: Number,
    required: true,
    min: 0
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  deliveryTimestamp: {
    type: Date
  },
  scheduledDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'failed'],
    default: 'pending'
  },
  customerName: {
    type: String,
    trim: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // Calculated fields for KPIs
  isOnTime: {
    type: Boolean,
    default: null
  },
  penalty: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  fuelCost: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate if delivery was on time
orderSchema.methods.calculateOnTimeStatus = function (route) {
  if (!this.actualDeliveryTime || !this.scheduledDeliveryTime) {
    return null;
  }

  const scheduledTime = new Date(this.scheduledDeliveryTime);
  const actualTime = new Date(this.actualDeliveryTime);

  const timeRequired = route.getExpectedDeliveryTime(this.assignedDriver?.isFatigued || false) * 60 * 1000; // Convert minutes to milliseconds  

  // Allow a 10-minute delay for on-time delivery
  const allowedDelay = timeRequired + (10 * 60 * 1000); // 10 minutes in milliseconds

  this.isOnTime = (actualTime - scheduledTime) <= allowedDelay;

  // Apply late delivery penalty
  if (!this.isOnTime) {
    this.penalty = 50; // ₹50 penalty
  } else {
    this.penalty = 0;
  }

  return this.isOnTime;
};

// Calculate high-value bonus
orderSchema.methods.calculateBonus = function () {
  if (this.valueRs > 1000 && this.isOnTime) {
    this.bonus = this.valueRs * 0.1; // 10% bonus
  } else {
    this.bonus = 0;
  }

  return this.bonus;
};

// Calculate total profit for this order
orderSchema.methods.calculateProfit = function (route) {
  if (route) {
    this.fuelCost = route.calculateFuelCost();
  }

  this.profit = this.valueRs + this.bonus - this.penalty - this.fuelCost;
  return this.profit;
};

module.exports = mongoose.model('Order', orderSchema);
