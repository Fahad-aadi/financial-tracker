const express = require('express');
const app = express();
const PORT = 4005;

// Simple test route
app.get('/api/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ status: 'ok', message: 'Test route working' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Test this endpoint: GET /api/test');
});
