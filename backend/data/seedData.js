const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const User = require('../models/User');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const Order = require('../models/Order');

// Sample data
const sampleUsers = [
  {
    email: 'manager@greencart.com',
    password: 'manager123',
    name: 'John Manager',
    role: 'manager'
  },
  {
    email: 'admin@greencart.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  }
];

const sampleDrivers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@greencart.com',
    phone: '+91-9876543210',
    currentShiftHours: 6,
    past7DayWorkHours: 42,
    licenseNumber: 'DL-1234567890'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@greencart.com',
    phone: '+91-9876543211',
    currentShiftHours: 4,
    past7DayWorkHours: 35,
    licenseNumber: 'DL-1234567891'
  },
  {
    name: 'Mohamed Ali',
    email: 'mohamed@greencart.com',
    phone: '+91-9876543212',
    currentShiftHours: 8,
    past7DayWorkHours: 48,
    licenseNumber: 'DL-1234567892'
  },
  {
    name: 'Sneha Patel',
    email: 'sneha@greencart.com',
    phone: '+91-9876543213',
    currentShiftHours: 5,
    past7DayWorkHours: 30,
    licenseNumber: 'DL-1234567893'
  },
  {
    name: 'Arjun Singh',
    email: 'arjun@greencart.com',
    phone: '+91-9876543214',
    currentShiftHours: 7,
    past7DayWorkHours: 40,
    licenseNumber: 'DL-1234567894'
  },
  {
    name: 'Lakshmi Nair',
    email: 'lakshmi@greencart.com',
    phone: '+91-9876543215',
    currentShiftHours: 3,
    past7DayWorkHours: 25,
    licenseNumber: 'DL-1234567895'
  }
];

const sampleRoutes = [
  {
    routeId: 'RT001',
    name: 'Central Mumbai - Bandra',
    distanceKm: 12.5,
    trafficLevel: 'High',
    baseTimeMinutes: 45,
    startLocation: 'Central Mumbai',
    endLocation: 'Bandra'
  },
  {
    routeId: 'RT002',
    name: 'Andheri - Powai',
    distanceKm: 8.2,
    trafficLevel: 'Medium',
    baseTimeMinutes: 35,
    startLocation: 'Andheri',
    endLocation: 'Powai'
  },
  {
    routeId: 'RT003',
    name: 'Thane - Kalyan',
    distanceKm: 15.8,
    trafficLevel: 'Low',
    baseTimeMinutes: 50,
    startLocation: 'Thane',
    endLocation: 'Kalyan'
  },
  {
    routeId: 'RT004',
    name: 'Pune City - Hadapsar',
    distanceKm: 10.3,
    trafficLevel: 'Medium',
    baseTimeMinutes: 40,
    startLocation: 'Pune City',
    endLocation: 'Hadapsar'
  },
  {
    routeId: 'RT005',
    name: 'Goregaon - Malad',
    distanceKm: 6.7,
    trafficLevel: 'High',
    baseTimeMinutes: 30,
    startLocation: 'Goregaon',
    endLocation: 'Malad'
  },
  {
    routeId: 'RT006',
    name: 'Navi Mumbai - Panvel',
    distanceKm: 20.1,
    trafficLevel: 'Low',
    baseTimeMinutes: 60,
    startLocation: 'Navi Mumbai',
    endLocation: 'Panvel'
  },
  {
    routeId: 'RT007',
    name: 'Borivali - Dahisar',
    distanceKm: 5.4,
    trafficLevel: 'Medium',
    baseTimeMinutes: 25,
    startLocation: 'Borivali',
    endLocation: 'Dahisar'
  },
  {
    routeId: 'RT008',
    name: 'Worli - Lower Parel',
    distanceKm: 4.2,
    trafficLevel: 'High',
    baseTimeMinutes: 20,
    startLocation: 'Worli',
    endLocation: 'Lower Parel'
  }
];

// Function to generate sample orders
const generateSampleOrders = async (routes) => {
  const customerNames = [
    'Amit Gupta', 'Priya Reddy', 'Rohit Mehta', 'Kavya Iyer', 'Sanjay Joshi',
    'Neha Agarwal', 'Vikram Rao', 'Pooja Khurana', 'Ravi Nair', 'Sunita Bose',
    'Manoj Kumar', 'Ritika Sharma', 'Deepak Tiwari', 'Anjali Verma', 'Suresh Yadav'
  ];
  
  const areas = [
    'Andheri East', 'Bandra West', 'Powai', 'Thane West', 'Kalyan',
    'Hadapsar', 'Goregaon', 'Malad', 'Panvel', 'Dahisar', 'Lower Parel'
  ];
  
  const priorities = ['low', 'medium', 'high'];
  
  const orders = [];
  
  for (let i = 1; i <= 25; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Generate random order value (₹200 to ₹2000)
    const baseValue = Math.floor(Math.random() * 1800) + 200;
    const valueRs = priority === 'high' ? baseValue + 500 : baseValue;
    
    const order = {
      orderId: `ORD${String(i).padStart(3, '0')}`,
      valueRs,
      assignedRoute: route._id,
      customerName,
      customerAddress: `${Math.floor(Math.random() * 999) + 1}, ${area}, Mumbai`,
      priority,
      status: 'pending'
    };
    
    orders.push(order);
  }
  
  return orders;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/greencart-logistics');
    
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Order.deleteMany({})
    ]);
    
    console.log('Creating users...');
    const users = await User.create(sampleUsers);
    console.log(`Created ${users.length} users`);
    
    console.log('Creating drivers...');
    const drivers = await Driver.create(sampleDrivers);
    console.log(`Created ${drivers.length} drivers`);
    
    console.log('Creating routes...');
    const routes = await Route.create(sampleRoutes);
    console.log(`Created ${routes.length} routes`);
    
    console.log('Generating and creating orders...');
    const orderData = await generateSampleOrders(routes);
    const orders = await Order.create(orderData);
    console.log(`Created ${orders.length} orders`);
    
    console.log('Database seeded successfully!');
    console.log('\nDefault credentials:');
    console.log('Manager: manager@greencart.com / manager123');
    console.log('Admin: admin@greencart.com / admin123');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
