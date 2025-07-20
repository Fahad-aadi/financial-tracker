import React, { useState, useEffect } from 'react';
import './Budgets.css';
import BudgetForm from './BudgetForm';
import { API } from '../services/api';

interface Budget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  period: string;
  categoryId: number;
  categoryName: string;
  costCenter?: string;
  costCenterName?: string;
  objectCode?: string;
  financialYear?: string;
}

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [currentFinancialYear, setCurrentFinancialYear] = useState('2024-25');

  useEffect(() => {
    const storedFinancialYear = localStorage.getItem('financialYear');
    if (storedFinancialYear) {
      setCurrentFinancialYear(storedFinancialYear);
    }
    
    const fetchBudgets = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching budgets in Budgets component");
        
        // First, try a direct fetch to the API
        try {
          const directResponse = await fetch('http://localhost:4001/api/budgets');
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log("Direct budget fetch successful:", directData);
            
            if (Array.isArray(directData) && directData.length > 0) {
              console.log(`Found ${directData.length} budgets directly from API`);
              directData.forEach((budget, index) => {
                console.log(`Budget ${index}:`, budget);
              });
              
              // Use the direct data
              setBudgets(directData);
              setIsLoading(false);
              return;
            }
          } else {
            console.error("Direct budget fetch failed:", directResponse.status);
          }
        } catch (directError: any) {
          console.error("Error in direct budget fetch:", directError);
        }
        
        // If direct fetch fails, try the API service
        console.log("Trying API service for budgets");
        const data = await API.budgets.getAll();
        console.log("Budgets fetched through API in Budgets component:", data);
        
        if (Array.isArray(data)) {
          setBudgets(data);
        } else {
          console.error("API returned non-array data:", data);
          setBudgets([]);
        }
      } catch (err: any) {
        console.error("Error fetching budgets:", err);
        setBudgets([]);
      }
      setIsLoading(false);
    };
    
    fetchBudgets();
  }, []);

  // More flexible filtering to handle different budget formats
  const filteredBudgets = budgets.filter(budget => {
    // First, log the budget to see its structure
    console.log("Filtering budget:", budget);
    
    // Check if budget has the necessary fields
    if (!budget || typeof budget !== 'object') {
      console.log("Invalid budget object:", budget);
      return false;
    }
    
    // More flexible period matching
    const periodMatch = 
      budget.period === 'yearly' || 
      (budget.period === undefined); // Default to yearly if period is not specified
    
    console.log(`Budget ${budget.name || budget.objectCode} period: ${budget.period}, match: ${periodMatch}`);
    return periodMatch;
  });

  const calculatePercentage = (spent: number, total: number) => {
    return Math.round((spent / total) * 100);
  };

  const handleOpenBudgetForm = () => {
    setEditBudget(null);
    setShowBudgetForm(true);
  };

  const handleCloseBudgetForm = () => {
    setShowBudgetForm(false);
  };

  const handleAddBudget = async (budgetData: any) => {
    try {
      console.log("Received budget data from form:", budgetData);
      
      // Parse the amount to a number
      const amount = parseFloat(budgetData.amountAllocated);
      if (isNaN(amount)) {
        console.error("Invalid amount:", budgetData.amountAllocated);
        alert("Please enter a valid amount.");
        return;
      }
      
      // Format the budget data for the API
      const newBudget = {
        name: budgetData.objectCode,
        amount: amount,
        spent: 0,
        remaining: amount,
        period: 'yearly', // Default to yearly
        categoryId: 1,
        categoryName: budgetData.codeDescription,
        costCenter: budgetData.costCenter, 
        costCenterName: budgetData.costCenterName,
        objectCode: budgetData.objectCode, 
        financialYear: budgetData.financialYear || currentFinancialYear
      };
      console.log("Formatted budget data to save:", newBudget);
      
      // Direct fetch to see if API is working
      try {
        console.log("Sending direct fetch request to budget API");
        const directResponse = await fetch('http://localhost:4001/api/budgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBudget)
        });
        
        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error("Direct budget save error:", directResponse.status, errorText);
          throw new Error(`API error: ${directResponse.status} - ${errorText}`);
        }
        
        const directResult = await directResponse.json();
        console.log("Direct budget save result:", directResult);
        console.log(" Budget created successfully with ID:", directResult.id);
        
        // Add the new budget to the state
        setBudgets(prev => [...prev, directResult]);
        
        // Show success message
        alert(`Budget for ${directResult.objectCode} successfully created and released!`);
        
        // Refresh the budgets list to ensure we have the latest data
        console.log("Refreshing budgets list");
        const updatedBudgets = await API.budgets.getAll();
        console.log("Updated budgets after save:", updatedBudgets);
        setBudgets(Array.isArray(updatedBudgets) ? updatedBudgets : []);
        
        return directResult;
      } catch (directError: any) {
        console.error("Direct budget save error:", directError);
        alert(`Failed to create budget: ${directError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error adding budget:", error);
      alert(`Failed to add budget: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditBudget(budget);
    setShowBudgetForm(true);
  };

  const handleDeleteBudget = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await API.budgets.delete(id);
        setBudgets(prev => prev.filter(budget => budget.id !== id));
      } catch (err: any) {
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const handleViewBudgetDetails = (budget: Budget) => {
    alert(`Budget Details for ${budget.name}:\n\nAmount: Rs. ${budget.amount.toLocaleString()}\nSpent: Rs. ${budget.spent.toLocaleString()}\nRemaining: Rs. ${budget.remaining.toLocaleString()}\nFinancial Year: ${budget.financialYear}\nCost Center: ${budget.costCenter}`);
  };

  if (isLoading) {
    return <div className="loading">Loading budgets...</div>;
  }

  return (
    <div className="budgets-container">
      <div className="budgets-header">
        <h1>Budgets</h1>
        <div className="actions">
          <button className="add-button" onClick={handleOpenBudgetForm}>Create Budget</button>
          {/* Period selector buttons removed as all budgets are now yearly */}
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="no-budgets">
          <p>No budgets found. Click "Create Budget" to add your first budget.</p>
        </div>
      ) : (
        <div className="budgets-table">
          <table>
            <thead>
              <tr>
                <th>Object Code</th>
                <th>Description</th>
                <th>Cost Center</th>
                <th>Financial Year</th>
                <th>Amount Allocated</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map(budget => {
                const percentage = calculatePercentage(budget.spent, budget.amount);
                const statusClass = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'good';
                
                return (
                  <tr key={budget.id}>
                    <td>{budget.name}</td>
                    <td>{budget.categoryName}</td>
                    <td>{budget.costCenter || 'N/A'}</td>
                    <td>{budget.financialYear || currentFinancialYear}</td>
                    <td className="amount">Rs. {budget.amount.toLocaleString()}</td>
                    <td className="amount">Rs. {budget.spent.toLocaleString()}</td>
                    <td className={`amount ${budget.remaining <= 0 ? 'danger' : ''}`}>
                      Rs. {budget.remaining.toLocaleString()}
                    </td>
                    <td>
                      <div className="status-indicator">
                        <div className="status-bar">
                          <div 
                            className={`status-fill ${statusClass}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="status-text">{percentage}% used</span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button className="action-button edit" onClick={() => handleEditBudget(budget)}>Edit</button>
                      <button className="action-button view" onClick={() => handleViewBudgetDetails(budget)}>View</button>
                      <button className="action-button delete" onClick={() => handleDeleteBudget(budget.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showBudgetForm && (
        <BudgetForm 
          onClose={handleCloseBudgetForm} 
          onSave={handleAddBudget}
          editBudget={editBudget}
        />
      )}
    </div>
  );
};

export default Budgets;
