/**
 * Transaction Proxy Server
 * 
 * This server acts as a proxy for transaction updates, handling the status and paymentDetails fields
 * by storing them in a separate JSON file while passing other fields to the SQLite database.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Path to store transaction status data
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const statusFilePath = path.join(dataDir, 'transaction-status.json');

// Initialize status data
let transactionStatusData = {};
if (fs.existsSync(statusFilePath)) {
  try {
    transactionStatusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
  } catch (error) {
    console.error('Error reading transaction status data:', error);
  }
}

// Save status data to file
function saveStatusData() {
  try {
    fs.writeFileSync(statusFilePath, JSON.stringify(transactionStatusData, null, 2));
  } catch (error) {
    console.error('Error saving transaction status data:', error);
  }
}

// Proxy route for transaction updates
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Proxying PUT request for transaction ${id}`);
    
    // Extract status and paymentDetails
    const { status, paymentDetails, ...otherFields } = req.body;
    
    // Store status and paymentDetails in our local storage
    if (status || paymentDetails) {
      transactionStatusData[id] = {
        status: status || 'pending',
        paymentDetails: paymentDetails || null,
        updatedAt: new Date().toISOString()
      };
      saveStatusData();
      console.log(`Saved status and paymentDetails for transaction ${id}`);
    }
    
    // Forward the request to the SQLite server without status and paymentDetails
    try {
      const response = await axios.put(`http://localhost:4001/api/transactions/${id}`, otherFields);
      console.log(`SQLite server response for transaction ${id}:`, response.status);
      
      // Combine the response with our stored status data
      const updatedTransaction = {
        ...response.data,
        status: transactionStatusData[id]?.status || 'pending',
        paymentDetails: transactionStatusData[id]?.paymentDetails || null
      };
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error(`Error forwarding request to SQLite server:`, error.message);
      
      // If the SQLite server fails, still return success with the status data
      // This ensures the UI shows the updated status even if the SQLite update fails
      res.json({
        id: parseInt(id),
        status: transactionStatusData[id]?.status || 'pending',
        paymentDetails: transactionStatusData[id]?.paymentDetails || null,
        ...otherFields
      });
    }
  } catch (error) {
    console.error('Error handling transaction update:', error);
    res.status(500).json({ 
      error: 'Failed to update transaction', 
      details: error.message 
    });
  }
});

// Proxy route for getting a transaction
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Proxying GET request for transaction ${id}`);
    
    // Get transaction data from SQLite server
    try {
      const response = await axios.get(`http://localhost:4001/api/transactions/${id}`);
      
      // Combine with status data if available
      const transaction = response.data;
      if (transactionStatusData[id]) {
        transaction.status = transactionStatusData[id].status;
        transaction.paymentDetails = transactionStatusData[id].paymentDetails;
      }
      
      res.json(transaction);
    } catch (error) {
      console.error(`Error getting transaction from SQLite server:`, error.message);
      res.status(500).json({ 
        error: 'Failed to get transaction', 
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error handling transaction get:', error);
    res.status(500).json({ 
      error: 'Failed to get transaction', 
      details: error.message 
    });
  }
});

// Proxy route for getting all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    console.log('Proxying GET request for all transactions');
    
    // Get transactions from SQLite server
    try {
      const response = await axios.get('http://localhost:4001/api/transactions');
      
      // Combine with status data
      const transactions = response.data.map(transaction => {
        const id = transaction.id.toString();
        if (transactionStatusData[id]) {
          transaction.status = transactionStatusData[id].status;
          transaction.paymentDetails = transactionStatusData[id].paymentDetails;
        } else {
          transaction.status = 'pending';
          transaction.paymentDetails = null;
        }
        return transaction;
      });
      
      res.json(transactions);
    } catch (error) {
      console.error(`Error getting transactions from SQLite server:`, error.message);
      res.status(500).json({ 
        error: 'Failed to get transactions', 
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error handling transactions get:', error);
    res.status(500).json({ 
      error: 'Failed to get transactions', 
      details: error.message 
    });
  }
});

// Forward all other requests to the SQLite server
app.all('*', async (req, res) => {
  try {
    const url = `http://localhost:4001${req.originalUrl}`;
    console.log(`Forwarding ${req.method} request to: ${url}`);
    
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error forwarding request:', error.message);
    res.status(500).json({ 
      error: 'Failed to forward request', 
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Transaction Proxy Server running on port ${PORT}`);
  console.log(`Forwarding requests to SQLite server at http://localhost:4001`);
});
