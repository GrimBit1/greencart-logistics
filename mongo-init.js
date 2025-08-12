// MongoDB initialization script
// This script will be executed when MongoDB container starts for the first time

// Switch to admin database to verify we can connect
db = db.getSiblingDB('admin');

// Verify admin user exists (it should be created by MONGO_INITDB_ROOT_USERNAME)
print('Admin user should exist...');

// Switch to the application database
db = db.getSiblingDB('greencart-logistics');

// Create a user for the application (only if it doesn't exist)
try {
  db.createUser({
    user: 'app_user',
    pwd: 'app_password123',
    roles: [
      {
        role: 'readWrite',
        db: 'greencart-logistics'
      }
    ]
  });
  print('Application user created successfully');
} catch (error) {
  print('Application user might already exist: ' + error.message);
}

// Create initial collections
print('Creating collections...');
db.createCollection('users');
db.createCollection('drivers');
db.createCollection('orders');
db.createCollection('routes');
db.createCollection('simulationresults');

// Create indexes for better performance
print('Creating indexes...');
try {
  db.users.createIndex({ "email": 1 }, { unique: true });
  db.orders.createIndex({ "orderId": 1 }, { unique: true });
  db.orders.createIndex({ "status": 1 });
  db.routes.createIndex({ "routeId": 1 }, { unique: true });
  db.simulationresults.createIndex({ "timestamp": 1 });
  print('Indexes created successfully');
} catch (error) {
  print('Error creating indexes: ' + error.message);
}

print('Database initialization completed successfully');
