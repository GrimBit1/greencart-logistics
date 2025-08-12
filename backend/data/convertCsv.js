const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Function to read CSV and convert to static data
const convertCsvToStatic = async () => {
  const driversData = [];
  const ordersData = [];

  // Read drivers CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'drivers.csv'))
      .pipe(csv())
      .on('data', (row) => {
        // Parse past_week_hours from pipe-separated string
        const pastWeekHours = row.past_week_hours.split('|').map(h => parseInt(h));
        const totalPastWeekHours = pastWeekHours.reduce((sum, hours) => sum + hours, 0);
        
        driversData.push({
          name: row.name,
          currentShiftHours: parseInt(row.shift_hours),
          past7DayWorkHours: totalPastWeekHours,
          pastWeekHours: pastWeekHours
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Read orders CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'orders.csv'))
      .pipe(csv())
      .on('data', (row) => {
        ordersData.push({
          orderId: row.order_id,
          valueRs: parseFloat(row.value_rs),
          routeId: parseInt(row.route_id),
          deliveryTime: row.delivery_time
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Output the static data
  console.log('// Drivers data from CSV:');
  console.log('const csvDriversData = ' + JSON.stringify(driversData, null, 2) + ';');
  console.log('\n// Orders data from CSV:');
  console.log('const csvOrdersData = ' + JSON.stringify(ordersData, null, 2) + ';');
};

convertCsvToStatic().catch(console.error);
