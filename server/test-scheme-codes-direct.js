// Enable better error stack traces
require('trace');
require('clarify');

const db = require('./database');

// Add unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Add uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function testSchemeCodeOperations() {
  console.log('=== Testing Scheme Code Operations ===');
  
  try {
    // 1. Create a new scheme code
    console.log('\n1. Creating a new scheme code...');
    const newCode = {
      code: `TEST-${Date.now()}`,
      name: 'Test Scheme Code',
      description: 'This is a test scheme code'
    };
    
    const createdCode = await db.createSchemeCode(newCode);
    console.log('✅ Created scheme code:', createdCode);
    
    // 2. Get scheme code by ID
    console.log('\n2. Getting scheme code by ID...');
    const codeById = await db.getSchemeCodeById(createdCode.id);
    console.log('✅ Found scheme code by ID:', codeById);
    
    // 3. Get scheme code by code
    console.log('\n3. Getting scheme code by code...');
    const codeByCode = await db.getSchemeCodeByCode(createdCode.code);
    console.log('✅ Found scheme code by code:', codeByCode);
    
    // 4. Get all scheme codes
    console.log('\n4. Getting all scheme codes...');
    const allCodes = await db.getSchemeCodes();
    console.log(`✅ Found ${allCodes.length} scheme codes`);
    
    // 5. Update scheme code
    console.log('\n5. Updating scheme code...');
    const updatedCode = {
      code: `${createdCode.code}-UPDATED`,
      name: 'Updated Test Scheme Code'
    };
    const updateResult = await db.updateSchemeCode(createdCode.id, updatedCode);
    console.log('✅ Updated scheme code:', updateResult);
    
    // 6. Delete scheme code
    console.log('\n6. Deleting scheme code...');
    const deleteResult = await db.deleteSchemeCode(createdCode.id);
    console.log('✅ Deleted scheme code:', deleteResult);
    
    // 7. Verify deletion
    console.log('\n7. Verifying deletion...');
    try {
      await db.getSchemeCodeById(createdCode.id);
      console.error('❌ Error: Scheme code still exists after deletion');
    } catch (error) {
      console.log('✅ Success: Scheme code was deleted');
    }
    
    console.log('\n=== All tests completed successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the tests
testSchemeCodeOperations();
