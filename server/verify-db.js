const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'financial-tracker.db');
const db = new sqlite3.Database(DB_PATH);

// Create tables if they don't exist
const createTables = `
  CREATE TABLE IF NOT EXISTS object_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    vendorNumber TEXT NOT NULL UNIQUE,
    contactPerson TEXT,
    email TEXT,
    phone TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cost_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scheme_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

console.log('Verifying database tables...');
db.serialize(() => {
  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
    } else {
      console.log('Database tables verified successfully!');
      
      // Insert default cost centers if they don't exist
      const defaultCostCenters = [
        { code: 'LZ4064', name: 'Lahore Zone', description: 'Lahore Zone Office' },
        { code: 'LO4587', name: 'Lahore Operations', description: 'Lahore Operations Department' }
      ];
      
      const stmt = db.prepare('INSERT OR IGNORE INTO cost_centers (code, name, description) VALUES (?, ?, ?)');
      defaultCostCenters.forEach(cc => {
        stmt.run(cc.code, cc.name, cc.description);
      });
      stmt.finalize();
      
      console.log('Default cost centers added if they did not exist');
    }
    
    db.close();
  });
});
