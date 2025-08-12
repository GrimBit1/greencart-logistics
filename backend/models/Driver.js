const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  currentShiftHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  past7DayWorkHours: {
    type: Number,
    default: 0,
    min: 0
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Track fatigue for business rule
  isFatigued: {
    type: Boolean,
    default: false
  },
  lastWorkDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if driver is fatigued (worked >8 hours yesterday)
driverSchema.methods.checkFatigue = function() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // If last work date was yesterday and worked >8 hours, driver is fatigued
  if (this.lastWorkDate && 
      this.lastWorkDate.toDateString() === yesterday.toDateString() && 
      this.currentShiftHours > 8) {
    this.isFatigued = true;
  } else {
    this.isFatigued = false;
  }
  
  return this.isFatigued;
};

module.exports = mongoose.model('Driver', driverSchema);
