// SQLite/Knex setup for Financial Tracker
const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './financial-tracker.sqlite3',
  },
  useNullAsDefault: true,
});

// Create tables if they do not exist
async function initializeDatabase() {
  // Budgets Table
  const hasBudgets = await db.schema.hasTable('budgets');
  if (!hasBudgets) {
    await db.schema.createTable('budgets', (table) => {
      table.increments('id').primary();
      table.string('cost_center');
      table.string('object_code');
      table.float('amount');
      table.string('financial_year');
    });
    console.log('Created table: budgets');
  }

  // Transactions Table
  const hasTransactions = await db.schema.hasTable('transactions');
  if (!hasTransactions) {
    await db.schema.createTable('transactions', (table) => {
      table.increments('id').primary();
      table.string('cost_center');
      table.string('object_code');
      table.float('amount');
      table.date('date');
      table.string('description');
      table.string('financial_year');
    });
    console.log('Created table: transactions');
  }
}

module.exports = { db, initializeDatabase };
