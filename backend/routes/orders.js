const express = require('express');
const { body, param } = require('express-validator');
const Order = require('../models/Order');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const { auth, requireManager } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, priority } = req.query;
    const query = {};

    // Add filters
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerAddress: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const orders = await Order.find(query)
      .populate('assignedRoute', 'routeId name distanceKm trafficLevel')
      .populate('assignedDriver', 'name email')
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      error: 'Failed to get orders',
      message: error.message 
    });
  }
});

// Get order by ID
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid order ID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedRoute', 'routeId name distanceKm trafficLevel baseTimeMinutes')
      .populate('assignedDriver', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      error: 'Failed to get order',
      message: error.message 
    });
  }
});

// Create new order
router.post('/', auth, requireManager, [
  body('orderId').trim().isLength({ min: 1 }).withMessage('Order ID is required'),
  body('valueRs').isFloat({ min: 0 }).withMessage('Order value must be non-negative'),
  body('assignedRoute').isMongoId().withMessage('Valid route ID is required'),
  body('customerName').optional().trim(),
  body('customerAddress').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('scheduledDeliveryTime').optional().isISO8601().withMessage('Invalid date format')
], handleValidationErrors, async (req, res) => {
  try {
    const { 
      orderId, 
      valueRs, 
      assignedRoute, 
      customerName, 
      customerAddress, 
      priority, 
      scheduledDeliveryTime 
    } = req.body;

    // Check if orderId is already taken
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(400).json({ 
        error: 'Order with this ID already exists' 
      });
    }

    // Verify that the route exists
    const route = await Route.findById(assignedRoute);
    if (!route) {
      return res.status(400).json({ 
        error: 'Assigned route not found' 
      });
    }

    const order = new Order({
      orderId,
      valueRs,
      assignedRoute,
      customerName,
      customerAddress,
      priority: priority || 'medium',
      scheduledDeliveryTime: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : undefined
    });

    // Calculate initial fuel cost
    order.fuelCost = route.calculateFuelCost();

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('assignedRoute', 'routeId name distanceKm trafficLevel')
      .populate('assignedDriver', 'name email');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error.message 
    });
  }
});

// Update order
router.put('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('orderId').optional().trim().isLength({ min: 1 }).withMessage('Order ID is required'),
  body('valueRs').optional().isFloat({ min: 0 }).withMessage('Order value must be non-negative'),
  body('assignedRoute').optional().isMongoId().withMessage('Valid route ID is required'),
  body('assignedDriver').optional().isMongoId().withMessage('Valid driver ID is required'),
  body('customerName').optional().trim(),
  body('customerAddress').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isIn(['pending', 'assigned', 'in_transit', 'delivered', 'failed']).withMessage('Invalid status'),
  body('scheduledDeliveryTime').optional().isISO8601().withMessage('Invalid date format'),
  body('actualDeliveryTime').optional().isISO8601().withMessage('Invalid date format')
], handleValidationErrors, async (req, res) => {
  try {
    const { 
      orderId, 
      valueRs, 
      assignedRoute, 
      assignedDriver,
      customerName, 
      customerAddress, 
      priority, 
      status,
      scheduledDeliveryTime,
      actualDeliveryTime 
    } = req.body;

    // Check if orderId is already taken by another order
    if (orderId) {
      const existingOrder = await Order.findOne({ 
        orderId, 
        _id: { $ne: req.params.id } 
      });
      if (existingOrder) {
        return res.status(400).json({ 
          error: 'Order ID is already taken by another order' 
        });
      }
    }

    // Verify that the route exists if updating
    if (assignedRoute) {
      const route = await Route.findById(assignedRoute);
      if (!route) {
        return res.status(400).json({ 
          error: 'Assigned route not found' 
        });
      }
    }

    // Verify that the driver exists if updating
    if (assignedDriver) {
      const driver = await Driver.findById(assignedDriver);
      if (!driver) {
        return res.status(400).json({ 
          error: 'Assigned driver not found' 
        });
      }
    }

    const updateData = {};
    if (orderId !== undefined) updateData.orderId = orderId;
    if (valueRs !== undefined) updateData.valueRs = valueRs;
    if (assignedRoute !== undefined) updateData.assignedRoute = assignedRoute;
    if (assignedDriver !== undefined) updateData.assignedDriver = assignedDriver;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (scheduledDeliveryTime !== undefined) updateData.scheduledDeliveryTime = new Date(scheduledDeliveryTime);
    if (actualDeliveryTime !== undefined) updateData.actualDeliveryTime = new Date(actualDeliveryTime);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedRoute', 'routeId name distanceKm trafficLevel')
     .populate('assignedDriver', 'name email');

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Recalculate KPIs if delivery time was updated
    if (actualDeliveryTime && order.assignedRoute) {
      order.calculateOnTimeStatus(order.assignedRoute);
      order.calculateBonus();
      order.calculateProfit(order.assignedRoute);
      await order.save();
    }

    res.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ 
      error: 'Failed to update order',
      message: error.message 
    });
  }
});

// Delete order
router.delete('/:id', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid order ID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    res.json({
      message: 'Order deleted successfully',
      order
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ 
      error: 'Failed to delete order',
      message: error.message 
    });
  }
});

// Complete order delivery
router.patch('/:id/complete', auth, requireManager, [
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('actualDeliveryTime').optional().isISO8601().withMessage('Invalid date format')
], handleValidationErrors, async (req, res) => {
  try {
    const { actualDeliveryTime } = req.body;
    
    const order = await Order.findById(req.params.id)
      .populate('assignedRoute');

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    // Set actual delivery time (use current time if not provided)
    order.actualDeliveryTime = actualDeliveryTime ? new Date(actualDeliveryTime) : new Date();
    order.status = 'delivered';

    // Calculate all KPIs
    if (order.assignedRoute) {
      order.calculateOnTimeStatus(order.assignedRoute);
      order.calculateBonus();
      order.calculateProfit(order.assignedRoute);
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('assignedRoute', 'routeId name distanceKm trafficLevel')
      .populate('assignedDriver', 'name email');

    res.json({
      message: 'Order completed successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ 
      error: 'Failed to complete order',
      message: error.message 
    });
  }
});

// Get order statistics
router.get('/:id/stats', auth, [
  param('id').isMongoId().withMessage('Invalid order ID')
], handleValidationErrors, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedRoute', 'routeId name distanceKm trafficLevel baseTimeMinutes')
      .populate('assignedDriver', 'name email');
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }

    const stats = {
      orderId: order.orderId,
      value: order.valueRs,
      status: order.status,
      priority: order.priority,
      isOnTime: order.isOnTime,
      penalty: order.penalty,
      bonus: order.bonus,
      fuelCost: order.fuelCost,
      profit: order.profit,
      route: order.assignedRoute ? {
        name: order.assignedRoute.name,
        distance: order.assignedRoute.distanceKm,
        trafficLevel: order.assignedRoute.trafficLevel
      } : null,
      driver: order.assignedDriver ? {
        name: order.assignedDriver.name
      } : null,
      deliveryTimes: {
        scheduled: order.scheduledDeliveryTime,
        actual: order.actualDeliveryTime
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get order statistics',
      message: error.message 
    });
  }
});

module.exports = router;
