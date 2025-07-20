// API service for connecting to the backend server
const API_URL = 'http://localhost:4001/api';
const TRANSACTION_API_URL = 'http://localhost:4002/api'; // Proxy server for transactions

// Flag to track if we've shown the server connection error
let hasShownServerError = false;

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// Check if the server is available
export const checkServerAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    // Fix: Use the correct URL format - remove /api for the root check
    const baseUrl = (API_URL).replace(/\/api\/?$/, '');
    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log("Server availability check succeeded:", response.status);
    return true;
  } catch (error) {
    console.error("Server availability check failed:", error);
    if (!hasShownServerError) {
      hasShownServerError = true;
      alert('Server is not available. Please ensure the backend is running.');
    }
    return false; // Return false instead of throwing an error
  }
};

// Fetch data from API without any localStorage fallback
export const fetchFromAPI = async (endpoint: string, options = {}) => {
  try {
    // Check server availability but don't block if it fails
    let isServerAvailable = true;
    try {
      isServerAvailable = await checkServerAvailability();
    } catch (error) {
      console.warn("Server availability check failed, but continuing with request:", error);
    }
    
    // Ensure endpoint doesn't start with a slash
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    let url = `${API_URL}/${cleanEndpoint}`;
    if (cleanEndpoint.startsWith('transactions')) {
      url = `${TRANSACTION_API_URL}/${cleanEndpoint}`;
    }
    console.log(`Fetching from API: ${url}`, options);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`API response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching from API (${endpoint}):`, error);
    throw error;
  }
};

// Transaction API functions
export const TransactionAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (Object.keys(filters).length > 0) {
      queryParams.set('filters', JSON.stringify(filters));
    }
    const transactions = await fetchFromAPI(`transactions?${queryParams.toString()}`);
    
    // Process transactions to parse paymentDetails JSON
    return transactions.map((transaction: any) => {
      // Parse paymentDetails if it exists and is a string
      if (transaction.paymentDetails && typeof transaction.paymentDetails === 'string') {
        try {
          transaction.paymentDetails = JSON.parse(transaction.paymentDetails);
        } catch (e) {
          console.error('Error parsing paymentDetails:', e);
          transaction.paymentDetails = null;
        }
      }
      return transaction;
    });
  },
  
  getById: async (id: number) => {
    const transaction = await fetchFromAPI(`transactions/${id}`);
    
    // Parse paymentDetails if it exists and is a string
    if (transaction.paymentDetails && typeof transaction.paymentDetails === 'string') {
      try {
        transaction.paymentDetails = JSON.parse(transaction.paymentDetails);
      } catch (e) {
        console.error('Error parsing paymentDetails:', e);
        transaction.paymentDetails = null;
      }
    }
    
    return transaction;
  },
  
  create: async (transaction: any) => {
    return fetchFromAPI('transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },
  
  update: async (id: number, transaction: any) => {
    return fetchFromAPI(`transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`transactions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cost Center API functions
export const CostCenterAPI = {
  getAll: async () => {
    return fetchFromAPI('costCenters');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`costCenters/${id}`);
  },
  
  create: async (costCenter: any) => {
    return fetchFromAPI('costCenters', {
      method: 'POST',
      body: JSON.stringify(costCenter),
    });
  },
  
  update: async (id: number, costCenter: any) => {
    return fetchFromAPI(`costCenters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(costCenter),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`costCenters/${id}`, {
      method: 'DELETE',
    });
  },
};

// Vendor API functions
export const VendorAPI = {
  getAll: async () => {
    return fetchFromAPI('vendors');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`vendors/${id}`);
  },
  
  create: async (vendor: any) => {
    return fetchFromAPI('vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  },
  
  update: async (id: number, vendor: any) => {
    return fetchFromAPI(`vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendor),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`vendors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Scheme Code API functions
export const SchemeCodeAPI = {
  getAll: async () => {
    return fetchFromAPI('schemeCodes');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`schemeCodes/${id}`);
  },
  
  create: async (schemeCode: any) => {
    return fetchFromAPI('schemeCodes', {
      method: 'POST',
      body: JSON.stringify(schemeCode),
    });
  },
  
  update: async (id: number, schemeCode: any) => {
    return fetchFromAPI(`schemeCodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schemeCode),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`schemeCodes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Category API functions
export const CategoryAPI = {
  getAll: async () => {
    return fetchFromAPI('categories');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`categories/${id}`);
  },
  
  create: async (category: any) => {
    return fetchFromAPI('categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },
  
  update: async (id: number, category: any) => {
    return fetchFromAPI(`categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Budget API functions
export const BudgetAPI = {
  getAll: async () => {
    console.log("BudgetAPI.getAll called");
    try {
      const result = await fetchFromAPI('budgets');
      console.log("BudgetAPI.getAll result:", result);
      return result;
    } catch (error) {
      console.error("BudgetAPI.getAll error:", error);
      throw error;
    }
  },
  
  getById: async (id: number) => {
    console.log(`BudgetAPI.getById(${id}) called`);
    try {
      const result = await fetchFromAPI(`budgets/${id}`);
      console.log(`BudgetAPI.getById(${id}) result:`, result);
      return result;
    } catch (error) {
      console.error(`BudgetAPI.getById(${id}) error:`, error);
      throw error;
    }
  },
  
  create: async (budget: any) => {
    console.log("BudgetAPI.create called with:", budget);
    try {
      const result = await fetchFromAPI('budgets', {
        method: 'POST',
        body: JSON.stringify(budget),
      });
      console.log("BudgetAPI.create result:", result);
      return result;
    } catch (error) {
      console.error("BudgetAPI.create error:", error);
      throw error;
    }
  },
  
  update: async (id: number, budget: any) => {
    console.log(`BudgetAPI.update(${id}) called with:`, budget);
    try {
      const result = await fetchFromAPI(`budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(budget),
      });
      console.log(`BudgetAPI.update(${id}) result:`, result);
      return result;
    } catch (error) {
      console.error(`BudgetAPI.update(${id}) error:`, error);
      throw error;
    }
  },
  
  delete: async (id: number) => {
    console.log(`BudgetAPI.delete(${id}) called`);
    try {
      const result = await fetchFromAPI(`budgets/${id}`, {
        method: 'DELETE',
      });
      console.log(`BudgetAPI.delete(${id}) result:`, result);
      return result;
    } catch (error) {
      console.error(`BudgetAPI.delete(${id}) error:`, error);
      throw error;
    }
  },
};

// User API functions
export const UserAPI = {
  getAll: async () => {
    return fetchFromAPI('users');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`users/${id}`);
  },
  
  create: async (user: any) => {
    return fetchFromAPI('users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  
  update: async (id: number, user: any) => {
    return fetchFromAPI(`users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Activity API functions
export const ActivityAPI = {
  getAll: async () => {
    return fetchFromAPI('activities');
  },
  
  getRecent: async (limit = 5) => {
    return fetchFromAPI(`activities/recent?limit=${limit}`);
  },
  
  create: async (activity: any) => {
    return fetchFromAPI('activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },
};

// Expense Reports API functions
export const ExpenseReportsAPI = {
  getAll: async () => {
    return fetchFromAPI('expense-reports');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`expense-reports/${id}`);
  },
  
  create: async (report: any) => {
    return fetchFromAPI('expense-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },
  
  update: async (id: number, report: any) => {
    return fetchFromAPI(`expense-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`expense-reports/${id}`, {
      method: 'DELETE',
    });
  },
};

// Object Codes API functions
export const ObjectCodeAPI = {
  getAll: async () => {
    return fetchFromAPI('objectCodes');
  },
  
  getById: async (id: number) => {
    return fetchFromAPI(`objectCodes/${id}`);
  },
  
  create: async (objectCode: any) => {
    return fetchFromAPI('objectCodes', {
      method: 'POST',
      body: JSON.stringify(objectCode),
    });
  },
  
  update: async (id: number, objectCode: any) => {
    return fetchFromAPI(`objectCodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(objectCode),
    });
  },
  
  delete: async (id: number) => {
    return fetchFromAPI(`objectCodes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bill Numbers API functions
export const BillNumbersAPI = {
  getAll: async () => {
    return fetchFromAPI('bill-numbers');
  },
  
  getByObjectCode: async (objectCode: string) => {
    return fetchFromAPI(`bill-numbers/${objectCode}`);
  },
  
  create: async (billNumber: any) => {
    return fetchFromAPI('bill-numbers', {
      method: 'POST',
      body: JSON.stringify(billNumber),
    });
  },
  
  update: async (objectCode: string, billNumber: any) => {
    return fetchFromAPI(`bill-numbers/${objectCode}`, {
      method: 'PUT',
      body: JSON.stringify(billNumber),
    });
  },
  
  delete: async (objectCode: string) => {
    return fetchFromAPI(`bill-numbers/${objectCode}`, {
      method: 'DELETE',
    });
  },
};

// Export all APIs individually
export const API = {
  transactions: TransactionAPI,
  costCenters: CostCenterAPI,
  objectCodes: ObjectCodeAPI,
  budgets: BudgetAPI,
  vendors: VendorAPI,
  schemeCodes: SchemeCodeAPI,
  users: UserAPI,
  activities: ActivityAPI,
  expenseReports: ExpenseReportsAPI,
  billNumbers: BillNumbersAPI,
  categories: CategoryAPI,
  settings: {
    getAll: async () => {
      return fetchFromAPI('settings');
    },
    save: async (data: any) => {
      return fetchFromAPI('settings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  }
};

// Export as default for those who prefer to import the whole API object
export default API;
