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
      table.string('status').defaultTo('pending');
      table.text('paymentDetails');
      table.string('type').defaultTo('expense');
      table.string('category');
      table.string('payee');
      table.string('objectDescription');
      table.string('costCenterName');
      table.string('vendorName');
      table.integer('vendorId');
      table.string('vendorNumber');
      table.float('netAmount');
      table.string('billNumber');
      table.string('schemeCode');
    });
    console.log('Created table: transactions');
  } else {
    // Check if the status column exists, and add it if it doesn't
    const hasStatusColumn = await db.schema.hasColumn('transactions', 'status');
    if (!hasStatusColumn) {
      await db.schema.table('transactions', (table) => {
        table.string('status').defaultTo('pending');
        table.text('paymentDetails');
        table.string('type').defaultTo('expense');
        table.string('category');
        table.string('payee');
        table.string('objectDescription');
        table.string('costCenterName');
        table.string('vendorName');
        table.integer('vendorId');
        table.string('vendorNumber');
        table.float('netAmount');
        table.string('billNumber');
        table.string('schemeCode');
      });
      console.log('Added missing columns to transactions table');
    }
  }
  
  // Budget Adjustments Table
  const hasBudgetAdjustments = await db.schema.hasTable('budget_adjustments');
  if (!hasBudgetAdjustments) {
    await db.schema.createTable('budget_adjustments', (table) => {
      table.increments('id').primary();
      table.date('date');
      table.string('from_object_code').nullable();
      table.string('from_cost_center').nullable();
      table.string('to_object_code').nullable();
      table.string('to_cost_center').nullable();
      table.float('amount');
      table.string('type'); // 'supplementary', 'reappropriation', 'surrender'
      table.text('remarks');
      table.string('financial_year');
      table.timestamps(true, true);
    });
    console.log('Created table: budget_adjustments');
  }
  
  // Budget Releases Table
  const hasBudgetReleases = await db.schema.hasTable('budget_releases');
  if (!hasBudgetReleases) {
    await db.schema.createTable('budget_releases', (table) => {
      table.increments('id').primary();
      table.integer('allocation_id');
      table.string('object_code');
      table.string('code_description');
      table.string('cost_center');
      table.string('cost_center_name');
      table.string('financial_year');
      table.integer('quarter');
      table.float('amount');
      table.date('date_released');
      table.text('remarks');
      table.string('type').defaultTo('regular'); // 'regular', 'supplementary', 'reappropriation', 'surrender'
      table.timestamps(true, true);
    });
    console.log('Created table: budget_releases');
  }
  
  // Scheme Codes Table
  const hasSchemeCodes = await db.schema.hasTable('scheme_codes');
  if (!hasSchemeCodes) {
    await db.schema.createTable('scheme_codes', (table) => {
      table.increments('id').primary();
      table.string('code').unique().notNullable();
      table.string('name').notNullable();
      table.timestamps(true, true);
    });
    console.log('Created table: scheme_codes');
  }
  
  // Vendors Table
  const hasVendors = await db.schema.hasTable('vendors');
  if (!hasVendors) {
    await db.schema.createTable('vendors', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('vendor_number').unique().notNullable();
      table.timestamps(true, true);
    });
    console.log('Created table: vendors');
  }
}

module.exports = { db, initializeDatabase };
