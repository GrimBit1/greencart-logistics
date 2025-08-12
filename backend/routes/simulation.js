const express = require('express');
const { body } = require('express-validator');
const Order = require('../models/Order');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const SimulationResult = require('../models/SimulationResult');
const { auth, requireManager } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

const router = express.Router();

// Run simulation
router.post('/run', auth, requireManager, [
  body('numberOfDrivers').isInt({ min: 1, max: 100 }).withMessage('Number of drivers must be between 1 and 100'),
  body('routeStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Route start time must be in HH:MM format'),
  body('maxHoursPerDriver').isFloat({ min: 1, max: 24 }).withMessage('Max hours per driver must be between 1 and 24')
], handleValidationErrors, async (req, res) => {
  try {
    const { numberOfDrivers, routeStartTime, maxHoursPerDriver } = req.body;

    // Generate unique simulation ID
    const simulationId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get all active drivers, routes, and pending orders
    const [drivers, routes, orders] = await Promise.all([
      Driver.find({ isActive: true }).limit(numberOfDrivers),
      Route.find({ isActive: true }),
      Order.find({ status: 'pending' }).populate('assignedRoute')
    ]);

    // Validate we have enough drivers
    if (drivers.length < numberOfDrivers) {
      return res.status(400).json({
        error: 'Not enough active drivers available',
        available: drivers.length,
        requested: numberOfDrivers
      });
    }

    // Validate we have routes and orders
    if (routes.length === 0) {
      return res.status(400).json({
        error: 'No active routes available'
      });
    }

    if (orders.length === 0) {
      return res.status(400).json({
        error: 'No pending orders available'
      });
    }

    // Select drivers for simulation
    const selectedDrivers = drivers.slice(0, numberOfDrivers);

    // Check driver fatigue status
    selectedDrivers.forEach(driver => {
      driver.checkFatigue();
    });

    // Parse start time
    const [startHour, startMinute] = routeStartTime.split(':').map(Number);
    const baseStartTime = new Date();
    baseStartTime.setHours(startHour, startMinute, 0, 0);

    // Simulation algorithm: Assign orders to drivers
    const simulationResults = {
      orderDetails: [],
      driverUtilization: [],
      totalProfit: 0,
      totalFuelCost: 0,
      totalPenalties: 0,
      totalBonuses: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      totalDeliveries: 0
    };

    // Initialize driver work tracking
    const driverWorkload = selectedDrivers.map(driver => ({
      driver: driver,
      hoursWorked: 0,
      ordersAssigned: [],
      currentTime: new Date(baseStartTime),
      isFatigued: driver.isFatigued
    }));

    // Sort orders by priority and value (high priority and high value first)
    const sortedOrders = orders.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 2;
      const bPriority = priorityWeight[b.priority] || 2;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      return b.valueRs - a.valueRs; // Higher value first
    });


    for (const order of sortedOrders) {
      // Find the driver with the least workload who can take this order
      let assignedDriverIndex = -1;
      let minWorkload = Infinity;

      for (let i = 0; i < driverWorkload.length; i++) {
        const driverWork = driverWorkload[i];
        const route = order.assignedRoute;

        if (!route) continue;

        // Calculate delivery time for this driver
        const deliveryTime = route.getExpectedDeliveryTime(
          driverWork.isFatigued
        );
        const deliveryHours = deliveryTime / 60;

        // Check if driver can take this order without exceeding max hours
        if (driverWork.hoursWorked + deliveryHours <= maxHoursPerDriver) {
          if (driverWork.hoursWorked < minWorkload) {
            minWorkload = driverWork.hoursWorked;
            assignedDriverIndex = i;
          }
        }
      }

      // If no driver can take the order, skip it
      if (assignedDriverIndex === -1) {
        continue;
      }

      const assignedDriverWork = driverWorkload[assignedDriverIndex];
      const driver = assignedDriverWork.driver;
      const route = order.assignedRoute;

      // Calculate delivery details
      const deliveryTimeMinutes = route.getExpectedDeliveryTime(
        assignedDriverWork.isFatigued
      );

      const scheduledTime = new Date(assignedDriverWork.currentTime);
      const actualTime = new Date(scheduledTime.getTime() + deliveryTimeMinutes * 60000);

      // Update driver workload
      assignedDriverWork.hoursWorked += deliveryTimeMinutes / 60;
      assignedDriverWork.currentTime = new Date(actualTime.getTime() + 15 * 60000); // 15 min break
      assignedDriverWork.ordersAssigned.push(order._id);

      // Calculate KPIs for this order
      const baseDeliveryTime = route.baseTimeMinutes;
      const allowedTime = baseDeliveryTime + 10; // 10 minutes grace period
      const isOnTime = deliveryTimeMinutes <= allowedTime;

      // Apply business rules
      let penalty = 0;
      let bonus = 0;

      // Late delivery penalty
      if (!isOnTime) {
        penalty = 50; // ₹50 penalty
      }

      // High-value bonus
      if (order.valueRs > 1000 && isOnTime) {
        bonus = order.valueRs * 0.1; // 10% bonus
      }

      // Fuel cost
      const fuelCost = route.calculateFuelCost();

      // Calculate profit
      const profit = order.valueRs + bonus - penalty - fuelCost;

      // Add to simulation results
      simulationResults.orderDetails.push({
        orderId: order.orderId,
        driverId: driver._id,
        routeId: route.routeId,
        scheduledTime: scheduledTime,
        actualTime: actualTime,
        isOnTime: isOnTime,
        profit: profit,
        penalty: penalty,
        bonus: bonus,
        fuelCost: fuelCost
      });

      // Update totals
      simulationResults.totalProfit += profit;
      simulationResults.totalFuelCost += fuelCost;
      simulationResults.totalPenalties += penalty;
      simulationResults.totalBonuses += bonus;
      simulationResults.totalDeliveries++;

      if (isOnTime) {
        simulationResults.onTimeDeliveries++;
      } else {
        simulationResults.lateDeliveries++;
      }
    }

    // Calculate driver utilization
    simulationResults.driverUtilization = driverWorkload.map(driverWork => ({
      driverId: driverWork.driver._id,
      driverName: driverWork.driver.name,
      hoursWorked: Math.round(driverWork.hoursWorked * 100) / 100,
      ordersDelivered: driverWork.ordersAssigned.length,
      isFatigued: driverWork.isFatigued
    }));

    // Calculate efficiency score
    const efficiencyScore = simulationResults.totalDeliveries > 0 ?
      Math.round((simulationResults.onTimeDeliveries / simulationResults.totalDeliveries) * 100) : 0;

    // Calculate average delivery time
    const totalDeliveryTime = simulationResults.orderDetails.reduce((sum, order) => {
      return sum + (order.actualTime - order.scheduledTime) / (60 * 1000); // Convert to minutes
    }, 0);
    const averageDeliveryTime = simulationResults.totalDeliveries > 0 ?
      Math.round(totalDeliveryTime / simulationResults.totalDeliveries) : 0;

    // Save simulation result to database
    const simulationResult = new SimulationResult({
      simulationId,
      inputs: {
        numberOfDrivers,
        routeStartTime,
        maxHoursPerDriver
      },
      results: {
        totalProfit: Math.round(simulationResults.totalProfit * 100) / 100,
        efficiencyScore,
        onTimeDeliveries: simulationResults.onTimeDeliveries,
        lateDeliveries: simulationResults.lateDeliveries,
        totalDeliveries: simulationResults.totalDeliveries,
        totalFuelCost: Math.round(simulationResults.totalFuelCost * 100) / 100,
        totalPenalties: simulationResults.totalPenalties,
        totalBonuses: Math.round(simulationResults.totalBonuses * 100) / 100,
        averageDeliveryTime
      },
      orderDetails: simulationResults.orderDetails,
      driverUtilization: simulationResults.driverUtilization,
      createdBy: req.user._id
    });

    await simulationResult.save();

    res.json({
      message: 'Simulation completed successfully',
      simulationId,
      results: simulationResult.results,
      orderDetails: simulationResults.orderDetails,
      driverUtilization: simulationResults.driverUtilization,
      summary: {
        ordersProcessed: simulationResults.totalDeliveries,
        totalOrdersAvailable: orders.length,
        driversUsed: selectedDrivers.length,
        averageOrdersPerDriver: Math.round((simulationResults.totalDeliveries / selectedDrivers.length) * 100) / 100
      }
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      error: 'Failed to run simulation',
      message: error.message
    });
  }
});

// Get simulation history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const simulations = await SimulationResult.find()
      .populate('createdBy', 'name email')
      .select('-orderDetails -driverUtilization') // Exclude large arrays for list view
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await SimulationResult.countDocuments();

    res.json({
      simulations,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get simulation history error:', error);
    res.status(500).json({
      error: 'Failed to get simulation history',
      message: error.message
    });
  }
});

// Get specific simulation result
router.get('/:simulationId', auth, async (req, res) => {
  try {
    const simulation = await SimulationResult.findOne({
      simulationId: req.params.simulationId
    }).populate('createdBy', 'name email');

    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found'
      });
    }

    res.json({ simulation });
  } catch (error) {
    console.error('Get simulation error:', error);
    res.status(500).json({
      error: 'Failed to get simulation',
      message: error.message
    });
  }
});

// Get dashboard KPIs (latest simulation or aggregated data)
router.get('/dashboard/kpis', auth, async (req, res) => {
  try {
    // Get the latest simulation
    const latestSimulation = await SimulationResult.findOne()
      .sort({ createdAt: -1 })
      .select('results createdAt');

    // Get overall statistics from all orders
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$valueRs' },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          onTimeOrders: {
            $sum: { $cond: [{ $eq: ['$isOnTime', true] }, 1, 0] }
          },
          totalPenalties: { $sum: '$penalty' },
          totalBonuses: { $sum: '$bonus' },
          totalFuelCost: { $sum: '$fuelCost' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalValue: 0,
      deliveredOrders: 0,
      onTimeOrders: 0,
      totalPenalties: 0,
      totalBonuses: 0,
      totalFuelCost: 0,
      totalProfit: 0
    };

    // Calculate efficiency
    const efficiencyScore = stats.deliveredOrders > 0 ?
      Math.round((stats.onTimeOrders / stats.deliveredOrders) * 100) : 0;

    const kpis = {
      latest_simulation: latestSimulation ? {
        totalProfit: latestSimulation.results.totalProfit,
        efficiencyScore: latestSimulation.results.efficiencyScore,
        onTimeDeliveries: latestSimulation.results.onTimeDeliveries,
        lateDeliveries: latestSimulation.results.lateDeliveries,
        totalDeliveries: latestSimulation.results.totalDeliveries,
        totalFuelCost: latestSimulation.results.totalFuelCost,
        date: latestSimulation.createdAt
      } : null,
      overall_stats: {
        totalOrders: stats.totalOrders,
        totalValue: Math.round(stats.totalValue * 100) / 100,
        deliveredOrders: stats.deliveredOrders,
        efficiencyScore,
        totalProfit: Math.round(stats.totalProfit * 100) / 100,
        totalFuelCost: Math.round(stats.totalFuelCost * 100) / 100,
        totalPenalties: stats.totalPenalties,
        totalBonuses: Math.round(stats.totalBonuses * 100) / 100
      }
    };

    return res.json({ kpis });
  } catch (error) {
    console.error('Get dashboard KPIs error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard KPIs',
      message: error.message
    });
  }
});

module.exports = router;
