const http = require('http');

const testEndpoints = [
  {
    method: 'GET',
    path: '/api/test-db',
    name: 'Database Connection Test'
  },
  {
    method: 'GET',
    path: '/api/schemeCodes',
    name: 'Get Scheme Codes'
  },
  {
    method: 'POST',
    path: '/api/schemeCodes',
    name: 'Create Scheme Code',
    body: JSON.stringify({
      code: `TEST${Date.now()}`,
      name: `Test Scheme ${new Date().toISOString()}`
    })
  }
];

async function testEndpoint({ method, path, name, body }) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(10)} ${name} ${'='.repeat(10)}`);
    console.log(`Testing ${method} ${path}`);
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (data) {
            const parsed = JSON.parse(data);
            console.log('Response:', JSON.stringify(parsed, null, 2));
          }
        } catch (e) {
          console.log('Response (raw):', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
      resolve();
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('Starting API Tests...');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\nAll tests completed!');
}

runTests().catch(console.error);
