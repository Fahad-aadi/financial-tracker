import React, { useState, useEffect } from 'react';
import './BudgetAllocationPlan.css';
import { API, ObjectCodeAPI } from '../services/api';

interface ObjectCode {
  id: number;
  code: string;
  description: string;
}

interface CostCenter {
  id: number;
  code: string;
  name: string;
}

interface BudgetAllocation {
  id: number;
  objectCode: string;
  codeDescription: string;
  costCenter: string;
  financialYear: string;
  totalAllocation: number;
  q1Release: number;
  q2Release: number;
  q3Release: number;
  q4Release: number;
  dateCreated: string;
}

const BudgetAllocationPlan: React.FC = () => {
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [financialYears, setFinancialYears] = useState<string[]>(['2024-25', '2025-26', '2026-27']);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [formData, setFormData] = useState({
    objectCode: '',
    costCenter: '',
    financialYear: '',
    totalAllocation: '',
    releaseStrategy: 'quarterly-equal', // Options: quarterly-equal, quarterly-custom, full
    q1Release: '',
    q2Release: '',
    q3Release: '',
    q4Release: ''
  });
  
  // Edit state
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let objectCodesData = [];
        try {
          objectCodesData = await ObjectCodeAPI.getAll();
        } catch (err) {
          console.error('Error fetching object codes from API:', err);
        }
        // Fallback to localStorage if API returns nothing
        if (!Array.isArray(objectCodesData) || objectCodesData.length === 0) {
          const storedObjectCodes = localStorage.getItem('objectCodes');
          if (storedObjectCodes) {
            objectCodesData = JSON.parse(storedObjectCodes);
            console.warn('Using object codes from localStorage as fallback.');
          } else {
            objectCodesData = [
              { id: 1, code: 'A01101', description: 'Basic Pay of Officers' },
              { id: 2, code: 'A01151', description: 'Basic Pay of Officials' },
              { id: 3, code: 'A03201', description: 'Postage and Telegraph' },
              { id: 4, code: 'A03770', description: 'Consultancy and Contractual work - Others' }
            ];
            console.warn('Using default object codes as fallback.');
          }
        }
        setObjectCodes(objectCodesData);
        const [costCentersData, allocationsData] = await Promise.all([
          API.costCenters.getAll(),
          API.budgets.getAll() // Change to a dedicated allocations endpoint if available
        ]);
        setCostCenters(Array.isArray(costCentersData) ? costCentersData : []);
        setAllocations(Array.isArray(allocationsData) ? allocationsData : []);
      } catch (err) {
        
        setObjectCodes([]);
        setCostCenters([]);
        setAllocations([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalAllocation' && formData.releaseStrategy === 'quarterly-equal') {
      // If total allocation changes and we're using equal quarterly distribution
      const totalValue = parseFloat(value) || 0;
      const quarterlyAmount = (totalValue / 4).toFixed(2);
      
      setFormData({
        ...formData,
        [name]: value,
        q1Release: quarterlyAmount,
        q2Release: quarterlyAmount,
        q3Release: quarterlyAmount,
        q4Release: quarterlyAmount
      });
    } else if (name === 'releaseStrategy') {
      if (value === 'quarterly-equal') {
        // If switching to equal quarterly distribution
        const totalValue = parseFloat(formData.totalAllocation) || 0;
        const quarterlyAmount = (totalValue / 4).toFixed(2);
        
        setFormData({
          ...formData,
          [name]: value,
          q1Release: quarterlyAmount,
          q2Release: quarterlyAmount,
          q3Release: quarterlyAmount,
          q4Release: quarterlyAmount
        });
      } else if (value === 'full') {
        // If switching to full release
        const totalValue = parseFloat(formData.totalAllocation) || 0;
        
        setFormData({
          ...formData,
          [name]: value,
          q1Release: totalValue.toFixed(2),
          q2Release: '0',
          q3Release: '0',
          q4Release: '0'
        });
      } else {
        // For custom, just update the strategy
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      // For all other fields, just update normally
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const validateForm = () => {
    // Check required fields
    if (!formData.objectCode || !formData.costCenter || !formData.financialYear || !formData.totalAllocation) {
      alert('Please fill in all required fields');
      return false;
    }
    
    // Check if total allocation is a valid number
    const totalAllocation = parseFloat(formData.totalAllocation);
    if (isNaN(totalAllocation) || totalAllocation <= 0) {
      alert('Total allocation must be a positive number');
      return false;
    }
    
    // For custom quarterly release, validate each quarter
    if (formData.releaseStrategy === 'quarterly-custom') {
      const q1 = parseFloat(formData.q1Release) || 0;
      const q2 = parseFloat(formData.q2Release) || 0;
      const q3 = parseFloat(formData.q3Release) || 0;
      const q4 = parseFloat(formData.q4Release) || 0;
      
      const totalReleased = q1 + q2 + q3 + q4;
      
      if (Math.abs(totalReleased - totalAllocation) > 0.01) {
        alert(`The sum of quarterly releases (${totalReleased.toFixed(2)}) must equal the total allocation (${totalAllocation.toFixed(2)})`);
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const formattedData = {
      ...formData,
      id: editingAllocation ? editingAllocation.id : Date.now(),
      totalAllocation: parseFloat(formData.totalAllocation),
      q1Release: parseFloat(formData.q1Release),
      q2Release: parseFloat(formData.q2Release),
      q3Release: parseFloat(formData.q3Release),
      q4Release: parseFloat(formData.q4Release),
      codeDescription: objectCodes.find(code => code.code === formData.objectCode)?.description || '',
      dateCreated: new Date().toISOString().split('T')[0]
    };
    try {
      let updatedAllocations;
      if (editingAllocation) {
        await API.budgets.update(formattedData.id, formattedData);
        updatedAllocations = allocations.map(a => a.id === formattedData.id ? formattedData : a);
      } else {
        const created = await API.budgets.create(formattedData);
        updatedAllocations = [...allocations, created];
      }
      setAllocations(updatedAllocations);
      setShowAllocationForm(false);
      setEditingAllocation(null);
    } catch (err) {
      alert('Failed to save allocation. Please try again.');
    }
  };
  
  const handleEdit = (allocation: BudgetAllocation) => {
    setEditingAllocation(allocation);
    
    // Determine release strategy
    let releaseStrategy = 'quarterly-custom';
    const quarterAmount = allocation.totalAllocation / 4;
    
    if (
      Math.abs(allocation.q1Release - quarterAmount) < 0.01 &&
      Math.abs(allocation.q2Release - quarterAmount) < 0.01 &&
      Math.abs(allocation.q3Release - quarterAmount) < 0.01 &&
      Math.abs(allocation.q4Release - quarterAmount) < 0.01
    ) {
      releaseStrategy = 'quarterly-equal';
    } else if (
      Math.abs(allocation.q1Release - allocation.totalAllocation) < 0.01 &&
      allocation.q2Release === 0 &&
      allocation.q3Release === 0 &&
      allocation.q4Release === 0
    ) {
      releaseStrategy = 'full';
    }
    
    setFormData({
      objectCode: allocation.objectCode,
      costCenter: allocation.costCenter,
      financialYear: allocation.financialYear,
      totalAllocation: allocation.totalAllocation.toString(),
      releaseStrategy,
      q1Release: allocation.q1Release.toString(),
      q2Release: allocation.q2Release.toString(),
      q3Release: allocation.q3Release.toString(),
      q4Release: allocation.q4Release.toString()
    });
    
    setShowAllocationForm(true);
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        await API.budgets.delete(id);
        setAllocations(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        alert('Failed to delete allocation. Please try again.');
      }
    }
  };
  
  const handleCreateBudgetRelease = async (allocation: any, quarter: number) => {
    // Calculate the release amount based on the quarter
    let releaseAmount = 0;
    let quarterName = '';
    
    switch (quarter) {
      case 1:
        releaseAmount = allocation.q1Release;
        quarterName = '1st Quarter';
        break;
      case 2:
        releaseAmount = allocation.q2Release;
        quarterName = '2nd Quarter';
        break;
      case 3:
        releaseAmount = allocation.q3Release;
        quarterName = '3rd Quarter';
        break;
      case 4:
        releaseAmount = allocation.q4Release;
        quarterName = '4th Quarter';
        break;
    }
    
    if (releaseAmount <= 0) {
      alert('This quarter has no budget to release');
      return;
    }
    
    // Find cost center name
    const costCenter = costCenters.find(center => center.code === allocation.costCenter);
    
    // Create a budget entry for the database
    const newEntry = {
      objectCode: allocation.objectCode,
      name: allocation.objectCode,
      amount: releaseAmount,
      spent: 0,
      remaining: releaseAmount,
      period: 'quarterly',
      categoryId: 1,
      categoryName: allocation.codeDescription,
      costCenter: allocation.costCenter,
      costCenterName: costCenter?.name || '',
      financialYear: allocation.financialYear,
      description: `Budget release for ${quarterName} of ${allocation.financialYear}`
    };
    
    try {
      console.log('Creating budget release in database:', newEntry);
      
      // Save to database via API
      const response = await fetch('http://localhost:4001/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save budget release: ${errorText}`);
      }
      
      const savedBudget = await response.json();
      console.log('Budget release saved to database:', savedBudget);
      
      // For backward compatibility, also update localStorage
      // This can be removed in the future when fully migrated to SQLite
      const storedBudgetEntries = localStorage.getItem('budgetEntries');
      let budgetEntries = [];
      
      if (storedBudgetEntries) {
        budgetEntries = JSON.parse(storedBudgetEntries);
      }
      
      // Add a unique ID to the entry for localStorage
      const localStorageEntry = {
        id: Date.now(),
        objectCode: allocation.objectCode,
        codeDescription: allocation.codeDescription,
        costCenter: allocation.costCenter,
        costCenterName: costCenter?.name || '',
        amountAllocated: allocation.totalAllocation,
        budgetReleased: releaseAmount,
        financialYear: allocation.financialYear,
        period: 'quarterly',
        remarks: `Budget release for ${quarterName} of ${allocation.financialYear}`,
        dateCreated: new Date().toISOString().split('T')[0]
      };
      
      budgetEntries.push(localStorageEntry);
      localStorage.setItem('budgetEntries', JSON.stringify(budgetEntries));
      
      // Also update the budgets list in localStorage for backward compatibility
      const storedBudgets = localStorage.getItem('budgets');
      let budgets = [];
      
      if (storedBudgets) {
        budgets = JSON.parse(storedBudgets);
      }
      
      // Check if there's already a budget for this object code and cost center
      const existingBudgetIndex = budgets.findIndex((budget: any) => 
        budget.name === allocation.objectCode && 
        budget.costCenter === allocation.costCenter &&
        budget.financialYear === allocation.financialYear
      );
      
      if (existingBudgetIndex >= 0) {
        // Update existing budget
        const existingBudget = budgets[existingBudgetIndex];
        existingBudget.amount = allocation.totalAllocation;
        existingBudget.spent += 0; // You would update this with actual spending
        existingBudget.remaining = allocation.totalAllocation - existingBudget.spent;
        
        budgets[existingBudgetIndex] = existingBudget;
      } else {
        // Create new budget
        const newBudget = {
          id: Date.now(),
          name: allocation.objectCode,
          amount: allocation.totalAllocation,
          spent: 0,
          remaining: allocation.totalAllocation,
          period: 'quarterly',
          categoryId: 1,
          categoryName: allocation.codeDescription,
          costCenter: allocation.costCenter,
          costCenterName: costCenter?.name || '',
          financialYear: allocation.financialYear
        };
        
        budgets.push(newBudget);
      }
      
      localStorage.setItem('budgets', JSON.stringify(budgets));
      
      alert(`Budget of Rs. ${releaseAmount.toLocaleString()} released for ${quarterName}`);
    } catch (error: any) {
      console.error('Error creating budget release:', error);
      alert(`Failed to release budget: ${error.message || 'Unknown error'}`);
    }
  };
  
  if (isLoading) {
    return <div className="loading">Loading budget allocation plan...</div>;
  }
  
  return (
    <div className="budget-allocation-container">
      <div className="budget-allocation-header">
        <h1>Budget Allocation Plan</h1>
        <button 
          className="add-button"
          onClick={() => setShowAllocationForm(true)}
        >
          Create New Allocation
        </button>
      </div>
      
      {showAllocationForm && (
        <div className="allocation-form-overlay">
          <div className="allocation-form-container">
            <div className="form-header">
              <h2>{editingAllocation ? 'Edit Budget Allocation' : 'Create New Budget Allocation'}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowAllocationForm(false);
                  setEditingAllocation(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Object Code</label>
                  <select
                    name="objectCode"
                    value={formData.objectCode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Object Code</option>
                    {objectCodes.map(code => (
                      <option key={code.id} value={code.code}>
                        {code.code} - {code.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Cost Center</label>
                  <select
                    name="costCenter"
                    value={formData.costCenter}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Cost Center</option>
                    {costCenters.map(center => (
                      <option key={center.id} value={center.code}>
                        {center.code} - {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Financial Year</label>
                  <select
                    name="financialYear"
                    value={formData.financialYear}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Financial Year</option>
                    {financialYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Total Allocation (Rs.)</label>
                  <input
                    type="number"
                    name="totalAllocation"
                    value={formData.totalAllocation}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Release Strategy</label>
                <select
                  name="releaseStrategy"
                  value={formData.releaseStrategy}
                  onChange={handleInputChange}
                  required
                >
                  <option value="quarterly-equal">Equal Quarterly Release</option>
                  <option value="quarterly-custom">Custom Quarterly Release</option>
                  <option value="full">Full Release (First Quarter)</option>
                </select>
              </div>
              
              {formData.releaseStrategy !== 'full' && (
                <div className="form-row quarters">
                  <div className="form-group">
                    <label>Q1 Release (Rs.)</label>
                    <input
                      type="number"
                      name="q1Release"
                      value={formData.q1Release}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      readOnly={formData.releaseStrategy === 'quarterly-equal'}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Q2 Release (Rs.)</label>
                    <input
                      type="number"
                      name="q2Release"
                      value={formData.q2Release}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      readOnly={formData.releaseStrategy === 'quarterly-equal'}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Q3 Release (Rs.)</label>
                    <input
                      type="number"
                      name="q3Release"
                      value={formData.q3Release}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      readOnly={formData.releaseStrategy === 'quarterly-equal'}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Q4 Release (Rs.)</label>
                    <input
                      type="number"
                      name="q4Release"
                      value={formData.q4Release}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      readOnly={formData.releaseStrategy === 'quarterly-equal'}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAllocationForm(false);
                    setEditingAllocation(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingAllocation ? 'Update Allocation' : 'Create Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {allocations.length === 0 ? (
        <div className="no-data">
          <p>No budget allocations found. Click "Create New Allocation" to add your first budget allocation plan.</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Object Code</th>
                <th>Description</th>
                <th>Cost Center</th>
                <th>Financial Year</th>
                <th>Total Allocation</th>
                <th>Q1 Release</th>
                <th>Q2 Release</th>
                <th>Q3 Release</th>
                <th>Q4 Release</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(allocation => (
                <tr key={allocation.id}>
                  <td>{allocation.objectCode}</td>
                  <td>{allocation.codeDescription}</td>
                  <td>{allocation.costCenter}</td>
                  <td>{allocation.financialYear}</td>
                  <td className="amount">Rs. {allocation.totalAllocation.toLocaleString()}</td>
                  <td className="amount">
                    Rs. {allocation.q1Release.toLocaleString()}
                    {allocation.q1Release > 0 && (
                      <button 
                        className="release-button"
                        onClick={() => handleCreateBudgetRelease(allocation, 1)}
                        title="Release Q1 Budget"
                      >
                        Release
                      </button>
                    )}
                  </td>
                  <td className="amount">
                    Rs. {allocation.q2Release.toLocaleString()}
                    {allocation.q2Release > 0 && (
                      <button 
                        className="release-button"
                        onClick={() => handleCreateBudgetRelease(allocation, 2)}
                        title="Release Q2 Budget"
                      >
                        Release
                      </button>
                    )}
                  </td>
                  <td className="amount">
                    Rs. {allocation.q3Release.toLocaleString()}
                    {allocation.q3Release > 0 && (
                      <button 
                        className="release-button"
                        onClick={() => handleCreateBudgetRelease(allocation, 3)}
                        title="Release Q3 Budget"
                      >
                        Release
                      </button>
                    )}
                  </td>
                  <td className="amount">
                    Rs. {allocation.q4Release.toLocaleString()}
                    {allocation.q4Release > 0 && (
                      <button 
                        className="release-button"
                        onClick={() => handleCreateBudgetRelease(allocation, 4)}
                        title="Release Q4 Budget"
                      >
                        Release
                      </button>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-button edit"
                      onClick={() => handleEdit(allocation)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDelete(allocation.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BudgetAllocationPlan;
