import { z } from 'zod';

// Base schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['admin', 'user', 'manager']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const transactionSchema = z.object({
  id: z.number(),
  type: z.enum(['income', 'expense']),
  date: z.string(),
  userId: z.number().nullable(),
  description: z.string(),
  categoryId: z.number().nullable(),
  costCenterId: z.number().nullable(),
  vendorId: z.number().nullable(),
  schemeCode: z.string().nullable(),
  financialYear: z.string().nullable(),
  amount: z.number(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  postedAt: z.date().nullable(),
  postedBy: z.number().nullable(),
  documentNumber: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  vendorNumber: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  paymentReference: z.string().nullable(),
  taxAmount: z.number().nullable(),
  discountAmount: z.number().nullable(),
  netAmount: z.number().nullable(),
});

export const budgetSchema = z.object({
  id: z.number(),
  name: z.string(),
  financialYear: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  amount: z.number(),
  costCenterId: z.number().nullable(),
  categoryId: z.number().nullable(),
  notes: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'draft']),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(['income', 'expense']),
  color: z.string(),
  icon: z.string().nullable(),
  parentId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const costCenterSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  budget: z.number().default(0),
  manager: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const vendorSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  contactPerson: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  taxId: z.string().nullable(),
  bankAccount: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  vendorNumber: z.string(),
});

export const schemeCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const activitySchema = z.object({
  id: z.number(),
  userId: z.number(),
  username: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.number().nullable(),
  details: z.string().nullable(),
  timestamp: z.date(),
});

// Insert schemas (for creating new records)
export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertTransactionSchema = transactionSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  postedAt: true,
  postedBy: true
});

export const insertBudgetSchema = budgetSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCategorySchema = categorySchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCostCenterSchema = costCenterSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertVendorSchema = vendorSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSchemeCodeSchema = schemeCodeSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertActivitySchema = activitySchema.omit({ 
  id: true, 
  timestamp: true 
});

// Types
export type User = z.infer<typeof userSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CostCenter = z.infer<typeof costCenterSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
export type SchemeCode = z.infer<typeof schemeCodeSchema>;
export type Activity = z.infer<typeof activitySchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertSchemeCode = z.infer<typeof insertSchemeCodeSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
