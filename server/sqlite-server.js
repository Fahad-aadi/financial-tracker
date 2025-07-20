/**
 * Financial Tracker - SQLite Server
 * 
 * This server uses SQLite for data storage instead of JSON files.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Load environment variables if .env file exists
require('dotenv').config();

// Import database module with enhanced logging
const db = require('./database');

// Log database configuration
console.log('Database configuration:');
console.log('- Database path:', path.join(__dirname, 'data', 'financial_tracker.db'));
console.log('- Environment:', process.env.NODE_ENV || 'development');

// Create Express app with enhanced settings
const app = express();

// Configure server settings
const PORT = process.env.PORT || 4001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log server startup information
console.log('\n=== Starting Financial Tracker Server ===');
console.log(`Environment: ${NODE_ENV}`);
console.log(`Server time: ${new Date().toISOString()}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Server will run on port: ${PORT}`);

// Log database configuration
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');
console.log('\nDatabase Configuration:');
console.log(`- Database path: ${dbPath}`);
console.log(`- Database exists: ${fs.existsSync(dbPath) ? '✅ Yes' : '❌ No'}`);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Only serve static files if the build directory exists
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  console.log('Serving static files from:', clientBuildPath);
  app.use(express.static(clientBuildPath));
} else {
  console.log('Client build directory not found at:', clientBuildPath);
  console.log('Static file serving is disabled');
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Financial Tracker API is running!',
    storageType: 'SQLite Database'
  });
});

// API Routes

// Budget routes
app.get('/api/budgets', async (req, res) => {
  try {
    console.log('GET /api/budgets - Fetching budgets from database');
    
    let budgets;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      budgets = await db.getBudgetsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      budgets = await db.getBudgetsByCostCenter(costCenter);
    } else if (financialYear) {
      budgets = await db.getBudgetsByFinancialYear(financialYear);
    } else {
      budgets = await db.getBudgets();
    }
    
    console.log(`Found ${budgets.length} budgets in database`);
    
    // Transform budgets to ensure all required fields are present
    const transformedBudgets = budgets.map(budget => ({
      ...budget,
      name: budget.name || budget.objectCode || '',
      costCenter: budget.costCenter || '',
      costCenterName: budget.costCenterName || '',
      objectCode: budget.objectCode || budget.name || '',
      financialYear: budget.financialYear || '',
      cost_center: budget.costCenter || '',
      object_code: budget.objectCode || budget.name || '',
      financial_year: budget.financialYear || '',
      period: 'yearly', // Always set to yearly
      amount: budget.amount || 0,
      spent: budget.spent || 0,
      remaining: budget.remaining || 0,
      categoryId: budget.categoryId || 1,
      categoryName: budget.categoryName || ''
    }));
    
    console.log('Sending budgets to client');
    res.json(transformedBudgets);
  } catch (error) {
    console.error('Error in GET /api/budgets:', error);
    res.status(500).json({ error: 'Failed to retrieve budgets', details: error.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    console.log('POST /api/budgets - Received budget data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budgets - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Ensure all required fields are present
    const newBudget = {
      name: req.body.name || req.body.objectCode || '',
      amount: Number(req.body.amount) || 0,
      spent: Number(req.body.spent) || 0,
      remaining: Number(req.body.remaining) || Number(req.body.amount) || 0,
      period: 'yearly', // Always set to yearly
      categoryId: Number(req.body.categoryId) || 1,
      categoryName: req.body.categoryName || '',
      costCenter: req.body.costCenter || req.body.cost_center || '',
      costCenterName: req.body.costCenterName || '',
      objectCode: req.body.objectCode || req.body.name || '',
      financialYear: req.body.financialYear || req.body.financial_year || ''
    };
    
    console.log('Formatted new budget:', newBudget);
    
    // Validate required fields
    if (!newBudget.costCenter) {
      console.error('Missing required field: costCenter');
      return res.status(400).json({ error: 'Missing required field: costCenter' });
    }
    
    if (!newBudget.objectCode) {
      console.error('Missing required field: objectCode');
      return res.status(400).json({ error: 'Missing required field: objectCode' });
    }
    
    if (!newBudget.financialYear) {
      console.error('Missing required field: financialYear');
      return res.status(400).json({ error: 'Missing required field: financialYear' });
    }
    
    console.log('Saving budget to database...');
    const result = await db.createBudget(newBudget);
    
    if (!result || !result.id) {
      console.error('Failed to save budget - No result or ID returned');
      return res.status(500).json({ error: 'Failed to save budget' });
    }
    
    console.log('Budget saved with ID:', result.id);
    
    // Get the created budget with its ID
    const createdBudget = await db.getBudgetById(result.id);
    
    console.log('Saved new budget:', createdBudget);
    console.log(' Budget created and released successfully!');
    res.status(201).json(createdBudget);
  } catch (error) {
    console.error('Error in POST /api/budgets:', error);
    res.status(500).json({ error: 'Failed to create budget', details: error.message });
  }
});

app.get('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const budget = await db.getBudgetById(id);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error(`Error in GET /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget', details: error.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if budget exists
    const existingBudget = await db.getBudgetById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update budget
    const updatedBudget = {
      ...existingBudget,
      ...req.body,
      amount: Number(req.body.amount) || existingBudget.amount,
      spent: Number(req.body.spent) || existingBudget.spent,
      remaining: Number(req.body.remaining) || Number(req.body.amount) - Number(req.body.spent) || existingBudget.remaining
    };
    
    await db.updateBudget(id, updatedBudget);
    
    // Get the updated budget
    const result = await db.getBudgetById(id);
    
    res.json(result);
  } catch (error) {
    console.error(`Error in PUT /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update budget', details: error.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if budget exists
    const existingBudget = await db.getBudgetById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete budget
    await db.deleteBudget(id);
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete budget', details: error.message });
  }
});

app.get('/api/budgets', async (req, res) => {
  try {
    console.log('GET /api/budgets - Fetching budgets');
    
    let budgets;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      budgets = await db.getBudgetsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      budgets = await db.getBudgetsByCostCenter(costCenter);
    } else if (financialYear) {
      budgets = await db.getBudgetsByFinancialYear(financialYear);
    } else {
      budgets = await db.getBudgets();
    }
    
    console.log(`Found ${budgets.length} budgets`);
    res.json(budgets);
  } catch (error) {
    console.error('Error in GET /api/budgets:', error);
    res.status(500).json({ error: 'Failed to retrieve budgets', details: error.message });
  }
});

app.get('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const budget = await db.getBudgetById(id);
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error(`Error in GET /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget', details: error.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    console.log('POST /api/budgets - Creating budget:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budgets - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Ensure the budget has a createdAt field
    const budget = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.createBudget(budget);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save budget' });
    }
    
    const createdBudget = await db.getBudgetById(result.id);
    
    console.log('Budget created successfully:', createdBudget);
    res.status(201).json(createdBudget);
  } catch (error) {
    console.error('Error in POST /api/budgets:', error);
    res.status(500).json({ error: 'Failed to create budget', details: error.message });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if budget exists
    const existingBudget = await db.getBudgetById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update budget
    await db.updateBudget(id, req.body);
    
    // Get the updated budget
    const updatedBudget = await db.getBudgetById(id);
    
    res.json(updatedBudget);
  } catch (error) {
    console.error(`Error in PUT /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update budget', details: error.message });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if budget exists
    const existingBudget = await db.getBudgetById(id);
    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete budget
    await db.deleteBudget(id);
    
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/budgets/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete budget', details: error.message });
  }
});

// Special endpoint to delete all budgets for a specific financial year
app.delete('/api/budgets/year/:financialYear', async (req, res) => {
  try {
    const financialYear = req.params.financialYear;
    
    // Get all budgets for this financial year
    const budgets = await db.getBudgetsByFinancialYear(financialYear);
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ error: 'No budgets found for this financial year' });
    }
    
    // Delete each budget
    let deletedCount = 0;
    for (const budget of budgets) {
      await db.deleteBudget(budget.id);
      deletedCount++;
    }
    
    res.json({ message: `Successfully deleted ${deletedCount} budgets for financial year ${financialYear}` });
  } catch (error) {
    console.error(`Error in DELETE /api/budgets/year/${req.params.financialYear}:`, error);
    res.status(500).json({ error: 'Failed to delete budgets', details: error.message });
  }
});

// Special endpoint to delete all budgets
app.delete('/api/budgets', async (req, res) => {
  try {
    // Get all budgets
    const budgets = await db.getBudgets();
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ error: 'No budgets found' });
    }
    
    // Delete each budget
    let deletedCount = 0;
    for (const budget of budgets) {
      await db.deleteBudget(budget.id);
      deletedCount++;
    }
    
    res.json({ message: `Successfully deleted ${deletedCount} budgets` });
  } catch (error) {
    console.error('Error in DELETE /api/budgets:', error);
    res.status(500).json({ error: 'Failed to delete budgets', details: error.message });
  }
});

// Transaction routes
app.get('/api/transactions', async (req, res) => {
  try {
    let transactions;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      transactions = await db.getTransactionsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      transactions = await db.getTransactionsByCostCenter(costCenter);
    } else if (financialYear) {
      transactions = await db.getTransactionsByFinancialYear(financialYear);
    } else {
      transactions = await db.getTransactions();
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions', details: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    console.log('POST /api/transactions - Received transaction data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/transactions - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Ensure all required fields are present with defaults
    const newTransaction = {
      date: req.body.date || new Date().toISOString().split('T')[0],
      description: req.body.description || '',
      amount: Number(req.body.amount) || 0,
      type: req.body.type || 'expense',
      category: req.body.category || '',
      payee: req.body.payee || '',
      objectCode: req.body.objectCode || '',
      costCenter: req.body.costCenter || '',
      financialYear: req.body.financialYear || '',
      billNumber: req.body.billNumber || '',
      schemeCode: req.body.schemeCode || ''
    };
    
    console.log('Formatted transaction data:', newTransaction);
    
    const result = await db.createTransaction(newTransaction);
    console.log('Transaction creation result:', result);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save transaction' });
    }
    
    const createdTransaction = await db.getTransactionById(result.id);
    console.log('Created transaction:', createdTransaction);
    
    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error in POST /api/transactions:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await db.getTransactionById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(`Error in GET /api/transactions/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve transaction', details: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if transaction exists
    const existingTransaction = await db.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Update transaction
    await db.updateTransaction(id, req.body);
    
    // Get the updated transaction
    const result = await db.getTransactionById(id);
    
    res.json(result);
  } catch (error) {
    console.error(`Error in PUT /api/transactions/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if transaction exists
    const existingTransaction = await db.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Delete transaction
    await db.deleteTransaction(id);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/transactions/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
});

// Cost Center routes
app.get('/api/costCenters', async (req, res) => {
  try {
    const costCenters = await db.getCostCenters();
    res.json(costCenters);
  } catch (error) {
    console.error('Error in GET /api/costCenters:', error);
    res.status(500).json({ error: 'Failed to retrieve cost centers', details: error.message });
  }
});

app.post('/api/costCenters', async (req, res) => {
  try {
    const result = await db.createCostCenter(req.body);
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save cost center' });
    }
    
    const createdCostCenter = await db.getCostCenterByCode(req.body.code);
    res.status(201).json(createdCostCenter);
  } catch (error) {
    console.error('Error in POST /api/costCenters:', error);
    res.status(500).json({ error: 'Failed to create cost center', details: error.message });
  }
});

// Object Code routes
app.get('/api/objectCodes', async (req, res) => {
  try {
    const objectCodes = await db.getObjectCodes();
    res.json(objectCodes);
  } catch (error) {
    console.error('Error in GET /api/objectCodes:', error);
    res.status(500).json({ error: 'Failed to retrieve object codes', details: error.message });
  }
});

app.post('/api/objectCodes', async (req, res) => {
  try {
    const result = await db.createObjectCode(req.body);
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save object code' });
    }
    
    const createdObjectCode = await db.getObjectCodeByCode(req.body.code);
    res.status(201).json(createdObjectCode);
  } catch (error) {
    console.error('Error in POST /api/objectCodes:', error);
    res.status(500).json({ error: 'Failed to create object code', details: error.message });
  }
});

// Vendor routes
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await db.getVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error in GET /api/vendors:', error);
    res.status(500).json({ error: 'Failed to retrieve vendors', details: error.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    // Prevent duplicate vendorNumber
    const allVendors = await db.getVendors();
    if (allVendors.some(v => v.vendorNumber === req.body.vendorNumber)) {
      return res.status(409).json({ error: 'Vendor number already exists' });
    }
    const result = await db.createVendor(req.body);
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save vendor' });
    }
    const createdVendor = await db.getVendorById(result.id);
    res.status(201).json(createdVendor);
  } catch (error) {
    console.error('Error in POST /api/vendors:', error);
    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.updateVendor(id, req.body);
    const updated = await db.getVendorById(id);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to update vendor', details: error.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteVendor(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
  }
});

// Settings sync endpoint
app.post('/api/settings/sync', async (req, res) => {
  try {
    console.log('POST /api/settings/sync - Syncing settings:', req.body);
    
    const { objectCodes, costCenters, schemeCodes, vendors, taxSettings } = req.body;
    
    // Process object codes
    if (objectCodes && Array.isArray(objectCodes)) {
      for (const code of objectCodes) {
        try {
          const existingCode = await db.getObjectCodeByCode(code.code);
          if (!existingCode) {
            await db.createObjectCode(code);
          }
        } catch (err) {
          console.error('Error syncing object code:', code, err);
        }
      }
    }
    
    // Process cost centers
    if (costCenters && Array.isArray(costCenters)) {
      for (const center of costCenters) {
        try {
          const existingCenter = await db.getCostCenterByCode(center.code);
          if (!existingCenter) {
            await db.createCostCenter(center);
          }
        } catch (err) {
          console.error('Error syncing cost center:', center, err);
        }
      }
    }
    
    // Process vendors
    if (vendors && Array.isArray(vendors)) {
      for (const vendor of vendors) {
        try {
          // Use vendor number as unique identifier
          const existingVendors = await db.getVendors();
          const existingVendor = existingVendors.find(v => v.number === vendor.number);
          if (!existingVendor) {
            await db.createVendor(vendor);
          }
        } catch (err) {
          console.error('Error syncing vendor:', vendor, err);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Settings synced successfully',
      counts: {
        objectCodes: objectCodes?.length || 0,
        costCenters: costCenters?.length || 0,
        schemeCodes: schemeCodes?.length || 0,
        vendors: vendors?.length || 0,
        taxSettings: taxSettings ? 1 : 0
      }
    });
  } catch (error) {
    console.error('Error in POST /api/settings/sync:', error);
    res.status(500).json({ error: 'Failed to sync settings', details: error.message });
  }
});

// Budget allocation endpoints
app.post('/api/budget-allocations', async (req, res) => {
  try {
    console.log('POST /api/budget-allocations - Received allocation data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budget-allocations - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Validate required fields
    const { objectCode, costCenter, financialYear, totalAllocation } = req.body;
    
    if (!objectCode) {
      return res.status(400).json({ error: 'Missing required field: objectCode' });
    }
    
    if (!costCenter) {
      return res.status(400).json({ error: 'Missing required field: costCenter' });
    }
    
    if (!financialYear) {
      return res.status(400).json({ error: 'Missing required field: financialYear' });
    }
    
    if (!totalAllocation && totalAllocation !== 0) {
      return res.status(400).json({ error: 'Missing required field: totalAllocation' });
    }
    
    // Ensure the allocation has a dateCreated field
    const allocation = {
      ...req.body,
      dateCreated: req.body.dateCreated || new Date().toISOString().split('T')[0]
    };
    
    // Store the allocation in the database
    const result = await db.createBudgetAllocation(allocation);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save budget allocation' });
    }
    
    // Get the created allocation with its ID
    const createdAllocation = await db.getBudgetAllocationById(result.id);
    
    console.log('Budget allocation saved successfully:', createdAllocation);
    res.status(201).json(createdAllocation);
  } catch (error) {
    console.error('Error in POST /api/budget-allocations:', error);
    res.status(500).json({ error: 'Failed to create budget allocation', details: error.message });
  }
});

app.get('/api/budget-allocations', async (req, res) => {
  try {
    console.log('GET /api/budget-allocations - Fetching budget allocations');
    
    let allocations;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      allocations = await db.getBudgetAllocationsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      allocations = await db.getBudgetAllocationsByCostCenter(costCenter);
    } else if (financialYear) {
      allocations = await db.getBudgetAllocationsByFinancialYear(financialYear);
    } else {
      allocations = await db.getBudgetAllocations();
    }
    
    console.log(`Found ${allocations.length} budget allocations`);
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    const transformedAllocations = allocations.map(allocation => ({
      ...allocation,
      q1Released: allocation.q1Released === 1,
      q2Released: allocation.q2Released === 1,
      q3Released: allocation.q3Released === 1,
      q4Released: allocation.q4Released === 1
    }));
    
    res.json(transformedAllocations);
  } catch (error) {
    console.error('Error in GET /api/budget-allocations:', error);
    res.status(500).json({ error: 'Failed to retrieve budget allocations', details: error.message });
  }
});

app.get('/api/budget-allocations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const allocation = await db.getBudgetAllocationById(id);
    
    if (!allocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    const transformedAllocation = {
      ...allocation,
      q1Released: allocation.q1Released === 1,
      q2Released: allocation.q2Released === 1,
      q3Released: allocation.q3Released === 1,
      q4Released: allocation.q4Released === 1
    };
    
    res.json(transformedAllocation);
  } catch (error) {
    console.error(`Error in GET /api/budget-allocations/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget allocation', details: error.message });
  }
});

app.put('/api/budget-allocations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if allocation exists
    const existingAllocation = await db.getBudgetAllocationById(id);
    if (!existingAllocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    
    // Update the allocation
    await db.updateBudgetAllocation(id, req.body);
    
    // Get the updated allocation
    const updatedAllocation = await db.getBudgetAllocationById(id);
    
    // Transform boolean fields from SQLite integers to JavaScript booleans
    const transformedAllocation = {
      ...updatedAllocation,
      q1Released: updatedAllocation.q1Released === 1,
      q2Released: updatedAllocation.q2Released === 1,
      q3Released: updatedAllocation.q3Released === 1,
      q4Released: updatedAllocation.q4Released === 1
    };
    
    res.json(transformedAllocation);
  } catch (error) {
    console.error(`Error in PUT /api/budget-allocations/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update budget allocation', details: error.message });
  }
});

app.delete('/api/budget-allocations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if allocation exists
    const existingAllocation = await db.getBudgetAllocationById(id);
    if (!existingAllocation) {
      return res.status(404).json({ error: 'Budget allocation not found' });
    }
    
    // Delete the allocation (this will cascade delete related entries)
    await db.deleteBudgetAllocation(id);
    
    res.json({ message: 'Budget allocation deleted successfully', id });
  } catch (error) {
    console.error('Error deleting budget allocation:', error);
    res.status(500).json({ error: error.message || 'Failed to delete budget allocation' });
  }
});

app.delete('/api/budget-releases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if release exists
    const existingRelease = await db.getBudgetReleaseById(id);
    if (!existingRelease) {
      return res.status(404).json({ error: 'Budget release not found' });
    }
    
    // Delete the release (this will update related entries)
    await db.deleteBudgetRelease(id);
    
    res.json({ message: 'Budget release deleted successfully', id });
  } catch (error) {
    console.error('Error deleting budget release:', error);
    res.status(500).json({ error: error.message || 'Failed to delete budget release' });
  }
});

app.delete('/api/budgets/year/:financialYear', async (req, res) => {
  try {
    const financialYear = req.params.financialYear;
    
    // Get all budgets for this financial year
    const budgets = await db.getBudgetsByFinancialYear(financialYear);
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ error: `No budgets found for financial year ${financialYear}` });
    }
    
    // Delete each budget
    let deletedCount = 0;
    for (const budget of budgets) {
      await db.deleteBudget(budget.id);
      deletedCount++;
    }
    
    res.json({ 
      message: `Successfully deleted ${deletedCount} budgets for financial year ${financialYear}`,
      count: deletedCount 
    });
  } catch (error) {
    console.error(`Error deleting budgets for financial year ${req.params.financialYear}:`, error);
    res.status(500).json({ error: error.message || 'Failed to delete budgets' });
  }
});

app.delete('/api/budgets', async (req, res) => {
  try {
    // Get all budgets
    const budgets = await db.getBudgets();
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ error: 'No budgets found' });
    }
    
    // Delete each budget
    let deletedCount = 0;
    for (const budget of budgets) {
      await db.deleteBudget(budget.id);
      deletedCount++;
    }
    
    res.json({ 
      message: `Successfully deleted all ${deletedCount} budgets`,
      count: deletedCount 
    });
  } catch (error) {
    console.error('Error deleting all budgets:', error);
    res.status(500).json({ error: error.message || 'Failed to delete budgets' });
  }
});

app.delete('/api/budgets/by-allocation', async (req, res) => {
  try {
    const { objectCode, costCenter, financialYear } = req.body;
    
    if (!objectCode || !costCenter || !financialYear) {
      return res.status(400).json({ error: 'Missing required parameters: objectCode, costCenter, financialYear' });
    }
    
    // Find budgets matching these criteria
    const budgets = await db.all(
      'SELECT * FROM budgets WHERE objectCode = ? AND costCenter = ? AND financialYear = ?',
      [objectCode, costCenter, financialYear]
    );
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ error: 'No matching budgets found' });
    }
    
    // Delete each budget
    let deletedCount = 0;
    for (const budget of budgets) {
      await db.deleteBudget(budget.id);
      deletedCount++;
    }
    
    res.json({ 
      message: `Successfully deleted ${deletedCount} budgets matching the allocation criteria`,
      count: deletedCount 
    });
  } catch (error) {
    console.error('Error deleting budgets by allocation:', error);
    res.status(500).json({ error: error.message || 'Failed to delete budgets' });
  }
});

// Budget releases endpoints
app.post('/api/budget-releases', async (req, res) => {
  try {
    console.log('POST /api/budget-releases - Received release data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budget-releases - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Validate required fields
    const { allocationId, objectCode, costCenter, financialYear, quarter, amount } = req.body;
    
    if (!allocationId) {
      return res.status(400).json({ error: 'Missing required field: allocationId' });
    }
    
    if (!objectCode) {
      return res.status(400).json({ error: 'Missing required field: objectCode' });
    }
    
    if (!costCenter) {
      return res.status(400).json({ error: 'Missing required field: costCenter' });
    }
    
    if (!financialYear) {
      return res.status(400).json({ error: 'Missing required field: financialYear' });
    }
    
    if (!quarter) {
      return res.status(400).json({ error: 'Missing required field: quarter' });
    }
    
    if (!amount && amount !== 0) {
      return res.status(400).json({ error: 'Missing required field: amount' });
    }
    
    // Ensure the release has a dateReleased field
    const release = {
      ...req.body,
      dateReleased: req.body.dateReleased || new Date().toISOString().split('T')[0],
      type: req.body.type || 'regular'
    };
    
    // Store the release in the database
    const result = await db.createBudgetRelease(release);
    
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save budget release' });
    }
    
    // Get the created release with its ID
    const createdRelease = await db.getBudgetReleaseById(result.id);
    
    console.log('Budget release saved successfully:', createdRelease);
    res.status(201).json(createdRelease);
  } catch (error) {
    console.error('Error in POST /api/budget-releases:', error);
    res.status(500).json({ error: 'Failed to create budget release', details: error.message });
  }
});

app.get('/api/budget-releases', async (req, res) => {
  try {
    console.log('GET /api/budget-releases - Fetching budget releases');
    
    let releases;
    const { allocationId, costCenter, financialYear } = req.query;
    
    if (allocationId) {
      releases = await db.getBudgetReleasesByAllocationId(allocationId);
    } else if (costCenter && financialYear) {
      // We don't have a specific method for this combination, so we'll fetch all and filter
      const allReleases = await db.getBudgetReleases();
      releases = allReleases.filter(r => r.costCenter === costCenter && r.financialYear === financialYear);
    } else if (costCenter) {
      releases = await db.getBudgetReleasesByCostCenter(costCenter);
    } else if (financialYear) {
      releases = await db.getBudgetReleasesByFinancialYear(financialYear);
    } else {
      releases = await db.getBudgetReleases();
    }
    
    console.log(`Found ${releases.length} budget releases`);
    res.json(releases);
  } catch (error) {
    console.error('Error in GET /api/budget-releases:', error);
    res.status(500).json({ error: 'Failed to retrieve budget releases', details: error.message });
  }
});

app.get('/api/budget-releases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const release = await db.getBudgetReleaseById(id);
    
    if (!release) {
      return res.status(404).json({ error: 'Budget release not found' });
    }
    
    res.json(release);
  } catch (error) {
    console.error(`Error in GET /api/budget-releases/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve budget release', details: error.message });
  }
});

app.delete('/api/budget-releases/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if release exists
    const existingRelease = await db.getBudgetReleaseById(id);
    if (!existingRelease) {
      return res.status(404).json({ error: 'Budget release not found' });
    }
    
    // Delete the release
    await db.deleteBudgetRelease(id);
    
    res.json({ message: 'Budget release deleted successfully' });
  } catch (error) {
    console.error(`Error in DELETE /api/budget-releases/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete budget release', details: error.message });
  }
});

// Settings API endpoints
app.get('/api/settings', async (req, res) => {
  try {
    // Read settings from the database or a settings file
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      res.json(settings);
    } else {
      // Return default settings if file doesn't exist
      const defaultSettings = {
        selectedFinancialYear: '2024-25',
        financialYears: ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28']
      };
      res.json(defaultSettings);
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // Save settings to a file
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/financial-years', async (req, res) => {
  try {
    // Read settings from the database or a settings file
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      if (settings.financialYears && Array.isArray(settings.financialYears)) {
        res.json(settings.financialYears);
      } else {
        // Return default financial years if not found in settings
        res.json(['2023-24', '2024-25', '2025-26', '2026-27', '2027-28']);
      }
    } else {
      // Return default financial years if file doesn't exist
      res.json(['2023-24', '2024-25', '2025-26', '2026-27', '2027-28']);
    }
  } catch (error) {
    console.error('Error getting financial years:', error);
    res.status(500).json({ error: 'Failed to get financial years' });
  }
});

// --- Scheme Codes CRUD Endpoints ---
app.get('/api/schemeCodes', async (req, res) => {
  try {
    console.log('GET /api/schemeCodes - Fetching scheme codes');
    const schemeCodes = await db.getSchemeCodes();
    console.log(`Found ${schemeCodes.length} scheme codes`);
    res.json(schemeCodes);
  } catch (error) {
    console.error('Error in GET /api/schemeCodes:', error);
    res.status(500).json({ error: 'Failed to retrieve scheme codes', details: error.message });
  }
});

app.post('/api/schemeCodes', async (req, res) => {
  try {
    console.log('POST /api/schemeCodes - Creating scheme code:', req.body);
    const result = await db.createSchemeCode(req.body);
    console.log('Create scheme code result:', result);
    
    if (!result || !result.id) {
      console.error('Failed to create scheme code - invalid result:', result);
      return res.status(500).json({ error: 'Failed to save scheme code - invalid result' });
    }
    
    const createdSchemeCode = await db.getSchemeCodeByCode(req.body.code);
    console.log('Created scheme code:', createdSchemeCode);
    
    if (!createdSchemeCode) {
      console.error('Failed to retrieve created scheme code');
      return res.status(500).json({ error: 'Failed to retrieve created scheme code' });
    }
    
    res.status(201).json(createdSchemeCode);
  } catch (error) {
    console.error('Error in POST /api/schemeCodes:', error);
    res.status(500).json({ 
      error: 'Failed to create scheme code', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.put('/api/schemeCodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.updateSchemeCode(id, req.body);
    const updated = await db.getSchemeCodeById(id);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/schemeCodes/:id:', error);
    res.status(500).json({ error: 'Failed to update scheme code', details: error.message });
  }
});

app.delete('/api/schemeCodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteSchemeCode(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/schemeCodes/:id:', error);
    res.status(500).json({ error: 'Failed to delete scheme code', details: error.message });
  }
});

// --- Vendors CRUD Endpoints ---
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await db.getVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error in GET /api/vendors:', error);
    res.status(500).json({ error: 'Failed to retrieve vendors', details: error.message });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const result = await db.createVendor(req.body);
    if (!result || !result.id) {
      return res.status(500).json({ error: 'Failed to save vendor' });
    }
    const createdVendor = await db.getVendorByNumber(req.body.vendorNumber);
    res.status(201).json(createdVendor);
  } catch (error) {
    console.error('Error in POST /api/vendors:', error);
    res.status(500).json({ error: 'Failed to create vendor', details: error.message });
  }
});

app.put('/api/vendors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.updateVendor(id, req.body);
    const updated = await db.getVendorById(id);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to update vendor', details: error.message });
  }
});

app.delete('/api/vendors/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteVendor(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/vendors/:id:', error);
    res.status(500).json({ error: 'Failed to delete vendor', details: error.message });
  }
});

// --- Object Codes PUT/DELETE Endpoints ---
app.put('/api/objectCodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.updateObjectCode(id, req.body);
    const updated = await db.getObjectCodeByCode(req.body.code);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/objectCodes/:id:', error);
    res.status(500).json({ error: 'Failed to update object code', details: error.message });
  }
});

app.delete('/api/objectCodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteObjectCode(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/objectCodes/:id:', error);
    res.status(500).json({ error: 'Failed to delete object code', details: error.message });
  }
});

// --- Cost Centers PUT/DELETE Endpoints ---
app.put('/api/costCenters/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.updateCostCenter(id, req.body);
    const updated = await db.getCostCenterByCode(req.body.code);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/costCenters/:id:', error);
    res.status(500).json({ error: 'Failed to update cost center', details: error.message });
  }
});

app.delete('/api/costCenters/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.deleteCostCenter(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/costCenters/:id:', error);
    res.status(500).json({ error: 'Failed to delete cost center', details: error.message });
  }
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  console.log('\n=== Starting database test ===');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');
    const dbExists = fs.existsSync(dbPath);
    console.log(`- Database file exists: ${dbExists}`);
    console.log(`- Database path: ${dbPath}`);
    
    if (!dbExists) {
      throw new Error(`Database file not found at: ${dbPath}`);
    }
    
    // 2. List all tables
    console.log('\n2. Listing database tables...');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(`- Found ${tables.length} tables:`, tables.map(t => t.name).join(', '));
    
    // 3. Check scheme_codes table
    console.log('\n3. Checking scheme_codes table...');
    const schemeCodesTable = tables.some(t => t.name === 'scheme_codes');
    console.log(`- scheme_codes table exists: ${schemeCodesTable}`);
    
    if (schemeCodesTable) {
      const schemeCodesColumns = await db.all("PRAGMA table_info('scheme_codes')");
      console.log(`- scheme_codes columns (${schemeCodesColumns.length}):`, 
        schemeCodesColumns.map(c => `${c.name} (${c.type})`).join(', '));
      
      // 4. Test insert operation
      console.log('\n4. Testing insert operation...');
      const now = new Date().toISOString();
      const testCode = 'TEST' + Date.now();
      
      console.log(`- Inserting test record with code: ${testCode}`);
      const insertResult = await db.run(
        'INSERT INTO scheme_codes (code, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [testCode, 'Test Scheme ' + now, now, now]
      );
      
      console.log('- Insert result:', insertResult);
      
      if (!insertResult || !insertResult.lastID) {
        throw new Error('Failed to insert test record - no lastID returned');
      }
      
      // 5. Test select operation
      console.log('\n5. Testing select operation...');
      const testRecord = await db.get('SELECT * FROM scheme_codes WHERE id = ?', [insertResult.lastID]);
      
      if (!testRecord) {
        throw new Error('Failed to retrieve the inserted test record');
      }
      
      console.log('- Retrieved test record:', testRecord);
      
      // 6. Test count operation
      const allSchemeCodes = await db.all('SELECT * FROM scheme_codes');
      console.log(`\n6. Total scheme codes in database: ${allSchemeCodes.length}`);
      
      // 7. Prepare response
      const response = {
        success: true,
        database: {
          path: dbPath,
          exists: dbExists,
          tables: tables.map(t => t.name)
        },
        schemeCodes: {
          tableExists: true,
          columns: schemeCodesColumns.map(c => ({
            name: c.name,
            type: c.type,
            notNull: c.notnull === 1,
            primaryKey: c.pk === 1
          })),
          testRecord: {
            id: testRecord.id,
            code: testRecord.code,
            name: testRecord.name,
            createdAt: testRecord.createdAt,
            updatedAt: testRecord.updatedAt
          },
          totalCount: allSchemeCodes.length
        }
      };
      
      console.log('\n=== Database test completed successfully ===');
      res.json(response);
    } else {
      throw new Error('scheme_codes table does not exist in the database');
    }
  } catch (error) {
    console.error('\n=== Database test failed ===');
    console.error('Error:', error);
    
    const response = {
      success: false,
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n❌ Unhandled error:', err);
  console.error('Error stack:', err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  console.error('Error stack:', error.stack);
  process.exit(1); // Exit with failure
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  const { address, port } = server.address();
  const host = address === '::' ? 'localhost' : address;
  
  console.log('\n=== Server Started Successfully ===');
  console.log(`Server URL: http://${host}:${port}`);
  console.log(`API Base URL: http://${host}:${port}/api`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
  console.log('\nPress Ctrl+C to stop the server\n');
  
  // Test database connection immediately
  if (fs.existsSync(dbPath)) {
    console.log('\nRunning initial database test...');
    const testDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error('❌ Initial database test failed:', err.message);
      } else {
        console.log('✅ Initial database test passed');
        testDb.close();
      }
    });
  } else {
    console.error('❌ Database file not found at:', dbPath);
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
  
  // Force close server after 5 seconds
  setTimeout(() => {
    console.error('Forcing server shutdown');
    process.exit(1);
  }, 5000);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await db.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
