const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize DB tables
initializeDatabase();

// Budgets Endpoints
app.get('/api/budgets', async (req, res) => {
  const budgets = await db('budgets').select();
  res.json(budgets);
});

app.post('/api/budgets', async (req, res) => {
  const { cost_center, object_code, amount, financial_year } = req.body;
  const [id] = await db('budgets').insert({ cost_center, object_code, amount, financial_year });
  const newBudget = await db('budgets').where({ id }).first();
  res.status(201).json(newBudget);
});

app.put('/api/budgets/:id', async (req, res) => {
  const { id } = req.params;
  const { cost_center, object_code, amount, financial_year } = req.body;
  await db('budgets').where({ id }).update({ cost_center, object_code, amount, financial_year });
  const updated = await db('budgets').where({ id }).first();
  res.json(updated);
});

app.delete('/api/budgets/:id', async (req, res) => {
  const { id } = req.params;
  await db('budgets').where({ id }).del();
  res.status(204).end();
});

// Transactions Endpoints
app.get('/api/transactions', async (req, res) => {
  const transactions = await db('transactions').select();
  res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
  const { cost_center, object_code, amount, date, description, financial_year } = req.body;
  const [id] = await db('transactions').insert({ cost_center, object_code, amount, date, description, financial_year });
  const newTransaction = await db('transactions').where({ id }).first();
  res.status(201).json(newTransaction);
});

app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    cost_center, object_code, amount, date, description, financial_year,
    status, paymentDetails, objectDescription, costCenterName,
    vendorName, vendorId, vendorNumber, netAmount, type, category, payee,
    billNumber, schemeCode
  } = req.body;
  
  // Prepare the update object with all possible fields
  const updateData = { 
    cost_center, object_code, amount, date, description, financial_year,
    status, objectDescription, costCenterName,
    vendorName, vendorId, vendorNumber, netAmount, type, category, payee,
    billNumber, schemeCode
  };
  
  // Handle paymentDetails separately (convert to JSON string if it's an object)
  if (paymentDetails) {
    updateData.paymentDetails = typeof paymentDetails === 'string' 
      ? paymentDetails 
      : JSON.stringify(paymentDetails);
  }
  
  // Remove undefined values
  Object.keys(updateData).forEach(key => 
    updateData[key] === undefined && delete updateData[key]
  );
  
  await db('transactions').where({ id }).update(updateData);
  const updated = await db('transactions').where({ id }).first();
  
  // Parse paymentDetails back to object if it's a string
  if (updated.paymentDetails && typeof updated.paymentDetails === 'string') {
    try {
      updated.paymentDetails = JSON.parse(updated.paymentDetails);
    } catch (e) {
      console.error('Error parsing paymentDetails:', e);
    }
  }
  
  res.json(updated);
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  await db('transactions').where({ id }).del();
  res.status(204).end();
});

// Budget Adjustments Endpoints
app.get('/api/budget-adjustments', async (req, res) => {
  try {
    const adjustments = await db('budget_adjustments').select();
    
    // Map snake_case database fields to camelCase for frontend
    const formattedAdjustments = adjustments.map(adjustment => ({
      id: adjustment.id,
      date: adjustment.date,
      fromObjectCode: adjustment.from_object_code,
      fromCostCenter: adjustment.from_cost_center,
      toObjectCode: adjustment.to_object_code,
      toCostCenter: adjustment.to_cost_center,
      amount: adjustment.amount,
      type: adjustment.type,
      remarks: adjustment.remarks,
      financialYear: adjustment.financial_year,
      createdAt: adjustment.created_at,
      updatedAt: adjustment.updated_at
    }));
    
    res.json(formattedAdjustments);
  } catch (error) {
    console.error('Error fetching budget adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch budget adjustments' });
  }
});

app.post('/api/budget-adjustments', async (req, res) => {
  try {
    const {
      date,
      fromObjectCode,
      fromCostCenter,
      toObjectCode,
      toCostCenter,
      amount,
      type,
      remarks,
      financialYear
    } = req.body;
    
    // Convert camelCase to snake_case for database
    const [id] = await db('budget_adjustments').insert({
      date,
      from_object_code: fromObjectCode,
      from_cost_center: fromCostCenter,
      to_object_code: toObjectCode,
      to_cost_center: toCostCenter,
      amount,
      type,
      remarks,
      financial_year: financialYear
    });
    
    const newAdjustment = await db('budget_adjustments').where({ id }).first();
    
    // Convert back to camelCase for response
    const formattedAdjustment = {
      id: newAdjustment.id,
      date: newAdjustment.date,
      fromObjectCode: newAdjustment.from_object_code,
      fromCostCenter: newAdjustment.from_cost_center,
      toObjectCode: newAdjustment.to_object_code,
      toCostCenter: newAdjustment.to_cost_center,
      amount: newAdjustment.amount,
      type: newAdjustment.type,
      remarks: newAdjustment.remarks,
      financialYear: newAdjustment.financial_year,
      createdAt: newAdjustment.created_at,
      updatedAt: newAdjustment.updated_at
    };
    
    res.status(201).json(formattedAdjustment);
  } catch (error) {
    console.error('Error creating budget adjustment:', error);
    res.status(500).json({ error: 'Failed to create budget adjustment' });
  }
});

app.put('/api/budget-adjustments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      fromObjectCode,
      fromCostCenter,
      toObjectCode,
      toCostCenter,
      amount,
      type,
      remarks,
      financialYear
    } = req.body;
    
    await db('budget_adjustments').where({ id }).update({
      date,
      from_object_code: fromObjectCode,
      from_cost_center: fromCostCenter,
      to_object_code: toObjectCode,
      to_cost_center: toCostCenter,
      amount,
      type,
      remarks,
      financial_year: financialYear,
      updated_at: new Date()
    });
    
    const updated = await db('budget_adjustments').where({ id }).first();
    
    // Convert to camelCase for response
    const formattedAdjustment = {
      id: updated.id,
      date: updated.date,
      fromObjectCode: updated.from_object_code,
      fromCostCenter: updated.from_cost_center,
      toObjectCode: updated.to_object_code,
      toCostCenter: updated.to_cost_center,
      amount: updated.amount,
      type: updated.type,
      remarks: updated.remarks,
      financialYear: updated.financial_year,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
    
    res.json(formattedAdjustment);
  } catch (error) {
    console.error('Error updating budget adjustment:', error);
    res.status(500).json({ error: 'Failed to update budget adjustment' });
  }
});

app.delete('/api/budget-adjustments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('budget_adjustments').where({ id }).del();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting budget adjustment:', error);
    res.status(500).json({ error: 'Failed to delete budget adjustment' });
  }
});

// Financial Years Endpoint
app.get('/api/financial-years', async (req, res) => {
  try {
    // Get unique financial years from budgets table
    const budgetYears = await db('budgets')
      .distinct('financial_year')
      .pluck('financial_year');
    
    // Get unique financial years from transactions table
    const transactionYears = await db('transactions')
      .distinct('financial_year')
      .pluck('financial_year');
    
    // Combine and deduplicate
    const allYears = [...new Set([...budgetYears, ...transactionYears])];
    
    // Sort years in descending order (newest first)
    allYears.sort((a, b) => {
      // Assuming format is "YYYY-YY"
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearB - yearA;
    });
    
    // If no years found, provide at least the current financial year
    if (allYears.length === 0) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-11
      
      // If we're after March (fiscal year in Pakistan/India often starts in April)
      const fiscalYear = month >= 3 ? 
        `${currentYear}-${(currentYear + 1).toString().slice(2)}` : 
        `${currentYear - 1}-${currentYear.toString().slice(2)}`;
      
      allYears.push(fiscalYear);
    }
    
    res.json(allYears);
  } catch (error) {
    console.error('Error fetching financial years:', error);
    res.status(500).json({ error: 'Failed to fetch financial years' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
