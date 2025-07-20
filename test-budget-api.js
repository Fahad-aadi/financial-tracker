// Test script to diagnose budget API issues
const fs = require('fs');
const path = require('path');
const http = require('http');

// Function to read the current budgets file
function readBudgets() {
  try {
    const dataPath = path.join(__dirname, 'server', 'data', 'budgets.json');
    console.log('Reading budgets from:', dataPath);
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    } else {
      console.log('Budgets file does not exist');
      return [];
    }
  } catch (error) {
    console.error('Error reading budgets file:', error);
    return [];
  }
}

// Function to write to the budgets file directly
function writeBudgets(budgets) {
  try {
    const dataPath = path.join(__dirname, 'server', 'data', 'budgets.json');
    console.log('Writing budgets to:', dataPath);
    
    // Ensure directory exists
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(budgets, null, 2), 'utf8');
    console.log('Successfully wrote budgets to file');
    return true;
  } catch (error) {
    console.error('Error writing budgets file:', error);
    return false;
  }
}

// Function to make an HTTP request to the API
function makeApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api/${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test the budget API
async function testBudgetApi() {
  console.log('=== TESTING BUDGET API ===');
  
  // Step 1: Check current budgets
  console.log('\n1. Reading current budgets from file:');
  const currentBudgets = readBudgets();
  console.log(`Found ${currentBudgets.length} budgets in the file`);
  
  // Step 2: Test GET /api/budgets
  console.log('\n2. Testing GET /api/budgets:');
  try {
    const getBudgetsResult = await makeApiRequest('GET', 'budgets');
    console.log(`Status code: ${getBudgetsResult.statusCode}`);
    console.log(`Received ${getBudgetsResult.data.length} budgets from API`);
  } catch (error) {
    console.error('Error testing GET /api/budgets:', error);
  }
  
  // Step 3: Create a test budget
  console.log('\n3. Creating a test budget:');
  const testBudget = {
    name: "TEST-BUDGET",
    amount: 100000,
    spent: 0,
    remaining: 100000,
    period: "yearly",
    categoryId: 1,
    categoryName: "Test Category",
    costCenter: "TEST-CC",
    costCenterName: "Test Cost Center",
    objectCode: "TEST-OC",
    financialYear: "2024-2025"
  };
  
  try {
    const createBudgetResult = await makeApiRequest('POST', 'budgets', testBudget);
    console.log(`Status code: ${createBudgetResult.statusCode}`);
    console.log('Created budget:', createBudgetResult.data);
    
    // Step 4: Verify the budget was added to the file
    console.log('\n4. Verifying budget was added to file:');
    const updatedBudgets = readBudgets();
    const foundBudget = updatedBudgets.find(b => b.name === "TEST-BUDGET");
    console.log(`Found ${updatedBudgets.length} budgets in the file after creation`);
    console.log('Found the test budget in the file:', !!foundBudget);
    
    if (foundBudget) {
      console.log('Test budget details:', foundBudget);
    }
  } catch (error) {
    console.error('Error creating test budget:', error);
  }
  
  // Step 5: Test direct file writing
  console.log('\n5. Testing direct file writing:');
  const directTestBudget = {
    id: 999,
    name: "DIRECT-TEST-BUDGET",
    amount: 200000,
    spent: 0,
    remaining: 200000,
    period: "yearly",
    categoryId: 1,
    categoryName: "Direct Test Category",
    costCenter: "DIRECT-TEST-CC",
    costCenterName: "Direct Test Cost Center",
    objectCode: "DIRECT-TEST-OC",
    financialYear: "2024-2025",
    createdAt: new Date().toISOString()
  };
  
  const currentBudgetsForDirectTest = readBudgets();
  currentBudgetsForDirectTest.push(directTestBudget);
  const writeResult = writeBudgets(currentBudgetsForDirectTest);
  console.log('Direct write result:', writeResult);
  
  // Step 6: Verify direct write
  console.log('\n6. Verifying direct write:');
  const afterDirectWriteBudgets = readBudgets();
  const foundDirectBudget = afterDirectWriteBudgets.find(b => b.name === "DIRECT-TEST-BUDGET");
  console.log(`Found ${afterDirectWriteBudgets.length} budgets in the file after direct write`);
  console.log('Found the direct test budget in the file:', !!foundDirectBudget);
  
  if (foundDirectBudget) {
    console.log('Direct test budget details:', foundDirectBudget);
  }
  
  console.log('\n=== BUDGET API TEST COMPLETE ===');
}

// Run the test
testBudgetApi();
