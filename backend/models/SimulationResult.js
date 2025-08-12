const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  simulationId: {
    type: String,
    required: true,
    unique: true
  },
  inputs: {
    numberOfDrivers: {
      type: Number,
      required: true
    },
    routeStartTime: {
      type: String,
      required: true
    },
    maxHoursPerDriver: {
      type: Number,
      required: true
    }
  },
  results: {
    totalProfit: {
      type: Number,
      default: 0
    },
    efficiencyScore: {
      type: Number,
      default: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    lateDeliveries: {
      type: Number,
      default: 0
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    totalFuelCost: {
      type: Number,
      default: 0
    },
    totalPenalties: {
      type: Number,
      default: 0
    },
    totalBonuses: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0
    }
  },
  orderDetails: [{
    orderId: String,
    driverId: mongoose.Schema.Types.ObjectId,
    routeId: String,
    scheduledTime: Date,
    actualTime: Date,
    isOnTime: Boolean,
    profit: Number,
    penalty: Number,
    bonus: Number,
    fuelCost: Number
  }],
  driverUtilization: [{
    driverId: mongoose.Schema.Types.ObjectId,
    driverName: String,
    hoursWorked: Number,
    ordersDelivered: Number,
    isFatigued: Boolean
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate overall efficiency score
simulationResultSchema.methods.calculateEfficiencyScore = function() {
  if (this.results.totalDeliveries === 0) {
    this.results.efficiencyScore = 0;
  } else {
    this.results.efficiencyScore = Math.round(
      (this.results.onTimeDeliveries / this.results.totalDeliveries) * 100
    );
  }
  return this.results.efficiencyScore;
};

module.exports = mongoose.model('SimulationResult', simulationResultSchema);
