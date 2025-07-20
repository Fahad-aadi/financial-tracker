// Helper function to generate unique IDs
function generateId() {
    return Math.floor(Math.random() * 1000000);
}
// In-memory storage implementation
export class MemStorage {
    constructor() {
        this.users = [];
        this.transactions = [];
        this.budgets = [];
        this.categories = [];
        this.costCenters = [];
        this.vendors = [];
        this.schemeCodes = [];
        this.activities = [];
        // Initialize with some sample data
        this.initializeData();
    }
    initializeData() {
        // Sample users
        this.users = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                fullName: 'Admin User',
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 2,
                username: 'user',
                email: 'user@example.com',
                fullName: 'Regular User',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        // Sample transactions
        this.transactions = [
            {
                id: 1,
                type: 'expense',
                date: '2025-04-01',
                userId: 1,
                description: 'Office supplies purchase',
                categoryId: 2,
                costCenterId: 1,
                vendorId: 1,
                schemeCode: 'SC-001',
                financialYear: '2025-2026',
                amount: 1500,
                reference: 'INV-12345',
                notes: 'Monthly office supplies',
                status: 'completed',
                createdAt: new Date(),
                updatedAt: null,
                postedAt: new Date(),
                postedBy: 1,
                documentNumber: 'DOC-001',
                invoiceNumber: 'INV-12345',
                vendorNumber: 'V-001',
                paymentMethod: 'Bank Transfer',
                paymentReference: 'BT-12345',
                taxAmount: 150,
                discountAmount: 50,
                netAmount: 1600
            },
            {
                id: 2,
                type: 'expense',
                date: '2025-04-02',
                userId: 1,
                description: 'Utility bill payment',
                categoryId: 3,
                costCenterId: 2,
                vendorId: 2,
                schemeCode: 'SC-001',
                financialYear: '2025-2026',
                amount: 2500,
                reference: 'UTIL-789',
                notes: 'Monthly utility bill',
                status: 'completed',
                createdAt: new Date(),
                updatedAt: null,
                postedAt: new Date(),
                postedBy: 1,
                documentNumber: 'DOC-002',
                invoiceNumber: 'UTIL-789',
                vendorNumber: 'V-002',
                paymentMethod: 'Bank Transfer',
                paymentReference: 'BT-6789',
                taxAmount: 250,
                discountAmount: 0,
                netAmount: 2750
            }
        ];
        // Sample categories
        this.categories = [
            {
                id: 1,
                name: 'Salary',
                type: 'income',
                color: '#4CAF50',
                icon: 'ri-money-dollar-circle-line',
                parentId: null,
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 2,
                name: 'Office Supplies',
                type: 'expense',
                color: '#F44336',
                icon: 'ri-pencil-ruler-line',
                parentId: null,
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 3,
                name: 'Utilities',
                type: 'expense',
                color: '#2196F3',
                icon: 'ri-lightbulb-line',
                parentId: null,
                createdAt: new Date(),
                updatedAt: null
            }
        ];
        // Sample cost centers
        this.costCenters = [
            {
                id: 1,
                name: 'IT Department',
                code: 'IT-001',
                description: 'Information Technology Department',
                budget: 50000,
                manager: 'John Smith',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 2,
                name: 'HR Department',
                code: 'HR-001',
                description: 'Human Resources Department',
                budget: 30000,
                manager: 'Jane Doe',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 3,
                name: 'Marketing',
                code: 'MKT-001',
                description: 'Marketing Department',
                budget: 40000,
                manager: 'Robert Johnson',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            }
        ];
        // Sample vendors
        this.vendors = [
            {
                id: 1,
                name: 'ABC Supplies',
                code: 'V-001',
                contactPerson: 'Alice Brown',
                email: 'alice@abcsupplies.com',
                phone: '123-456-7890',
                address: '123 Main St, Anytown, USA',
                taxId: 'TAX-12345',
                bankAccount: 'BANK-001-123456',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 2,
                name: 'XYZ Services',
                code: 'V-002',
                contactPerson: 'Bob Wilson',
                email: 'bob@xyzservices.com',
                phone: '987-654-3210',
                address: '456 Oak St, Somewhere, USA',
                taxId: 'TAX-67890',
                bankAccount: 'BANK-002-654321',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            }
        ];
        // Sample scheme codes
        this.schemeCodes = [
            {
                id: 1,
                code: 'SC-001',
                name: 'Operating Expenses',
                description: 'Regular operating expenses',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 2,
                code: 'SC-002',
                name: 'Capital Expenditure',
                description: 'Long-term investments',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            },
            {
                id: 3,
                code: 'SC-003',
                name: 'Project Expenses',
                description: 'Expenses related to specific projects',
                status: 'active',
                createdAt: new Date(),
                updatedAt: null
            }
        ];
    }
    // User methods
    async getUsers() {
        return [...this.users];
    }
    async getUserById(id) {
        const user = this.users.find(u => u.id === id);
        return user || null;
    }
    async createUser(user) {
        const newUser = {
            ...user,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.users.push(newUser);
        return newUser;
    }
    async updateUser(id, userData) {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1)
            return null;
        const updatedUser = {
            ...this.users[index],
            ...userData,
            updatedAt: new Date()
        };
        this.users[index] = updatedUser;
        return updatedUser;
    }
    async deleteUser(id) {
        const initialLength = this.users.length;
        this.users = this.users.filter(u => u.id !== id);
        return initialLength !== this.users.length;
    }
    // Transaction methods
    async getTransactions(filters) {
        if (!filters)
            return [...this.transactions];
        return this.transactions.filter(transaction => {
            return Object.entries(filters).every(([key, value]) => {
                return transaction[key] === value;
            });
        });
    }
    async getTransactionById(id) {
        const transaction = this.transactions.find(t => t.id === id);
        return transaction || null;
    }
    async createTransaction(transaction) {
        const newTransaction = {
            ...transaction,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null,
            postedAt: null,
            postedBy: null
        };
        this.transactions.push(newTransaction);
        return newTransaction;
    }
    async updateTransaction(id, transactionData) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1)
            return null;
        const updatedTransaction = {
            ...this.transactions[index],
            ...transactionData,
            updatedAt: new Date()
        };
        this.transactions[index] = updatedTransaction;
        return updatedTransaction;
    }
    async deleteTransaction(id) {
        const initialLength = this.transactions.length;
        this.transactions = this.transactions.filter(t => t.id !== id);
        return initialLength !== this.transactions.length;
    }
    async postTransaction(id, userId) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1)
            return null;
        // Only expense transactions can be posted
        if (this.transactions[index].type !== 'expense') {
            return null;
        }
        // Update the transaction
        const updatedTransaction = {
            ...this.transactions[index],
            status: 'completed',
            postedAt: new Date(),
            postedBy: userId,
            updatedAt: new Date()
        };
        this.transactions[index] = updatedTransaction;
        // Update the cost center budget if applicable
        if (updatedTransaction.costCenterId) {
            await this.updateCostCenterBudget(updatedTransaction.costCenterId, -updatedTransaction.amount // Subtract the expense amount from the budget
            );
        }
        // Create an activity record for this action
        await this.createActivity({
            userId,
            action: 'post_transaction',
            entityType: 'transaction',
            entityId: id,
            details: `Posted transaction: ${updatedTransaction.description}`
        });
        return updatedTransaction;
    }
    // Budget methods
    async getBudgets(filters) {
        if (!filters)
            return [...this.budgets];
        return this.budgets.filter(budget => {
            return Object.entries(filters).every(([key, value]) => {
                return budget[key] === value;
            });
        });
    }
    async getBudgetById(id) {
        const budget = this.budgets.find(b => b.id === id);
        return budget || null;
    }
    async createBudget(budget) {
        const newBudget = {
            ...budget,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null
        };
        this.budgets.push(newBudget);
        return newBudget;
    }
    async updateBudget(id, budgetData) {
        const index = this.budgets.findIndex(b => b.id === id);
        if (index === -1)
            return null;
        const updatedBudget = {
            ...this.budgets[index],
            ...budgetData,
            updatedAt: new Date()
        };
        this.budgets[index] = updatedBudget;
        return updatedBudget;
    }
    async deleteBudget(id) {
        const initialLength = this.budgets.length;
        this.budgets = this.budgets.filter(b => b.id !== id);
        return initialLength !== this.budgets.length;
    }
    // Category methods
    async getCategories(filters) {
        if (!filters)
            return [...this.categories];
        return this.categories.filter(category => {
            return Object.entries(filters).every(([key, value]) => {
                return category[key] === value;
            });
        });
    }
    async getCategoryById(id) {
        const category = this.categories.find(c => c.id === id);
        return category || null;
    }
    async createCategory(category) {
        const newCategory = {
            ...category,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null
        };
        this.categories.push(newCategory);
        return newCategory;
    }
    async updateCategory(id, categoryData) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index === -1)
            return null;
        const updatedCategory = {
            ...this.categories[index],
            ...categoryData,
            updatedAt: new Date()
        };
        this.categories[index] = updatedCategory;
        return updatedCategory;
    }
    async deleteCategory(id) {
        const initialLength = this.categories.length;
        this.categories = this.categories.filter(c => c.id !== id);
        return initialLength !== this.categories.length;
    }
    // Cost Center methods
    async getCostCenters(filters) {
        if (!filters)
            return [...this.costCenters];
        return this.costCenters.filter(costCenter => {
            return Object.entries(filters).every(([key, value]) => {
                return costCenter[key] === value;
            });
        });
    }
    async getCostCenterById(id) {
        const costCenter = this.costCenters.find(c => c.id === id);
        return costCenter || null;
    }
    async createCostCenter(costCenter) {
        const newCostCenter = {
            ...costCenter,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null
        };
        this.costCenters.push(newCostCenter);
        return newCostCenter;
    }
    async updateCostCenter(id, costCenterData) {
        const index = this.costCenters.findIndex(c => c.id === id);
        if (index === -1)
            return null;
        const updatedCostCenter = {
            ...this.costCenters[index],
            ...costCenterData,
            updatedAt: new Date()
        };
        this.costCenters[index] = updatedCostCenter;
        return updatedCostCenter;
    }
    async deleteCostCenter(id) {
        const initialLength = this.costCenters.length;
        this.costCenters = this.costCenters.filter(c => c.id !== id);
        return initialLength !== this.costCenters.length;
    }
    async updateCostCenterBudget(id, amount) {
        const index = this.costCenters.findIndex(c => c.id === id);
        if (index === -1)
            return null;
        const updatedCostCenter = {
            ...this.costCenters[index],
            budget: this.costCenters[index].budget + amount,
            updatedAt: new Date()
        };
        this.costCenters[index] = updatedCostCenter;
        return updatedCostCenter;
    }
    // Vendor methods
    async getVendors(filters) {
        if (!filters)
            return [...this.vendors];
        return this.vendors.filter(vendor => {
            return Object.entries(filters).every(([key, value]) => {
                return vendor[key] === value;
            });
        });
    }
    async getVendorById(id) {
        const vendor = this.vendors.find(v => v.id === id);
        return vendor || null;
    }
    async createVendor(vendor) {
        const newVendor = {
            ...vendor,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null
        };
        this.vendors.push(newVendor);
        return newVendor;
    }
    async updateVendor(id, vendorData) {
        const index = this.vendors.findIndex(v => v.id === id);
        if (index === -1)
            return null;
        const updatedVendor = {
            ...this.vendors[index],
            ...vendorData,
            updatedAt: new Date()
        };
        this.vendors[index] = updatedVendor;
        return updatedVendor;
    }
    async deleteVendor(id) {
        const initialLength = this.vendors.length;
        this.vendors = this.vendors.filter(v => v.id !== id);
        return initialLength !== this.vendors.length;
    }
    // Scheme Code methods
    async getSchemeCodes(filters) {
        if (!filters)
            return [...this.schemeCodes];
        return this.schemeCodes.filter(schemeCode => {
            return Object.entries(filters).every(([key, value]) => {
                return schemeCode[key] === value;
            });
        });
    }
    async getSchemeCodeById(id) {
        const schemeCode = this.schemeCodes.find(s => s.id === id);
        return schemeCode || null;
    }
    async createSchemeCode(schemeCode) {
        const newSchemeCode = {
            ...schemeCode,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: null
        };
        this.schemeCodes.push(newSchemeCode);
        return newSchemeCode;
    }
    async updateSchemeCode(id, schemeCodeData) {
        const index = this.schemeCodes.findIndex(s => s.id === id);
        if (index === -1)
            return null;
        const updatedSchemeCode = {
            ...this.schemeCodes[index],
            ...schemeCodeData,
            updatedAt: new Date()
        };
        this.schemeCodes[index] = updatedSchemeCode;
        return updatedSchemeCode;
    }
    async deleteSchemeCode(id) {
        const initialLength = this.schemeCodes.length;
        this.schemeCodes = this.schemeCodes.filter(s => s.id !== id);
        return initialLength !== this.schemeCodes.length;
    }
    // Activity methods
    async getActivities(filters) {
        if (!filters)
            return [...this.activities];
        return this.activities.filter(activity => {
            return Object.entries(filters).every(([key, value]) => {
                return activity[key] === value;
            });
        });
    }
    async getActivityById(id) {
        const activity = this.activities.find(a => a.id === id);
        return activity || null;
    }
    async createActivity(activity) {
        const newActivity = {
            id: generateId(),
            userId: activity.userId,
            username: activity.username,
            action: activity.action,
            entityType: activity.entityType,
            entityId: activity.entityId,
            details: activity.details,
            timestamp: new Date()
        };
        this.activities.push(newActivity);
        return newActivity;
    }
    async getRecentActivities(limit = 5) {
        return [...this.activities]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
}
