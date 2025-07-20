import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express server
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Data storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper functions to read/write data
const getDataFilePath = (entity) => path.join(dataDir, `${entity}.json`);

const readData = (entity) => {
  const filePath = getDataFilePath(entity);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

const writeData = (entity, data) => {
  const filePath = getDataFilePath(entity);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Helper function to load localStorage data from the client
const loadClientLocalStorageData = () => {
  try {
    // Default object codes if none exist
    const defaultObjectCodes = [
      { id: 1, code: 'A01101', description: 'Basic Pay of Officers' },
      { id: 2, code: 'A01151', description: 'Basic Pay of Officials' },
      { id: 3, code: 'A03201', description: 'Postage and Telegraph' },
      { id: 4, code: 'A03770', description: 'Consultancy and Contractual work - Others' }
    ];
    // Default cost centers if none exist
    const defaultCostCenters = [
      { id: 1, code: 'LZ4064', name: 'Directorate General Monitoring & Evaluation' },
      { id: 2, code: 'LZ4065', name: 'Planning & Development Department' },
      { id: 3, code: 'LZ4066', name: 'Finance Department' }
    ];
    // Default scheme codes if none exist, including "No Scheme Code" option
    const defaultSchemeCodes = [
      { id: 1, code: 'NO_SCHEME', name: 'No Scheme Code' },
      { id: 2, code: 'SC001', name: 'Development Scheme 1' },
      { id: 3, code: 'SC002', name: 'Infrastructure Project' }
    ];
    // Default vendors if none exist
    const defaultVendors = [
      { id: 1, name: 'Mustansar Hussain', vendorNumber: '30966550' },
      { id: 2, name: 'Shahid Mehmood', vendorNumber: '31234567' }
    ];

    // Only write default data if the file does NOT exist
    const entitiesWithDefaults = [
      { entity: 'objectCodes', defaults: defaultObjectCodes },
      { entity: 'costCenters', defaults: defaultCostCenters },
      { entity: 'schemeCodes', defaults: defaultSchemeCodes },
      { entity: 'vendors', defaults: defaultVendors }
    ];
    entitiesWithDefaults.forEach(({ entity, defaults }) => {
      const filePath = getDataFilePath(entity);
      if (!fs.existsSync(filePath)) {
        writeData(entity, defaults);
      }
    });

    console.log('Initialized server with default data (only if files did not exist)');
  } catch (error) {
    console.error('Error initializing server data:', error);
  }
};

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  const entities = [
    'users', 'transactions', 'costCenters', 'vendors', 
    'schemeCodes', 'categories', 'objectCodes', 'billNumbers', 'budgets'
  ];
  
  entities.forEach(entity => {
    const filePath = getDataFilePath(entity);
    if (!fs.existsSync(filePath)) {
      writeData(entity, []);
    }
  });
  
  // Load default data from client-compatible format
  loadClientLocalStorageData();
};

initializeDataFiles();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Financial Tracker API is running!',
    storageType: 'File-based Storage'
  });
});

// User routes
app.get('/api/users', (req, res) => {
  const users = readData('users');
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const users = readData('users');
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const users = readData('users');
  const newUser = {
    ...req.body,
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1
  };
  
  users.push(newUser);
  writeData('users', users);
  
  res.status(201).json(newUser);
});

// Transaction routes
app.get('/api/transactions', (req, res) => {
  const transactions = readData('transactions');
  
  // Support filtering if query params are provided
  if (req.query.filters) {
    const filters = JSON.parse(req.query.filters);
    const filteredTransactions = transactions.filter(transaction => {
      return Object.entries(filters).every(([key, value]) => {
        return transaction[key] === value;
      });
    });
    return res.json(filteredTransactions);
  }
  
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const transactions = readData('transactions');
  const newTransaction = {
    ...req.body,
    id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  
  // Update bill number if needed
  if (newTransaction.objectCode) {
    const billNumbers = readData('billNumbers');
    const billNumberEntry = billNumbers.find(bn => bn.objectCode === newTransaction.objectCode);
    
    if (billNumberEntry) {
      // Use a deleted number if available, otherwise increment lastNumber
      if (billNumberEntry.deletedNumbers && billNumberEntry.deletedNumbers.length > 0) {
        const nextNumber = billNumberEntry.deletedNumbers.shift();
        billNumberEntry.lastNumber = Math.max(billNumberEntry.lastNumber, nextNumber);
        writeData('billNumbers', billNumbers);
      } else {
        billNumberEntry.lastNumber += 1;
        writeData('billNumbers', billNumbers);
      }
    } else {
      // Create new bill number entry
      billNumbers.push({
        objectCode: newTransaction.objectCode,
        lastNumber: 1,
        deletedNumbers: []
      });
      writeData('billNumbers', billNumbers);
    }
  }
  
  transactions.push(newTransaction);
  writeData('transactions', transactions);
  
  res.status(201).json(newTransaction);
});

app.put('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const transactions = readData('transactions');
  const index = transactions.findIndex(t => t.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  // Keep the same bill number when updating
  const billNumber = transactions[index].billNumber;
  
  transactions[index] = {
    ...transactions[index],
    ...req.body,
    id,
    billNumber: billNumber || req.body.billNumber,
    updatedAt: new Date().toISOString()
  };
  
  writeData('transactions', transactions);
  
  res.json(transactions[index]);
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const transactions = readData('transactions');
  const transaction = transactions.find(t => t.id === id);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  // Store the bill number for reuse
  if (transaction.objectCode && transaction.billNumber) {
    const billNumber = parseInt(transaction.billNumber.split('-')[1]);
    const billNumbers = readData('billNumbers');
    const billNumberEntry = billNumbers.find(bn => bn.objectCode === transaction.objectCode);
    
    if (billNumberEntry) {
      if (!billNumberEntry.deletedNumbers) {
        billNumberEntry.deletedNumbers = [];
      }
      billNumberEntry.deletedNumbers.push(billNumber);
      // Sort deleted numbers for easier management
      billNumberEntry.deletedNumbers.sort((a, b) => a - b);
      writeData('billNumbers', billNumbers);
    }
  }
  
  const updatedTransactions = transactions.filter(t => t.id !== id);
  writeData('transactions', updatedTransactions);
  
  res.json({ success: true });
});

// Cost center routes
app.get('/api/cost-centers', (req, res) => {
  const costCenters = readData('costCenters');
  res.json(costCenters);
});

app.get('/api/costCenters', (req, res) => {
  const costCenters = readData('costCenters');
  res.json(costCenters);
});

app.post('/api/costCenters', (req, res) => {
  const costCenters = readData('costCenters');
  const newCostCenter = {
    ...req.body,
    id: costCenters.length > 0 ? Math.max(...costCenters.map(c => c.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  costCenters.push(newCostCenter);
  writeData('costCenters', costCenters);
  res.status(201).json(newCostCenter);
});

app.put('/api/costCenters/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const costCenters = readData('costCenters');
  const index = costCenters.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cost center not found' });
  }
  costCenters[index] = { ...costCenters[index], ...req.body, id };
  writeData('costCenters', costCenters);
  res.json(costCenters[index]);
});

app.delete('/api/costCenters/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const costCenters = readData('costCenters');
  const updated = costCenters.filter(c => c.id !== id);
  writeData('costCenters', updated);
  res.json({ success: true });
});

// Vendor routes
app.get('/api/vendors', (req, res) => {
  const vendors = readData('vendors');
  // Only return vendors with both name and vendorNumber
  res.json(vendors.filter(v => v.name && v.vendorNumber));
});

app.get('/api/vendors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const vendors = readData('vendors');
  const vendor = vendors.find(v => v.id === id);
  
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  
  res.json(vendor);
});

app.post('/api/vendors', (req, res) => {
  const vendors = readData('vendors');
  // Prevent duplicate vendorNumber
  if (vendors.some(v => v.vendorNumber === req.body.vendorNumber)) {
    return res.status(409).json({ error: 'Vendor number already exists' });
  }
  const newVendor = {
    ...req.body,
    id: vendors.length > 0 ? Math.max(...vendors.map(v => v.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  vendors.push(newVendor);
  writeData('vendors', vendors);
  res.status(201).json(newVendor);
});

app.put('/api/vendors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const vendors = readData('vendors');
  const index = vendors.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  vendors[index] = { ...vendors[index], ...req.body, id };
  writeData('vendors', vendors);
  res.json(vendors[index]);
});

app.delete('/api/vendors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const vendors = readData('vendors');
  const updated = vendors.filter(v => v.id !== id);
  writeData('vendors', updated);
  res.json({ success: true });
});

// Budget routes
app.get('/api/budgets', (req, res) => {
  try {
    console.log('GET /api/budgets - Reading budgets from file');
    const budgets = readData('budgets');
    console.log(`Found ${budgets.length} budgets in file`);
    
    // Transform budgets to include cost_center, object_code, and financial_year
    // and ensure all required fields are present
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
    
    console.log('Sending budgets to client:', transformedBudgets);
    res.json(transformedBudgets);
  } catch (error) {
    console.error('Error in GET /api/budgets:', error);
    res.status(500).json({ error: 'Failed to retrieve budgets', details: error.message });
  }
});

app.post('/api/budgets', (req, res) => {
  try {
    console.log('POST /api/budgets - Received budget data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/budgets - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    const budgets = readData('budgets');
    console.log(`Found ${budgets.length} existing budgets`);
    
    // Ensure all required fields are present
    const newBudget = {
      ...req.body,
      name: req.body.name || req.body.objectCode || '',
      costCenter: req.body.costCenter || req.body.cost_center || '',
      costCenterName: req.body.costCenterName || '',
      objectCode: req.body.objectCode || req.body.name || '',
      financialYear: req.body.financialYear || req.body.financial_year || '',
      period: 'yearly', // Always set to yearly
      amount: Number(req.body.amount) || 0,
      spent: Number(req.body.spent) || 0,
      remaining: Number(req.body.remaining) || Number(req.body.amount) || 0,
      categoryId: Number(req.body.categoryId) || 1,
      categoryName: req.body.categoryName || '',
      id: budgets.length > 0 ? Math.max(...budgets.map(b => Number(b.id) || 0)) + 1 : 1,
      createdAt: new Date().toISOString()
    };
    
    console.log('Formatted new budget:', newBudget);
    
    budgets.push(newBudget);
    const writeResult = writeData('budgets', budgets);
    console.log('Write result:', writeResult);
    
    if (!writeResult) {
      return res.status(500).json({ error: 'Failed to save budget' });
    }
    
    console.log('Saved new budget:', newBudget);
    res.status(201).json(newBudget);
  } catch (error) {
    console.error('Error in POST /api/budgets:', error);
    res.status(500).json({ error: 'Failed to create budget', details: error.message });
  }
});

app.get('/api/budgets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const budgets = readData('budgets');
  const budget = budgets.find(b => b.id === id);
  
  if (!budget) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  
  res.json(budget);
});

app.put('/api/budgets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const budgets = readData('budgets');
  const index = budgets.findIndex(b => b.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  
  budgets[index] = {
    ...budgets[index],
    ...req.body,
    id
  };
  
  writeData('budgets', budgets);
  
  res.json(budgets[index]);
});

app.delete('/api/budgets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const budgets = readData('budgets');
  const budget = budgets.find(b => b.id === id);
  
  if (!budget) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  
  const updatedBudgets = budgets.filter(b => b.id !== id);
  writeData('budgets', updatedBudgets);
  
  res.json({ success: true });
});

// Category routes
app.get('/api/categories', (req, res) => {
  const categories = readData('categories');
  res.json(categories);
});

// Scheme code routes
app.get('/api/scheme-codes', (req, res) => {
  const schemeCodes = readData('schemeCodes');
  res.json(schemeCodes);
});

app.get('/api/schemeCodes', (req, res) => {
  const schemeCodes = readData('schemeCodes');
  res.json(schemeCodes);
});

// Object code routes
app.get('/api/object-codes', (req, res) => {
  const objectCodes = readData('objectCodes');
  res.json(objectCodes);
});

app.get('/api/objectCodes', (req, res) => {
  const objectCodes = readData('objectCodes');
  res.json(objectCodes);
});

app.post('/api/objectCodes', (req, res) => {
  const objectCodes = readData('objectCodes');
  const newObjectCode = {
    ...req.body,
    id: objectCodes.length > 0 ? Math.max(...objectCodes.map(o => o.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  objectCodes.push(newObjectCode);
  writeData('objectCodes', objectCodes);
  res.status(201).json(newObjectCode);
});

app.put('/api/objectCodes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const objectCodes = readData('objectCodes');
  const index = objectCodes.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Object code not found' });
  }
  objectCodes[index] = { ...objectCodes[index], ...req.body, id };
  writeData('objectCodes', objectCodes);
  res.json(objectCodes[index]);
});

app.delete('/api/objectCodes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const objectCodes = readData('objectCodes');
  const exists = objectCodes.some(o => o.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Object code not found' });
  }
  const updated = objectCodes.filter(o => o.id !== id);
  try {
    writeData('objectCodes', updated);
    res.json({ success: true });
  } catch (err) {
    console.error('Error writing objectCodes file:', err);
    res.status(500).json({ error: 'Failed to write objectCodes file' });
  }
});

// Bill numbers routes
app.get('/api/bill-numbers', (req, res) => {
  const billNumbers = readData('billNumbers');
  res.json(billNumbers);
});

app.get('/api/billNumbers', (req, res) => {
  const billNumbers = readData('billNumbers');
  res.json(billNumbers);
});

app.get('/api/bill-numbers/:objectCode', (req, res) => {
  const { objectCode } = req.params;
  const billNumbers = readData('billNumbers');
  const billNumber = billNumbers.find(bn => bn.objectCode === objectCode);
  
  if (billNumber) {
    res.json(billNumber);
  } else {
    // Create a new bill number entry if it doesn't exist
    const newBillNumber = { 
      objectCode, 
      lastNumber: 1, 
      deletedNumbers: [] 
    };
    billNumbers.push(newBillNumber);
    writeData('billNumbers', billNumbers);
    res.json(newBillNumber);
  }
});

app.put('/api/bill-numbers/:objectCode', (req, res) => {
  const { objectCode } = req.params;
  const billNumbers = readData('billNumbers');
  const index = billNumbers.findIndex(bn => bn.objectCode === objectCode);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Bill number not found' });
  }
  
  billNumbers[index] = {
    ...billNumbers[index],
    ...req.body,
    objectCode
  };
  
  writeData('billNumbers', billNumbers);
  
  res.json(billNumbers[index]);
});

// Sync data from localStorage
app.post('/api/sync-settings', (req, res) => {
  try {
    // Extract settings data from request body
    const { 
      objectCodes, 
      costCenters, 
      schemeCodes, 
      vendors,
      financialYear
    } = req.body;
    
    console.log('Received sync request with data:', {
      objectCodesCount: objectCodes?.length || 0,
      costCentersCount: costCenters?.length || 0,
      schemeCodesCount: schemeCodes?.length || 0,
      vendorsCount: vendors?.length || 0,
      financialYear
    });
    
    // Update server data files with localStorage data
    if (objectCodes && Array.isArray(objectCodes)) {
      writeData('objectCodes', objectCodes);
    }
    
    if (costCenters && Array.isArray(costCenters)) {
      writeData('costCenters', costCenters);
    }
    
    if (schemeCodes && Array.isArray(schemeCodes)) {
      // Ensure "No Scheme Code" option exists
      const hasNoSchemeOption = schemeCodes.some(code => code.code === 'NO_SCHEME');
      
      if (!hasNoSchemeOption && schemeCodes.length > 0) {
        schemeCodes.push({
          id: Math.max(...schemeCodes.map(s => s.id)) + 1,
          code: 'NO_SCHEME',
          name: 'No Scheme Code'
        });
      } else if (!hasNoSchemeOption && schemeCodes.length === 0) {
        schemeCodes.push({
          id: 1,
          code: 'NO_SCHEME',
          name: 'No Scheme Code'
        });
      }
      
      writeData('schemeCodes', schemeCodes);
    }
    
    if (vendors && Array.isArray(vendors)) {
      writeData('vendors', vendors);
    }
    
    res.json({ success: true, message: 'Settings synchronized successfully' });
  } catch (error) {
    console.error('Error syncing settings:', error);
    res.status(500).json({ error: 'Failed to sync settings' });
  }
});

// --- schemeCodes camelCase routes ---
app.post('/api/schemeCodes', (req, res) => {
  const schemeCodes = readData('schemeCodes');
  const newSchemeCode = {
    ...req.body,
    id: schemeCodes.length > 0 ? Math.max(...schemeCodes.map(s => s.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  schemeCodes.push(newSchemeCode);
  writeData('schemeCodes', schemeCodes);
  res.status(201).json(newSchemeCode);
});

app.put('/api/schemeCodes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const schemeCodes = readData('schemeCodes');
  const index = schemeCodes.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scheme code not found' });
  }
  schemeCodes[index] = { ...schemeCodes[index], ...req.body, id };
  writeData('schemeCodes', schemeCodes);
  res.json(schemeCodes[index]);
});

app.delete('/api/schemeCodes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const schemeCodes = readData('schemeCodes');
  const updated = schemeCodes.filter(s => s.id !== id);
  writeData('schemeCodes', updated);
  res.json({ success: true });
});

// --- taxSettings camelCase routes ---
app.get('/api/taxSettings', (req, res) => {
  const filePath = getDataFilePath('taxSettings');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(data));
  } else {
    res.json({});
  }
});

app.post('/api/taxSettings', (req, res) => {
  const filePath = getDataFilePath('taxSettings');
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Using File-based Storage in ${dataDir}`);
});
