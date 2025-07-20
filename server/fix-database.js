// Script to add missing columns to the transactions table
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./financial-tracker.sqlite3');

console.log('Adding missing columns to transactions table...');

// Add columns one by one with proper error handling
const addColumn = (columnDef) => {
  return new Promise((resolve, reject) => {
    const columnName = columnDef.split(' ')[0];
    console.log(`Adding column: ${columnName}`);
    
    db.run(`ALTER TABLE transactions ADD COLUMN ${columnDef}`, (err) => {
      if (err) {
        // Column might already exist, which is fine
        console.log(`Note: ${err.message}`);
        resolve();
      } else {
        console.log(`Successfully added column: ${columnName}`);
        resolve();
      }
    });
  });
};

// Execute all column additions sequentially
const addAllColumns = async () => {
  try {
    await addColumn('status TEXT DEFAULT "pending"');
    await addColumn('paymentDetails TEXT');
    await addColumn('type TEXT DEFAULT "expense"');
    await addColumn('category TEXT');
    await addColumn('payee TEXT');
    await addColumn('objectDescription TEXT');
    await addColumn('costCenterName TEXT');
    await addColumn('vendorName TEXT');
    await addColumn('vendorId INTEGER');
    await addColumn('vendorNumber TEXT');
    await addColumn('netAmount REAL');
    await addColumn('billNumber TEXT');
    await addColumn('schemeCode TEXT');
    
    console.log('All columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

// Run the function
addAllColumns();
