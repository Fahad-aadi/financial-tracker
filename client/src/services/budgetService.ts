// Budget Service for checking available funds
import { API } from './api';

// Interface for budget data from API
interface Budget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  period: string;
  categoryId: number;
  categoryName: string;
  costCenter?: string;
  costCenterName?: string;
  objectCode?: string;
  financialYear?: string;
  // Snake case versions for API compatibility
  cost_center?: string;
  object_code?: string;
  financial_year?: string;
}

// Interface for expense report
interface ExpenseReport {
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

// Function to check if funds are available for a transaction
export const checkFundsAvailability = async (
  costCenterId: number,
  objectCode: string,
  amount: number,
  financialYear: string
): Promise<{ available: boolean; availableAmount: number; message: string }> => {
  try {
    // Try to fetch from API first
    const isServerAvailable = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001'}`, {
      method: 'HEAD',
    }).then(() => true).catch(() => false);
    
    if (isServerAvailable) {
      console.log("Server is available, fetching budgets from API");
      // Get budget data from API
      const budgets = await API.budgets.getAll();
      console.log("Budgets from API:", budgets);
      
      // Find the budget for this cost center, object code and financial year
      const budget = budgets.find(
        (b: Budget) => {
          const objectCodeMatch = b.objectCode === objectCode || b.object_code === objectCode || b.name === objectCode;
          const financialYearMatch = b.financialYear === financialYear || b.financial_year === financialYear;
          const costCenterMatch = b.costCenter === String(costCenterId) || b.cost_center === String(costCenterId);
          
          console.log(`Budget ${b.id} match: objectCode=${objectCodeMatch}, financialYear=${financialYearMatch}, costCenter=${costCenterMatch}`);
          return objectCodeMatch && financialYearMatch && costCenterMatch;
        }
      );
      
      console.log("Matching budget:", budget);
      
      if (!budget) {
        return {
          available: false,
          availableAmount: 0,
          message: `No budget allocated for this Cost Center (${costCenterId}) and Object Code (${objectCode}) for Financial Year ${financialYear}.`
        };
      }
      
      // Use remaining as available funds
      const availableFunds = budget.remaining || 0;
      
      // Check if enough funds are available
      if (availableFunds < amount) {
        return {
          available: false,
          availableAmount: availableFunds,
          message: `Insufficient funds. Available: Rs. ${availableFunds.toLocaleString()}, Required: Rs. ${amount.toLocaleString()}.`
        };
      }
      
      return {
        available: true,
        availableAmount: availableFunds,
        message: `Funds available. Current balance: Rs. ${availableFunds.toLocaleString()} out of Rs. ${budget.amount.toLocaleString()} allocated.`
      };
    } else {
      console.log("Server is not available, using localStorage fallback");
      // Fallback to localStorage
      const storedBudgets = localStorage.getItem('budgets');
      if (!storedBudgets) {
        return {
          available: true, // Default to true if no budget data is available
          availableAmount: 0,
          message: 'Budget data not available. Proceeding without budget check.'
        };
      }
      
      const budgets = JSON.parse(storedBudgets);
      console.log("Budgets from localStorage:", budgets);
      
      // Find the budget for this cost center, object code and financial year
      const budget = budgets.find(
        (b: any) => 
          (b.costCenterId === costCenterId || b.costCenter === String(costCenterId)) && 
          (b.objectCode === objectCode || b.name === objectCode) && 
          b.financialYear === financialYear
      );
      
      console.log("Matching budget from localStorage:", budget);
      
      if (!budget) {
        return {
          available: false,
          availableAmount: 0,
          message: `No budget allocated for this Cost Center (${costCenterId}) and Object Code (${objectCode}) for Financial Year ${financialYear}.`
        };
      }
      
      // Use available or remaining property depending on what's available
      const availableFunds = budget.available || budget.remaining || 0;
      
      // Check if enough funds are available
      if (availableFunds < amount) {
        return {
          available: false,
          availableAmount: availableFunds,
          message: `Insufficient funds. Available: Rs. ${availableFunds.toLocaleString()}, Required: Rs. ${amount.toLocaleString()}.`
        };
      }
      
      return {
        available: true,
        availableAmount: availableFunds,
        message: `Funds available. Current balance: Rs. ${availableFunds.toLocaleString()}.`
      };
    }
  } catch (error) {
    console.error("Error checking funds availability:", error);
    return {
      available: true, // Default to true in case of errors
      availableAmount: 0,
      message: 'Error checking budget. Proceeding without budget check.'
    };
  }
};

// Function to update budget after a transaction is posted
export const updateBudgetAfterTransaction = async (
  costCenterId: number,
  objectCode: string,
  amount: number,
  financialYear: string
): Promise<boolean> => {
  try {
    // Try to fetch from API first
    const isServerAvailable = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001'}`, {
      method: 'HEAD',
    }).then(() => true).catch(() => false);
    
    if (isServerAvailable) {
      // Get budget data from API
      const budgets = await API.budgets.getAll();
      
      // Find the budget for this cost center, object code and financial year
      const budget = budgets.find(
        (b: Budget) => {
          const objectCodeMatch = b.objectCode === objectCode || b.object_code === objectCode || b.name === objectCode;
          const financialYearMatch = b.financialYear === financialYear || b.financial_year === financialYear;
          const costCenterMatch = b.costCenter === String(costCenterId) || b.cost_center === String(costCenterId);
          
          console.log(`Budget ${b.id} match: objectCode=${objectCodeMatch}, financialYear=${financialYearMatch}, costCenter=${costCenterMatch}`);
          return objectCodeMatch && financialYearMatch && costCenterMatch;
        }
      );
      
      if (!budget) {
        console.error('No budget found to update');
        return false;
      }
      
      // Update existing budget
      await API.budgets.update(budget.id, {
        ...budget,
        spent: budget.spent + amount,
        remaining: budget.remaining - amount
      });
      
      // Update expense report
      await updateExpenseReport(costCenterId, objectCode, amount, financialYear);
      
      return true;
    } else {
      // Fallback to localStorage
      const storedBudgets = localStorage.getItem('budgets');
      let budgets = storedBudgets ? JSON.parse(storedBudgets) : [];
      
      // Find the budget for this cost center, object code and financial year
      const budgetIndex = budgets.findIndex(
        (b: any) => 
          (b.costCenterId === costCenterId || b.costCenter === String(costCenterId)) && 
          (b.objectCode === objectCode || b.name === objectCode) && 
          b.financialYear === financialYear
      );
      
      if (budgetIndex === -1) {
        console.error('No budget found to update');
        return false;
      }
      
      // Update existing budget
      budgets[budgetIndex] = {
        ...budgets[budgetIndex],
        spent: budgets[budgetIndex].spent + amount,
        remaining: budgets[budgetIndex].remaining - amount
      };
      
      localStorage.setItem('budgets', JSON.stringify(budgets));
      
      // Update expense report
      await updateExpenseReport(costCenterId, objectCode, amount, financialYear);
      
      return true;
    }
  } catch (error) {
    console.error('Error updating budget after transaction:', error);
    return false;
  }
};

// Function to update expense report
export const updateExpenseReport = async (
  costCenterId: number,
  objectCode: string,
  amount: number,
  financialYear: string
): Promise<boolean> => {
  try {
    // Try to fetch from API first
    const isServerAvailable = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001'}`, {
      method: 'HEAD',
    }).then(() => true).catch(() => false);
    
    if (isServerAvailable) {
      // Get expense reports from API
      const reports = await API.expenseReports.getAll();
      
      // Find the report for this cost center, object code and financial year
      const report = reports.find(
        (r: ExpenseReport) => 
          r.costCenterId === costCenterId && 
          r.objectCode === objectCode && 
          r.financialYear === financialYear
      );
      
      if (!report) {
        // Create a new report if one doesn't exist
        // First get the budget to get total budget and released amounts
        const budgets = await API.budgets.getAll();
        const budget = budgets.find(
          (b: Budget) => {
            const objectCodeMatch = b.objectCode === objectCode || b.object_code === objectCode || b.name === objectCode;
            const financialYearMatch = b.financialYear === financialYear || b.financial_year === financialYear;
            const costCenterMatch = b.costCenter === String(costCenterId) || b.cost_center === String(costCenterId);
            
            console.log(`Budget ${b.id} match: objectCode=${objectCodeMatch}, financialYear=${financialYearMatch}, costCenter=${costCenterMatch}`);
            return objectCodeMatch && financialYearMatch && costCenterMatch;
          }
        );
        
        if (!budget) {
          console.error('No budget found to create expense report');
          return false;
        }
        
        await API.expenseReports.create({
          costCenterId,
          objectCode,
          financialYear,
          totalBudget: budget.amount,
          totalReleased: budget.amount,
          totalExpense: amount,
          remainingBudget: budget.amount - amount,
          lastUpdated: new Date()
        });
      } else {
        // Update existing report
        await API.expenseReports.update(report.id, {
          ...report,
          totalExpense: report.totalExpense + amount,
          remainingBudget: report.remainingBudget - amount,
          lastUpdated: new Date()
        });
      }
      
      return true;
    } else {
      // Fallback to localStorage
      const storedReports = localStorage.getItem('expenseReports');
      let reports = storedReports ? JSON.parse(storedReports) : [];
      
      // Find the report for this cost center, object code and financial year
      const reportIndex = reports.findIndex(
        (r: ExpenseReport) => 
          r.costCenterId === costCenterId && 
          r.objectCode === objectCode && 
          r.financialYear === financialYear
      );
      
      if (reportIndex === -1) {
        // Create a new report if one doesn't exist
        // First get the budget to get total budget and released amounts
        const storedBudgets = localStorage.getItem('budgets');
        const budgets = storedBudgets ? JSON.parse(storedBudgets) : [];
        const budget = budgets.find(
          (b: any) => 
            (b.costCenterId === costCenterId || b.costCenter === String(costCenterId)) && 
            (b.objectCode === objectCode || b.name === objectCode) && 
            b.financialYear === financialYear
        );
        
        if (!budget) {
          console.error('No budget found to create expense report');
          return false;
        }
        
        reports.push({
          id: Date.now(),
          costCenterId,
          objectCode,
          financialYear,
          totalBudget: budget.amount,
          totalReleased: budget.amount,
          totalExpense: amount,
          remainingBudget: budget.amount - amount,
          lastUpdated: new Date()
        });
      } else {
        // Update existing report
        reports[reportIndex] = {
          ...reports[reportIndex],
          totalExpense: reports[reportIndex].totalExpense + amount,
          remainingBudget: reports[reportIndex].remainingBudget - amount,
          lastUpdated: new Date()
        };
      }
      
      localStorage.setItem('expenseReports', JSON.stringify(reports));
      
      return true;
    }
  } catch (error) {
    console.error('Error updating expense report:', error);
    return false;
  }
};
