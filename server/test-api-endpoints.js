const http = require('http');
const { promisify } = require('util');

// Configuration
const API_BASE_URL = 'http://localhost:4000/api';

// Helper function to make HTTP requests
async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      ...options,
      port: 4000 // Using port 4000 to match the server
    };
    
    console.log(`\nMaking ${options.method} request to ${options.hostname}:4000${options.path}`);
    if (data) {
      console.log('Request data:', JSON.stringify(data, null, 2));
    }
    
    const req = http.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
          console.log('Response headers:', JSON.stringify(res.headers, null, 2));
          
          let parsedData;
          if (responseData) {
            try {
              parsedData = JSON.parse(responseData);
              console.log('Response data:', JSON.stringify(parsedData, null, 2));
            } catch (e) {
              console.log('Response (raw):', responseData);
            }
          }
          
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData || responseData
          };
          
          resolve(response);
        } catch (error) {
          console.error('Error processing response:', error);
          reject(new Error(`Failed to process response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testGetSchemeCodes() {
  console.log('\n=== Testing GET /api/schemeCodes ===');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/schemeCodes',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function testCreateSchemeCode() {
  console.log('\n=== Testing POST /api/schemeCodes ===');
  try {
    const testCode = `TEST-${Date.now()}`;
    const response = await makeRequest(
      {
        hostname: 'localhost',
        port: 4000,
        path: '/api/schemeCodes',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      {
        code: testCode,
        name: `Test Scheme ${new Date().toISOString()}`
      }
    );
    
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 201) {
      return response.data.id; // Return the ID for cleanup
    }
    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function testDeleteSchemeCode(id) {
  if (!id) return true;
  
  console.log(`\n=== Testing DELETE /api/schemeCodes/${id} ===`);
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/schemeCodes/${id}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('Starting API endpoint tests...');
  
  // Test GET /api/schemeCodes
  const getTestPassed = await testGetSchemeCodes();
  
  // Test POST /api/schemeCodes
  const createdId = await testCreateSchemeCode();
  
  // Test DELETE /api/schemeCodes/:id (cleanup)
  let deleteTestPassed = true;
  if (createdId) {
    deleteTestPassed = await testDeleteSchemeCode(createdId);
  } else {
    console.log('Skipping DELETE test - no record was created');
    deleteTestPassed = false;
  }
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`GET /api/schemeCodes: ${getTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`POST /api/schemeCodes: ${createdId ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`DELETE /api/schemeCodes/:id: ${deleteTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (getTestPassed && createdId && deleteTestPassed) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
