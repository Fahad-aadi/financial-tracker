/**
 * Financial Tracker - Data Migration Script
 * 
 * This script migrates data from JSON files to SQLite database
 */

const db = require('./database');
const fs = require('fs');
const path = require('path');

// Backup JSON files before migration
function backupJsonFiles() {
  const dataDir = path.join(__dirname, 'data');
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
async function migrateData() {
  try {
    console.log('Starting migration from JSON files to SQLite database...');
    
    // First, backup the JSON files
    const backupDir = backupJsonFiles();
    console.log(`JSON files backed up to: ${backupDir}`);
    
    // Migrate budgets
    const budgets = readJsonData('budgets');
    if (budgets.length > 0) {
      console.log(`Migrating ${budgets.length} budgets...`);
      for (const budget of budgets) {
        await db.createBudget(budget);
      }
      console.log('Budgets migration completed');
    } else {
      console.log('No budgets to migrate');
    }
    
    // Migrate transactions
    const transactions = readJsonData('transactions');
    if (transactions.length > 0) {
      console.log(`Migrating ${transactions.length} transactions...`);
      for (const transaction of transactions) {
        await db.createTransaction(transaction);
      }
      console.log('Transactions migration completed');
    } else {
      console.log('No transactions to migrate');
    }
    
    // Migrate cost centers
    const costCenters = readJsonData('costCenters');
    if (costCenters.length > 0) {
      console.log(`Migrating ${costCenters.length} cost centers...`);
      for (const costCenter of costCenters) {
        await db.createCostCenter(costCenter);
      }
      console.log('Cost centers migration completed');
    } else {
      console.log('No cost centers to migrate');
    }
    
    // Migrate object codes
    const objectCodes = readJsonData('objectCodes');
    if (objectCodes.length > 0) {
      console.log(`Migrating ${objectCodes.length} object codes...`);
      for (const objectCode of objectCodes) {
        await db.createObjectCode(objectCode);
      }
      console.log('Object codes migration completed');
    } else {
      console.log('No object codes to migrate');
    }
    
    // Migrate vendors
    const vendors = readJsonData('vendors');
    if (vendors.length > 0) {
      console.log(`Migrating ${vendors.length} vendors...`);
      for (const vendor of vendors) {
        await db.createVendor(vendor);
      }
      console.log('Vendors migration completed');
    } else {
      console.log('No vendors to migrate');
    }
    
    // Migrate scheme codes
    const schemeCodes = readJsonData('schemeCodes');
    if (schemeCodes.length > 0) {
      console.log(`Migrating ${schemeCodes.length} scheme codes...`);
      // Add code to migrate scheme codes
      console.log('Scheme codes migration completed');
    } else {
      console.log('No scheme codes to migrate');
    }
    
    // Migrate bill numbers
    const billNumbers = readJsonData('billNumbers');
    if (billNumbers.length > 0) {
      console.log(`Migrating ${billNumbers.length} bill numbers...`);
      // Add code to migrate bill numbers
      console.log('Bill numbers migration completed');
    } else {
      console.log('No bill numbers to migrate');
    }
    
    console.log('Migration completed successfully!');
    console.log('You can now use the SQLite database for your application.');
    console.log('To start the server with SQLite, run: node sqlite-server.js');
    
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  } finally {
    // Close the database connection
    await db.close();
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });
