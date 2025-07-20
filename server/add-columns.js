// Script to add missing columns to the transactions table
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./financial-tracker.sqlite3');

console.log('Adding missing columns to transactions table...');

// Start a transaction
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  
  // Add the missing columns
  const columnsToAdd = [
    'status TEXT DEFAULT "pending"',
    'paymentDetails TEXT',
    'type TEXT DEFAULT "expense"',
    'category TEXT',
    'payee TEXT',
    'objectDescription TEXT',
    'costCenterName TEXT',
    'vendorName TEXT',
    'vendorId INTEGER',
    'vendorNumber TEXT',
    'netAmount REAL',
    'billNumber TEXT',
    'schemeCode TEXT'
  ];
  
  // Add each column one by one
  columnsToAdd.forEach(column => {
    const columnName = column.split(' ')[0];
    console.log(`Adding column: ${columnName}`);
    
    // Check if column exists before adding
    db.get(`PRAGMA table_info(transactions)`, (err, rows) => {
      if (err) {
        console.error(`Error checking columns: ${err.message}`);
        return;
      }
      
      // If column doesn't exist, add it
      if (!rows || !rows.some(row => row.name === columnName)) {
        db.run(`ALTER TABLE transactions ADD COLUMN ${column}`, err => {
          if (err) {
            console.error(`Error adding column ${columnName}: ${err.message}`);
          } else {
            console.log(`Successfully added column: ${columnName}`);
          }
        });
      } else {
        console.log(`Column ${columnName} already exists, skipping`);
      }
    });
  });
  
  // Commit the transaction
  db.run('COMMIT', err => {
    if (err) {
      console.error(`Error committing transaction: ${err.message}`);
    } else {
      console.log('All columns added successfully!');
    }
    
    // Close the database connection
    db.close(err => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      } else {
        console.log('Database connection closed');
      }
    });
  });
});
