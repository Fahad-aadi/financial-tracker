/**
 * Budget Database Cleanup Utility
 * 
 * This script allows you to clean up budget entries from the database.
 * It can delete all budgets or budgets for a specific financial year.
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:4001/api';
const FINANCIAL_YEAR = '2024-25'; // Change this to the financial year you want to clean up

async function getAllBudgets() {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets`);
    if (!response.ok) {
      throw new Error(`Failed to fetch budgets: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
}

async function deleteBudget(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete budget ${id}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Deleted budget ${id}: ${result.message}`);
    return true;
  } catch (error) {
    console.error(`Error deleting budget ${id}:`, error);
    return false;
  }
}

async function deleteAllBudgets() {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete all budgets: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(result.message);
    return true;
  } catch (error) {
    console.error('Error deleting all budgets:', error);
    return false;
  }
}

async function deleteBudgetsByFinancialYear(financialYear) {
  try {
    const response = await fetch(`${API_BASE_URL}/budgets/year/${financialYear}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete budgets for ${financialYear}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(result.message);
    return true;
  } catch (error) {
    console.error(`Error deleting budgets for ${financialYear}:`, error);
    return false;
  }
}

async function displayBudgets() {
  const budgets = await getAllBudgets();
  
  if (budgets.length === 0) {
    console.log('No budgets found in the database.');
    return;
  }
  
  console.log(`Found ${budgets.length} budgets in the database:`);
  
  // Group budgets by financial year
  const budgetsByYear = {};
  
  budgets.forEach(budget => {
    const year = budget.financialYear || budget.financial_year || 'Unknown';
    if (!budgetsByYear[year]) {
      budgetsByYear[year] = [];
    }
    budgetsByYear[year].push(budget);
  });
  
  // Display summary by financial year
  console.log('\nBudgets by Financial Year:');
  Object.keys(budgetsByYear).forEach(year => {
    console.log(`${year}: ${budgetsByYear[year].length} budgets`);
  });
  
  // Display detailed budget information
  console.log('\nDetailed Budget Information:');
  budgets.forEach(budget => {
    console.log(`ID: ${budget.id}, Object Code: ${budget.objectCode || budget.object_code}, Cost Center: ${budget.costCenter || budget.cost_center}, Financial Year: ${budget.financialYear || budget.financial_year}, Amount: ${budget.amount}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'display';
  
  switch (command) {
    case 'display':
      await displayBudgets();
      break;
    
    case 'delete-all':
      console.log('Deleting all budgets...');
      await deleteAllBudgets();
      break;
    
    case 'delete-year':
      const year = args[1] || FINANCIAL_YEAR;
      console.log(`Deleting budgets for financial year ${year}...`);
      // Try the endpoint first
      try {
        await deleteBudgetsByFinancialYear(year);
      } catch (error) {
        // If that fails, try deleting budgets individually
        console.log('Falling back to deleting budgets individually...');
        const budgets = await getAllBudgets();
        const yearBudgets = budgets.filter(b => 
          (b.financialYear === year || b.financial_year === year)
        );
        
        if (yearBudgets.length === 0) {
          console.log(`No budgets found for financial year ${year}.`);
          return;
        }
        
        console.log(`Found ${yearBudgets.length} budgets for financial year ${year}. Deleting...`);
        
        let successCount = 0;
        for (const budget of yearBudgets) {
          const success = await deleteBudget(budget.id);
          if (success) successCount++;
        }
        
        console.log(`Successfully deleted ${successCount} out of ${yearBudgets.length} budgets for financial year ${year}.`);
      }
      break;
    
    default:
      console.log(`
Budget Database Cleanup Utility

Usage:
  node cleanup-budgets.js [command] [options]

Commands:
  display                 Display all budgets in the database (default)
  delete-all              Delete all budgets from the database
  delete-year [year]      Delete all budgets for a specific financial year
                          (defaults to ${FINANCIAL_YEAR})

Examples:
  node cleanup-budgets.js display
  node cleanup-budgets.js delete-all
  node cleanup-budgets.js delete-year 2024-25
      `);
  }
}

main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});
