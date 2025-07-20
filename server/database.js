/**
 * Financial Tracker - SQLite Database Module
 * 
 * This module provides a robust interface to the SQLite database
 * for the Financial Tracker application.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, 'financial-tracker.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Enable foreign key constraints
db.get("PRAGMA foreign_keys = ON");

// Initialize database schema
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create tables if they don't exist
    const createTables = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'user',
        isActive BOOLEAN NOT NULL DEFAULT 1,
        lastLogin TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      -- Scheme Codes table
      CREATE TABLE IF NOT EXISTS scheme_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      -- Vendors table
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        vendor_number TEXT UNIQUE,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      -- Cost Centers table
      CREATE TABLE IF NOT EXISTS cost_centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      -- Object Codes table
      CREATE TABLE IF NOT EXISTS object_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      
      -- Budgets table
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        financial_year TEXT NOT NULL,
        cost_center_id INTEGER NOT NULL,
        object_code_id INTEGER NOT NULL,
        amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        createdBy INTEGER,
        updatedBy INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
        FOREIGN KEY (object_code_id) REFERENCES object_codes (id),
        FOREIGN KEY (createdBy) REFERENCES users (id),
        FOREIGN KEY (updatedBy) REFERENCES users (id),
        UNIQUE (financial_year, cost_center_id, object_code_id)
      );
      
      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_date TEXT NOT NULL,
        financial_year TEXT NOT NULL,
        cost_center_id INTEGER NOT NULL,
        object_code_id INTEGER NOT NULL,
        vendor_id INTEGER,
        bill_number TEXT,
        description TEXT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        payment_method TEXT,
        reference_number TEXT,
        isPaid BOOLEAN NOT NULL DEFAULT 0,
        payment_date TEXT,
        notes TEXT,
        createdBy INTEGER,
        updatedBy INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
        FOREIGN KEY (object_code_id) REFERENCES object_codes (id),
        FOREIGN KEY (vendor_id) REFERENCES vendors (id),
        FOREIGN KEY (createdBy) REFERENCES users (id),
        FOREIGN KEY (updatedBy) REFERENCES users (id)
      );
      
      -- Budget Allocations table
      CREATE TABLE IF NOT EXISTS budget_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        financial_year TEXT NOT NULL,
        cost_center_id INTEGER NOT NULL,
        scheme_code_id INTEGER NOT NULL,
        allocation_date TEXT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        notes TEXT,
        createdBy INTEGER,
        updatedBy INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
        FOREIGN KEY (scheme_code_id) REFERENCES scheme_codes (id),
        FOREIGN KEY (createdBy) REFERENCES users (id),
        FOREIGN KEY (updatedBy) REFERENCES users (id),
        UNIQUE (financial_year, cost_center_id, scheme_code_id)
      );
      
      -- Budget Releases table
      CREATE TABLE IF NOT EXISTS budget_releases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        allocation_id INTEGER NOT NULL,
        release_date TEXT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        reference_number TEXT,
        is_approved BOOLEAN NOT NULL DEFAULT 0,
        approved_by INTEGER,
        approved_at TEXT,
        notes TEXT,
        createdBy INTEGER,
        updatedBy INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (allocation_id) REFERENCES budget_allocations (id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users (id),
        FOREIGN KEY (createdBy) REFERENCES users (id),
        FOREIGN KEY (updatedBy) REFERENCES users (id)
      );
      
      -- Bill Numbers table (for tracking unique bill numbers)
      CREATE TABLE IF NOT EXISTS bill_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number TEXT NOT NULL UNIQUE,
        transaction_id INTEGER,
        cost_center_id INTEGER NOT NULL,
        financial_year TEXT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT 0,
        used_date TEXT,
        notes TEXT,
        createdBy INTEGER,
        updatedBy INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL,
        FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id),
        FOREIGN KEY (createdBy) REFERENCES users (id),
        FOREIGN KEY (updatedBy) REFERENCES users (id)
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_financial_year ON transactions(financial_year);
      CREATE INDEX IF NOT EXISTS idx_transactions_cost_center ON transactions(cost_center_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_object_code ON transactions(object_code_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_financial_year ON budgets(financial_year);
      CREATE INDEX IF NOT EXISTS idx_budgets_cost_center ON budgets(cost_center_id);
      CREATE INDEX IF NOT EXISTS idx_budget_allocations_financial_year ON budget_allocations(financial_year);
      CREATE INDEX IF NOT EXISTS idx_budget_allocations_cost_center ON budget_allocations(cost_center_id);
    `;

    // Execute the create tables query
    db.serialize(() => {
      db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
          return;
        }
        
        console.log('Database schema initialized successfully');
        resolve();
      });
    });
  });
};

// Helper function to run SQL queries
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    console.log('Executing SQL:', sql);
    console.log('With parameters:', params);
    
    const startTime = Date.now();
    
    db.run(sql, params, function(err) {
      const duration = Date.now() - startTime;
      
      if (err) {
        console.error('SQL Error:', {
          code: err.code,
          message: err.message,
          sql: sql,
          params: params,
          duration: `${duration}ms`,
          stack: err.stack
        });
        return reject(err);
      }
      
      console.log('SQL Execution successful:', {
        lastID: this.lastID,
        changes: this.changes,
        duration: `${duration}ms`
      });
      
      resolve({ 
        lastID: this.lastID, 
        changes: this.changes 
      });
    });
  });
};

// Helper function to get a single row
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Error getting row:', sql, 'Params:', params, 'Error:', err);
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

// Helper function to get all rows
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error getting all rows:', sql, 'Params:', params, 'Error:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

// Export database methods
module.exports = {
  // Generic database methods
  run,
  get,
  all,
  
  // Scheme Code methods
  getSchemeCodes: async () => {
    try {
      const rows = await all('SELECT id, code, name, createdAt, updatedAt FROM scheme_codes ORDER BY code');
      return rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
    } catch (error) {
      console.error('Error in getSchemeCodes:', error);
      throw error;
    }
  },
  
  getSchemeCodeById: async (id) => {
    try {
      const row = await get('SELECT id, code, name, createdAt, updatedAt FROM scheme_codes WHERE id = ?', [id]);
      if (!row) {
        throw new Error('Scheme code not found');
      }
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    } catch (error) {
      console.error('Error in getSchemeCodeById:', error);
      throw error;
    }
  },
  
  getSchemeCodeByCode: async (code) => {
    try {
      const row = await get('SELECT id, code, name, createdAt, updatedAt FROM scheme_codes WHERE code = ?', [code]);
      if (!row) {
        throw new Error(`Scheme code '${code}' not found`);
      }
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
    } catch (error) {
      console.error('Error in getSchemeCodeByCode:', error);
      throw error;
    }
  },
  
  createSchemeCode: async (schemeCode) => {
    try {
      console.log('Creating scheme code with data:', schemeCode);
      const { code, name, description = null } = schemeCode;
      if (!code || !name) {
        throw new Error('Both code and name are required');
      }
      
      const now = new Date().toISOString();
      const params = [code, name, 1, now, now];
      console.log('Executing SQL with params:', params);
      
      const result = await run(
        'INSERT INTO scheme_codes (code, name, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        params
      );
      
      console.log('SQL execution result:', result);
      
      if (result && result.lastID) {
        const created = { 
          id: result.lastID, 
          code, 
          name,
          description,
          isActive: 1,
          createdAt: now,
          updatedAt: now
        };
        console.log('Successfully created scheme code:', created);
        return created;
      }
      
      throw new Error('Failed to create scheme code - invalid result');
    } catch (error) {
      console.error('Error in createSchemeCode:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        sql: error.sql,
        params: error.params
      });
      
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A scheme code with this code already exists');
      }
      
      // Add more specific error handling if needed
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Database constraint violation: ' + error.message);
      }
      
      throw error;
    }
  },
  
  updateSchemeCode: async (id, schemeCode) => {
    try {
      const { code, name } = schemeCode;
      if (!code || !name) {
        throw new Error('Both code and name are required');
      }
      
      const now = new Date().toISOString();
      const result = await run(
        'UPDATE scheme_codes SET code = ?, name = ?, updatedAt = ? WHERE id = ?',
        [code, name, now, id]
      );
      
      if (result && result.changes > 0) {
        return {
          id: id,
          code: code,
          name: name,
          updatedAt: now
        };
      }
      
      throw new Error('Scheme code not found or no changes made');
    } catch (error) {
      console.error('Error in updateSchemeCode:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A scheme code with this code already exists');
      }
      throw error;
    }
  },
  
  deleteSchemeCode: async (id) => {
    try {
      // First get the scheme code to return it after deletion
      const schemeCode = await get('SELECT * FROM scheme_codes WHERE id = ?', [id]);
      if (!schemeCode) {
        throw new Error('Scheme code not found');
      }
      
      const result = await run('DELETE FROM scheme_codes WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        throw new Error('No scheme code was deleted');
      }
      
      return {
        id: schemeCode.id,
        code: schemeCode.code,
        name: schemeCode.name,
        deleted: true
      };
    } catch (error) {
      console.error('Error in deleteSchemeCode:', error);
      throw error;
    }
  },
  
  // Object Code methods
  getObjectCodes: async () => {
    try {
      const sql = 'SELECT * FROM object_codes WHERE isActive = 1 ORDER BY code';
      return await all(sql);
    } catch (error) {
      console.error('Error getting object codes:', error);
      return []; // Return empty array instead of throwing error
    }
  },
  
  getObjectCodeById: async (id) => {
    try {
      const sql = 'SELECT * FROM object_codes WHERE id = ? AND isActive = 1';
      return await get(sql, [id]);
    } catch (error) {
      console.error(`Error getting object code with id ${id}:`, error);
      return null;
    }
  },
  
  createObjectCode: async (objectCode) => {
    try {
      console.log('Creating object code with data:', objectCode);
      const { code, description, isActive = 1 } = objectCode;
      if (!code || !description) {
        throw new Error('Both code and description are required');
      }
      const name = objectCode.name || description || code;
      const now = new Date().toISOString();
      const params = [code, name, description, isActive, now, now];
      console.log('Executing SQL with params:', params);
      const result = await run(
        'INSERT INTO object_codes (code, name, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        params
      );
      console.log('SQL execution result:', result);
      if (result && result.lastID) {
        const created = {
          id: result.lastID,
          code,
          name,
          description,
          isActive,
          createdAt: now,
          updatedAt: now
        };
        console.log('Successfully created object code:', created);
        return created; // Return the constructed object directly
      }
      throw new Error('Failed to create object code - invalid result');
    } catch (error) {
      console.error('Error in createObjectCode:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  },
  
  updateObjectCode: async (id, objectCode) => {
    try {
      const { code, description, isActive = 1 } = objectCode;
      const now = new Date().toISOString();
      // Use description as name if name is not provided
      const name = objectCode.name || description || code;
      
      const sql = `
        UPDATE object_codes 
        SET code = ?, 
            name = ?, 
            description = ?, 
            isActive = ?,
            updatedAt = ?
        WHERE id = ?
      `;
      
      const result = await run(sql, [
        code, 
        name, 
        description, 
        isActive,
        now,
        id
      ]);
      
      // Return the updated object code
      if (result && result.changes > 0) {
        return await getObjectCodeById(id);
      }
      
      throw new Error('Object code not found or not updated');
    } catch (error) {
      console.error('Error updating object code:', error);
      throw error;
    }
  },
  
  deleteObjectCode: async (id) => {
    try {
      const sql = 'UPDATE object_codes SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
      return await run(sql, [id]);
    } catch (error) {
      console.error(`Error deleting object code with id ${id}:`, error);
      throw error;
    }
  },

  // Vendor methods
  getVendors: async () => {
    try {
      const sql = 'SELECT * FROM vendors WHERE isActive = 1 ORDER BY name';
      return await all(sql);
    } catch (error) {
      console.error('Error getting vendors:', error);
      throw error;
    }
  },
  
  getVendorById: async (id) => {
    try {
      const sql = 'SELECT * FROM vendors WHERE id = ?';
      return await get(sql, [id]);
    } catch (error) {
      console.error(`Error getting vendor with id ${id}:`, error);
      throw error;
    }
  },
  
  createVendor: async (vendor) => {
    try {
      console.log('Creating vendor with data:', vendor);
      const { name, vendorNumber, contactPerson = null, email = null, phone = null, isActive = 1 } = vendor;
      if (!name || !vendorNumber) {
        throw new Error('Both name and vendor number are required');
      }
      const now = new Date().toISOString();
      const params = [name, vendorNumber, contactPerson, email, phone, isActive, now, now];
      console.log('Executing SQL with params:', params);
      const result = await run(
        'INSERT INTO vendors (name, vendor_number, contact_person, email, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params
      );
      console.log('SQL execution result:', result);
      if (result && result.lastID) {
        const created = {
          id: result.lastID,
          name,
          vendorNumber,
          contactPerson,
          email,
          phone,
          isActive,
          createdAt: now,
          updatedAt: now
        };
        console.log('Successfully created vendor:', created);
        return created;
      }
      throw new Error('Failed to create vendor - invalid result');
    } catch (error) {
      console.error('Error in createVendor:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  },
  
  updateVendor: async (id, vendor) => {
    try {
      const { name, vendorNumber, contactPerson, email, phone, isActive } = vendor;
      const sql = `
        UPDATE vendors 
        SET name = ?, vendor_number = ?, contact_person = ?, email = ?, phone = ?, isActive = ?
        WHERE id = ?
      `;
      return await run(sql, [name, vendorNumber, contactPerson, email, phone, isActive, id]);
    } catch (error) {
      console.error(`Error updating vendor with id ${id}:`, error);
      throw error;
    }
  },
  
  deleteVendor: async (id) => {
    try {
      const sql = 'UPDATE vendors SET isActive = 0 WHERE id = ?';
      return await run(sql, [id]);
    } catch (error) {
      console.error(`Error deleting vendor with id ${id}:`, error);
      throw error;
    }
  },

  // Cost Center methods
  getCostCenters: async () => {
    try {
      const sql = 'SELECT * FROM cost_centers WHERE isActive = 1 ORDER BY code';
      return await all(sql);
    } catch (error) {
      console.error('Error getting cost centers:', error);
      throw error;
    }
  },
  
  getCostCenterById: async (id) => {
    try {
      const sql = 'SELECT * FROM cost_centers WHERE id = ?';
      return await get(sql, [id]);
    } catch (error) {
      console.error(`Error getting cost center with id ${id}:`, error);
      throw error;
    }
  },
  
  createCostCenter: async (costCenter) => {
    try {
      console.log('Creating cost center with data:', costCenter);
      const { code, name, description = null, isActive = 1 } = costCenter;
      if (!code || !name) {
        throw new Error('Both code and name are required');
      }
      const now = new Date().toISOString();
      const params = [code, name, description, isActive, now, now];
      console.log('Executing SQL with params:', params);
      const result = await run(
        'INSERT INTO cost_centers (code, name, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        params
      );
      console.log('SQL execution result:', result);
      if (result && result.lastID) {
        const created = {
          id: result.lastID,
          code,
          name,
          description,
          isActive,
          createdAt: now,
          updatedAt: now
        };
        console.log('Successfully created cost center:', created);
        return created;
      }
      throw new Error('Failed to create cost center - invalid result');
    } catch (error) {
      console.error('Error in createCostCenter:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  },
  
  updateCostCenter: async (id, costCenter) => {
    try {
      const { code, name, description, isActive } = costCenter;
      const sql = `
        UPDATE cost_centers 
        SET code = ?, name = ?, description = ?, isActive = ?
        WHERE id = ?
      `;
      return await run(sql, [code, name, description, isActive, id]);
    } catch (error) {
      console.error(`Error updating cost center with id ${id}:`, error);
      throw error;
    }
  },
  
  deleteCostCenter: async (id) => {
    try {
      const sql = 'UPDATE cost_centers SET isActive = 0 WHERE id = ?';
      return await run(sql, [id]);
    } catch (error) {
      console.error(`Error deleting cost center with id ${id}:`, error);
      throw error;
    }
  },
  createBudgetAllocation: async (budget) => {
    
  }
  
  // Close the database connection
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    });
  }
};

// Initialize the database when this module is loaded
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
