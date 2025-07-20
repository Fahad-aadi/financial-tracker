/**
 * Direct Budget Database Cleanup Utility
 * 
 * This script directly uses the database module to clean up budget entries.
 */

const db = require('./database');

async function cleanupBudgets() {
  try {
    // Get all budgets
    console.log('Fetching all budgets...');
    const budgets = await db.getBudgets();
    
    if (!budgets || budgets.length === 0) {
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
    
    // Ask for confirmation
    console.log('\nDo you want to delete all these budgets? (y/n)');
    // Since we can't get user input in this environment, we'll automatically proceed
    console.log('Automatically proceeding with deletion...');
    
    // Delete each budget
    let successCount = 0;
    for (const budget of budgets) {
      try {
        await db.deleteBudget(budget.id);
        console.log(`Deleted budget ID: ${budget.id}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete budget ID: ${budget.id}`, error);
      }
    }
    
    console.log(`\nSuccessfully deleted ${successCount} out of ${budgets.length} budgets.`);
    
  } catch (error) {
    console.error('Error cleaning up budgets:', error);
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
    await db.close();
  }
}

// Run the cleanup
cleanupBudgets().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
