/**
 * Script to update the SQLite database schema for the SQLite server
 * This will add the missing columns to the transactions table
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the SQLite database file used by the SQLite server
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');

console.log(`Opening database at: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database');
});

// Function to check if a column exists in a table
function columnExists(table, column) {
  return new Promise((resolve, reject) => {
    db.get(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Check if the column exists in the result
      const exists = rows && rows.some(row => row.name === column);
      resolve(exists);
    });
  });
}

// Function to add a column to a table if it doesn't exist
function addColumnIfNotExists(table, column, type) {
  return columnExists(table, column)
    .then(exists => {
      if (!exists) {
        return new Promise((resolve, reject) => {
          console.log(`Adding column ${column} to ${table}`);
          db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
            if (err) {
              reject(err);
              return;
            }
            console.log(`Column ${column} added successfully`);
            resolve();
          });
        });
      } else {
        console.log(`Column ${column} already exists in ${table}`);
        return Promise.resolve();
      }
    });
}

// Add the missing columns to the transactions table
async function updateTransactionsTable() {
  try {
    // Check if the transactions table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'", (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      });
    });
    
    if (!tableExists) {
      console.error('Transactions table does not exist');
      return;
    }
    
    // Add the missing columns
    await addColumnIfNotExists('transactions', 'status', 'TEXT DEFAULT "pending"');
    await addColumnIfNotExists('transactions', 'paymentDetails', 'TEXT');
    await addColumnIfNotExists('transactions', 'objectDescription', 'TEXT');
    await addColumnIfNotExists('transactions', 'costCenterName', 'TEXT');
    await addColumnIfNotExists('transactions', 'vendorName', 'TEXT');
    await addColumnIfNotExists('transactions', 'vendorId', 'INTEGER');
    await addColumnIfNotExists('transactions', 'vendorNumber', 'TEXT');
    await addColumnIfNotExists('transactions', 'netAmount', 'REAL');
    
    console.log('All columns added successfully');
  } catch (error) {
    console.error('Error updating transactions table:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Run the update
updateTransactionsTable();
