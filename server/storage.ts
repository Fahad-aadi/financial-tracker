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

// Interface for storage operations
export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;

  // Transaction operations
  getTransactions(filters?: Partial<Transaction>): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | null>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | null>;
  deleteTransaction(id: number): Promise<boolean>;
  postTransaction(id: number, userId: number): Promise<Transaction | null>;

  // Budget operations
  getBudgets(filters?: Partial<Budget>): Promise<Budget[]>;
  getBudgetById(id: number): Promise<Budget | null>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | null>;
  deleteBudget(id: number): Promise<boolean>;

  // Category operations
  getCategories(filters?: Partial<Category>): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | null>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | null>;
  deleteCategory(id: number): Promise<boolean>;

  // Cost Center operations
  getCostCenters(filters?: Partial<CostCenter>): Promise<CostCenter[]>;
  getCostCenterById(id: number): Promise<CostCenter | null>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: number, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | null>;
  deleteCostCenter(id: number): Promise<boolean>;
  updateCostCenterBudget(id: number, amount: number): Promise<CostCenter | null>;

  // Vendor operations
  getVendors(filters?: Partial<Vendor>): Promise<Vendor[]>;
  getVendorById(id: number): Promise<Vendor | null>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | null>;
  deleteVendor(id: number): Promise<boolean>;

  // Scheme Code operations
  getSchemeCodes(filters?: Partial<SchemeCode>): Promise<SchemeCode[]>;
  getSchemeCodeById(id: number): Promise<SchemeCode | null>;
  createSchemeCode(schemeCode: InsertSchemeCode): Promise<SchemeCode>;
  updateSchemeCode(id: number, schemeCode: Partial<InsertSchemeCode>): Promise<SchemeCode | null>;
  deleteSchemeCode(id: number): Promise<boolean>;

  // Activity operations
  getActivities(filters?: Partial<Activity>): Promise<Activity[]>;
  getActivityById(id: number): Promise<Activity | null>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
}

// Import the implementation and export the storage instance
import { MemStorage } from './implementation.js';

// Create and export the storage instance
export const storage = new MemStorage();
