const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');

describe('Business Rules Tests', () => {

  describe('Driver Fatigue Rule', () => {
    test('should mark driver as fatigued if worked >8 hours yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const driver = new Driver({
        name: 'Test Driver',
        currentShiftHours: 10,
        lastWorkDate: yesterday
      });

      const isFatigued = driver.checkFatigue();

      expect(isFatigued).toBe(true);
      expect(driver.isFatigued).toBe(true);
    });

    test('should not mark driver as fatigued if worked ≤8 hours yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const driver = new Driver({
        name: 'Test Driver',
        currentShiftHours: 7,
        lastWorkDate: yesterday
      });

      const isFatigued = driver.checkFatigue();

      expect(isFatigued).toBe(false);
      expect(driver.isFatigued).toBe(false);
    });
  });

  describe('Route Fuel Cost Calculation', () => {
    test('should calculate base fuel cost correctly (₹5/km)', async () => {
      const route = new Route({
        routeId: 'R001',
        name: 'Test Route',
        distanceKm: 10,
        trafficLevel: 'Low',
        baseTimeMinutes: 30
      });

      const fuelCost = route.calculateFuelCost();

      expect(fuelCost).toBe(50); // 10km * ₹5/km
    });

    test('should add traffic surcharge for high traffic (₹2/km extra)', async () => {
      const route = new Route({
        routeId: 'R002',
        name: 'Test Route High Traffic',
        distanceKm: 10,
        trafficLevel: 'High',
        baseTimeMinutes: 30
      });

      const fuelCost = route.calculateFuelCost();

      expect(fuelCost).toBe(70); // 10km * (₹5 + ₹2)/km
    });
  });

  describe('Route Delivery Time Calculation', () => {
    test('should increase delivery time by 30% for fatigued drivers', async () => {
      const route = new Route({
        routeId: 'R003',
        name: 'Test Route',
        distanceKm: 10,
        trafficLevel: 'Low',
        baseTimeMinutes: 60
      });

      const normalTime = route.getExpectedDeliveryTime(false);
      const fatiguedTime = route.getExpectedDeliveryTime(true);

      expect(fatiguedTime).toBe(Math.ceil(normalTime * 1.3));
    });

    test('should adjust delivery time based on traffic level', async () => {
      const baseTime = 60;

      const lowTrafficRoute = new Route({
        routeId: 'R004',
        name: 'Low Traffic Route',
        distanceKm: 10,
        trafficLevel: 'Low',
        baseTimeMinutes: baseTime
      });

      const mediumTrafficRoute = new Route({
        routeId: 'R005',
        name: 'Medium Traffic Route',
        distanceKm: 10,
        trafficLevel: 'Medium',
        baseTimeMinutes: baseTime
      });

      const highTrafficRoute = new Route({
        routeId: 'R006',
        name: 'High Traffic Route',
        distanceKm: 10,
        trafficLevel: 'High',
        baseTimeMinutes: baseTime
      });

      const lowTime = lowTrafficRoute.getExpectedDeliveryTime(false);
      const mediumTime = mediumTrafficRoute.getExpectedDeliveryTime(false);
      const highTime = highTrafficRoute.getExpectedDeliveryTime(false);

      expect(lowTime).toBe(baseTime);
      expect(mediumTime).toBe(Math.ceil(baseTime * 1.2));
      expect(highTime).toBe(Math.ceil(baseTime * 1.5));
    });
  });

  describe('Order KPI Calculations', () => {
    let testRoute;

    beforeEach(async () => {
      testRoute = new Route({
        routeId: 'R007',
        name: 'Test Route for Orders',
        distanceKm: 10,
        trafficLevel: 'Low',
        baseTimeMinutes: 60
      });
      await testRoute.save();
    });

    test('should apply ₹50 penalty for late delivery', async () => {
      const order = new Order({
        orderId: 'O001',
        valueRs: 500,
        assignedRoute: testRoute._id,
        scheduledDeliveryTime: new Date('2023-01-01T10:00:00'),
        actualDeliveryTime: new Date('2023-01-01T11:30:00') // 90 minutes late (>70 min allowed)
      });

      const isOnTime = order.calculateOnTimeStatus(testRoute);

      expect(isOnTime).toBe(false);
      expect(order.penalty).toBe(50);
    });

    test('should not apply penalty for on-time delivery', async () => {
      const order = new Order({
        orderId: 'O002',
        valueRs: 500,
        assignedRoute: testRoute._id,
        scheduledDeliveryTime: new Date('2023-01-01T10:00:00'),
        actualDeliveryTime: new Date('2023-01-01T11:05:00') // 65 minutes (within 70 min allowed)
      });

      isOnTime = order.calculateOnTimeStatus(testRoute);

      expect(isOnTime).toBe(true);
      expect(order.penalty).toBe(0);
    });

    test('should apply 10% bonus for high-value on-time delivery', async () => {
      const order = new Order({
        orderId: 'O003',
        valueRs: 1500, // >₹1000
        assignedRoute: testRoute._id,
        scheduledDeliveryTime: new Date('2023-01-01T10:00:00'),
        actualDeliveryTime: new Date('2023-01-01T11:00:00'), // On time
        isOnTime: true
      });

      const bonus = order.calculateBonus();

      expect(bonus).toBe(150); // 10% of ₹1500
      expect(order.bonus).toBe(150);
    });

    test('should not apply bonus for high-value late delivery', async () => {
      const order = new Order({
        orderId: 'O004',
        valueRs: 1500, // >₹1000
        assignedRoute: testRoute._id,
        isOnTime: false // Late delivery
      });

      const bonus = order.calculateBonus();

      expect(bonus).toBe(0);
      expect(order.bonus).toBe(0);
    });

    test('should calculate profit correctly', async () => {
      const order = new Order({
        orderId: 'O005',
        valueRs: 1000,
        assignedRoute: testRoute._id,
        bonus: 100,
        penalty: 0
      });

      const profit = order.calculateProfit(testRoute);
      const expectedProfit = 1000 + 100 - 0 - testRoute.calculateFuelCost();

      expect(profit).toBe(expectedProfit);
      expect(order.profit).toBe(expectedProfit);
    });
  });
});
