const axios = require('axios');

const API_BASE_URL = 'http://localhost:4005/api';

async function testSchemeCodeEndpoints() {
  try {
    console.log('=== Testing Scheme Code Endpoints ===');
    
    // Test 1: Create a new scheme code
    console.log('\n1. Creating a new scheme code...');
    const newSchemeCode = {
      code: 'TEST001',
      name: 'Test Scheme Code',
      description: 'This is a test scheme code'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/schemeCodes`, newSchemeCode);
    console.log('Create response:', createResponse.data);
    const schemeCodeId = createResponse.data.data.id;
    
    // Test 2: Get all scheme codes
    console.log('\n2. Getting all scheme codes...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/schemeCodes`);
    console.log('All scheme codes:', JSON.stringify(getAllResponse.data, null, 2));
    
    // Test 3: Get scheme code by ID
    console.log(`\n3. Getting scheme code with ID ${schemeCodeId}...`);
    const getByIdResponse = await axios.get(`${API_BASE_URL}/schemeCodes/${schemeCodeId}`);
    console.log('Scheme code by ID:', getByIdResponse.data);
    
    // Test 4: Update scheme code
    console.log('\n4. Updating the scheme code...');
    const updatedSchemeCode = {
      code: 'TEST001-UPDATED',
      name: 'Updated Test Scheme Code',
      description: 'This is an updated test scheme code'
    };
    
    const updateResponse = await axios.put(
      `${API_BASE_URL}/schemeCodes/${schemeCodeId}`, 
      updatedSchemeCode
    );
    console.log('Update response:', updateResponse.data);
    
    // Test 5: Delete scheme code
    console.log('\n5. Deleting the scheme code...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/schemeCodes/${schemeCodeId}`);
    console.log('Delete response:', deleteResponse.data);
    
    // Verify deletion
    try {
      console.log('\n6. Verifying deletion...');
      await axios.get(`${API_BASE_URL}/schemeCodes/${schemeCodeId}`);
      console.error('Error: Scheme code still exists after deletion');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Success: Scheme code was deleted');
      } else {
        console.error('Error verifying deletion:', error.message);
      }
    }
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test failed:', error.response ? 
      `Status: ${error.response.status} - ${error.response.data.error || error.message}` : 
      error.message);
    process.exit(1);
  }
}

// Start the tests
testSchemeCodeEndpoints();
