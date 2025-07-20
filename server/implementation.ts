import fs from 'fs';
import path from 'path';
import {
  User, InsertUser,
  Transaction, InsertTransaction,
  Budget, InsertBudget,
  Category, InsertCategory,
  CostCenter, InsertCostCenter,
  Vendor, InsertVendor,
  SchemeCode, InsertSchemeCode,
  Activity, InsertActivity
} from '../shared/schema.js';
import { IStorage } from './storage.js';

// Helper function to generate unique IDs
function generateId(): number {
  return Math.floor(Math.random() * 1000000);
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private transactions: Transaction[] = [];
  private budgets: Budget[] = [];
  private categories: Category[] = [];
  private costCenters: CostCenter[] = [];
  private vendors: Vendor[] = [];
  private schemeCodes: SchemeCode[] = [];
  private activities: Activity[] = [];

  constructor() {
    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData() {
    // Initialize with empty arrays instead of sample data
    this.users = [];
    this.transactions = [];
    this.categories = [];
    this.costCenters = [];
    this.vendors = [];
    this.schemeCodes = [];
    this.budgets = [];
    this.activities = [];
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: number): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user ?? null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: generateId(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role ?? 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    const prev = this.users[index];
    const updatedUser: User = {
      ...prev,
      ...userData,
      role: userData.role ?? prev.role,
      updatedAt: new Date(),
    };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    return initialLength !== this.users.length;
  }

  // Transaction methods
  async getTransactions(filters?: Partial<Transaction>): Promise<Transaction[]> {
    if (!filters) return [...this.transactions];
    return this.transactions.filter(transaction => {
      return Object.entries(filters).every(([key, value]) => {
        return transaction[key as keyof Transaction] === value;
      });
    });
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    const transaction = this.transactions.find(t => t.id === id);
    return transaction ?? null;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: generateId(),
      type: transaction.type ?? 'expense',
      date: transaction.date ?? '',
      userId: transaction.userId ?? null,
      description: transaction.description ?? '',
      categoryId: transaction.categoryId ?? null,
      costCenterId: transaction.costCenterId ?? null,
      vendorId: transaction.vendorId ?? null,
      schemeCode: transaction.schemeCode ?? null,
      financialYear: transaction.financialYear ?? null,
      amount: transaction.amount ?? 0,
      reference: transaction.reference ?? null,
      notes: transaction.notes ?? null,
      status: transaction.status ?? 'pending',
      createdAt: new Date(),
      updatedAt: null,
      postedAt: null,
      postedBy: null,
      documentNumber: transaction.documentNumber ?? null,
      invoiceNumber: transaction.invoiceNumber ?? null,
      vendorNumber: transaction.vendorNumber ?? null,
      paymentMethod: transaction.paymentMethod ?? null,
      paymentReference: transaction.paymentReference ?? null,
      taxAmount: transaction.taxAmount ?? null,
      discountAmount: transaction.discountAmount ?? null,
      netAmount: transaction.netAmount ?? null,
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | null> {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const prev = this.transactions[idx];
    const updated: Transaction = {
      ...prev,
      type: transactionData.type ?? prev.type,
      date: transactionData.date ?? prev.date,
      userId: transactionData.userId ?? prev.userId,
      description: transactionData.description ?? prev.description,
      categoryId: transactionData.categoryId ?? prev.categoryId,
      costCenterId: transactionData.costCenterId ?? prev.costCenterId,
      vendorId: transactionData.vendorId ?? prev.vendorId,
      schemeCode: transactionData.schemeCode ?? prev.schemeCode,
      financialYear: transactionData.financialYear ?? prev.financialYear,
      amount: transactionData.amount ?? prev.amount,
      reference: transactionData.reference ?? prev.reference,
      notes: transactionData.notes ?? prev.notes,
      status: transactionData.status ?? prev.status,
      updatedAt: new Date(),
      documentNumber: transactionData.documentNumber ?? prev.documentNumber,
      invoiceNumber: transactionData.invoiceNumber ?? prev.invoiceNumber,
      vendorNumber: transactionData.vendorNumber ?? prev.vendorNumber,
      paymentMethod: transactionData.paymentMethod ?? prev.paymentMethod,
      paymentReference: transactionData.paymentReference ?? prev.paymentReference,
      taxAmount: transactionData.taxAmount ?? prev.taxAmount,
      discountAmount: transactionData.discountAmount ?? prev.discountAmount,
      netAmount: transactionData.netAmount ?? prev.netAmount,
    };
    this.transactions[idx] = updated;
    return updated;
  }

  async postTransaction(id: number, userId: number): Promise<Transaction | null> {
    const idx = this.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const prev = this.transactions[idx];
    const posted: Transaction = {
      ...prev,
      status: 'completed',
      postedAt: new Date(),
      postedBy: userId,
      updatedAt: new Date(),
    };
    this.transactions[idx] = posted;
    return posted;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const initialLength = this.transactions.length;
    this.transactions = this.transactions.filter(t => t.id !== id);
    return initialLength !== this.transactions.length;
  }

  // Budget methods
  async getBudgets(filters?: Partial<Budget>): Promise<Budget[]> {
    if (!filters) return [...this.budgets];
    return this.budgets.filter(budget => {
      return Object.entries(filters).every(([key, value]) => {
        return budget[key as keyof Budget] === value;
      });
    });
  }

  async getBudgetById(id: number): Promise<Budget | null> {
    const budget = this.budgets.find(b => b.id === id);
    return budget ?? null;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const newBudget: Budget = {
      id: generateId(),
      name: budget.name ?? '',
      financialYear: budget.financialYear ?? '',
      startDate: budget.startDate ?? '',
      endDate: budget.endDate ?? '',
      amount: budget.amount ?? 0,
      costCenterId: budget.costCenterId ?? null,
      categoryId: budget.categoryId ?? null,
      notes: budget.notes ?? null,
      status: budget.status ?? 'active',
      createdAt: new Date(),
      updatedAt: null,
    };
    this.budgets.push(newBudget);
    return newBudget;
  }

  async updateBudget(id: number, budgetData: Partial<InsertBudget>): Promise<Budget | null> {
    const idx = this.budgets.findIndex(b => b.id === id);
    if (idx === -1) return null;
    const prev = this.budgets[idx];
    const updated: Budget = {
      ...prev,
      name: budgetData.name ?? prev.name,
      financialYear: budgetData.financialYear ?? prev.financialYear,
      startDate: budgetData.startDate ?? prev.startDate,
      endDate: budgetData.endDate ?? prev.endDate,
      amount: budgetData.amount ?? prev.amount,
      costCenterId: budgetData.costCenterId ?? prev.costCenterId,
      categoryId: budgetData.categoryId ?? prev.categoryId,
      notes: budgetData.notes ?? prev.notes,
      status: budgetData.status ?? prev.status,
      updatedAt: new Date(),
    };
    this.budgets[idx] = updated;
    return updated;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const initialLength = this.budgets.length;
    this.budgets = this.budgets.filter(b => b.id !== id);
    return initialLength !== this.budgets.length;
  }

  // Category methods
  async getCategories(filters?: Partial<Category>): Promise<Category[]> {
    if (!filters) return [...this.categories];
    return this.categories.filter(category => {
      return Object.entries(filters).every(([key, value]) => {
        return category[key as keyof Category] === value;
      });
    });
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const category = this.categories.find(c => c.id === id);
    return category ?? null;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: generateId(),
      name: category.name ?? '',
      type: category.type ?? 'expense',
      color: category.color ?? '#000000',
      icon: category.icon ?? null,
      parentId: category.parentId ?? null,
      createdAt: new Date(),
      updatedAt: null,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | null> {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const prev = this.categories[idx];
    const updated: Category = {
      ...prev,
      name: categoryData.name ?? prev.name,
      type: categoryData.type ?? prev.type,
      color: categoryData.color ?? prev.color,
      icon: categoryData.icon ?? prev.icon,
      parentId: categoryData.parentId ?? prev.parentId,
      updatedAt: new Date(),
    };
    this.categories[idx] = updated;
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(c => c.id !== id);
    return initialLength !== this.categories.length;
  }

  // CostCenter methods
  async getCostCenters(filters?: Partial<CostCenter>): Promise<CostCenter[]> {
    if (!filters) return [...this.costCenters];
    return this.costCenters.filter(costCenter => {
      return Object.entries(filters).every(([key, value]) => {
        return costCenter[key as keyof CostCenter] === value;
      });
    });
  }

  async getCostCenterById(id: number): Promise<CostCenter | null> {
    const costCenter = this.costCenters.find(c => c.id === id);
    return costCenter ?? null;
  }

  async createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter> {
    const newCostCenter: CostCenter = {
      id: generateId(),
      name: costCenter.name ?? '',
      code: costCenter.code ?? '',
      description: costCenter.description ?? null,
      budget: costCenter.budget ?? 0,
      manager: costCenter.manager ?? null,
      status: costCenter.status ?? 'active',
      createdAt: new Date(),
      updatedAt: null,
    };
    this.costCenters.push(newCostCenter);
    return newCostCenter;
  }

  async updateCostCenter(id: number, costCenterData: Partial<InsertCostCenter>): Promise<CostCenter | null> {
    const idx = this.costCenters.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const prev = this.costCenters[idx];
    const updated: CostCenter = {
      ...prev,
      name: costCenterData.name ?? prev.name,
      code: costCenterData.code ?? prev.code,
      description: costCenterData.description ?? prev.description,
      budget: costCenterData.budget ?? prev.budget,
      manager: costCenterData.manager ?? prev.manager,
      status: costCenterData.status ?? prev.status,
      updatedAt: new Date(),
    };
    this.costCenters[idx] = updated;
    return updated;
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    const initialLength = this.costCenters.length;
    this.costCenters = this.costCenters.filter(c => c.id !== id);
    return initialLength !== this.costCenters.length;
  }

  async updateCostCenterBudget(id: number, amount: number): Promise<CostCenter | null> {
    const idx = this.costCenters.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const prev = this.costCenters[idx];
    const updated: CostCenter = {
      ...prev,
      budget: prev.budget + amount,
      updatedAt: new Date(),
    };
    this.costCenters[idx] = updated;
    return updated;
  }

  // Vendor methods
  async getVendors(filters?: Partial<Vendor>): Promise<Vendor[]> {
    if (!filters) return [...this.vendors];
    return this.vendors.filter(vendor => {
      return Object.entries(filters).every(([key, value]) => {
        return vendor[key as keyof Vendor] === value;
      });
    });
  }

  async getVendorById(id: number): Promise<Vendor | null> {
    const vendor = this.vendors.find(v => v.id === id);
    return vendor ?? null;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const newVendor: Vendor = {
      id: generateId(),
      name: vendor.name ?? '',
      code: vendor.code ?? '',
      contactPerson: vendor.contactPerson ?? null,
      email: vendor.email ?? null,
      phone: vendor.phone ?? null,
      address: vendor.address ?? null,
      taxId: vendor.taxId ?? null,
      bankAccount: vendor.bankAccount ?? null,
      status: vendor.status ?? 'active',
      createdAt: new Date(),
      updatedAt: null,
      vendorNumber: vendor.vendorNumber ?? `VN-${generateId()}`,
    };
    this.vendors.push(newVendor);
    return newVendor;
  }

  async updateVendor(id: number, vendorData: Partial<InsertVendor>): Promise<Vendor | null> {
    const idx = this.vendors.findIndex(v => v.id === id);
    if (idx === -1) return null;
    const prev = this.vendors[idx];
    const updated: Vendor = {
      ...prev,
      name: vendorData.name ?? prev.name,
      code: vendorData.code ?? prev.code,
      contactPerson: vendorData.contactPerson ?? prev.contactPerson,
      email: vendorData.email ?? prev.email,
      phone: vendorData.phone ?? prev.phone,
      address: vendorData.address ?? prev.address,
      taxId: vendorData.taxId ?? prev.taxId,
      bankAccount: vendorData.bankAccount ?? prev.bankAccount,
      status: vendorData.status ?? prev.status,
      vendorNumber: vendorData.vendorNumber ?? prev.vendorNumber,
      updatedAt: new Date(),
    };
    this.vendors[idx] = updated;
    return updated;
  }

  async deleteVendor(id: number): Promise<boolean> {
    const initialLength = this.vendors.length;
    this.vendors = this.vendors.filter(v => v.id !== id);
    return initialLength !== this.vendors.length;
  }

  // SchemeCode methods
  async getSchemeCodes(filters?: Partial<SchemeCode>): Promise<SchemeCode[]> {
    if (!filters) return [...this.schemeCodes];
    return this.schemeCodes.filter(schemeCode => {
      return Object.entries(filters).every(([key, value]) => {
        return schemeCode[key as keyof SchemeCode] === value;
      });
    });
  }

  async getSchemeCodeById(id: number): Promise<SchemeCode | null> {
    const schemeCode = this.schemeCodes.find(s => s.id === id);
    return schemeCode ?? null;
  }

  async createSchemeCode(schemeCode: InsertSchemeCode): Promise<SchemeCode> {
    const newSchemeCode: SchemeCode = {
      id: generateId(),
      code: schemeCode.code ?? '',
      name: schemeCode.name ?? '',
      description: schemeCode.description ?? null,
      status: schemeCode.status ?? 'active',
      createdAt: new Date(),
      updatedAt: null,
    };
    this.schemeCodes.push(newSchemeCode);
    return newSchemeCode;
  }

  async updateSchemeCode(id: number, schemeCodeData: Partial<InsertSchemeCode>): Promise<SchemeCode | null> {
    const idx = this.schemeCodes.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const prev = this.schemeCodes[idx];
    const updated: SchemeCode = {
      ...prev,
      code: schemeCodeData.code ?? prev.code,
      name: schemeCodeData.name ?? prev.name,
      description: schemeCodeData.description ?? prev.description,
      status: schemeCodeData.status ?? prev.status,
      updatedAt: new Date(),
    };
    this.schemeCodes[idx] = updated;
    return updated;
  }

  async deleteSchemeCode(id: number): Promise<boolean> {
    const initialLength = this.schemeCodes.length;
    this.schemeCodes = this.schemeCodes.filter(s => s.id !== id);
    return initialLength !== this.schemeCodes.length;
  }

  // Activity methods
  async getActivities(filters?: Partial<Activity>): Promise<Activity[]> {
    if (!filters) return [...this.activities];
    return this.activities.filter(activity => {
      return Object.entries(filters).every(([key, value]) => {
        return activity[key as keyof Activity] === value;
      });
    });
  }

  async getActivityById(id: number): Promise<Activity | null> {
    const activity = this.activities.find(a => a.id === id);
    return activity ?? null;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: generateId(),
      userId: activity.userId,
      username: activity.username,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId ?? null,
      details: activity.details ?? null,
      timestamp: new Date(),
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  async getRecentActivities(limit: number = 5): Promise<Activity[]> {
    return [...this.activities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
