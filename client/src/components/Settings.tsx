import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onClose?: () => void;
}

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

interface SchemeCode {
  id: number;
  code: string;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
  vendorNumber: string;
}

interface StampDutyRange {
  max: number;
  amount: number;
}

interface TaxSettings {
  incomeTaxPurchaseRates: string[];
  incomeTaxServiceRates: string[];
  generalSalesTaxRates: string[];
  punjabSalesTaxRates: string[];
  stampDutyRanges: StampDutyRange[];
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [financialYears, setFinancialYears] = useState<string[]>([
    '2023-24', '2024-25', '2025-26', '2026-27', '2027-28'
  ]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('2025-26');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  // Object Codes Management
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [showObjectCodeForm, setShowObjectCodeForm] = useState(false);
  const [newObjectCode, setNewObjectCode] = useState({ code: '', description: '' });
  
  // Cost Centers Management
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [showCostCenterForm, setShowCostCenterForm] = useState(false);
  const [newCostCenter, setNewCostCenter] = useState({ code: '', name: '' });
  
  // Scheme Codes Management
  const [schemeCodes, setSchemeCodes] = useState<SchemeCode[]>([]);
  const [showSchemeCodeForm, setShowSchemeCodeForm] = useState(false);
  const [newSchemeCode, setNewSchemeCode] = useState({ code: '', name: '' });
  
  // Vendors Management
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', vendorNumber: '' });
  
  // Tax Settings Management
  const [activeTab, setActiveTab] = useState('general');
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    incomeTaxPurchaseRates: ['4.5', '5.5', '6.5'],
    incomeTaxServiceRates: ['10.0', '11.0', '12.0'],
    generalSalesTaxRates: ['1/5', '20.0', '25.0'],
    punjabSalesTaxRates: ['16', '100.0'],
    stampDutyRanges: [
      { max: 500000, amount: 3000 },
      { max: 1000000, amount: 5000 },
      { max: 5000000, amount: 8000 },
      { max: 15000000, amount: 15000 },
      { max: 1000000000, amount: 30000 }
    ]
  });
  const [newIncomeTaxPurchaseRate, setNewIncomeTaxPurchaseRate] = useState('');
  const [newIncomeTaxServiceRate, setNewIncomeTaxServiceRate] = useState('');
  const [newGeneralSalesTaxRate, setNewGeneralSalesTaxRate] = useState('');
  const [newPunjabSalesTaxRate, setNewPunjabSalesTaxRate] = useState('');
  const [newStampDutyMax, setNewStampDutyMax] = useState('');
  const [newStampDutyAmount, setNewStampDutyAmount] = useState('');
  const [message, setMessage] = useState('');

  // Track deleted vendors in a Set to prevent re-adding on save
  const [deletedVendorIds, setDeletedVendorIds] = useState<Set<number>>(new Set());

  // Move fetchData to top level of Settings component
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [objectCodesResponse, vendorsResponse, costCentersResponse, schemeCodesResponse] = await Promise.all([
        fetch('http://localhost:4001/api/objectCodes'),
        fetch('http://localhost:4001/api/vendors'),
        fetch('http://localhost:4001/api/costCenters'),
        fetch('http://localhost:4001/api/schemeCodes'),
      ]);
      if (objectCodesResponse.ok) {
        setObjectCodes(await objectCodesResponse.json());
      }
      if (vendorsResponse.ok) {
        let vendorsData = await vendorsResponse.json();
        // Only show vendors with both name and vendorNumber
        vendorsData = vendorsData.filter((v: Vendor) => v.name && v.vendorNumber);
        setVendors(vendorsData);
        setDeletedVendorIds(new Set()); // Clear deleted vendor ids after fetch
      }
      if (costCentersResponse.ok) {
        setCostCenters(await costCentersResponse.json());
      }
      if (schemeCodesResponse.ok) {
        setSchemeCodes(await schemeCodesResponse.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      // Try to save settings to the API
      try {
        // Save financial years and selected financial year
        await fetch('http://localhost:4001/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            financialYears,
            selectedFinancialYear
          }),
        });
        
        // Save object codes
        for (const code of objectCodes) {
          if (code.id) {
            await fetch(`http://localhost:4001/api/objectCodes/${code.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(code),
            });
          } else {
            await fetch('http://localhost:4001/api/objectCodes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(code),
            });
          }
        }
        
        // Save cost centers
        for (const center of costCenters) {
          if (center.id) {
            await fetch(`http://localhost:4001/api/costCenters/${center.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(center),
            });
          } else {
            await fetch('http://localhost:4001/api/costCenters', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(center),
            });
          }
        }
        
        // Save scheme codes
        for (const scheme of schemeCodes) {
          if (scheme.id) {
            await fetch(`http://localhost:4001/api/schemeCodes/${scheme.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(scheme),
            });
          } else {
            await fetch('http://localhost:4001/api/schemeCodes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(scheme),
            });
          }
        }
        
        // Save vendors: POST any vendors in state not in backend
        try {
          const backendVendorsRes = await fetch('http://localhost:4001/api/vendors');
          const backendVendors = backendVendorsRes.ok ? await backendVendorsRes.json() : [];
          const backendVendorNumbers = backendVendors.map((v: Vendor) => v.vendorNumber);
          for (const v of vendors) {
            if (!backendVendorNumbers.includes(v.vendorNumber) && !deletedVendorIds.has(v.id)) {
              await fetch('http://localhost:4001/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: v.name, vendorNumber: v.vendorNumber })
              });
            }
          }
          // Refresh vendor list from backend
          const refreshed = await fetch('http://localhost:4001/api/vendors');
          if (refreshed.ok) setVendors(await refreshed.json());
          setDeletedVendorIds(new Set()); // Clear deleted vendor ids after save
        } catch (err) {
          console.error('Error syncing vendors:', err);
        }
        
        // Save tax settings
        await fetch('http://localhost:4001/api/taxSettings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taxSettings),
        });
        
        console.log('Settings saved to database successfully');
        
        // Dispatch a custom event to notify other components of the changes
        const event = new Event('settingsUpdated');
        window.dispatchEvent(event);
      } catch (apiError) {
        console.error('Error saving settings to API:', apiError);
        setMessage('Error saving settings to database. Please try again.');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      setIsSaved(true);
      setMessage('All settings saved successfully!');
      setTimeout(() => {
        setMessage('');
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddObjectCode = async () => {
    if (!newObjectCode.code || !newObjectCode.description) {
      alert('Please enter both the object code and description.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:4001/api/objectCodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newObjectCode.code,
          description: newObjectCode.description
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save object code');
      }
      
      // Reset form
      setNewObjectCode({ code: '', description: '' });
      setShowObjectCodeForm(false);
      
      // Refresh the data from the server
      await fetchData();
      
      // Show success message
      setMessage('Object code added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error saving object code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving object code. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteObjectCode = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this object code?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4001/api/objectCodes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete object code');
      }
      
      // Refresh the data from the server
      await fetchData();
      
      setMessage('Object code deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error deleting object code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting object code. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh the data from the server to ensure consistency
      await fetchData();
    }
  };

  const handleAddCostCenter = async () => {
    if (!newCostCenter.code || !newCostCenter.name) {
      alert('Please enter both Cost Center Code and Name');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:4001/api/costCenters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newCostCenter.code.toUpperCase(),
          name: newCostCenter.name,
          description: ''
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save cost center');
      }
      
      // Reset form
      setNewCostCenter({ code: '', name: '' });
      setShowCostCenterForm(false);
      
      // Refresh the data from the server
      await fetchData();
      
      setMessage('Cost center added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error saving cost center:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving cost center. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteCostCenter = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this cost center?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4001/api/costCenters/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cost center');
      }
      
      // Refresh the data from the server
      await fetchData();
      
      setMessage('Cost center deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error deleting cost center:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting cost center. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh the data from the server to ensure consistency
      await fetchData();
    }
  };

  const handleAddSchemeCode = async () => {
    if (!newSchemeCode.code || !newSchemeCode.name) {
      alert('Please enter both Scheme Code and Name');
      return;
    }
    
    // Check if code already exists
    if (schemeCodes.some(item => item.code === newSchemeCode.code)) {
      alert('This Scheme Code already exists');
      return;
    }
    
    const newItem = {
      id: Date.now(),
      code: newSchemeCode.code,
      name: newSchemeCode.name
    };
    
    setSchemeCodes([...schemeCodes, newItem]);
    setNewSchemeCode({ code: '', name: '' });
    setShowSchemeCodeForm(false);
    try {
      const response = await fetch('http://localhost:4001/api/schemeCodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        throw new Error('Failed to save scheme code to database');
      }
      console.log('Scheme code saved to database successfully');
      
      // Dispatch a custom event to notify other components of the changes
      const event = new CustomEvent('settingsUpdated', {
        detail: { type: 'schemeCodes', data: [...schemeCodes, newItem] }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error saving scheme code to database:', error);
      setMessage('Error saving to database. Changes will be lost unless you save settings.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteSchemeCode = async (id: number) => {
    // Don't allow deletion of "NO_SCHEME" option
    const schemeToDelete = schemeCodes.find(scheme => scheme.id === id);
    if (schemeToDelete && schemeToDelete.code === 'NO_SCHEME') {
      alert('Cannot delete the "No Scheme Code" option as it is required by the system.');
      return;
    }
    
    setSchemeCodes(schemeCodes.filter(item => item.id !== id));
    try {
      const response = await fetch(`http://localhost:4001/api/schemeCodes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete scheme code from database');
      }
      console.log('Scheme code deleted from database successfully');
      
      // Dispatch a custom event to notify other components of the changes
      const event = new CustomEvent('settingsUpdated', {
        detail: { type: 'schemeCodes', data: schemeCodes.filter(item => item.id !== id) }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error deleting scheme code from database:', error);
      setMessage('Error deleting from database. Changes will be lost unless you save settings.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.name || !newVendor.vendorNumber) {
      alert('Please enter both Vendor Name and Vendor Number');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:4001/api/vendors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          name: newVendor.name, 
          vendorNumber: newVendor.vendorNumber,
          contactPerson: '',
          email: '',
          phone: ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vendor');
      }
      
      // Reset form
      setNewVendor({ name: '', vendorNumber: '' });
      setShowVendorForm(false);
      
      // Refresh the data from the server
      await fetchData();
      
      setMessage('Vendor added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error saving vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving vendor. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4001/api/vendors/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vendor');
      }
      
      // Refresh the data from the server
      await fetchData();
      
      setMessage('Vendor deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: unknown) {
      console.error('Error deleting vendor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting vendor. Please try again.';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh the data from the server to ensure consistency
      await fetchData();
    }
  };

  const addIncomeTaxPurchaseRate = () => {
    if (newIncomeTaxPurchaseRate && !taxSettings.incomeTaxPurchaseRates.includes(newIncomeTaxPurchaseRate)) {
      setTaxSettings({
        ...taxSettings,
        incomeTaxPurchaseRates: [...taxSettings.incomeTaxPurchaseRates, newIncomeTaxPurchaseRate]
      });
      setNewIncomeTaxPurchaseRate('');
    }
  };

  const removeIncomeTaxPurchaseRate = (rate: string) => {
    setTaxSettings({
      ...taxSettings,
      incomeTaxPurchaseRates: taxSettings.incomeTaxPurchaseRates.filter(r => r !== rate)
    });
  };

  const addIncomeTaxServiceRate = () => {
    if (newIncomeTaxServiceRate && !taxSettings.incomeTaxServiceRates.includes(newIncomeTaxServiceRate)) {
      setTaxSettings({
        ...taxSettings,
        incomeTaxServiceRates: [...taxSettings.incomeTaxServiceRates, newIncomeTaxServiceRate]
      });
      setNewIncomeTaxServiceRate('');
    }
  };

  const removeIncomeTaxServiceRate = (rate: string) => {
    setTaxSettings({
      ...taxSettings,
      incomeTaxServiceRates: taxSettings.incomeTaxServiceRates.filter(r => r !== rate)
    });
  };

  const addGeneralSalesTaxRate = () => {
    if (newGeneralSalesTaxRate && !taxSettings.generalSalesTaxRates.includes(newGeneralSalesTaxRate)) {
      setTaxSettings({
        ...taxSettings,
        generalSalesTaxRates: [...taxSettings.generalSalesTaxRates, newGeneralSalesTaxRate]
      });
      setNewGeneralSalesTaxRate('');
    }
  };

  const removeGeneralSalesTaxRate = (rate: string) => {
    setTaxSettings({
      ...taxSettings,
      generalSalesTaxRates: taxSettings.generalSalesTaxRates.filter(r => r !== rate)
    });
  };

  const addPunjabSalesTaxRate = () => {
    if (newPunjabSalesTaxRate && !taxSettings.punjabSalesTaxRates.includes(newPunjabSalesTaxRate)) {
      setTaxSettings({
        ...taxSettings,
        punjabSalesTaxRates: [...taxSettings.punjabSalesTaxRates, newPunjabSalesTaxRate]
      });
      setNewPunjabSalesTaxRate('');
    }
  };

  const removePunjabSalesTaxRate = (rate: string) => {
    setTaxSettings({
      ...taxSettings,
      punjabSalesTaxRates: taxSettings.punjabSalesTaxRates.filter(r => r !== rate)
    });
  };

  const addStampDutyRange = () => {
    const max = parseInt(newStampDutyMax);
    const amount = parseInt(newStampDutyAmount);
    
    if (max && amount) {
      // Sort ranges by max value
      const newRanges = [
        ...taxSettings.stampDutyRanges,
        { max, amount }
      ].sort((a, b) => a.max - b.max);
      
      setTaxSettings({
        ...taxSettings,
        stampDutyRanges: newRanges
      });
      
      setNewStampDutyMax('');
      setNewStampDutyAmount('');
    }
  };

  const removeStampDutyRange = (max: number) => {
    setTaxSettings({
      ...taxSettings,
      stampDutyRanges: taxSettings.stampDutyRanges.filter(range => range.max !== max)
    });
  };

  const saveTaxSettings = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('taxSettings', JSON.stringify(taxSettings));
      
      // Save to API if available
      // const isServerAvailable = await checkServerAvailability();
      // if (isServerAvailable) {
      //   // await API.settings.saveTaxSettings(taxSettings);
      // }
      
      setMessage('Tax settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving tax settings:', error);
      setMessage('Error saving tax settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'codes' ? 'active' : ''}`}
          onClick={() => setActiveTab('codes')}
        >
          Codes & Centers
        </button>
        <button 
          className={`tab-button ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          Tax Settings
        </button>
      </div>

      {activeTab === 'general' && (
        <>
          <div className="settings-section">
            <h2>Financial Year</h2>
            <p>Set the current financial year for the application.</p>
            <div className="form-group">
              <label>Current Financial Year</label>
              <select 
                value={selectedFinancialYear}
                onChange={(e) => setSelectedFinancialYear(e.target.value)}
              >
                {financialYears.map((year, index) => (
                  <option key={index} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tax' && (
        <>
          <div className="settings-section">
            <h2>Tax Rates</h2>
            <p>Configure tax rates for different transaction types.</p>
            
            <div className="tax-settings-container">
              <div className="tax-setting-group">
                <h3>Income Tax (Purchase)</h3>
                <div className="tax-rate-input">
                  <input 
                    type="text" 
                    value={newIncomeTaxPurchaseRate} 
                    onChange={(e) => setNewIncomeTaxPurchaseRate(e.target.value)}
                    placeholder="e.g. 4.5"
                  />
                  <button onClick={addIncomeTaxPurchaseRate}>Add</button>
                </div>
                <div className="tax-rates-list">
                  {taxSettings.incomeTaxPurchaseRates.map((rate, index) => (
                    <div key={index} className="tax-rate-item">
                      <span>{rate}%</span>
                      <button onClick={() => removeIncomeTaxPurchaseRate(rate)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="tax-setting-group">
                <h3>Income Tax (Service)</h3>
                <div className="tax-rate-input">
                  <input 
                    type="text" 
                    value={newIncomeTaxServiceRate} 
                    onChange={(e) => setNewIncomeTaxServiceRate(e.target.value)}
                    placeholder="e.g. 10.0"
                  />
                  <button onClick={addIncomeTaxServiceRate}>Add</button>
                </div>
                <div className="tax-rates-list">
                  {taxSettings.incomeTaxServiceRates.map((rate, index) => (
                    <div key={index} className="tax-rate-item">
                      <span>{rate}%</span>
                      <button onClick={() => removeIncomeTaxServiceRate(rate)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="tax-setting-group">
                <h3>General Sales Tax</h3>
                <div className="tax-rate-input">
                  <input 
                    type="text" 
                    value={newGeneralSalesTaxRate} 
                    onChange={(e) => setNewGeneralSalesTaxRate(e.target.value)}
                    placeholder="e.g. 1/5 or 20.0"
                  />
                  <button onClick={addGeneralSalesTaxRate}>Add</button>
                </div>
                <div className="tax-rates-list">
                  {taxSettings.generalSalesTaxRates.map((rate, index) => (
                    <div key={index} className="tax-rate-item">
                      <span>{rate}</span>
                      <button onClick={() => removeGeneralSalesTaxRate(rate)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="tax-setting-group">
                <h3>Punjab Sales Tax</h3>
                <div className="tax-rate-input">
                  <input 
                    type="text" 
                    value={newPunjabSalesTaxRate} 
                    onChange={(e) => setNewPunjabSalesTaxRate(e.target.value)}
                    placeholder="e.g. 16"
                  />
                  <button onClick={addPunjabSalesTaxRate}>Add</button>
                </div>
                <div className="tax-rates-list">
                  {taxSettings.punjabSalesTaxRates.map((rate, index) => (
                    <div key={index} className="tax-rate-item">
                      <span>{rate}%</span>
                      <button onClick={() => removePunjabSalesTaxRate(rate)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="tax-setting-group">
                <h3>Stamp Duty Ranges</h3>
                <div className="stamp-duty-input">
                  <div className="form-group">
                    <label>Max Amount</label>
                    <input 
                      type="number" 
                      value={newStampDutyMax} 
                      onChange={(e) => setNewStampDutyMax(e.target.value)}
                      placeholder="e.g. 500000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duty Amount</label>
                    <input 
                      type="number" 
                      value={newStampDutyAmount} 
                      onChange={(e) => setNewStampDutyAmount(e.target.value)}
                      placeholder="e.g. 3000"
                    />
                  </div>
                  <button onClick={addStampDutyRange}>Add</button>
                </div>
                <div className="stamp-duty-list">
                  <table>
                    <thead>
                      <tr>
                        <th>Max Amount (Rs.)</th>
                        <th>Duty Amount (Rs.)</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxSettings.stampDutyRanges
                        .sort((a, b) => a.max - b.max)
                        .map((range, index) => (
                          <tr key={index}>
                            <td>{range.max.toLocaleString()}</td>
                            <td>{range.amount.toLocaleString()}</td>
                            <td>
                              <button onClick={() => removeStampDutyRange(range.max)}>Delete</button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <button className="primary-button" onClick={saveTaxSettings}>
              Save Tax Settings
            </button>
            {message && <div className="message">{message}</div>}
          </div>
        </>
      )}

      {activeTab === 'codes' && (
        <>
          <div className="settings-section">
            <h2>Object Codes</h2>
            <p>Manage object codes and their descriptions for budget allocation.</p>
            
            {showObjectCodeForm ? (
              <div className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label>Object Code</label>
                    <input 
                      type="text" 
                      value={newObjectCode.code}
                      onChange={(e) => setNewObjectCode({...newObjectCode, code: e.target.value})}
                      placeholder="e.g. A01101"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      value={newObjectCode.description}
                      onChange={(e) => setNewObjectCode({...newObjectCode, description: e.target.value})}
                      placeholder="e.g. Basic Pay of Officers"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowObjectCodeForm(false)}>
                      Cancel
                    </button>
                    <button className="save-button" onClick={handleAddObjectCode}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="secondary-button" onClick={() => setShowObjectCodeForm(true)}>
                Add New Object Code
              </button>
            )}
            
            {objectCodes.length > 0 && (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Object Code</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objectCodes.map(item => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{item.description}</td>
                        <td>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteObjectCode(item.id)}
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

          <div className="settings-section">
            <h2>Cost Centers</h2>
            <p>Manage cost centers for budget allocation and expense tracking.</p>
            
            {showCostCenterForm ? (
              <div className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Center Code</label>
                    <input 
                      type="text" 
                      value={newCostCenter.code}
                      onChange={(e) => setNewCostCenter({...newCostCenter, code: e.target.value})}
                      placeholder="e.g. LZ4064"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost Center Name</label>
                    <input 
                      type="text" 
                      value={newCostCenter.name}
                      onChange={(e) => setNewCostCenter({...newCostCenter, name: e.target.value})}
                      placeholder="e.g. Directorate General Monitoring & Evaluation"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowCostCenterForm(false)}>
                      Cancel
                    </button>
                    <button className="save-button" onClick={handleAddCostCenter}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="secondary-button" onClick={() => setShowCostCenterForm(true)}>
                Add New Cost Center
              </button>
            )}
            
            {costCenters.length > 0 && (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cost Center Code</th>
                      <th>Cost Center Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costCenters.map(item => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteCostCenter(item.id)}
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
          
          <div className="settings-section">
            <h2>Scheme Codes</h2>
            <p>Manage scheme codes for budget allocation and expense tracking.</p>
            
            {showSchemeCodeForm ? (
              <div className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label>Scheme Code</label>
                    <input 
                      type="text" 
                      value={newSchemeCode.code}
                      onChange={(e) => setNewSchemeCode({...newSchemeCode, code: e.target.value})}
                      placeholder="e.g. LO17007507"
                    />
                  </div>
                  <div className="form-group">
                    <label>Scheme Name</label>
                    <input 
                      type="text" 
                      value={newSchemeCode.name}
                      onChange={(e) => setNewSchemeCode({...newSchemeCode, name: e.target.value})}
                      placeholder="e.g. Development Scheme 1"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowSchemeCodeForm(false)}>
                      Cancel
                    </button>
                    <button className="save-button" onClick={handleAddSchemeCode}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="secondary-button" onClick={() => setShowSchemeCodeForm(true)}>
                Add New Scheme Code
              </button>
            )}
            
            {schemeCodes.length > 0 && (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Scheme Code</th>
                      <th>Scheme Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemeCodes.map(item => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteSchemeCode(item.id)}
                            disabled={item.code === 'NO_SCHEME'}
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
          
          <div className="settings-section">
            <h2>Vendors</h2>
            <p>Manage vendors for transactions and payments.</p>
            
            {showVendorForm ? (
              <div className="form-container">
                <div className="form-row">
                  <div className="form-group">
                    <label>Vendor Name</label>
                    <input 
                      type="text" 
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      placeholder="e.g. Mustansar Hussain"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vendor Number</label>
                    <input 
                      type="text" 
                      value={newVendor.vendorNumber}
                      onChange={(e) => setNewVendor({...newVendor, vendorNumber: e.target.value})}
                      placeholder="e.g. 30966550"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowVendorForm(false)}>
                      Cancel
                    </button>
                    <button className="save-button" onClick={handleAddVendor}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button className="secondary-button" onClick={() => setShowVendorForm(true)}>
                Add New Vendor
              </button>
            )}
            
            {vendors.length > 0 && (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th>Vendor Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.vendorNumber}</td>
                        <td>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteVendor(item.id)}
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
        </>
      )}

      {/* Remove the Save All Settings button and its related logic from the settings-actions section. */}
    </div>
  );
};

export default Settings;
