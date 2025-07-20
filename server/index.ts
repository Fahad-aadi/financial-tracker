import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { storage } from './storage.js';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'Financial Tracker API is running!',
    storageType: 'In-Memory Storage'
  });
});

// User routes
app.get('/api/users', async (req: express.Request, res: express.Response) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = await storage.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Transaction routes
app.get('/api/transactions', async (req: express.Request, res: express.Response) => {
  try {
    // Support filtering
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
    const transactions = await storage.getTransactions(filters);
    
    // Transform transaction data to match the format expected by the frontend
    const transformedTransactions = await Promise.all(transactions.map(async (transaction) => {
      // Get cost center code
      let costCenterCode = '';
      if (transaction.costCenterId) {
        const costCenter = await storage.getCostCenterById(transaction.costCenterId);
        if (costCenter) {
          costCenterCode = costCenter.code;
        }
      }
      
      // Get category (used as object_code in the frontend)
      let objectCode = '';
      if (transaction.categoryId) {
        const category = await storage.getCategoryById(transaction.categoryId);
        if (category) {
          objectCode = category.name;
        }
      }
      
      return {
        ...transaction,
        cost_center: costCenterCode,
        object_code: objectCode || 'Uncategorized',
        financial_year: transaction.financialYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
      };
    }));
    
    res.json(transformedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req: express.Request, res: express.Response) => {
  try {
    const newTransaction = await storage.createTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedTransaction = await storage.updateTransaction(id, req.body);
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Cost center routes
app.get('/api/cost-centers', async (req: express.Request, res: express.Response) => {
  try {
    const costCenters = await storage.getCostCenters();
    res.json(costCenters);
  } catch (error) {
    console.error('Error fetching cost centers:', error);
    res.status(500).json({ error: 'Failed to fetch cost centers' });
  }
});

// Vendor routes
app.get('/api/vendors', async (req: express.Request, res: express.Response) => {
  try {
    const vendors = await storage.getVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Category routes
app.get('/api/categories', async (req: express.Request, res: express.Response) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Scheme code routes
app.get('/api/scheme-codes', async (req: express.Request, res: express.Response) => {
  try {
    const schemeCodes = await storage.getSchemeCodes();
    res.json(schemeCodes);
  } catch (error) {
    console.error('Error fetching scheme codes:', error);
    res.status(500).json({ error: 'Failed to fetch scheme codes' });
  }
});

// Object code routes
app.get('/api/object-codes', async (req: express.Request, res: express.Response) => {
  try {
    // For now, return sample data
    const objectCodes = [
      { id: 1, code: 'A01101', description: 'Basic Pay' },
      { id: 2, code: 'A01151', description: 'House Rent Allowance' },
      { id: 3, code: 'A01202', description: 'Transport Allowance' },
      { id: 4, code: 'A03201', description: 'Postage and Telegraph' },
      { id: 5, code: 'A03202', description: 'Telephone and Trunk Calls' },
      { id: 6, code: 'A03303', description: 'Electricity' },
      { id: 7, code: 'A03304', description: 'Gas' },
      { id: 8, code: 'A03402', description: 'Rent for Office Building' },
      { id: 9, code: 'A03805', description: 'Travelling Allowance' },
      { id: 10, code: 'A03807', description: 'POL Charges' },
      { id: 11, code: 'A03901', description: 'Stationery' },
      { id: 12, code: 'A03902', description: 'Printing and Publication' },
      { id: 13, code: 'A03970', description: 'Others' },
      { id: 14, code: 'A09601', description: 'Purchase of Plant and Machinery' }
    ];
    res.json(objectCodes);
  } catch (error) {
    console.error('Error fetching object codes:', error);
    res.status(500).json({ error: 'Failed to fetch object codes' });
  }
});

// Bill numbers routes
app.get('/api/bill-numbers', async (req: express.Request, res: express.Response) => {
  try {
    // For now, return sample data
    const billNumbers = [
      { objectCode: 'A01101', lastNumber: 5, deletedNumbers: [] },
      { objectCode: 'A03201', lastNumber: 3, deletedNumbers: [2] },
      { objectCode: 'A03970', lastNumber: 10, deletedNumbers: [4, 7] }
    ];
    res.json(billNumbers);
  } catch (error) {
    console.error('Error fetching bill numbers:', error);
    res.status(500).json({ error: 'Failed to fetch bill numbers' });
  }
});

app.get('/api/bill-numbers/:objectCode', async (req: express.Request, res: express.Response) => {
  try {
    const { objectCode } = req.params;
    // For now, return sample data
    const billNumber = { 
      objectCode, 
      lastNumber: Math.floor(Math.random() * 10) + 1, 
      deletedNumbers: [] 
    };
    res.json(billNumber);
  } catch (error) {
    console.error('Error fetching bill number:', error);
    res.status(500).json({ error: 'Failed to fetch bill number' });
  }
});

// Budget routes
app.get('/api/budgets', async (req: express.Request, res: express.Response) => {
  try {
    const budgets = await storage.getBudgets();
    
    // Transform budget data to match the format expected by the frontend
    const transformedBudgets = await Promise.all(budgets.map(async (budget) => {
      // Get cost center code
      let costCenterCode = '';
      if (budget.costCenterId) {
        const costCenter = await storage.getCostCenterById(budget.costCenterId);
        if (costCenter) {
          costCenterCode = costCenter.code;
        }
      }
      
      // Get category (used as object_code in the frontend)
      let objectCode = '';
      if (budget.categoryId) {
        const category = await storage.getCategoryById(budget.categoryId);
        if (category) {
          objectCode = category.name;
        }
      }
      
      return {
        ...budget,
        cost_center: costCenterCode,
        object_code: objectCode || 'Uncategorized',
        financial_year: budget.financialYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
      };
    }));
    
    res.json(transformedBudgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Settings sync endpoint
app.post('/api/sync-settings', async (req: express.Request, res: express.Response) => {
  try {
    // Extract settings from request body
    const { costCenters, categories, vendors } = req.body;
    
    // Process cost centers
    if (costCenters && Array.isArray(costCenters)) {
      for (const costCenter of costCenters) {
        if (costCenter.id) {
          await storage.updateCostCenter(costCenter.id, costCenter);
        } else {
          await storage.createCostCenter(costCenter);
        }
      }
    }
    
    // Process categories
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        if (category.id) {
          await storage.updateCategory(category.id, category);
        } else {
          await storage.createCategory(category);
        }
      }
    }
    
    // Process vendors
    if (vendors && Array.isArray(vendors)) {
      for (const vendor of vendors) {
        if (vendor.id) {
          await storage.updateVendor(vendor.id, vendor);
        } else {
          await storage.createVendor(vendor);
        }
      }
    }
    
    res.json({ success: true, message: 'Settings synchronized successfully' });
  } catch (error) {
    console.error('Error syncing settings:', error);
    res.status(500).json({ error: 'Failed to sync settings' });
  }
});
// ========================

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
//================

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Using In-Memory Storage for data persistence`);
});
