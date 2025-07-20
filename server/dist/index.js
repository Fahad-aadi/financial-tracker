import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MemStorage } from './implementation.js';
// Load environment variables
dotenv.config();
// Create Express server
const app = express();
const PORT = process.env.PORT || 5000;
// Use in-memory storage
const storage = new MemStorage();
// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Financial Tracker API is running!',
        storageType: 'In-Memory Storage'
    });
});
// User routes
app.get('/api/users', async (req, res) => {
    try {
        const users = await storage.getUsers();
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.get('/api/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await storage.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Transaction routes
app.get('/api/transactions', async (req, res) => {
    try {
        // Support filtering
        const filters = req.query.filters ? JSON.parse(req.query.filters) : undefined;
        const transactions = await storage.getTransactions(filters);
        res.json(transactions);
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
app.post('/api/transactions', async (req, res) => {
    try {
        const newTransaction = await storage.createTransaction(req.body);
        res.status(201).json(newTransaction);
    }
    catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedTransaction = await storage.updateTransaction(id, req.body);
        if (!updatedTransaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(updatedTransaction);
    }
    catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteTransaction(id);
        if (!success) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});
// Cost center routes
app.get('/api/cost-centers', async (req, res) => {
    try {
        const costCenters = await storage.getCostCenters();
        res.json(costCenters);
    }
    catch (error) {
        console.error('Error fetching cost centers:', error);
        res.status(500).json({ error: 'Failed to fetch cost centers' });
    }
});
// Vendor routes
app.get('/api/vendors', async (req, res) => {
    try {
        const vendors = await storage.getVendors();
        res.json(vendors);
    }
    catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});
// Category routes
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await storage.getCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Scheme code routes
app.get('/api/scheme-codes', async (req, res) => {
    try {
        const schemeCodes = await storage.getSchemeCodes();
        res.json(schemeCodes);
    }
    catch (error) {
        console.error('Error fetching scheme codes:', error);
        res.status(500).json({ error: 'Failed to fetch scheme codes' });
    }
});
// Object code routes
app.get('/api/object-codes', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching object codes:', error);
        res.status(500).json({ error: 'Failed to fetch object codes' });
    }
});
// Bill numbers routes
app.get('/api/bill-numbers', async (req, res) => {
    try {
        // For now, return sample data
        const billNumbers = [
            { objectCode: 'A01101', lastNumber: 5, deletedNumbers: [] },
            { objectCode: 'A03201', lastNumber: 3, deletedNumbers: [2] },
            { objectCode: 'A03970', lastNumber: 10, deletedNumbers: [4, 7] }
        ];
        res.json(billNumbers);
    }
    catch (error) {
        console.error('Error fetching bill numbers:', error);
        res.status(500).json({ error: 'Failed to fetch bill numbers' });
    }
});
app.get('/api/bill-numbers/:objectCode', async (req, res) => {
    try {
        const { objectCode } = req.params;
        // For now, return sample data
        const billNumber = {
            objectCode,
            lastNumber: Math.floor(Math.random() * 10) + 1,
            deletedNumbers: []
        };
        res.json(billNumber);
    }
    catch (error) {
        console.error('Error fetching bill number:', error);
        res.status(500).json({ error: 'Failed to fetch bill number' });
    }
});
// Budget routes
app.get('/api/budgets', async (req, res) => {
    try {
        const budgets = await storage.getBudgets();
        res.json(budgets);
    }
    catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Using In-Memory Storage for data persistence`);
});
