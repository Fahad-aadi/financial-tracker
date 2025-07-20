import { Pool } from 'pg';
// PostgreSQL implementation of the storage interface
export class PostgresStorage {
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
    async initializeDatabase() {
        try {
            // Create tables if they don't exist
            await this.createTables();
            console.log('Database initialized successfully');
        }
        catch (error) {
            console.error('Error initializing database:', error);
        }
    }
    async createTables() {
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
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    // User methods
    async getUsers() {
        const result = await this.pool.query(`
      SELECT * FROM users ORDER BY username
    `);
        return result.rows.map(this.mapUserFromDb);
    }
    async getUserById(id) {
        const result = await this.pool.query(`
      SELECT * FROM users WHERE id = $1
    `, [id]);
        if (result.rows.length === 0)
            return null;
        return this.mapUserFromDb(result.rows[0]);
    }
    async createUser(user) {
        const result = await this.pool.query(`
      INSERT INTO users (username, email, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user.username, user.email, user.fullName, user.role]);
        return this.mapUserFromDb(result.rows[0]);
    }
    async updateUser(id, userData) {
        const updates = [];
        const values = [];
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
        if (updates.length === 1)
            return this.getUserById(id);
        const result = await this.pool.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
        if (result.rows.length === 0)
            return null;
        return this.mapUserFromDb(result.rows[0]);
    }
    async deleteUser(id) {
        const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
    // Transaction methods
    async getTransactions(filters) {
        let query = 'SELECT * FROM transactions';
        const values = [];
        let paramIndex = 1;
        if (filters && Object.keys(filters).length > 0) {
            const conditions = [];
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
    async getTransactionById(id) {
        const result = await this.pool.query(`
      SELECT * FROM transactions WHERE id = $1
    `, [id]);
        if (result.rows.length === 0)
            return null;
        return this.mapTransactionFromDb(result.rows[0]);
    }
    async createTransaction(transaction) {
        const columns = [];
        const placeholders = [];
        const values = [];
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
    async updateTransaction(id, transactionData) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(transactionData)) {
            if (value !== undefined) {
                updates.push(`${this.snakeCase(key)} = $${paramIndex++}`);
                values.push(value);
            }
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        if (updates.length === 1)
            return this.getTransactionById(id);
        const result = await this.pool.query(`
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
        if (result.rows.length === 0)
            return null;
        return this.mapTransactionFromDb(result.rows[0]);
    }
    async deleteTransaction(id) {
        const result = await this.pool.query(`
      DELETE FROM transactions WHERE id = $1
    `, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
    async postTransaction(id, userId) {
        const result = await this.pool.query(`
      UPDATE transactions
      SET status = 'completed', posted_at = NOW(), posted_by = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [userId, id]);
        if (result.rows.length === 0)
            return null;
        return this.mapTransactionFromDb(result.rows[0]);
    }
    // Helper methods for mapping database rows to objects
    mapUserFromDb(row) {
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
    mapTransactionFromDb(row) {
        return {
            id: row.id,
            type: row.type,
            date: row.date,
            userId: row.user_id,
            description: row.description,
            categoryId: row.category_id,
            costCenterId: row.cost_center_id,
            vendorId: row.vendor_id,
            schemeCode: row.scheme_code,
            financialYear: row.financial_year,
            amount: parseFloat(row.amount),
            reference: row.reference,
            notes: row.notes,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            postedAt: row.posted_at,
            postedBy: row.posted_by,
            documentNumber: row.document_number,
            invoiceNumber: row.invoice_number,
            vendorNumber: row.vendor_number,
            paymentMethod: row.payment_method,
            paymentReference: row.payment_reference,
            taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : null,
            discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : null,
            netAmount: row.net_amount ? parseFloat(row.net_amount) : null,
            billNumber: row.bill_number,
            objectCode: row.object_code,
            objectDescription: row.object_description,
            goodsAmount: row.goods_amount ? parseFloat(row.goods_amount) : null,
            servicesAmount: row.services_amount ? parseFloat(row.services_amount) : null,
            stampDuty: row.stamp_duty ? parseFloat(row.stamp_duty) : null,
            incomeTax: row.income_tax ? parseFloat(row.income_tax) : null,
            gstAmount: row.gst_amount ? parseFloat(row.gst_amount) : null,
            pstAmount: row.pst_amount ? parseFloat(row.pst_amount) : null,
            paymentDetails: row.payment_details
        };
    }
    // Helper method to convert camelCase to snake_case
    snakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    // Implement remaining methods from IStorage interface
    // These are placeholders - you'll need to implement each method
    // Budget methods
    async getBudgets(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getBudgetById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createBudget(budget) {
        // Implementation similar to createTransaction
        return {};
    }
    async updateBudget(id, budgetData) {
        // Implementation similar to updateTransaction
        return null;
    }
    async deleteBudget(id) {
        // Implementation similar to deleteTransaction
        return false;
    }
    // Category methods
    async getCategories(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getCategoryById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createCategory(category) {
        // Implementation similar to createTransaction
        return {};
    }
    async updateCategory(id, categoryData) {
        // Implementation similar to updateTransaction
        return null;
    }
    async deleteCategory(id) {
        // Implementation similar to deleteTransaction
        return false;
    }
    // Cost Center methods
    async getCostCenters(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getCostCenterById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createCostCenter(costCenter) {
        // Implementation similar to createTransaction
        return {};
    }
    async updateCostCenter(id, costCenterData) {
        // Implementation similar to updateTransaction
        return null;
    }
    async deleteCostCenter(id) {
        // Implementation similar to deleteTransaction
        return false;
    }
    async updateCostCenterBudget(id, amount) {
        // Implementation similar to updateTransaction but specific to budget update
        return null;
    }
    // Vendor methods
    async getVendors(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getVendorById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createVendor(vendor) {
        // Implementation similar to createTransaction
        return {};
    }
    async updateVendor(id, vendorData) {
        // Implementation similar to updateTransaction
        return null;
    }
    async deleteVendor(id) {
        // Implementation similar to deleteTransaction
        return false;
    }
    // Scheme Code methods
    async getSchemeCodes(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getSchemeCodeById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createSchemeCode(schemeCode) {
        // Implementation similar to createTransaction
        return {};
    }
    async updateSchemeCode(id, schemeCodeData) {
        // Implementation similar to updateTransaction
        return null;
    }
    async deleteSchemeCode(id) {
        // Implementation similar to deleteTransaction
        return false;
    }
    // Activity methods
    async getActivities(filters) {
        // Implementation similar to getTransactions
        return [];
    }
    async getActivityById(id) {
        // Implementation similar to getTransactionById
        return null;
    }
    async createActivity(activity) {
        // Implementation similar to createTransaction
        return {};
    }
    async getRecentActivities(limit = 5) {
        // Implementation similar to getTransactions but with limit and sorting
        return [];
    }
}
