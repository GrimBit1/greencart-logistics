const express = require('express');
const { body, param } = require('express-validator');
const Driver = require('../models/Driver');
const { auth, requireManager } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Get all drivers
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const query = {};

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const drivers = await Driver.find(query)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Driver.countDocuments(query);

    res.json({
      drivers,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ 
      error: 'Failed to get drivers',
      message: error.message 
    });
  }
});

// Get driver by ID
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], handleValidationErrors, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ 
        error: 'Driver not found' 
      });
    }

    res.json({ driver });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ 
      error: 'Failed to get driver',
      message: error.message 
    });
  }
});

// Create new driver
router.post('/', auth, requireManager, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('currentShiftHours').optional().isFloat({ min: 0, max: 24 }).withMessage('Shift hours must be between 0 and 24'),
  body('past7DayWorkHours').optional().isFloat({ min: 0 }).withMessage('Work hours must be non-negative')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, phone, currentShiftHours, past7DayWorkHours } = req.body;

    // Check if email is already taken
    if (email) {
      const existingDriver = await Driver.findOne({ email });
      if (existingDriver) {
        return res.status(400).json({ 
          error: 'Driver with this email already exists' 
        });
      }
    }

    const driver = new Driver({
      name,
      email,
      phone,
      currentShiftHours: currentShiftHours || 0,
      past7DayWorkHours: past7DayWorkHours || 0
    });

    await driver.save();

    res.status(201).json({
      message: 'Driver created successfully',
      driver
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ 
      error: 'Failed to create driver',
      message: error.message 
    });
  }
});

// Update driver
router.put('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid driver ID'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('currentShiftHours').optional().isFloat({ min: 0, max: 24 }).withMessage('Shift hours must be between 0 and 24'),
  body('past7DayWorkHours').optional().isFloat({ min: 0 }).withMessage('Work hours must be non-negative'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, phone, currentShiftHours, past7DayWorkHours, isActive } = req.body;

    // Check if email is already taken by another driver
    if (email) {
      const existingDriver = await Driver.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingDriver) {
        return res.status(400).json({ 
          error: 'Email is already taken by another driver' 
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (currentShiftHours !== undefined) updateData.currentShiftHours = currentShiftHours;
    if (past7DayWorkHours !== undefined) updateData.past7DayWorkHours = past7DayWorkHours;
    if (isActive !== undefined) updateData.isActive = isActive;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({ 
        error: 'Driver not found' 
      });
    }

    res.json({
      message: 'Driver updated successfully',
      driver
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ 
      error: 'Failed to update driver',
      message: error.message 
    });
  }
});

// Delete driver
router.delete('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], handleValidationErrors, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.status(404).json({ 
        error: 'Driver not found' 
      });
    }

    res.json({
      message: 'Driver deleted successfully',
      driver
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ 
      error: 'Failed to delete driver',
      message: error.message 
    });
  }
});

// Get driver statistics
router.get('/:id/stats', auth, [
  param('id').isMongoId().withMessage('Invalid driver ID')
], handleValidationErrors, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ 
        error: 'Driver not found' 
      });
    }

    // Check fatigue status
    const isFatigued = driver.checkFatigue();

    const stats = {
      driverId: driver._id,
      name: driver.name,
      currentShiftHours: driver.currentShiftHours,
      past7DayWorkHours: driver.past7DayWorkHours,
      isFatigued,
      isActive: driver.isActive,
      // Add more statistics as needed
      workload: driver.past7DayWorkHours > 40 ? 'High' : 
                driver.past7DayWorkHours > 20 ? 'Medium' : 'Low',
      availability: driver.currentShiftHours < 8 && driver.isActive
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get driver statistics',
      message: error.message 
    });
  }
});

module.exports = router;
