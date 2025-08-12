const express = require('express');
const { body, param } = require('express-validator');
const Route = require('../models/Route');
const { auth, requireManager } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Get all routes
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, trafficLevel, isActive } = req.query;
    const query = {};

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { routeId: { $regex: search, $options: 'i' } },
        { startLocation: { $regex: search, $options: 'i' } },
        { endLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (trafficLevel) {
      query.trafficLevel = trafficLevel;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const routes = await Route.find(query)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Route.countDocuments(query);

    // Add calculated fuel costs to response
    const routesWithCosts = routes.map(route => ({
      ...route.toObject(),
      fuelCost: route.calculateFuelCost()
    }));

    res.json({
      routes: routesWithCosts,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({
      error: 'Failed to get routes',
      message: error.message
    });
  }
});

// Get route by ID
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid route ID')
], handleValidationErrors, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        error: 'Route not found'
      });
    }

    const routeWithCost = {
      ...route.toObject(),
      fuelCost: route.calculateFuelCost()
    };

    res.json({ route: routeWithCost });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({
      error: 'Failed to get route',
      message: error.message
    });
  }
});

// Create new route
router.post('/', auth, requireManager, [
  body('routeId').trim().isLength({ min: 1 }).withMessage('Route ID is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('distanceKm').isFloat({ min: 0.1 }).withMessage('Distance must be greater than 0'),
  body('trafficLevel').isIn(['Low', 'Medium', 'High']).withMessage('Traffic level must be Low, Medium, or High'),
  body('baseTimeMinutes').isInt({ min: 1 }).withMessage('Base time must be at least 1 minute'),
  body('startLocation').optional().trim(),
  body('endLocation').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const { routeId, name, distanceKm, trafficLevel, baseTimeMinutes, startLocation, endLocation } = req.body;

    // Check if routeId is already taken
    const existingRoute = await Route.findOne({ routeId });
    if (existingRoute) {
      return res.status(400).json({
        error: 'Route with this ID already exists'
      });
    }

    const route = new Route({
      routeId,
      name,
      distanceKm,
      trafficLevel,
      baseTimeMinutes,
      startLocation,
      endLocation
    });

    await route.save();

    const routeWithCost = {
      ...route.toObject(),
      fuelCost: route.calculateFuelCost()
    };

    res.status(201).json({
      message: 'Route created successfully',
      route: routeWithCost
    });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({
      error: 'Failed to create route',
      message: error.message
    });
  }
});

// Update route
router.put('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid route ID'),
  body('routeId').optional().trim().isLength({ min: 1 }).withMessage('Route ID is required'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('distanceKm').optional().isFloat({ min: 0.1 }).withMessage('Distance must be greater than 0'),
  body('trafficLevel').optional().isIn(['Low', 'Medium', 'High']).withMessage('Traffic level must be Low, Medium, or High'),
  body('baseTimeMinutes').optional().isInt({ min: 1 }).withMessage('Base time must be at least 1 minute'),
  body('startLocation').optional().trim(),
  body('endLocation').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], handleValidationErrors, async (req, res) => {
  try {
    const { routeId, name, distanceKm, trafficLevel, baseTimeMinutes, startLocation, endLocation, isActive } = req.body;

    // Check if routeId is already taken by another route
    if (routeId) {
      const existingRoute = await Route.findOne({
        routeId,
        _id: { $ne: req.params.id }
      });
      if (existingRoute) {
        return res.status(400).json({
          error: 'Route ID is already taken by another route'
        });
      }
    }

    const updateData = {};
    if (routeId !== undefined) updateData.routeId = routeId;
    if (name !== undefined) updateData.name = name;
    if (distanceKm !== undefined) updateData.distanceKm = distanceKm;
    if (trafficLevel !== undefined) updateData.trafficLevel = trafficLevel;
    if (baseTimeMinutes !== undefined) updateData.baseTimeMinutes = baseTimeMinutes;
    if (startLocation !== undefined) updateData.startLocation = startLocation;
    if (endLocation !== undefined) updateData.endLocation = endLocation;
    if (isActive !== undefined) updateData.isActive = isActive;

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({
        error: 'Route not found'
      });
    }

    const routeWithCost = {
      ...route.toObject(),
      fuelCost: route.calculateFuelCost()
    };

    res.json({
      message: 'Route updated successfully',
      route: routeWithCost
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({
      error: 'Failed to update route',
      message: error.message
    });
  }
});

// Delete route
router.delete('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid route ID')
], handleValidationErrors, async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      return res.status(404).json({
        error: 'Route not found'
      });
    }

    res.json({
      message: 'Route deleted successfully',
      route
    });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      error: 'Failed to delete route',
      message: error.message
    });
  }
});

// Get route statistics
router.get('/:id/stats', auth, [
  param('id').isMongoId().withMessage('Invalid route ID')
], handleValidationErrors, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        error: 'Route not found'
      });
    }

    const stats = {
      routeId: route.routeId,
      name: route.name,
      distanceKm: route.distanceKm,
      trafficLevel: route.trafficLevel,
      baseTimeMinutes: route.baseTimeMinutes,
      fuelCost: route.calculateFuelCost(),
      expectedDeliveryTime: {
        normal: route.getExpectedDeliveryTime(false),
        fatigued: route.getExpectedDeliveryTime(true)
      },
      difficulty: route.trafficLevel === 'High' ? 'Hard' :
        route.trafficLevel === 'Medium' ? 'Medium' : 'Easy',
      costPerKm: route.trafficLevel === 'High' ? 7 : 5 // ₹5 base + ₹2 for high traffic
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get route stats error:', error);
    res.status(500).json({
      error: 'Failed to get route statistics',
      message: error.message
    });
  }
});

module.exports = router;
