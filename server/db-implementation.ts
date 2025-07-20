import {
  User, InsertUser,
  Transaction, InsertTransaction,
  Budget, InsertBudget,
  Category, InsertCategory,
  CostCenter, InsertCostCenter,
  Vendor, InsertVendor,
  SchemeCode, InsertSchemeCode,
  Activity, InsertActivity
} from './shared/schema.js';
import { IStorage } from './storage.js';
import { Pool } from 'pg';

// PostgreSQL implementation of the storage interface
export class PostgresStorage implements IStorage {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'financial_tracker',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });
    
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Create tables if they don't exist
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  private async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Categories table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          color VARCHAR(50),
          icon VARCHAR(100),
          parent_id INTEGER REFERENCES categories(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Cost Centers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cost_centers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
          manager VARCHAR(255),
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Vendors table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vendors (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          vendor_number VARCHAR(100) UNIQUE,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          tax_id VARCHAR(100),
          payment_terms VARCHAR(100),
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Scheme Codes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS scheme_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          date DATE NOT NULL,
          user_id INTEGER REFERENCES users(id),
          description TEXT NOT NULL,
          category_id INTEGER REFERENCES categories(id),
          cost_center_id INTEGER REFERENCES cost_centers(id),
          vendor_id INTEGER REFERENCES vendors(id),
          scheme_code VARCHAR(100),
          financial_year VARCHAR(20) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          reference VARCHAR(100),
          notes TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP,
          posted_at TIMESTAMP,
          posted_by INTEGER REFERENCES users(id),
          document_number VARCHAR(100),
          invoice_number VARCHAR(100),
          vendor_number VARCHAR(100),
          payment_method VARCHAR(100),
          payment_reference VARCHAR(100),
          tax_amount NUMERIC(15, 2),
          discount_amount NUMERIC(15, 2),
          net_amount NUMERIC(15, 2),
          bill_number VARCHAR(100),
          object_code VARCHAR(100),
          object_description TEXT,
          goods_amount NUMERIC(15, 2),
          services_amount NUMERIC(15, 2),
          stamp_duty NUMERIC(15, 2),
          income_tax NUMERIC(15, 2),
          gst_amount NUMERIC(15, 2),
          pst_amount NUMERIC(15, 2),
          payment_details JSONB
        )
      `);

      // Budgets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          cost_center_id INTEGER REFERENCES cost_centers(id),
          category_id INTEGER REFERENCES categories(id),
          financial_year VARCHAR(20) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP
        )
      `);

      // Activities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action_type VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id INTEGER,
          description TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          details JSONB
        )
      `);

      // Create indexes for better performance
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_financial_year ON transactions(financial_year)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_object_code ON transactions(object_code)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_bill_number ON transactions(bill_number)');

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const result = await this.pool.query(`
      SELECT * FROM users ORDER BY username
    `);
    return result.rows.map(this.mapUserFromDb);
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await this.pool.query(`
      SELECT * FROM users WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapUserFromDb(result.rows[0]);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.pool.query(`
      INSERT INTO users (username, email, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user.username, user.email, user.fullName, user.role]);
    
    return this.mapUserFromDb(result.rows[0]);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.username) {
      updates.push(`username = $${paramIndex++}`);
      values.push(userData.username);
    }
    if (userData.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(userData.fullName);
    }
    if (userData.role) {
      updates.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    if (updates.length === 1) return this.getUserById(id);

    const result = await this.pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) return null;
    return this.mapUserFromDb(result.rows[0]);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transaction methods
  async getTransactions(filters?: Partial<Transaction>): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions';
    const values: any[] = [];
    let paramIndex = 1;

    if (filters && Object.keys(filters).length > 0) {
      const conditions: string[] = [];
      
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          conditions.push(`${this.snakeCase(key)} = $${paramIndex++}`);
          values.push(value);
        }
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    query += ' ORDER BY date DESC';
    
    const result = await this.pool.query(query, values);
    return result.rows.map(this.mapTransactionFromDb);
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    const result = await this.pool.query(`
      SELECT * FROM transactions WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapTransactionFromDb(result.rows[0]);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(transaction)) {
      if (value !== undefined) {
        columns.push(this.snakeCase(key));
        placeholders.push(`$${paramIndex++}`);
        values.push(value);
      }
    }

    const result = await this.pool.query(`
      INSERT INTO transactions (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `, values);
    
    return this.mapTransactionFromDb(result.rows[0]);
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(transactionData)) {
      if (value !== undefined) {
        updates.push(`${this.snakeCase(key)} = $${paramIndex++}`);
        values.push(value);
      }
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    if (updates.length === 1) return this.getTransactionById(id);

    const result = await this.pool.query(`
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) return null;
    return this.mapTransactionFromDb(result.rows[0]);
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM transactions WHERE id = $1
    `, [id]);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async postTransaction(id: number, userId: number): Promise<Transaction | null> {
    const result = await this.pool.query(`
      UPDATE transactions
      SET status = 'completed', posted_at = NOW(), posted_by = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [userId, id]);
    
    if (result.rows.length === 0) return null;
    return this.mapTransactionFromDb(result.rows[0]);
  }

  // Helper methods for mapping database rows to objects
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapTransactionFromDb(row: any): Transaction {
    return {
      id: row.id.toString(),
      financialYear: row.financial_year,
      costCenter: row.cost_center,
      costCenterName: row.cost_center_name,
      schemeCode: row.scheme_code,
      schemeName: row.scheme_name,
      vendorName: row.vendor_name,
      vendorNumber: row.vendor_number,
      date: row.date,
      billNumber: row.bill_number,
      billNature: row.bill_nature,
      objectCode: row.object_code,
      objectDescription: row.object_description,
      grossAmount: row.gross_amount?.toString() ?? '',
      goodsAmount: row.goods_amount?.toString() ?? '',
      servicesAmount: row.services_amount?.toString() ?? '',
      gstAmount: row.gst_amount?.toString() ?? '',
      pstAmount: row.pst_amount?.toString() ?? '',
      contractType: row.contract_type,
      contractAmount: row.contract_amount?.toString() ?? '',
      stampDuty: row.stamp_duty?.toString() ?? '',
      advanceIncomeTax: row.advance_income_tax?.toString() ?? '',
      incomeTaxPurchaseRate: row.income_tax_purchase_rate?.toString() ?? '',
      incomeTaxPurchaseAmount: row.income_tax_purchase_amount?.toString() ?? '',
      incomeTaxServiceRate: row.income_tax_service_rate?.toString() ?? '',
      incomeTaxServiceAmount: row.income_tax_service_amount?.toString() ?? '',
      generalSalesTaxRate: row.general_sales_tax_rate?.toString() ?? '',
      generalSalesTaxAmount: row.general_sales_tax_amount?.toString() ?? '',
      punjabSalesTaxRate: row.punjab_sales_tax_rate?.toString() ?? '',
      punjabSalesTaxAmount: row.punjab_sales_tax_amount?.toString() ?? '',
      netAmount: row.net_amount?.toString() ?? '',
      billDetail: row.bill_detail ?? '',
      billDescription: row.bill_description ?? '',
      status: row.status,
      createdAt: row.created_at,
    };
  }

  // Helper method to convert camelCase to snake_case
  private snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Implement remaining methods from IStorage interface
  // These are placeholders - you'll need to implement each method
  
  // Budget methods
  async getBudgets(filters?: Partial<Budget>): Promise<Budget[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getBudgetById(id: number): Promise<Budget | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    // Implementation similar to createTransaction
    return {} as Budget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | null> {
    // Implementation similar to updateTransaction
    return null;
  }

  async deleteBudget(id: number): Promise<boolean> {
    // Implementation similar to deleteTransaction
    return false;
  }

  // Category methods
  async getCategories(filters?: Partial<Category>): Promise<Category[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getCategoryById(id: number): Promise<Category | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    // Implementation similar to createTransaction
    return {} as Category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | null> {
    // Implementation similar to updateTransaction
    return null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Implementation similar to deleteTransaction
    return false;
  }

  // Cost Center methods
  async getCostCenters(filters?: Partial<CostCenter>): Promise<CostCenter[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getCostCenterById(id: number): Promise<CostCenter | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter> {
    // Implementation similar to createTransaction
    return {} as CostCenter;
  }

  async updateCostCenter(id: number, costCenterData: Partial<InsertCostCenter>): Promise<CostCenter | null> {
    // Implementation similar to updateTransaction
    return null;
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    // Implementation similar to deleteTransaction
    return false;
  }

  async updateCostCenterBudget(id: number, amount: number): Promise<CostCenter | null> {
    // Implementation similar to updateTransaction but specific to budget update
    return null;
  }

  // Vendor methods
  async getVendors(filters?: Partial<Vendor>): Promise<Vendor[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getVendorById(id: number): Promise<Vendor | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    // Implementation similar to createTransaction
    return {} as Vendor;
  }

  async updateVendor(id: number, vendorData: Partial<InsertVendor>): Promise<Vendor | null> {
    // Implementation similar to updateTransaction
    return null;
  }

  async deleteVendor(id: number): Promise<boolean> {
    // Implementation similar to deleteTransaction
    return false;
  }

  // Scheme Code methods
  async getSchemeCodes(filters?: Partial<SchemeCode>): Promise<SchemeCode[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getSchemeCodeById(id: number): Promise<SchemeCode | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createSchemeCode(schemeCode: InsertSchemeCode): Promise<SchemeCode> {
    // Implementation similar to createTransaction
    return {} as SchemeCode;
  }

  async updateSchemeCode(id: number, schemeCodeData: Partial<InsertSchemeCode>): Promise<SchemeCode | null> {
    // Implementation similar to updateTransaction
    return null;
  }

  async deleteSchemeCode(id: number): Promise<boolean> {
    // Implementation similar to deleteTransaction
    return false;
  }

  // Activity methods
  async getActivities(filters?: Partial<Activity>): Promise<Activity[]> {
    // Implementation similar to getTransactions
    return [];
  }

  async getActivityById(id: number): Promise<Activity | null> {
    // Implementation similar to getTransactionById
    return null;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    // Implementation similar to createTransaction
    return {} as Activity;
  }

  async getRecentActivities(limit: number = 5): Promise<Activity[]> {
    // Implementation similar to getTransactions but with limit and sorting
    return [];
  }
}
