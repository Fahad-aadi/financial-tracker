import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API, { ObjectCodeAPI, CostCenterAPI, BudgetAPI } from '../services/api';
import './BudgetForm.css';

interface ObjectCode {
  id: number;
  code: string;
  description: string;
}

interface CostCenter {
  id: number;
  name: string;
  code: string;
}

interface BudgetFormProps {
  onClose: () => void;
  onSave: (budget: any) => void;
  editBudget?: any;
}

interface BudgetFormData {
  id?: number;
  objectCode: string;
  costCenter: string;
  amount: string | number;
  remarks: string;
  financialYear: string;
  objectDescription?: string;
  costCenterName?: string;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  onClose, 
  onSave,
  editBudget 
}) => {
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedObjectCode, setSelectedObjectCode] = useState<ObjectCode | null>(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<BudgetFormData>({
    id: editBudget?.id,
    objectCode: editBudget?.objectCode || '',
    costCenter: editBudget?.costCenter || '',
    amount: editBudget?.amount || '',
    remarks: editBudget?.remarks || '',
    financialYear: editBudget?.financialYear || ''
  });

  useEffect(() => {
    // Function to fetch data from API
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch data from the API
        const objectCodesData = await ObjectCodeAPI.getAll();
        const costCentersData = await CostCenterAPI.getAll();
        
        const objectCodesArray = Array.isArray(objectCodesData) ? objectCodesData : [];
        const costCentersArray = Array.isArray(costCentersData) ? costCentersData : [];
        
        console.log('Fetched object codes from database:', objectCodesArray);
        console.log('Fetched cost centers from database:', costCentersArray);
        
        setObjectCodes(objectCodesArray);
        setCostCenters(costCentersArray);
      } catch (err) {
        console.error('Error fetching data from database:', err);
        
        // Fallback to API service if direct fetch fails
        try {
          const objectCodesData = await ObjectCodeAPI.getAll();
          const costCentersData = await CostCenterAPI.getAll();
          
          const objectCodesArray = Array.isArray(objectCodesData) ? objectCodesData : [];
          const costCentersArray = Array.isArray(costCentersData) ? costCentersData : [];
          
          console.log('Fallback: Using object codes from API service:', objectCodesArray);
          console.log('Fallback: Using cost centers from API service:', costCentersArray);
          
          setObjectCodes(objectCodesArray);
          setCostCenters(costCentersArray);
        } catch (apiError) {
          console.error('Error fetching data from API service:', apiError);
          setObjectCodes([]);
          setCostCenters([]);
        }
      }
      
      if (!formData.financialYear) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        let defaultFinancialYear: string;
        if (currentMonth >= 6) {
          defaultFinancialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
        } else {
          defaultFinancialYear = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        }
        setFormData(prev => ({
          ...prev,
          financialYear: defaultFinancialYear
        }));
      }
      setIsLoading(false);
    };
    
    // Initial data fetch
    fetchData();
    
    // Add event listener for settings updated event
    const handleSettingsUpdated = (event: Event) => {
      console.log('Settings updated event detected, refreshing data...');
      
      // Check if the event has detail data
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.type === 'objectCodes' && Array.isArray(customEvent.detail.data)) {
        console.log('Received updated object codes directly:', customEvent.detail.data);
        setObjectCodes(customEvent.detail.data);
      } else {
        // If no detail data or not object codes, fetch all data
        fetchData();
      }
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, [formData.financialYear]);

  useEffect(() => {
    if (formData.objectCode) {
      const code = objectCodes.find(code => code.code === formData.objectCode);
      if (code) {
        setSelectedObjectCode(code);
      }
    }
  }, [formData.objectCode, objectCodes]);

  useEffect(() => {
    if (formData.costCenter) {
      const center = costCenters.find(center => center.code === formData.costCenter);
      if (center) {
        setSelectedCostCenter(center);
      }
    }
  }, [formData.costCenter, costCenters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'objectCode') {
      const code = objectCodes.find(code => code.code === value);
      setSelectedObjectCode(code || null);
    }

    if (name === 'costCenter') {
      const center = costCenters.find(center => center.code === value);
      setSelectedCostCenter(center || null);
    }
  };

  const navigate = useNavigate();
  const isEditing = editBudget !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.objectCode || !formData.costCenter || !formData.amount) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find the object code and cost center details
      const selectedObjectCode = objectCodes.find(code => code.code === formData.objectCode);
      const selectedCostCenter = costCenters.find(center => center.code === formData.costCenter);
      
      // Create the budget object with all necessary details
      const budgetData: BudgetFormData = {
        ...formData,
        objectDescription: selectedObjectCode ? selectedObjectCode.description : '',
        costCenterName: selectedCostCenter ? selectedCostCenter.name : '',
      };
      
      let response;
      
      if (isEditing && formData.id) {
        // Update existing budget
        response = await BudgetAPI.update(formData.id, budgetData);
      } else {
        // Create new budget
        response = await BudgetAPI.create(budgetData);
      }
      
      console.log('Budget saved successfully:', response);
      
      // Dispatch a custom event to notify other components of the changes
      const event = new Event('budgetUpdated');
      window.dispatchEvent(event);
      
      // Redirect to budgets list
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading form data...</div>;
  }

  return (
    <div className="budget-form-overlay">
      <div className="budget-form-container">
        <div className="form-header">
          <h2>{editBudget ? 'Edit Budget' : 'Create New Budget'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>1. Object Code</label>
            <select 
              name="objectCode" 
              value={formData.objectCode} 
              onChange={handleChange}
              required
            >
              <option value="">Select an object code</option>
              {objectCodes.map(code => (
                <option key={code.id} value={code.code}>
                  {code.code}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>2. Code Description</label>
            <input 
              type="text" 
              value={selectedObjectCode?.description || ''} 
              readOnly
              className="code-description"
            />
            <small className="help-text">Description is fetched automatically from the settings based on the selected Object Code</small>
          </div>
          
          <div className="form-group">
            <label>3. Cost Center</label>
            <select 
              name="costCenter" 
              value={formData.costCenter} 
              onChange={handleChange}
              required
            >
              <option value="">Select a cost center</option>
              {costCenters.map(center => (
                <option key={center.id} value={center.code}>
                  {center.code}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>4. Cost Center Name</label>
            <input 
              type="text" 
              value={selectedCostCenter?.name || ''} 
              readOnly
              className="cost-center-name"
            />
            <small className="help-text">Name is fetched automatically from the settings based on the selected Cost Center</small>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>5. Amount (Rs.)</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleChange}
                min="0" 
                step="0.01"
                required
              />
              <small className="help-text">Total yearly budget allocation (not yet released completely)</small>
            </div>
          </div>
          
          <div className="form-group">
            <label>6. Financial Year</label>
            <input 
              type="text" 
              name="financialYear" 
              value={formData.financialYear} 
              onChange={handleChange}
              required
            />
            <small className="help-text">Enter the financial year (e.g., 2022-2023)</small>
          </div>
          
          <div className="form-group">
            <label>7. Remarks</label>
            <textarea 
              name="remarks" 
              value={formData.remarks} 
              onChange={handleChange}
              rows={3}
              placeholder="Enter details about this budget (e.g., 1st Quarter, 2nd Quarter, Supplementary Budget, Budget Surrender, Excess Demanded, etc.)"
            />
            <small className="help-text">Specify the type of budget released during the Financial Year (July to June)</small>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={isSubmitting}>
              {editBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
