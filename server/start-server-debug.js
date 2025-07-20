console.log('=== Starting Financial Tracker Server (Debug Mode) ===');
console.log('Current directory:', process.cwd());

// Load environment variables first
require('dotenv').config();
console.log('Environment variables loaded');

// Import required modules
try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const path = require('path');
  const fs = require('fs');
  const sqlite3 = require('sqlite3').verbose();
  
  console.log('Core modules imported successfully');
  
  // Import database module
  console.log('Importing database module...');
  const db = require('./database');
  console.log('Database module imported successfully');
  
  // Create Express app
  const app = express();
  const PORT = process.env.PORT || 4001;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());
  
  console.log('Middleware configured');
  
  // Test route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // API Routes
  console.log('Setting up API routes...');
  app.use('/api/schemeCodes', require('./routes/schemeCodes'));
  app.use('/api/objectCodes', require('./routes/objectCodes'));
  app.use('/api/vendors', require('./routes/vendors'));
  app.use('/api/costCenters', require('./routes/costCenters'));
  app.use('/api/budget-allocations', require('./routes/budgets'));

  console.log('Routes configured');
  
  // Start the server
  console.log(`\nStarting server on port ${PORT}...`);
  const server = app.listen(PORT, '0.0.0.0', () => {
    try {
      const { address, port } = server.address();
      const host = address === '::' ? 'localhost' : address;
      
      console.log('\n=== Server Started Successfully ===');
      console.log(`Server URL: http://${host}:${port}`);
      console.log(`API Base URL: http://${host}:${port}/api`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Process ID: ${process.pid}`);
      console.log('\nPress Ctrl+C to stop the server\n');
      
      // Test the server immediately
      console.log('Testing server with a simple request...');
      const http = require('http');
      const testReq = http.get(`http://localhost:${port}/api/health`, (testRes) => {
        let data = '';
        testRes.on('data', (chunk) => { data += chunk; });
        testRes.on('end', () => {
          console.log('Server test response:', {
            statusCode: testRes.statusCode,
            headers: testRes.headers,
            data: data
          });
        });
      });
      
      testReq.on('error', (err) => {
        console.error('Server test failed:', err);
      });
      
    } catch (error) {
      console.error('Error in server startup callback:', error);
    }
  });
  
  // Handle server errors
  server.on('error', (error) => {
    console.error('\n=== Server Error ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.error('Please stop any other servers using this port and try again.');
    }
    
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server has been stopped');
      process.exit(0);
    });
    
    // Force shutdown after 5 seconds
    setTimeout(() => {
      console.error('Forcing shutdown...');
      process.exit(1);
    }, 5000);
  });
  
} catch (error) {
  console.error('\n=== Fatal Error ===');
  console.error('Error during server startup:');
  console.error('Name:', error.name);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
