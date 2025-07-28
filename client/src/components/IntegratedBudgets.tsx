import React, { useState, useEffect } from 'react';
import './Budgets.css';
import './BudgetAllocationPlan.css';

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
  q1Released: boolean;
  q2Released: boolean;
  q3Released: boolean;
  q4Released: boolean;
  dateCreated: string;
  supplementaryGrants: number;
  reAppropriationsIn: number;
  reAppropriationsOut: number;
  surrenders: number;
  objectCodeName?:string;
  costCenterName:string;

}

interface BudgetRelease {
  id: number;
  allocationId: number;
  objectCode: string;
  codeDescription: string;
  costCenter: string;
  costCenterName: string;
  financialYear: string;
  quarter: number;
  amount: number;
  dateReleased: string;
  remarks: string;
  type: 'regular' | 'supplementary' | 'reappropriation' | 'surrender';
}

interface BudgetAdjustment {
  id: number;
  date: string;
  fromObjectCode?: string;
  fromCostCenter?: string;
  toObjectCode?: string;
  toCostCenter?: string;
  amount: number;
  type: 'supplementary' | 'reappropriation' | 'surrender';
  period ?:string;
  remarks: string;
  financialYear: string;
  dateCreated ?:string;
}

const IntegratedBudgets: React.FC = () => {
  // Data states
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [releases, setReleases] = useState<BudgetRelease[]>([]);
  const [adjustments, setAdjustments] = useState<BudgetAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFinancialYear, setCurrentFinancialYear] = useState('2024-25');
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([]);
  const [activePeriod, setActivePeriod] = useState('yearly');
  const [selectedAllocation, setSelectedAllocation] = useState<BudgetAllocation | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);
  const [editingAdjustment, setEditingAdjustment] = useState<BudgetAdjustment | null>(null);
  
  // UI states
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    objectCode: '',
    costCenter: '',
    financialYear: '',
    totalAllocation: '',
    releaseStrategy: 'quarterly-equal', 
    q1Release: '',
    q2Release: '',
    q3Release: '',
    q4Release: ''
  });
  
  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'supplementary',
    fromObjectCode: '',
    fromCostCenter: '',
    toObjectCode: '',
    toCostCenter: '',
    amount: '',
    remarks: '',
    financialYear: ''
  });
  
  // Add state for success and error messages
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
    
    // Try to get the selected financial year from localStorage
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        if (settings && settings.selectedFinancialYear) {
          setCurrentFinancialYear(settings.selectedFinancialYear);
          setFormData(prev => ({ ...prev, financialYear: settings.selectedFinancialYear }));
          setAdjustmentForm(prev => ({ ...prev, financialYear: settings.selectedFinancialYear }));
        }
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    } else {
      // Calculate current financial year based on date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentYear = currentDate.getFullYear();
      
      // Financial year starts from July (month index 6)
      let financialYear: string;
      if (currentMonth >= 6) { // July or later
        financialYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      } else {
        financialYear = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
      }
      
      setCurrentFinancialYear(financialYear);
      setFormData(prev => ({ ...prev, financialYear }));
      setAdjustmentForm(prev => ({ ...prev, financialYear }));
    }
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000); // Clear messages after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch object codes from API
      const objectCodesResponse = await fetch('http://localhost:4001/api/objectCodes');
      if (objectCodesResponse.ok) {
        const objectCodesData = await objectCodesResponse.json();
        setObjectCodes(objectCodesData);
      } else {
        console.error('Failed to fetch object codes from API');
        setObjectCodes([]);
      }
      
      // Fetch cost centers from API
      const costCentersResponse = await fetch('http://localhost:4001/api/costCenters');
      if (costCentersResponse.ok) {
        const costCentersData = await costCentersResponse.json();
        setCostCenters(costCentersData);
      } else {
        console.error('Failed to fetch cost centers from API');
        setCostCenters([]);
      }
      
      // Fetch budget allocations from API
      const allocationsResponse = await fetch('http://localhost:4001/api/budget-allocations');
      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData);
      } else {
        console.error('Failed to fetch budget allocations from API');
        setAllocations([]);
      }
      
      // Fetch budget releases from API
      const releasesResponse = await fetch('http://localhost:4001/api/budget-releases');
      if (releasesResponse.ok) {
        const releasesData = await releasesResponse.json();
        setReleases(releasesData);
      } else {
        console.error('Failed to fetch budget releases from API');
        setReleases([]);
      }
      
      // Fetch budget adjustments from API
      // Note: This will need a new API endpoint to be created
      const adjustmentsResponse = await fetch('http://localhost:4001/api/budget-adjustments');
      if (adjustmentsResponse.ok) {
        const adjustmentsData = await adjustmentsResponse.json();
        setAdjustments(adjustmentsData);
      } else {
        console.error('Failed to fetch budget adjustments from API - endpoint may not exist yet');
        setAdjustments([]);
      }
      
      // Fetch available financial years from API
      const financialYearsResponse = await fetch('http://localhost:4001/api/financial-years');
      if (financialYearsResponse.ok) {
        const financialYearsData = await financialYearsResponse.json();
        setAvailableFinancialYears(financialYearsData);
      } else {
        console.error('Failed to fetch available financial years from API');
        // Set default financial years if API fails
        const defaultYears = ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28'];
        setAvailableFinancialYears(defaultYears);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save allocations to database whenever they change
  useEffect(() => {
    if (allocations.length > 0) {
      console.log('Budget allocations updated in database');
    }
  }, [allocations]);
  
  // Save releases to database whenever they change
  useEffect(() => {
    if (releases.length > 0) {
      console.log('Budget releases updated in database');
    } else {
      console.log('All budget releases have been removed');
    }
  }, [releases]);
  
  // Save adjustments to database whenever they change
  useEffect(() => {
    if (adjustments.length > 0) {
      console.log('Budget adjustments updated in database');
    } else {
      console.log('All budget adjustments have been removed');
    }
  }, [adjustments]);
  
  // Add useEffect to sync budget entries when component mounts and after operations
  useEffect(() => {
    // Sync budget entries with allocations when component mounts
    syncBudgetEntries();
  }, []);

  // Add useEffect to sync budget entries after allocations change
  useEffect(() => {
    if (allocations.length > 0) {
      // Only sync if we have allocations loaded
      syncBudgetEntries();
    }
  }, [allocations.length]);

  // Add useEffect to sync budget entries after any deletion operation
  useEffect(() => {
    // This is a flag to track if we need to sync after a deletion
    const needsSync = localStorage.getItem('needsBudgetSync');
    if (needsSync === 'true') {
      syncBudgetEntries();
      localStorage.removeItem('needsBudgetSync');
    }
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
  
  const handleSubmitAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const totalAllocation = parseFloat(formData.totalAllocation);
    const q1Release = parseFloat(formData.q1Release) || 0;
    const q2Release = parseFloat(formData.q2Release) || 0;
    const q3Release = parseFloat(formData.q3Release) || 0;
    const q4Release = parseFloat(formData.q4Release) || 0;
    
    // Find object code description and cost center name
    const objectCode = objectCodes.find(code => code.code === formData.objectCode);
    const costCenter = costCenters.find(center => center.code === formData.costCenter);
    
    if (editingAllocation) {
      try {
        // Create updated allocation object
        const updatedAllocation = {
          ...editingAllocation,
          objectCode: formData.objectCode,
          codeDescription: objectCode?.description || '',
          costCenter: formData.costCenter,
          costCenterName: costCenter?.name || '',
          financialYear: formData.financialYear,
          totalAllocation,
          q1Release,
          q2Release,
          q3Release,
          q4Release
        };
        
        // Save to database via API
        console.log('Updating budget allocation via API:', updatedAllocation);
        const response = await fetch(`http://localhost:4001/api/budget-allocations/${editingAllocation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedAllocation)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update budget allocation');
        }
        
        const savedAllocation = await response.json();
        console.log('Budget allocation updated in API:', savedAllocation);
        
        // Update the related budget entry
        try {
          // First find the existing budget entry
          const budgetsResponse = await fetch(`http://localhost:4001/api/budgets?objectCode=${formData.objectCode}&costCenter=${formData.costCenter}&financialYear=${formData.financialYear}`);
          const budgetEntries = await budgetsResponse.json();
          
          if (budgetEntries && budgetEntries.length > 0) {
            const budgetEntry = budgetEntries[0];
            
            // Update the budget entry
            const updatedBudget = {
              ...budgetEntry,
              name: formData.objectCode,
              objectCode: formData.objectCode,
              costCenter: formData.costCenter,
              costCenterName: costCenter?.name || '',
              categoryName: objectCode?.description || '',
              financialYear: formData.financialYear,
              amount: totalAllocation,
              remaining: totalAllocation - (budgetEntry.spent || 0)
            };
            
            const budgetUpdateResponse = await fetch(`http://localhost:4001/api/budgets/${budgetEntry.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedBudget)
            });
            
            if (!budgetUpdateResponse.ok) {
              console.warn('Failed to update related budget entry');
            } else {
              console.log('Related budget entry updated successfully');
            }
          } else {
            // Create a new budget entry if one doesn't exist
            const budgetData = {
              name: formData.objectCode,
              objectCode: formData.objectCode,
              costCenter: formData.costCenter,
              costCenterName: costCenter?.name || '',
              categoryName: objectCode?.description || '',
              financialYear: formData.financialYear,
              amount: totalAllocation,
              spent: 0,
              remaining: totalAllocation,
              period: 'yearly',
              categoryId: 1
            };
            
            const budgetCreateResponse = await fetch('http://localhost:4001/api/budgets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(budgetData)
            });
            
            if (!budgetCreateResponse.ok) {
              console.warn('Failed to create budget entry for updated allocation');
            } else {
              console.log('New budget entry created for updated allocation');
            }
          }
        } catch (budgetError) {
          console.error('Error updating related budget entry:', budgetError);
          // Continue even if budget update fails
        }
        
        // Update local state
        setAllocations(allocations.map(allocation => 
          allocation.id === editingAllocation.id ? savedAllocation : allocation
        ));
        
        setSuccess('Budget allocation updated successfully');
        setEditingAllocation(null);
      } catch (error) {
        console.error('Error updating budget allocation:', error);
        setError(`Error updating budget allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Check if allocation already exists for this combination
      const existingAllocation = allocations.find(
        a => a.objectCodeName === formData.objectCode && 
             a.costCenterName === formData.costCenter && 
             a.financialYear === formData.financialYear
      );
      
      if (existingAllocation) {
        setError('A budget allocation already exists for this Object Code, Cost Center, and Financial Year combination.');
        return;
      }
      
      try {
        // Create new allocation object
        const newAllocation: BudgetAllocation = {
          id: 0, // This will be replaced with the server-generated ID
          objectCode: formData.objectCode,
          codeDescription: objectCode?.description || '',
          costCenter: formData.costCenter,
          costCenterName: costCenter?.name || '',
          financialYear: formData.financialYear,
          totalAllocation,
          q1Release,
          q2Release,
          q3Release,
          q4Release,
          q1Released: false,
          q2Released: false,
          q3Released: false,
          q4Released: false,
          dateCreated: formatDate(new Date().toISOString().split('T')[0]),
          supplementaryGrants: 0,
          reAppropriationsIn: 0,
          reAppropriationsOut: 0,
          surrenders: 0
        };
        
        // Save to database via API
        console.log('Saving budget allocation to API:', newAllocation);
        const response = await fetch('http://localhost:4001/api/budget-allocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newAllocation)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save budget allocation');
        }
        
        const savedAllocation = await response.json();
        console.log('Budget allocation saved to API:', savedAllocation);
        
        // Also create a budget entry in the budgets table
        const budgetData = {
          name: formData.objectCode,
          objectCode: formData.objectCode,
          costCenter: formData.costCenter,
          costCenterName: costCenter?.name || '',
          categoryName: objectCode?.description || '',
          financialYear: formData.financialYear,
          amount: totalAllocation,
          spent: 0,
          remaining: totalAllocation,
          period: 'yearly',
          categoryId: 1
        };
        
        console.log('Creating budget entry for allocation:', budgetData);
        const budgetResponse = await fetch('http://localhost:4001/api/budgets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(budgetData)
        });
        
        if (!budgetResponse.ok) {
          console.warn('Failed to create budget entry for allocation');
          // Continue even if budget creation fails
        } else {
          console.log('Budget entry created for allocation');
        }
        
        // Update local state with the server-returned allocation (which has the correct ID)
        setAllocations([...allocations, savedAllocation]);
        setSuccess('Budget allocation created successfully');
      } catch (error) {
        console.error('Error creating budget allocation:', error);
        setError(`Error creating budget allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Reset form
    setFormData({
      objectCode: '',
      costCenter: '',
      financialYear: currentFinancialYear,
      totalAllocation: '',
      releaseStrategy: 'quarterly-equal',
      q1Release: '',
      q2Release: '',
      q3Release: '',
      q4Release: ''
    });
    
    setShowAllocationForm(false);
  };
  
  const handleEditAllocation = (allocation: BudgetAllocation) => {
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
  
  const handleDeleteAllocation = async (id: number) => {
    try {
      // First, check if there are any releases for this allocation
      const allocationToDelete = allocations.find(a => a.id === id);
      if (!allocationToDelete) {
        setError('Allocation not found');
        return;
      }
      
      const relatedReleases = releases.filter(release => 
        release.objectCode === allocationToDelete.objectCode && 
        release.costCenter === allocationToDelete.costCenter &&
        release.financialYear === allocationToDelete.financialYear
      );
      
      // If there are releases, delete them first
      if (relatedReleases.length > 0) {
        for (const release of relatedReleases) {
          await fetch(`http://localhost:4001/api/budget-releases/${release.id}`, {
            method: 'DELETE'
          });
        }
      }
      
      // Now delete the allocation
      const response = await fetch(`http://localhost:4001/api/budget-allocations/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget allocation');
      }
      
      // Set flag to trigger budget entries sync after deletion
      localStorage.setItem('needsBudgetSync', 'true');
      
      // Update state
      setAllocations(allocations.filter(allocation => allocation.id !== id));
      setSuccess('Budget allocation deleted successfully');
      
      // Refresh the data
      fetchAllocations();
      fetchReleases();
      fetchAdjustments();
    } catch (error) {
      console.error('Error deleting budget allocation:', error);
      setError(`Error deleting budget allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRelease = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4001/api/budget-releases/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget release');
      }
      
      // Set flag to trigger budget entries sync after deletion
      localStorage.setItem('needsBudgetSync', 'true');
      
      // Update state
      setReleases(releases.filter(release => release.id !== id));
      setSuccess('Budget release deleted successfully');
      
      // Refresh the data
      fetchReleases();
    } catch (error) {
      console.error('Error deleting budget release:', error);
      setError(`Error deleting budget release: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAdjustment = async (id: number) => {
    try {
      // Get the adjustment to be deleted
      const adjustmentToDelete = adjustments.find(adj => adj.id === id);
      if (!adjustmentToDelete) {
        setError('Adjustment not found');
        return;
      }
      
      // Find related releases
      const relatedReleases = releases.filter(release => 
        release.objectCode === adjustmentToDelete.fromObjectCode && 
        release.costCenter === adjustmentToDelete.fromCostCenter &&
        release.financialYear === adjustmentToDelete.financialYear
      );
      
      // Delete the adjustment
      const response = await fetch(`http://localhost:4001/api/budget-adjustments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete budget adjustment');
      }
      
      // Set flag to trigger budget entries sync after deletion
      localStorage.setItem('needsBudgetSync', 'true');
      
      // Update state
      setAdjustments(adjustments.filter(adjustment => adjustment.id !== id));
      setSuccess('Budget adjustment deleted successfully');
      
      // Refresh the data
      fetchAdjustments();
      fetchReleases();
    } catch (error) {
      console.error('Error deleting budget adjustment:', error);
      setError(`Error deleting budget adjustment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReleaseBudget = async (allocation: BudgetAllocation, quarter: 1 | 2 | 3 | 4) => {
    try {
      // First, fetch the latest allocation data from the server to ensure we have the most up-to-date values
      const response = await fetch(`http://localhost:4001/api/budget-allocations/${allocation.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch the latest allocation data');
      }
      
      const latestAllocation = await response.json();
      console.log('Latest allocation data:', latestAllocation);
      
      // Use the latest allocation data for the release
      allocation = latestAllocation;
      
      // If this allocation is currently selected, update the selected allocation state
      if (selectedAllocation && selectedAllocation.id === allocation.id) {
        setSelectedAllocation(latestAllocation);
      }
      
      // Determine which quarter's amount to release
      let releaseAmount = 0;
      let quarterName = '';
      let quarterProperty = '';
      
      switch (quarter) {
        case 1:
          releaseAmount = allocation.q1Release;
          quarterName = '1st Quarter';
          quarterProperty = 'q1Released';
          break;
        case 2:
          releaseAmount = allocation.q2Release;
          quarterName = '2nd Quarter';
          quarterProperty = 'q2Released';
          break;
        case 3:
          releaseAmount = allocation.q3Release;
          quarterName = '3rd Quarter';
          quarterProperty = 'q3Released';
          break;
        case 4:
          releaseAmount = allocation.q4Release;
          quarterName = '4th Quarter';
          quarterProperty = 'q4Released';
          break;
      }
      
      if (releaseAmount <= 0) {
        setError('This quarter has no budget to release');
        return;
      }
      
      // Check if this quarter has already been released
      if (allocation[quarterProperty as keyof BudgetAllocation] === true) {
        setError(`The budget for ${quarterName} has already been released.`);
        return;
      }
      
      // Update the allocation to mark this quarter as released
      const updatedAllocation = { ...allocation };
      
      // Mark the quarter as released
      if (quarter === 1) updatedAllocation.q1Released = true;
      else if (quarter === 2) updatedAllocation.q2Released = true;
      else if (quarter === 3) updatedAllocation.q3Released = true;
      else if (quarter === 4) updatedAllocation.q4Released = true;
      
      // Update the allocation in the database
      const updateResponse = await fetch(`http://localhost:4001/api/budget-allocations/${allocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAllocation)
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update allocation release status');
      }
      
      const updatedAllocationFromServer = await updateResponse.json();
      
      // Update the allocations list in state
      setAllocations(allocations.map(a => 
        a.id === allocation.id ? updatedAllocationFromServer : a
      ));
      
      // Create a new budget release
      const newRelease: BudgetRelease = {
        id: 0, // This will be replaced with the server-generated ID
        allocationId: allocation.id,
        objectCode: allocation.objectCode,
        codeDescription: allocation.codeDescription,
        costCenter: allocation.costCenter,
        costCenterName: allocation.costCenterName,
        financialYear: allocation.financialYear,
        quarter,
        amount: releaseAmount,
        dateReleased: formatDate(new Date().toISOString().split('T')[0]),
        remarks: `Budget release for ${quarterName}`,
        type: 'regular'
      };
      
      // Save to database via API
      console.log('Saving budget release to API:', newRelease);
      const releaseResponse = await fetch('http://localhost:4001/api/budget-releases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRelease)
      });
      
      if (!releaseResponse.ok) {
        const errorData = await releaseResponse.json();
        throw new Error(errorData.error || 'Failed to save budget release');
      }
      
      const savedRelease = await releaseResponse.json();
      console.log('Budget release saved to API:', savedRelease);
      
      // Also create a budget entry in the budgets table
      const budgetData = {
        name: allocation.objectCode,
        objectCode: allocation.objectCode,
        costCenter: allocation.costCenter,
        costCenterName: allocation.costCenterName,
        categoryName: allocation.codeDescription,
        financialYear: allocation.financialYear,
        amount: releaseAmount,
        spent: 0,
        remaining: releaseAmount,
        period: 'quarterly',
        categoryId: 1
      };
      
      console.log('Creating budget entry for release:', budgetData);
      const budgetResponse = await fetch('http://localhost:4001/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData)
      });
      
      if (!budgetResponse.ok) {
        console.warn('Failed to create budget entry for release');
        // Continue even if budget creation fails
      } else {
        console.log('Budget entry created for release');
      }
      
      // Update the releases list in state
      setReleases([...releases, savedRelease]);
      
      // Show success message
      setSuccess(`Budget of Rs. ${releaseAmount.toLocaleString()} released for ${quarterName}`);
      
      // Refresh the data
      fetchAllocations();
      fetchReleases();
    } catch (error) {
      console.error('Error releasing budget:', error);
      setError(`Error releasing budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleUnreleaseConfirmation = (release: BudgetRelease) => {
    if (window.confirm(`Are you sure you want to unrelease this budget of Rs. ${release.amount.toLocaleString()}?`)) {
      handleUnreleaseBudget(release);
    }
  };
  
  const handleUnreleaseBudget = async (release: BudgetRelease) => {
    try {
      console.log('Unreleasing budget release:', release);
      
      // First, fetch the latest allocation data
      const allocationResponse = await fetch(`http://localhost:4001/api/budget-allocations/${release.allocationId}`);
      if (!allocationResponse.ok) {
        throw new Error('Failed to fetch the latest allocation data');
      }
      
      const allocation = await allocationResponse.json();
      console.log('Latest allocation data for unrelease:', allocation);
      
      // Determine which quarter field to update
      let quarterField = '';
      switch (release.quarter) {
        case 1: quarterField = 'q1Released'; break;
        case 2: quarterField = 'q2Released'; break;
        case 3: quarterField = 'q3Released'; break;
        case 4: quarterField = 'q4Released'; break;
        default: throw new Error(`Invalid quarter: ${release.quarter}`);
      }
      
      // Create updated allocation object
      const updatedAllocation = {
        ...allocation,
        [quarterField]: false
      };
      
      // Update the allocation in the database
      const updateResponse = await fetch(`http://localhost:4001/api/budget-allocations/${allocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAllocation)
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update allocation release status');
      }
      
      const updatedAllocationFromServer = await updateResponse.json();
      console.log('Allocation updated in API:', updatedAllocationFromServer);
      
      // Delete the release from the database
      const deleteResponse = await fetch(`http://localhost:4001/api/budget-releases/${release.id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to delete budget release');
      }
      
      console.log('Budget release deleted from API');
      
      // Update local state
      setReleases(releases.filter(r => r.id !== release.id));
      
      // Update the allocation in local state
      setAllocations(allocations.map(a => 
        a.id === allocation.id ? updatedAllocationFromServer : a
      ));
      
      // If this allocation is currently selected, update the selected allocation state
      if (selectedAllocation && selectedAllocation.id === release.allocationId) {
        setSelectedAllocation(updatedAllocationFromServer);
      }
      
      // Show success message
      setSuccess(`Budget release for Quarter ${release.quarter} has been canceled`);
      
      // Refresh the data to ensure everything is up to date
      fetchAllocations();
      fetchReleases();
    } catch (error) {
      console.error('Error unreleasing budget:', error);
      setError(`Error unreleasing budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const type = adjustmentForm.type as 'supplementary' | 'reappropriation' | 'surrender';
    const fromObjectCode = adjustmentForm.fromObjectCode;
    const fromCostCenter = adjustmentForm.fromCostCenter;
    const toObjectCode = adjustmentForm.toObjectCode;
    const toCostCenter = adjustmentForm.toCostCenter;
    const amount = parseFloat(adjustmentForm.amount);
    const remarks = adjustmentForm.remarks;
    const financialYear = adjustmentForm.financialYear;
    if (isNaN(amount) || amount <= 0) {
      alert('Amount must be a positive number');
      return;
    }
    
    // Find the allocation for validation
    const fromAllocation = allocations.find(a =>
      a.objectCodeName === fromObjectCode && 
      a.costCenterName === fromCostCenter && 
      a.financialYear === financialYear
    );
    
    if (!fromAllocation) {
      alert('Could not find the allocation for this object code and cost center');
      return;
    }
    
    // For reappropriation and surrender, check if there's enough released budget available
    if (type === 'reappropriation' || type === 'surrender') {
      const totalReleased = calculateTotalReleased(fromAllocation);
      const availableBudget = fromAllocation.totalAllocation - totalReleased;
      
      if (amount > availableBudget) {
        alert(`Insufficient budget available for ${type}. Available: Rs. ${availableBudget.toLocaleString()}, Requested: Rs. ${amount.toLocaleString()}`);
        return;
      }
    }
    
    // For reappropriation, also check the destination allocation
    if (type === 'reappropriation') {
      const toAllocation = allocations.find(a => 
        a.objectCodeName === toObjectCode && 
        a.costCenterName === toCostCenter && 
        a.financialYear === financialYear
      );

      if (!toAllocation) {
        alert('Could not find the destination allocation for this reappropriation');
        return;
      }
    }
    
    // If editing an existing adjustment, remove the old one first
    if (editingAdjustment) {
      handleDeleteAdjustment(editingAdjustment.id);
    }
    
    // Create a new budget adjustment
    const newAdjustment: BudgetAdjustment = {
      id: Date.now(),
      date: formatDate(new Date().toISOString().split('T')[0]),
      fromObjectCode,
      fromCostCenter,
      toObjectCode,
      toCostCenter,
      amount,
      type,
      remarks,
      financialYear
    };
    
    // Update the adjustments list
    setAdjustments([...adjustments, newAdjustment]);
    
    // Create budget release entries for the adjustment
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);
    
    if (type === 'supplementary') {
      // Find the allocation for the object code receiving the supplementary grant
      const allocation = allocations.find(a => 
        a.objectCodeName === fromObjectCode && 
        a.costCenterName === fromCostCenter && 
        a.financialYear === financialYear
      );
      
      if (!allocation) {
        alert('Could not find the allocation for this object code and cost center');
        return;
      }
      
      // Create a new budget release for the supplementary grant
      const newRelease: BudgetRelease = {
        id: Date.now(),
        allocationId: allocation.id,
        objectCode: fromObjectCode,
        codeDescription: allocation.codeDescription,
        costCenter: fromCostCenter,
        costCenterName: allocation.costCenterName,
        financialYear,
        quarter: 0, // 0 indicates it's not a quarterly release
        amount,
        dateReleased: currentDate,
        remarks: `Supplementary grant: ${remarks}`,
        type: 'supplementary'
      };
      
      // Update the releases list
      setReleases([...releases, newRelease]);
      
      // Also update the budgetEntries in localStorage
      const storedBudgets = localStorage.getItem('budgetEntries');
      let budgetEntries: any[] = [];
      
      if (storedBudgets) {
        budgetEntries = JSON.parse(storedBudgets);
      }
      
      // Add the new budget entry
      const newEntry = {
        id: Date.now(),
        fromObjectCodeId: fromAllocation.objectCode,
        fromCostCenterId: allocation.costCenter,
        fromObjectCode: fromObjectCode,
        fromCodeDescription: allocation.codeDescription,
        fromCostCenter: fromCostCenter,
        fromCostCenterName: allocation.costCenterName,
        amountAllocated: allocation.totalAllocation,
        budgetReleased: amount,
        financialYear,
        period: 'supplementary',
        remarks: `Supplementary grant: ${remarks}`,
        dateCreated: currentDate
      };
      
      budgetEntries.push(newEntry);
      try{
      const createResponse = await fetch('http://localhost:4001/api/budget-adjustments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEntry)
          });
          
          if (createResponse.ok) {
            console.log(`Created budget entry for allocation ID: ${allocation.id}`);
          } else {
            console.warn(`Failed to create budget entry for allocation ID: ${allocation.id}`);
          }
        } catch (error) {
          console.error(`Error creating budget entry for allocation ID: ${allocation.id}:`, error);
        }
      localStorage.setItem('budgetEntries', JSON.stringify(budgetEntries));
      
    } else if (type === 'reappropriation') {
      // Find the allocation for the source object code
      const fromAllocation = allocations.find(a => 
        a.objectCodeName === fromObjectCode && 
        a.costCenterName === fromCostCenter && 
        a.financialYear === financialYear
      );
      
      // Find the allocation for the destination object code
      const toAllocation = allocations.find(a => 
        a.objectCodeName === toObjectCode && 
        a.costCenterName === toCostCenter && 
        a.financialYear === financialYear
      );
      
      if (!fromAllocation || !toAllocation) {
        alert('Could not find one or both allocations for this reappropriation');
        return;
      }
      
      // Create a new budget release for the source (negative amount)
      const fromRelease: BudgetRelease = {
        id: Date.now(),
        allocationId: fromAllocation.id,
        objectCode: fromObjectCode,
        codeDescription: fromAllocation.codeDescription,
        costCenter: fromCostCenter,
        costCenterName: fromAllocation.costCenterName,
        financialYear,
        quarter: 0,
        amount: -amount, // Negative amount for the source
        dateReleased: currentDate,
        remarks: `Reappropriation to ${toObjectCode}: ${remarks}`,
        type: 'reappropriation'
      };
      
      // Create a new budget release for the destination (positive amount)
      const toRelease: BudgetRelease = {
        id: Date.now() + 1,
        allocationId: toAllocation.id,
        objectCode: toObjectCode,
        codeDescription: toAllocation.codeDescription,
        costCenter: toCostCenter,
        costCenterName: toAllocation.costCenterName,
        financialYear,
        quarter: 0,
        amount, // Positive amount for the destination
        dateReleased: currentDate,
        remarks: `Reappropriation from ${fromObjectCode}: ${remarks}`,
        type: 'reappropriation'
      };
      
      // Update the releases list
      setReleases([...releases, fromRelease, toRelease]);
      
      // Also update the budgetEntries in localStorage
      const storedBudgets = localStorage.getItem('budgetEntries');
      let budgetEntries: any[] = [];
      
      if (storedBudgets) {
        budgetEntries = JSON.parse(storedBudgets);
      }
      
      // Add the new budget entries
      const fromEntry = {
        id: Date.now(),
        fromObjectCode: fromObjectCode,
        fromCodeDescription: fromAllocation.codeDescription,
        fromObjectCodeId: fromAllocation.objectCode,
        fromCostCenterId: fromAllocation.costCenter,
        fromCostCenter: fromCostCenter,
        fromCostCenterName: fromAllocation.costCenterName,

        toObjectCode: toObjectCode,
        toCodeDescription: toAllocation.codeDescription,
        toObjectCodeId: toAllocation.objectCode,
        toCostCenterId: toAllocation.costCenter,
        toCostCenter: toCostCenter,
        toCostCenterName: toAllocation.costCenterName,
        amountAllocated: toAllocation.totalAllocation,
        budgetReleased: -amount, // Negative amount
        financialYear,
        period: 'reappropriation',
        remarks: `Reappropriation to ${toObjectCode}: ${remarks}`,
        dateCreated: currentDate
      };
      
      const toEntry = {
        id: Date.now() + 1,
        objectCode: toObjectCode,
        codeDescription: toAllocation.codeDescription,
        costCenter: toCostCenter,
        costCenterName: toAllocation.costCenterName,
        amountAllocated: toAllocation.totalAllocation,
        budgetReleased: amount, // Positive amount
        financialYear,
        period: 'reappropriation',
        remarks: `Reappropriation from ${fromObjectCode}: ${remarks}`,
        dateCreated: currentDate
      };
      
      budgetEntries.push(fromEntry, toEntry);
      try{
        const createResponse = await fetch('http://localhost:4001/api/budget-adjustments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fromEntry)
            });
            
            if (createResponse.ok) {
              console.log(`Created budget entry for allocation ID: ${fromAllocation.id}`);
            } else {
              console.warn(`Failed to create budget entry for allocation ID: ${fromAllocation.id}`);
            }
        } catch (error) {
          console.error(`Error creating budget entry for allocation ID: ${fromAllocation.id}:`, error);
        }      
      localStorage.setItem('budgetEntries', JSON.stringify(budgetEntries));
      
    } else if (type === 'surrender') {
      // Find the allocation for the object code surrendering budget
      const allocation = allocations.find(a => 
        a.objectCodeName === fromObjectCode && 
        a.costCenterName === fromCostCenter && 
        a.financialYear === financialYear
      );
      
      if (!allocation) {
        alert('Could not find the allocation for this object code and cost center');
        return;
      }
      
      // Create a new budget release for the surrender (negative amount)
      const newRelease: BudgetRelease = {
        id: Date.now(),
        allocationId: allocation.id,
        objectCode: fromObjectCode,
        codeDescription: allocation.codeDescription,
        costCenter: fromCostCenter,
        costCenterName: allocation.costCenterName,
        financialYear,
        quarter: 0,
        amount: -amount, // Negative amount for surrender
        dateReleased: currentDate,
        remarks: `Budget surrender: ${remarks}`,
        type: 'surrender'
      };
      
      // Update the releases list
      setReleases([...releases, newRelease]);
      
      // Also update the budgetEntries in localStorage
      const storedBudgets = localStorage.getItem('budgetEntries');
      let budgetEntries: any[] = [];
      
      if (storedBudgets) {
        budgetEntries = JSON.parse(storedBudgets);
      }
      
      // Add the new budget entry
      const newEntry = {
        id: Date.now(),
        fromObjectCode: fromObjectCode,
        fromCodeDescription: allocation.codeDescription,
        fromCostCenter: fromCostCenter,
        fromCostCenterName: allocation.costCenterName,
        fromObjectCodeId: allocation.objectCode,
        fromCostCenterId: allocation.costCenter,
        amountAllocated: allocation.totalAllocation,
        budgetReleased: -amount, // Negative amount
        financialYear,
        period: 'surrender',
        remarks: `Budget surrender: ${remarks}`,
        dateCreated: currentDate
      };
      //=============
      budgetEntries.push(newEntry);
      try{
      const createResponse = await fetch('http://localhost:4001/api/budget-adjustments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEntry)
          });
          
          if (createResponse.ok) {
            console.log(`Created budget entry for allocation ID: ${allocation.id}`);
          } else {
            console.warn(`Failed to create budget entry for allocation ID: ${allocation.id}`);
          }
        } catch (error) {
          console.error(`Error creating budget entry for allocation ID: ${allocation.id}:`, error);
        }
      localStorage.setItem('budgetEntries', JSON.stringify(budgetEntries));
    }
    // Reset form
    setAdjustmentForm({
      type: 'supplementary',
      fromObjectCode: '',
      fromCostCenter: '',
      toObjectCode: '',
      toCostCenter: '',
      amount: '',
      remarks: '',
      financialYear: ''
    });
    
    setShowAdjustmentForm(false);
  };

  const handleEditAdjustment = (adjustment: BudgetAdjustment) => {
    setEditingAdjustment(adjustment);
    setAdjustmentForm({
      type: adjustment.period?? adjustment.type,
      fromObjectCode: adjustment.fromObjectCode || '',
      fromCostCenter: adjustment.fromCostCenter || '',
      toObjectCode: adjustment.toObjectCode || '',
      toCostCenter: adjustment.toCostCenter || '',
      amount: adjustment.amount.toString(),
      remarks: adjustment.remarks,
      financialYear: adjustment.financialYear
    });
    setShowAdjustmentForm(true);
  };

  const handleShowAdjustmentForm = () => {
    setShowAdjustmentForm(true);
  };
  
  const handleFinancialYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFinancialYear = e.target.value;
    setCurrentFinancialYear(newFinancialYear);
    
    // Also update the form data
    setFormData(prev => ({ ...prev, financialYear: newFinancialYear }));
    setAdjustmentForm(prev => ({ ...prev, financialYear: newFinancialYear }));
    
    // Save the selection to localStorage
    try {
      const storedSettings = localStorage.getItem('appSettings');
      const settings = storedSettings ? JSON.parse(storedSettings) : {};
      settings.selectedFinancialYear = newFinancialYear;
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving financial year to settings:', error);
    }
  };
  
  // Add a utility function to sync budget entries with allocations
  const syncBudgetEntries = async () => {
    try {
      console.log('Syncing budget entries with allocations...');
      
      // Get all budget entries
      const budgetsResponse = await fetch('http://localhost:4001/api/budgets');
      if (!budgetsResponse.ok) {
        throw new Error('Failed to fetch budget entries');
      }
      const budgetEntries: any[] = await budgetsResponse.json();
      
      // Get all allocations
      const allocationsResponse = await fetch('http://localhost:4001/api/budget-allocations');
      if (!allocationsResponse.ok) {
        throw new Error('Failed to fetch budget allocations');
      }
      const allAllocations: BudgetAllocation[] = await allocationsResponse.json();
      
      // Find orphaned budget entries (entries without a corresponding allocation)
      const orphanedEntries = budgetEntries.filter((entry: any) => {
        const entryObjectCode = entry.objectCode || entry.object_code;
        const entryCostCenter = entry.costCenter || entry.cost_center;
        const entryFinancialYear = entry.financialYear || entry.financial_year;
        
        return !allAllocations.some(allocation => 
          allocation.objectCode === entryObjectCode && 
          allocation.costCenter === entryCostCenter && 
          allocation.financialYear === entryFinancialYear
        );
      });
      
      // Delete orphaned entries
      if (orphanedEntries.length > 0) {
        console.log(`Found ${orphanedEntries.length} orphaned budget entries. Cleaning up...`);
        
        for (const entry of orphanedEntries) {
          try {
            const deleteResponse = await fetch(`http://localhost:4001/api/budgets/${entry.id}`, {
              method: 'DELETE'
            });
            
            if (deleteResponse.ok) {
              console.log(`Deleted orphaned budget entry ID: ${entry.id}`);
            } else {
              console.warn(`Failed to delete orphaned budget entry ID: ${entry.id}`);
            }
          } catch (error) {
            console.error(`Error deleting orphaned budget entry ID: ${entry.id}:`, error);
          }
        }
      } else {
        console.log('No orphaned budget entries found.');
      }
      
      // Check for missing budget entries (allocations without a corresponding budget entry)
      const missingEntries = allAllocations.filter((allocation: BudgetAllocation) => {
        return !budgetEntries.some((entry: any) => {
          const entryObjectCode = entry.objectCode || entry.object_code;
          const entryCostCenter = entry.costCenter || entry.cost_center;
          const entryFinancialYear = entry.financialYear || entry.financial_year;
          
          return allocation.objectCode === entryObjectCode && 
                 allocation.costCenter === entryCostCenter && 
                 allocation.financialYear === entryFinancialYear;
        });
      });
      
      // Create missing budget entries
      if (missingEntries.length > 0) {
        console.log(`Found ${missingEntries.length} allocations without budget entries. Creating...`);
        
        for (const allocation of missingEntries) {
          try {
            const budgetData = {
              name: allocation.objectCode,
              objectCode: allocation.objectCode,
              costCenter: allocation.costCenter,
              costCenterName: allocation.costCenterName,
              categoryName: allocation.codeDescription,
              financialYear: allocation.financialYear,
              amount: allocation.totalAllocation,
              spent: 0,
              remaining: allocation.totalAllocation,
              period: 'yearly',
              categoryId: 1
            };
            
            const createResponse = await fetch('http://localhost:4001/api/budgets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(budgetData)
            });
            
            if (createResponse.ok) {
              console.log(`Created budget entry for allocation ID: ${allocation.id}`);
            } else {
              console.warn(`Failed to create budget entry for allocation ID: ${allocation.id}`);
            }
          } catch (error) {
            console.error(`Error creating budget entry for allocation ID: ${allocation.id}:`, error);
          }
        }
      } else {
        console.log('No missing budget entries found.');
      }
      
      console.log('Budget entries sync completed.');
    } catch (error) {
      console.error('Error syncing budget entries:', error);
    }
  };
  
  // Add functions to fetch data from API
  const fetchAllocations = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/budget-allocations');
      if (!response.ok) {
        throw new Error('Failed to fetch budget allocations');
      }
      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      console.error('Error fetching budget allocations:', error);
      setError(`Error fetching budget allocations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchReleases = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/budget-releases');
      if (!response.ok) {
        throw new Error('Failed to fetch budget releases');
      }
      const data = await response.json();
      setReleases(data);
    } catch (error) {
      console.error('Error fetching budget releases:', error);
      setError(`Error fetching budget releases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/budget-adjustments');
      if (!response.ok) {
        throw new Error('Failed to fetch budget adjustments');
      }
      const data = await response.json();
      setAdjustments(data);
    } catch (error) {
      console.error('Error fetching budget adjustments:', error);
      setError(`Error fetching budget adjustments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };
  
  const calculateTotalReleased = (allocation: BudgetAllocation) => {
    // Get all releases for this allocation
    const allocationReleases = releases.filter(release => 
      release.objectCode === allocation.objectCode && 
      release.costCenter === allocation.costCenter &&
      release.financialYear === allocation.financialYear
    );
    
    // Sum up the amounts (will automatically handle negative values for surrenders and reappropriations)
    return allocationReleases.reduce((total, release) => total + release.amount, 0);
  };
  
  const calculateAvailableBudget = (allocation: BudgetAllocation) => {
    const totalReleased = calculateTotalReleased(allocation);
    return allocation.totalAllocation - totalReleased;
  };
  
  const filteredAllocations = allocations.filter(allocation => 
    allocation.financialYear === currentFinancialYear
  );
  
  const filteredReleases = releases.filter(release => 
    release.financialYear === currentFinancialYear
  );
  
  const filteredAdjustments = adjustments.filter(adjustment => 
    adjustment.financialYear === currentFinancialYear
  );
  
  const renderNotifications = () => {
    return (
      <>
        {success && (
          <div className="alert alert-success" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return <div className="loading">Loading budget management...</div>;
  }
  
  return (
    <div className="budgets-container">
      {renderNotifications()}
      <div className="budgets-header">
        <h1>Budget Management</h1>
        <div className="actions">
          <button className="add-button" onClick={() => setShowAllocationForm(true)}>
            Create Budget Allocation
          </button>
          <button className="add-button" onClick={handleShowAdjustmentForm}>
            Create Budget Adjustment
          </button>
          <div className="period-selector">
            <button 
              className={`period-button ${activePeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setActivePeriod('yearly')}
            >
              Yearly
            </button>
            <button 
              className={`period-button ${activePeriod === 'quarterly' ? 'active' : ''}`}
              onClick={() => setActivePeriod('quarterly')}
            >
              Quarterly
            </button>
          </div>
          <div className="financial-year-selector">
            <select
              name="financialYear"
              value={currentFinancialYear}
              onChange={handleFinancialYearChange}
            >
              {availableFinancialYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
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
            
            <form onSubmit={handleSubmitAllocation}>
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
                      <option key={code.id} value={code.id}>
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
                      <option key={center.id} value={center.id}>
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
                    {availableFinancialYears.map(year => (
                      <option key={year} value={year}>{year}</option>
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
      
      {showAdjustmentForm && (
        <div className="adjustment-form-overlay">
          <div className="adjustment-form-container">
            <div className="form-header">
              <h2>{editingAdjustment ? 'Edit Budget Adjustment' : 'Create Budget Adjustment'}</h2>
              <button 
                className="close-button"
                onClick={() => setShowAdjustmentForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAdjustment}>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                    required
                  >
                    <option value="supplementary">Supplementary Grant</option>
                    <option value="reappropriation">Reappropriation</option>
                    <option value="surrender">Surrender</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Financial Year</label>
                  <select
                    name="financialYear"
                    value={adjustmentForm.financialYear}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, financialYear: e.target.value })}
                    required
                  >
                    <option value="">Select Financial Year</option>
                    {availableFinancialYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Source Object Code and Cost Center - Required for all types */}
              <div className="form-row">
                <div className="form-group">
                  <label>{adjustmentForm.type === 'reappropriation' ? 'From Object Code' : 'Object Code'}</label>
                  <select
                    name="fromObjectCode"
                    value={adjustmentForm.fromObjectCode}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, fromObjectCode: e.target.value })}
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
                  <label>{adjustmentForm.type === 'reappropriation' ? 'From Cost Center' : 'Cost Center'}</label>
                  <select
                    name="fromCostCenter"
                    value={adjustmentForm.fromCostCenter}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, fromCostCenter: e.target.value })}
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
              
              {/* Destination Object Code and Cost Center - Only required for reappropriation */}
              {adjustmentForm.type === 'reappropriation' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>To Object Code</label>
                    <select
                      name="toObjectCode"
                      value={adjustmentForm.toObjectCode}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, toObjectCode: e.target.value })}
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
                    <label>To Cost Center</label>
                    <select
                      name="toCostCenter"
                      value={adjustmentForm.toCostCenter}
                      onChange={(e) => setAdjustmentForm({ ...adjustmentForm, toCostCenter: e.target.value })}
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
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (Rs.)</label>
                  <input
                    type="number"
                    name="amount"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    value={adjustmentForm.remarks}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, remarks: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAdjustmentForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingAdjustment ? 'Update Adjustment' : 'Create Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="budget-sections">
        <div className="budget-section">
          <h2>Budget Allocations</h2>
          {filteredAllocations.length === 0 ? (
            <div className="no-data">
              <p>No budget allocations found for {currentFinancialYear}. Click "Create Budget Allocation" to add your first budget allocation.</p>
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Object Code</th>
                    <th>Description</th>
                    <th>Cost Center</th>
                    <th>Total Allocation</th>
                    <th>Released Budget</th>
                    <th>Available Budget</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map(allocation => {
                    const totalReleased = calculateTotalReleased(allocation);
                    const availableBudget = allocation.totalAllocation - totalReleased;
                    
                    return (
                      <tr key={allocation.id}>
                        <td>{allocation.objectCodeName}</td>
                        <td>{allocation.codeDescription}</td>
                        <td>{allocation.costCenterName} - {allocation.costCenterName}</td>
                        <td className="amount">Rs. {allocation.totalAllocation.toLocaleString()}</td>
                        <td className="amount">Rs. {totalReleased.toLocaleString()}</td>
                        <td className="amount">Rs. {availableBudget.toLocaleString()}</td>
                        <td>
                          <button 
                            className="action-button edit"
                            onClick={() => handleEditAllocation(allocation)}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-button view"
                            onClick={() => setSelectedAllocation(allocation)}
                          >
                            Manage Releases
                          </button>
                          <button 
                            className="action-button delete"
                            onClick={() => handleDeleteAllocation(allocation.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="budget-section">
          <h2>Budget Releases</h2>
          {filteredReleases.length === 0 ? (
            <div className="no-data">
              <p>No budget releases found for {currentFinancialYear}. Release a budget from an allocation to see it here.</p>
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Object Code</th>
                    <th>Cost Center</th>
                    <th>Type</th>
                    <th>Quarter</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReleases.map(release => (
                    <tr key={release.id} className={release.amount < 0 ? 'negative-amount' : ''}>
                      <td>{formatDate(release.dateReleased)}</td>
                      <td>{release.objectCode}</td>
                      <td>{release.costCenter} - {release.costCenterName}</td>
                      <td>{release.type}</td>
                      <td>{release.quarter === 0 ? 'N/A' : `Q${release.quarter}`}</td>
                      <td className="amount">Rs. {release.amount.toLocaleString()}</td>
                      <td>{release.remarks}</td>
                      <td>
                        {release.type === 'regular' && (
                          <button 
                            className="action-button unrelease"
                            onClick={() => handleUnreleaseConfirmation(release)}
                          >
                            Unrelease
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="budget-section">
          <h2>Budget Adjustments</h2>
          {filteredAdjustments.length === 0 ? (
            <div className="no-data">
              <p>No budget adjustments found for {currentFinancialYear}. Click "Create Budget Adjustment" to add your first budget adjustment.</p>
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>From Object Code</th>
                    <th>From Cost Center</th>
                    <th>To Object Code</th>
                    <th>To Cost Center</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdjustments.map(adjustment => (
                    <tr key={adjustment.id}>
                      <td>{formatDate(adjustment.dateCreated && adjustment.dateCreated || adjustment.date)}</td>
                      <td>{adjustment.period}</td>
                      <td>{adjustment.fromObjectCode}</td>
                      <td>{adjustment.fromCostCenter}</td>
                      <td>{adjustment.toObjectCode}</td>
                      <td>{adjustment.toCostCenter}</td>
                      <td className="amount">Rs. {adjustment.amount.toLocaleString()}</td>
                      <td>{adjustment.remarks}</td>
                      <td>
                        <button 
                          className="action-button edit"
                          onClick={() => handleEditAdjustment(adjustment)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => handleDeleteAdjustment(adjustment.id)}
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
      </div>
      
      {selectedAllocation && (
        <div className="allocation-details-overlay">
          <div className="allocation-details-container">
            <div className="form-header">
              <h2>Manage Quarterly Releases</h2>
              <button 
                className="close-button"
                onClick={() => setSelectedAllocation(null)}
              >
                ×
              </button>
            </div>
            
            <div className="allocation-details">
              <h3>{selectedAllocation.objectCode} - {selectedAllocation.codeDescription}</h3>
              <p><strong>Cost Center:</strong> {selectedAllocation.costCenter} - {selectedAllocation.costCenterName}</p>
              <p><strong>Financial Year:</strong> {selectedAllocation.financialYear}</p>
              <p><strong>Total Allocation:</strong> Rs. {selectedAllocation.totalAllocation.toLocaleString()}</p>
              
              <div className="quarterly-releases">
                <h4>Quarterly Releases</h4>
                <div className="quarters-grid">
                  <div className="quarter-card">
                    <h5>Quarter 1</h5>
                    <p>Allocation: Rs. {selectedAllocation.q1Release.toLocaleString()}</p>
                    <p>
                      Status: 
                      <span className={`status ${selectedAllocation.q1Released ? 'released' : 'not-released'}`}>
                        {selectedAllocation.q1Released ? 'Released' : 'Not Released'}
                      </span>
                    </p>
                    {selectedAllocation.q1Release > 0 && !selectedAllocation.q1Released && (
                      <button 
                        className="release-button"
                        onClick={() => handleReleaseBudget(selectedAllocation, 1)}
                        disabled={selectedAllocation.q1Released}
                      >
                        Release Budget
                      </button>
                    )}
                  </div>
                  
                  <div className="quarter-card">
                    <h5>Quarter 2</h5>
                    <p>Allocation: Rs. {selectedAllocation.q2Release.toLocaleString()}</p>
                    <p>
                      Status: 
                      <span className={`status ${selectedAllocation.q2Released ? 'released' : 'not-released'}`}>
                        {selectedAllocation.q2Released ? 'Released' : 'Not Released'}
                      </span>
                    </p>
                    {selectedAllocation.q2Release > 0 && !selectedAllocation.q2Released && (
                      <button 
                        className="release-button"
                        onClick={() => handleReleaseBudget(selectedAllocation, 2)}
                        disabled={selectedAllocation.q2Released}
                      >
                        Release Budget
                      </button>
                    )}
                  </div>
                  
                  <div className="quarter-card">
                    <h5>Quarter 3</h5>
                    <p>Allocation: Rs. {selectedAllocation.q3Release.toLocaleString()}</p>
                    <p>
                      Status: 
                      <span className={`status ${selectedAllocation.q3Released ? 'released' : 'not-released'}`}>
                        {selectedAllocation.q3Released ? 'Released' : 'Not Released'}
                      </span>
                    </p>
                    {selectedAllocation.q3Release > 0 && !selectedAllocation.q3Released && (
                      <button 
                        className="release-button"
                        onClick={() => handleReleaseBudget(selectedAllocation, 3)}
                        disabled={selectedAllocation.q3Released}
                      >
                        Release Budget
                      </button>
                    )}
                  </div>
                  
                  <div className="quarter-card">
                    <h5>Quarter 4</h5>
                    <p>Allocation: Rs. {selectedAllocation.q4Release.toLocaleString()}</p>
                    <p>
                      Status: 
                      <span className={`status ${selectedAllocation.q4Released ? 'released' : 'not-released'}`}>
                        {selectedAllocation.q4Released ? 'Released' : 'Not Released'}
                      </span>
                    </p>
                    {selectedAllocation.q4Release > 0 && !selectedAllocation.q4Released && (
                      <button 
                        className="release-button"
                        onClick={() => handleReleaseBudget(selectedAllocation, 4)}
                        disabled={selectedAllocation.q4Released}
                      >
                        Release Budget
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedBudgets;
