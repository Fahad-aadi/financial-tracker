/**
 * Migration Script: JSON to SQLite
 * 
 * This script migrates data from JSON files to SQLite database
 * Run with: node migrate-to-sqlite.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');
// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to the SQLite database');
    // Initialize the database schema
    initDatabase();
  }
});

// Backup JSON files before migration
function backupJsonFiles() {
  const backupDir = path.join(__dirname, 'data-backup-' + new Date().toISOString().replace(/:/g, '-'));
  
  console.log(`Creating backup directory: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
  
  const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const sourcePath = path.join(dataDir, file);
    const destPath = path.join(backupDir, file);
    
    console.log(`Backing up ${file}...`);
    fs.copyFileSync(sourcePath, destPath);
  }
  
  console.log('Backup completed successfully');
  return backupDir;
}

// Initialize database schema
function initDatabase() {
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables if they don't exist
    
    // Budgets table
    db.run(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        spent REAL NOT NULL DEFAULT 0,
        remaining REAL NOT NULL DEFAULT 0,
        period TEXT NOT NULL DEFAULT 'yearly',
        categoryId INTEGER,
        categoryName TEXT,
        costCenter TEXT NOT NULL,
        costCenterName TEXT,
        objectCode TEXT NOT NULL,
        financialYear TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        payee TEXT,
        objectCode TEXT,
        costCenter TEXT,
        financialYear TEXT,
        billNumber TEXT,
        schemeCode TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Cost Centers table
    db.run(`
      CREATE TABLE IF NOT EXISTS cost_centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Object Codes table
    db.run(`
      CREATE TABLE IF NOT EXISTS object_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Vendors table
    db.run(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contactPerson TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        accountNumber TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Scheme Codes table
    db.run(`
      CREATE TABLE IF NOT EXISTS scheme_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Bill Numbers table
    db.run(`
      CREATE TABLE IF NOT EXISTS bill_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL UNIQUE,
        description TEXT,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        createdAt TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating database schema:', err);
      } else {
        console.log('Database schema initialized successfully');
        // Start the migration after schema is created
        backupJsonFiles();
        migrateData();
      }
    });
  });
}

// Helper function to read JSON data
function readJsonData(filename) {
  try {
    const filePath = path.join(__dirname, 'data', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filename}.json:`, error);
    return [];
  }
}

// Migrate data from JSON files to SQLite
function migrateData() {
  console.log('Starting data migration...');
  
  // Migrate budgets
  const budgets = readJsonData('budgets');
  if (budgets.length > 0) {
    console.log(`Migrating ${budgets.length} budgets...`);
    const stmt = db.prepare(`
      INSERT INTO budgets (
        name, amount, spent, remaining, period, categoryId, categoryName,
        costCenter, costCenterName, objectCode, financialYear, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    budgets.forEach(budget => {
      stmt.run(
        budget.name || budget.objectCode || '',
        budget.amount || 0,
        budget.spent || 0,
        budget.remaining || 0,
        budget.period || 'yearly',
        budget.categoryId || 1,
        budget.categoryName || '',
        budget.costCenter || '',
        budget.costCenterName || '',
        budget.objectCode || budget.name || '',
        budget.financialYear || '',
        budget.createdAt || new Date().toISOString()
      );
    });
    
    stmt.finalize();
    console.log('Budgets migration completed');
  }
  
  // Migrate transactions
  const transactions = readJsonData('transactions');
  if (transactions.length > 0) {
    console.log(`Migrating ${transactions.length} transactions...`);
    const stmt = db.prepare(`
      INSERT INTO transactions (
        date, description, amount, type, category, payee, objectCode,
        costCenter, financialYear, billNumber, schemeCode, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    transactions.forEach(transaction => {
      stmt.run(
        transaction.date || '',
        transaction.description || '',
        transaction.amount || 0,
        transaction.type || '',
        transaction.category || '',
        transaction.payee || '',
        transaction.objectCode || '',
        transaction.costCenter || '',
        transaction.financialYear || '',
        transaction.billNumber || '',
        transaction.schemeCode || '',
        transaction.createdAt || new Date().toISOString()
      );
    });
    
    stmt.finalize();
    console.log('Transactions migration completed');
  }
  
  // Migrate cost centers
  const costCenters = readJsonData('costCenters');
  if (costCenters.length > 0) {
    console.log(`Migrating ${costCenters.length} cost centers...`);
    const stmt = db.prepare(`
      INSERT INTO cost_centers (
        code, name, description, createdAt
      ) VALUES (?, ?, ?, ?)
    `);
    
    costCenters.forEach(costCenter => {
      stmt.run(
        costCenter.code || '',
        costCenter.name || '',
        costCenter.description || '',
        costCenter.createdAt || new Date().toISOString()
      );
    });
    
    stmt.finalize();
    console.log('Cost centers migration completed');
  }
  
  // Migrate object codes
  const objectCodes = readJsonData('objectCodes');
  if (objectCodes.length > 0) {
    console.log(`Migrating ${objectCodes.length} object codes...`);
    const stmt = db.prepare(`
      INSERT INTO object_codes (
        code, description, createdAt
      ) VALUES (?, ?, ?)
    `);
    
    objectCodes.forEach(objectCode => {
      stmt.run(
        objectCode.code || '',
        objectCode.description || '',
        objectCode.createdAt || new Date().toISOString()
      );
    });
    
    stmt.finalize();
    console.log('Object codes migration completed');
  }
  
  // Migrate vendors
  const vendors = readJsonData('vendors');
  if (vendors.length > 0) {
    console.log(`Migrating ${vendors.length} vendors...`);
    const stmt = db.prepare(`
      INSERT INTO vendors (
        name, contactPerson, phone, email, address, accountNumber, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    vendors.forEach(vendor => {
      stmt.run(
        vendor.name || '',
        vendor.contactPerson || '',
        vendor.phone || '',
        vendor.email || '',
        vendor.address || '',
        vendor.accountNumber || '',
        vendor.createdAt || new Date().toISOString()
      );
    });
    
    stmt.finalize();
    console.log('Vendors migration completed');
  }
  
  console.log('Migration completed successfully!');
  console.log('You can now use the SQLite database for your application.');
  console.log('To start the server with SQLite, run: node sqlite-server.js');
  
  // Close the database connection
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
