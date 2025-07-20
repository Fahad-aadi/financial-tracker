import React, { useState, useEffect } from 'react';
import { API, checkServerAvailability   } from '../services/api';
import { checkFundsAvailability } from '../services/budgetService';
import './BudgetCheck.css';

interface BudgetCheckProps {
  costCenterId: number | null;
  objectCode: string;
  amount: number;
  financialYear: string;
  onValidityChange: (isValid: boolean) => void;
}

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
  cost_center?: string;
  object_code?: string;
  financial_year?: string;
}

const BudgetCheck: React.FC<BudgetCheckProps> = ({ 
  costCenterId, 
  objectCode, 
  amount, 
  financialYear,
  onValidityChange
}) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    const checkBudget = async () => {
      if (!costCenterId || !objectCode || !financialYear) {
        setBudget(null);
        setError(null);
        setIsValid(true);
        onValidityChange(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`Checking budget for costCenterId: ${costCenterId}, objectCode: ${objectCode}, amount: ${amount}, financialYear: ${financialYear}`);
        
        const result = await checkFundsAvailability(
          costCenterId,
          objectCode,
          amount,
          financialYear
        );
        
        console.log("Budget check result:", result);
        
        setIsValid(result.available);
        if (!result.available) {
          setError(result.message);
        } else {
          setError(null);
        }
        
        const budgets = await API.budgets.getAll();
        console.log("All budgets:", budgets);
        
        const foundBudget = budgets.find((b: Budget) => {
          const objectCodeMatch = b.objectCode === objectCode || b.object_code === objectCode || b.name === objectCode;
          const financialYearMatch = b.financialYear === financialYear || b.financial_year === financialYear;
          const costCenterMatch = b.costCenter === String(costCenterId) || b.cost_center === String(costCenterId);
          
          return objectCodeMatch && financialYearMatch && costCenterMatch;
        });
        
        console.log("Found budget:", foundBudget);
        setBudget(foundBudget || null);
        
      } catch (err) {
        console.error("Error checking budget:", err);
        setError("Error checking budget availability. Please try again.");
        setIsValid(true); 
      } finally {
        setLoading(false);
        onValidityChange(isValid);
      }
    };

    checkBudget();
  }, [costCenterId, objectCode, amount, financialYear, onValidityChange, isValid]);

  if (!costCenterId || !objectCode || !financialYear) {
    return null; 
  }

  return (
    <div className="budget-check">
      <h3>Budget Check</h3>
      
      {loading ? (
        <div className="loading">Checking budget availability...</div>
      ) : error ? (
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      ) : budget ? (
        <div className="budget-info">
          <div className="budget-status valid">
            <i className="fas fa-check-circle"></i> Funds Available
          </div>
          <div className="budget-details">
            <div className="detail">
              <span>Total Budget:</span> Rs. {budget.amount.toLocaleString()}
            </div>
            <div className="detail">
              <span>Spent:</span> Rs. {budget.spent.toLocaleString()}
            </div>
            <div className="detail">
              <span>Available:</span> Rs. {budget.remaining.toLocaleString()}
            </div>
            <div className="detail">
              <span>Required:</span> Rs. {amount.toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-budget">
          No budget information available for this cost center and object code.
        </div>
      )}
    </div>
  );
};

export default BudgetCheck;
