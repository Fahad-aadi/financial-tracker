// Shared schema types for the Financial Tracker application

// User schema
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: string;
}

// Transaction schema
export interface Transaction {
  id: number;
  financialYear: string;
  costCenter: string;
  costCenterName: string;
  schemeCode: string;
  schemeName: string;
  vendorName: string;
  vendorNumber: string;
  date: string;
  billNumber: string;
  billNature: string;
  objectCode: string;
  objectDescription: string;
  grossAmount: string;
  goodsAmount: string;
  servicesAmount: string;
  gstAmount: string;
  pstAmount: string;
  contractType: string;
  contractAmount: string;
  stampDuty: string;
  advanceIncomeTax: string;
  incomeTaxPurchaseRate: string;
  incomeTaxPurchaseAmount: string;
  incomeTaxServiceRate: string;
  incomeTaxServiceAmount: string;
  generalSalesTaxRate: string;
  generalSalesTaxAmount: string;
  punjabSalesTaxRate: string;
  punjabSalesTaxAmount: string;
  netAmount: string;
  billDetail: string;
  billDescription: string;
  status: string;
  createdAt?: Date;
}

export interface InsertTransaction {
  financialYear: string;
  costCenter: string;
  costCenterName: string;
  schemeCode: string;
  schemeName: string;
  vendorName: string;
  vendorNumber: string;
  date: string;
  billNumber: string;
  billNature: string;
  objectCode: string;
  objectDescription: string;
  grossAmount: string;
  goodsAmount: string;
  servicesAmount: string;
  gstAmount: string;
  pstAmount: string;
  contractType: string;
  contractAmount: string;
  stampDuty: string;
  advanceIncomeTax: string;
  incomeTaxPurchaseRate: string;
  incomeTaxPurchaseAmount: string;
  incomeTaxServiceRate: string;
  incomeTaxServiceAmount: string;
  generalSalesTaxRate: string;
  generalSalesTaxAmount: string;
  punjabSalesTaxRate: string;
  punjabSalesTaxAmount: string;
  netAmount: string;
  billDetail: string;
  billDescription: string;
  status: string;
}

// Budget schema
export interface Budget {
  id: number;
  costCenterId: number;
  objectCode: string;
  amount: number;
  released: number;
  used: number;
  available: number;
  financialYear: string;
  createdAt?: Date;
}

export interface InsertBudget {
  costCenterId: number;
  objectCode: string;
  amount: number;
  released: number;
  used: number;
  available: number;
  financialYear: string;
}

// Category schema
export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
}

export interface InsertCategory {
  name: string;
  description?: string;
}

// Cost Center schema
export interface CostCenter {
  id: number;
  code: string;
  name: string;
  createdAt?: Date;
}

export interface InsertCostCenter {
  code: string;
  name: string;
}

// Vendor schema
export interface Vendor {
  id: number;
  name: string;
  vendorNumber: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  createdAt?: Date;
}

export interface InsertVendor {
  name: string;
  vendorNumber: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

// Scheme Code schema
export interface SchemeCode {
  id: number;
  code: string;
  name: string;
  createdAt?: Date;
}

export interface InsertSchemeCode {
  code: string;
  name: string;
}

// Object Code schema
export interface ObjectCode {
  id: number;
  code: string;
  description: string;
  createdAt?: Date;
}

export interface InsertObjectCode {
  code: string;
  description: string;
}

// Bill Number schema
export interface BillNumber {
  objectCode: string;
  lastNumber: number;
  deletedNumbers: number[];
}

// Activity schema
export interface Activity {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: Date;
}

export interface InsertActivity {
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
}

// Expense Report schema
export interface ExpenseReport {
  id: number;
  costCenterId: number;
  objectCode: string;
  financialYear: string;
  totalBudget: number;
  totalReleased: number;
  totalExpense: number;
  remainingBudget: number;
  lastUpdated: Date;
}

export interface InsertExpenseReport {
  costCenterId: number;
  objectCode: string;
  financialYear: string;
  totalBudget: number;
  totalReleased: number;
  totalExpense: number;
  remainingBudget: number;
}
