import React, { useState, useEffect } from 'react';
import './Transactions.css';
import EnhancedTransactionForm from './EnhancedTransactionForm';
import { API, checkServerAvailability   } from '../services/api';
import PaymentStatusForm from './PaymentStatusForm';
import PrintableForms from './PrintableForms';

interface PaymentDetails {
  chequeNumber: string;
  chequeDate: string;
  chequeAmount: string;
  remarks: string;
}

interface Transaction {
  id: number;
  type: string;
  date: string;
  description: string;
  amount: number;
  categoryId?: number;
  costCenterId?: number;
  vendorId?: number;
  status: string;
  reference: string;
  paymentDetails?: PaymentDetails;
  [key: string]: any; // Allow for additional properties
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [billNumbers, setBillNumbers] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentPaymentTransaction, setCurrentPaymentTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintableForms, setShowPrintableForms] = useState(false);
  const [printableTransactionData, setPrintableTransactionData] = useState<any>(null);

  useEffect(() => {
    // Fetch transactions from the API
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const data = await API.transactions.getAll();
        setTransactions(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Save transactions to API only, no localStorage
  useEffect(() => {
    // No localStorage saving
  }, [transactions, isLoading]);

  const filteredTransactions = transactions.filter(transaction => {
    // First apply the type filter
    const typeFilterPassed = filter === 'all' || transaction.type === filter;
    
    // Then apply the search filter if there is a search term
    if (!searchTerm.trim()) {
      return typeFilterPassed;
    }
    
    // Search in multiple fields
    const searchTermLower = searchTerm.toLowerCase();
    return typeFilterPassed && (
      transaction.description.toLowerCase().includes(searchTermLower) ||
      transaction.reference.toLowerCase().includes(searchTermLower) ||
      transaction.date.toLowerCase().includes(searchTermLower) ||
      transaction.vendorName?.toLowerCase().includes(searchTermLower) ||
      transaction.objectCode?.toLowerCase().includes(searchTermLower) ||
      transaction.billNumber?.toLowerCase().includes(searchTermLower) ||
      (transaction.amount?.toString() || '').includes(searchTermLower)
    );
  });

  const handleSaveTransaction = async (transaction: any) => {
    try {
      // Prepare transaction data with required fields for display
      const transactionData = {
        ...transaction,
        id: transaction.id || Date.now(),
        type: transaction.type || 'expense',
        description: transaction.objectCode ? `${transaction.objectCode} - ${transaction.objectDescription || ''}` : transaction.description || '',
        reference: transaction.vendorName ? `${transaction.vendorName} - ${transaction.date}` : transaction.reference || '',
        amount: parseFloat(transaction.grossAmount) || 0,
        status: transaction.status || 'pending',
        // Preserve vendor information
        vendorName: transaction.vendorName || '',
        vendorId: transaction.vendorId || null,
        vendorNumber: transaction.vendorNumber || '',
        // Preserve object code information
        objectCode: transaction.objectCode || '',
        objectDescription: transaction.objectDescription || '',
        // Preserve cost center information
        costCenter: transaction.costCenter || '',
        costCenterName: transaction.costCenterName || '',
        // Ensure financial year is preserved
        financialYear: transaction.financialYear || ''
      };
      
      console.log("Saving transaction data:", transactionData);
      
      // Check if server is available
      const isServerAvailable = await checkServerAvailability();
      
      if (isServerAvailable) {
        if (transaction.id) {
          // Update existing transaction
          const updatedTransaction = await API.transactions.update(transaction.id, transactionData);
          console.log("Updated transaction from API:", updatedTransaction);
          
          // Update local state - replace the existing transaction
          setTransactions(prevTransactions => 
            prevTransactions.map(t => t.id === transaction.id ? {
              ...updatedTransaction, 
              vendorName: transaction.vendorName, 
              objectDescription: transaction.objectDescription,
              costCenter: transaction.costCenter,
              costCenterName: transaction.costCenterName,
              objectCode: transaction.objectCode,
              status: transaction.status || 'pending'
            } : t)
          );
        } else {
          // Create new transaction
          const newTransaction = await API.transactions.create(transactionData);
          console.log("New transaction from API:", newTransaction);
          
          // Update local state
          setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
        }
      } else {
        // Server is not available, use API only
        if (transaction.id) {
          // Update existing transaction
          setTransactions(prevTransactions => 
            prevTransactions.map(t => t.id === transaction.id ? transactionData : t)
          );
        } else {
          // Create new transaction with a temporary ID
          // Update local state
          setTransactions(prevTransactions => [...prevTransactions, transactionData]);
        }
      }
      
      // Don't close the form immediately - the PrintableForms component will handle this
      // The form will be closed when the user clicks "Save & Return" in the PrintableForms component
      // setShowTransactionForm(false);
      // setCurrentTransaction(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log("Editing transaction:", transaction);
    
    // Make a deep copy of the transaction to avoid reference issues
    const transactionCopy = JSON.parse(JSON.stringify(transaction));
    
    // Ensure all required fields are present and correctly formatted
    const editData = {
      ...transactionCopy,
      // Convert amount to grossAmount if needed
      grossAmount: transactionCopy.grossAmount || transactionCopy.amount?.toString() || '',
      // Ensure other fields are properly set
      billNature: transactionCopy.billNature || 'NoTax',
      contractType: transactionCopy.contractType || 'Procure',
      // Preserve vendor information
      vendorName: transactionCopy.vendorName || '',
      vendorId: transactionCopy.vendorId || null,
      vendorNumber: transactionCopy.vendorNumber || '',
      // Preserve object code information
      objectCode: transactionCopy.objectCode || '',
      objectDescription: transactionCopy.objectDescription || ''
    };
    
    console.log("Setting current transaction for edit:", editData);
    setCurrentTransaction(editData);
    setShowTransactionForm(true);
    setViewMode(false);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    console.log("Viewing transaction:", transaction);
    
    // Make a deep copy of the transaction to avoid reference issues
    const transactionCopy = JSON.parse(JSON.stringify(transaction));
    
    // Ensure all required fields are present and correctly formatted
    const viewData = {
      ...transactionCopy,
      // Convert amount to grossAmount if needed
      grossAmount: transactionCopy.grossAmount || transactionCopy.amount?.toString() || '',
      // Ensure other fields are properly set
      billNature: transactionCopy.billNature || 'NoTax',
      contractType: transactionCopy.contractType || 'Procure'
    };
    
    console.log("Setting current transaction for view:", viewData);
    setCurrentTransaction(viewData);
    setShowTransactionForm(true);
    setViewMode(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      // Check if server is available
      const isServerAvailable = await checkServerAvailability();
      
      if (isServerAvailable) {
        // Delete from API
        await API.transactions.delete(id);
      }
      
      // Get the transaction to be deleted
      const transactionToDelete = transactions.find(t => t.id === id);
      
      // Update local state
      setTransactions(transactions.filter(t => t.id !== id));
      
      // If the transaction has an object code and bill number, add it to deleted bill numbers
      if (transactionToDelete && transactionToDelete.objectCode && transactionToDelete.billNumber) {
        const objectCode = transactionToDelete.objectCode;
        const billNumberParts = transactionToDelete.billNumber.split('-');
        if (billNumberParts.length === 2) {
          const billNumber = parseInt(billNumberParts[1]);
          
          // Update billNumbers state
          setBillNumbers(prevBillNumbers => {
            const existingIndex = prevBillNumbers.findIndex(bn => bn.objectCode === objectCode);
            
            if (existingIndex >= 0) {
              const updatedBillNumbers = [...prevBillNumbers];
              updatedBillNumbers[existingIndex] = {
                ...updatedBillNumbers[existingIndex],
                deletedNumbers: [...updatedBillNumbers[existingIndex].deletedNumbers, billNumber]
              };
              return updatedBillNumbers;
            }
            return prevBillNumbers;
          });
        }
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowTransactionForm(false);
    setCurrentTransaction(null);
    setViewMode(false);
  };

  const handleStatusClick = (transaction: Transaction) => {
    setCurrentPaymentTransaction(transaction);
    setShowPaymentForm(true);
  };

  const handleSavePayment = async (transactionId: number, paymentDetails: PaymentDetails, status: string) => {
    try {
      console.log(`Saving payment for transaction ${transactionId} with status: ${status}`);
      console.log('Payment details:', paymentDetails);
      
      // Find the transaction to update
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Create a properly updated transaction object with ALL fields from the original transaction
      const transactionToUpdate = {
        ...transaction,
        status: status,
        paymentDetails: paymentDetails,
        // Ensure these fields are explicitly included for the server
        cost_center: transaction.costCenter || transaction.cost_center,
        object_code: transaction.objectCode || transaction.object_code,
        financial_year: transaction.financialYear || transaction.financial_year,
        // Include any other fields that might be needed
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        vendorName: transaction.vendorName,
        objectDescription: transaction.objectDescription,
        costCenterName: transaction.costCenterName
      };
      
      console.log('Updating transaction with:', transactionToUpdate);
      
      // Update the transaction with payment details
      const updatedTransaction = await API.transactions.update(transactionId, transactionToUpdate);
      console.log('Server response:', updatedTransaction);
      
      // Make sure the status and payment details are preserved in the final object
      const finalTransaction = {
        ...updatedTransaction,
        status: status, // Ensure status is set correctly
        paymentDetails: paymentDetails // Ensure payment details are set correctly
      };
      
      console.log('Final transaction to save in state:', finalTransaction);
      
      // Update local state
      setTransactions(prevTransactions => 
        prevTransactions.map(t => t.id === transactionId ? finalTransaction : t)
      );
      
      // Close the payment form
      setShowPaymentForm(false);
      setCurrentPaymentTransaction(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setCurrentPaymentTransaction(null);
  };

  const handleViewPrintableForms = (transaction: Transaction) => {
    // Prepare the transaction data for printing
    const printData = {
      ...transaction,
      // Ensure all required fields are available for printing
      costCenter: transaction.costCenterId || transaction.costCenter,
      objectCode: transaction.objectCode || '',
      vendorName: transaction.vendorName || '',
      grossAmount: transaction.amount.toString(),
      // Set default tax rates if not available
      incomeTaxServiceRate: transaction.incomeTaxServiceRate || '0',
      incomeTaxPurchaseRate: transaction.incomeTaxPurchaseRate || '0',
      generalSalesTaxRate: transaction.generalSalesTaxRate || '0',
      punjabSalesTaxRate: transaction.punjabSalesTaxRate || '0',
      // Set tax amounts
      incomeTaxServiceAmount: transaction.incomeTaxServiceAmount || '0',
      incomeTaxPurchaseAmount: transaction.incomeTaxPurchaseAmount || '0',
      generalSalesTaxAmount: transaction.generalSalesTaxAmount || '0',
      punjabSalesTaxAmount: transaction.punjabSalesTaxAmount || '0',
      stampDuty: transaction.stampDuty || '0',
    };
    
    setPrintableTransactionData(printData);
    setShowPrintableForms(true);
  };

  if (isLoading) {
    return <div className="loading">Loading transactions...</div>;
  }

  return (
    <div className="transactions-container">
      <h2>Transactions</h2>
      
      {/* Show PrintableForms if showPrintableForms is true */}
      {showPrintableForms && printableTransactionData && (
        <PrintableForms
          transactionData={printableTransactionData}
          onClose={() => setShowPrintableForms(false)}
          onSaveAndReturn={() => setShowPrintableForms(false)}
        />
      )}
      
      {!showPrintableForms && (
        <div>
          <div className="transactions-header">
            <div className="transactions-header-top">
              <h1>Transactions</h1>
              <button 
                className="add-transaction-button"
                onClick={() => {
                  setCurrentTransaction(null);
                  setShowTransactionForm(true);
                  setViewMode(false);
                }}
              >
                Add Transaction
              </button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="transactions-actions">
              <div className="filter-controls">
                <label>Filter:</label>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {showTransactionForm ? (
            <EnhancedTransactionForm
              onSave={handleSaveTransaction}
              onCancel={handleCancelForm}
              editTransaction={currentTransaction}
              viewMode={viewMode}
            />
          ) : showPaymentForm && currentPaymentTransaction ? (
            <PaymentStatusForm
              transactionId={currentPaymentTransaction.id}
              onSave={handleSavePayment}
              onCancel={handleCancelPayment}
              currentStatus={currentPaymentTransaction.status}
              currentPaymentDetails={currentPaymentTransaction.paymentDetails}
            />
          ) : (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Net Amount</th>
                    <th>Cheque/MPG No.</th>
                    <th>Cheque/MPG Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.date}</td>
                      <td>{transaction.description}</td>
                      <td>{transaction.reference}</td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`amount ${transaction.type}`}>
                        Rs. {(transaction.amount || 0).toLocaleString()}
                      </td>
                      <td className="net-amount">
                        Rs. {(transaction.netAmount || transaction.amount || 0).toLocaleString()}
                      </td>
                      <td>{transaction.paymentDetails?.chequeNumber || '-'}</td>
                      <td>{transaction.paymentDetails?.chequeDate || '-'}</td>
                      <td>
                        <button
                          className={`status-button ${transaction.status || 'pending'}`}
                          onClick={() => handleStatusClick(transaction)}
                        >
                          {transaction.status === 'pending' ? 'Pending' : 
                           transaction.status === 'cheque-issued' ? 'Cheque Issued' :
                           transaction.status === 'cheque-prepared' ? 'Cheque Prepared' :
                           transaction.status || 'Pending'}
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="action-button edit"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button view"
                          onClick={() => handleViewTransaction(transaction)}
                        >
                          View
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this transaction?')) {
                              handleDeleteTransaction(transaction.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                        <button 
                          className="action-button print"
                          onClick={() => handleViewPrintableForms(transaction)}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;
