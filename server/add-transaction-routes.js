/**
 * Script to add transaction routes to the SQLite server
 */
const fs = require('fs');
const path = require('path');

// Path to the SQLite server file
const serverFilePath = path.join(__dirname, 'sqlite-server.js');

// Check if the file exists
if (!fs.existsSync(serverFilePath)) {
  console.error(`Server file not found at: ${serverFilePath}`);
  process.exit(1);
}

// Read the server file
let serverCode = fs.readFileSync(serverFilePath, 'utf8');

// Check if transaction routes already exist
if (serverCode.includes('app.put(\'/api/transactions/:id\'')) {
  console.log('Transaction routes already exist in the server file.');
  process.exit(0);
}

// Find the position to insert the transaction routes
// Look for the last route definition or the server start
const insertPosition = serverCode.lastIndexOf('app.listen(PORT');

if (insertPosition === -1) {
  console.error('Could not find a suitable position to insert the transaction routes.');
  process.exit(1);
}

// Transaction routes to add
const transactionRoutes = `
// Transaction routes
app.get('/api/transactions', async (req, res) => {
  try {
    console.log('GET /api/transactions - Fetching transactions from database');
    
    let transactions;
    const { costCenter, financialYear } = req.query;
    
    if (costCenter && financialYear) {
      transactions = await db.getTransactionsByCostCenterAndFinancialYear(costCenter, financialYear);
    } else if (costCenter) {
      transactions = await db.getTransactionsByCostCenter(costCenter);
    } else if (financialYear) {
      transactions = await db.getTransactionsByFinancialYear(financialYear);
    } else {
      transactions = await db.getTransactions();
    }
    
    console.log(\`Found \${transactions.length} transactions in database\`);
    
    // Parse paymentDetails for each transaction
    const parsedTransactions = transactions.map(transaction => {
      if (transaction.paymentDetails && typeof transaction.paymentDetails === 'string') {
        try {
          transaction.paymentDetails = JSON.parse(transaction.paymentDetails);
        } catch (e) {
          console.error('Error parsing paymentDetails:', e);
        }
      }
      return transaction;
    });
    
    res.json(parsedTransactions);
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
    res.status(500).json({ error: 'Failed to retrieve transactions', details: error.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await db.getTransactionById(id);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Parse paymentDetails if it exists and is a string
    if (transaction.paymentDetails && typeof transaction.paymentDetails === 'string') {
      try {
        transaction.paymentDetails = JSON.parse(transaction.paymentDetails);
      } catch (e) {
        console.error('Error parsing paymentDetails:', e);
      }
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(\`Error in GET /api/transactions/\${req.params.id}:\`, error);
    res.status(500).json({ error: 'Failed to retrieve transaction', details: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    console.log('POST /api/transactions - Received transaction data:', req.body);
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('POST /api/transactions - Empty request body');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    // Prepare transaction data
    const now = new Date().toISOString();
    const transaction = {
      ...req.body,
      status: req.body.status || 'pending',
      createdAt: now
    };
    
    // Convert paymentDetails to JSON string if it exists
    if (transaction.paymentDetails && typeof transaction.paymentDetails !== 'string') {
      transaction.paymentDetails = JSON.stringify(transaction.paymentDetails);
    }
    
    console.log('Creating transaction in database:', transaction);
    const result = await db.createTransaction(transaction);
    
    // Get the created transaction
    const createdTransaction = await db.getTransactionById(result.id);
    
    // Parse paymentDetails back to object if it's a string
    if (createdTransaction.paymentDetails && typeof createdTransaction.paymentDetails === 'string') {
      try {
        createdTransaction.paymentDetails = JSON.parse(createdTransaction.paymentDetails);
      } catch (e) {
        console.error('Error parsing paymentDetails:', e);
      }
    }
    
    console.log('Transaction created successfully:', createdTransaction);
    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error in POST /api/transactions:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if transaction exists
    const existingTransaction = await db.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    console.log(\`PUT /api/transactions/\${id} - Updating transaction\`);
    console.log('Received data:', req.body);
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Convert paymentDetails to JSON string if it exists
    if (updateData.paymentDetails && typeof updateData.paymentDetails !== 'string') {
      updateData.paymentDetails = JSON.stringify(updateData.paymentDetails);
    }
    
    console.log('Updating transaction in database:', updateData);
    await db.updateTransaction(id, updateData);
    
    // Get the updated transaction
    const updatedTransaction = await db.getTransactionById(id);
    
    // Parse paymentDetails back to object if it's a string
    if (updatedTransaction.paymentDetails && typeof updatedTransaction.paymentDetails === 'string') {
      try {
        updatedTransaction.paymentDetails = JSON.parse(updatedTransaction.paymentDetails);
      } catch (e) {
        console.error('Error parsing paymentDetails:', e);
      }
    }
    
    console.log('Transaction updated successfully:', updatedTransaction);
    res.json(updatedTransaction);
  } catch (error) {
    console.error(\`Error in PUT /api/transactions/\${req.params.id}:\`, error);
    res.status(500).json({ error: 'Failed to update transaction', details: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check if transaction exists
    const existingTransaction = await db.getTransactionById(id);
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Delete the transaction
    await db.deleteTransaction(id);
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(\`Error in DELETE /api/transactions/\${req.params.id}:\`, error);
    res.status(500).json({ error: 'Failed to delete transaction', details: error.message });
  }
});
`;

// Insert the transaction routes before the server start
const updatedServerCode = serverCode.slice(0, insertPosition) + transactionRoutes + serverCode.slice(insertPosition);

// Write the updated server code back to the file
fs.writeFileSync(serverFilePath, updatedServerCode, 'utf8');

console.log('Transaction routes successfully added to the SQLite server.');
