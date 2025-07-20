const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./db.cjs');

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
  const { cost_center, object_code, amount, date, description, financial_year } = req.body;
  await db('transactions').where({ id }).update({ cost_center, object_code, amount, date, description, financial_year });
  const updated = await db('transactions').where({ id }).first();
  res.json(updated);
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  await db('transactions').where({ id }).del();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
