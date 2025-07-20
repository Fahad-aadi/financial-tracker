import React, { useState, useEffect } from 'react';
import './EnhancedTransactionForm.css';
import { API, checkServerAvailability   } from '../services/api';
import PrintableForms from './PrintableForms';

// Helper function to format date to DD-MM-YYYY
const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to parse DD-MM-YYYY to Date object
const parseDDMMYYYY = (dateString: string): Date => {
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to convert date string to format suitable for date input field
const convertDateForDateInput = (dateString: string): string => {
  const [day, month, year] = dateString.split('-').map(Number);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Helper function to convert date string from date input field to DD-MM-YYYY format
const convertDateFromInput = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
};

// Interface definitions
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

interface BillNumber {
  objectCode: string;
  lastNumber: number;
  deletedNumbers: number[];
}

interface FormData {
  // Section 1: Basic Information
  financialYear: string;
  costCenter: string;
  costCenterName: string;
  schemeCode: string;
  schemeName: string;
  vendorName: string;
  vendorNumber: string;
  date: string;
  billNumber: string;
  
  // Section 2: Bill Nature
  billNature: string;
  
  // Section 3: Object Code
  objectCode: string;
  objectDescription: string;
  
  // Section 4: Amount
  grossAmount: string;
  goodsAmount: string;
  servicesAmount: string;
  
  // Section 5: Tax Section
  gstAmount: string;
  pstAmount: string;
  contractType: string;
  contractAmount: string;
  stampDuty: string;
  advanceIncomeTax: string;
  incomeTaxPurchaseRate: string;
  incomeTaxPurchaseAmount: string;
  incomeTaxServiceRate: string;
  incomeTaxServiceAmount: string;
  generalSalesTaxRate: string;
  generalSalesTaxAmount: string;
  punjabSalesTaxRate: string;
  punjabSalesTaxAmount: string;
  netAmount: string;
  
  // Section 6: Bill Details
  billDetail: string;
  billDescription: string;
  
  // Additional fields needed for transaction saving
  transactionType?: string;
  description?: string;
  category?: string;
  
  // Fields from original transaction object if editing
  id?: number;
  type?: string;
  amount?: number;
  payee?: string;
}

interface EnhancedTransactionFormProps {
  onSave: (transaction: any) => void;
  onCancel: () => void;
  editTransaction?: any;
  viewMode?: boolean;
}

// Main component
const EnhancedTransactionForm: React.FC<EnhancedTransactionFormProps> = ({ onSave, editTransaction, onCancel, viewMode = false }) => {
  // Load data from settings
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [schemeCodes, setSchemeCodes] = useState<SchemeCode[]>([]);
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [billNumbers, setBillNumbers] = useState<BillNumber[]>([]);
  
  // Add a separate state for gross amount
  const [grossAmount, setGrossAmount] = useState('');
  
  // Search and filter states
  const [costCenterSearch, setCostCenterSearch] = useState('');
  const [schemeCodeSearch, setSchemeCodeSearch] = useState('');
  const [objectCodeSearch, setObjectCodeSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  
  // Dropdown visibility states
  const [showCostCenterDropdown, setShowCostCenterDropdown] = useState(false);
  const [showSchemeCodeDropdown, setShowSchemeCodeDropdown] = useState(false);
  const [showObjectCodeDropdown, setShowObjectCodeDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<FormData>({
    // Section 1: Basic Information
    financialYear: '',
    costCenter: '',
    costCenterName: '',
    schemeCode: '',
    schemeName: '',
    vendorName: '',
    vendorNumber: '',
    date: formatDateToDDMMYYYY(new Date()),
    billNumber: '',
    
    // Section 2: Bill Nature
    billNature: 'No Tax',
    
    // Section 3: Object Code
    objectCode: '',
    objectDescription: '',
    
    // Section 4: Amount
    grossAmount: '',
    goodsAmount: '',
    servicesAmount: '',
    
    // Section 5: Tax Section
    gstAmount: '0',
    pstAmount: '0',
    contractType: 'Procure',
    contractAmount: '0',
    stampDuty: '0',
    advanceIncomeTax: '0',
    incomeTaxPurchaseRate: '4.5', 
    incomeTaxPurchaseAmount: '0',
    incomeTaxServiceRate: '10', 
    incomeTaxServiceAmount: '0',
    generalSalesTaxRate: '1/5', 
    generalSalesTaxAmount: '0',
    punjabSalesTaxRate: '16', 
    punjabSalesTaxAmount: '0',
    netAmount: '0',
    
    // Section 6: Bill Details
    billDetail: '',
    billDescription: ''
  });
  
  // State for dropdown options
  const [isLoading, setIsLoading] = useState(false);
  
  // State for printable forms
  const [showPrintableForms, setShowPrintableForms] = useState(false);
  const [savedTransactionData, setSavedTransactionData] = useState<any>(null);

  // State for tax rates from settings
  const [taxRates, setTaxRates] = useState({
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

  // Function to calculate stamp duty based on contract amount and type
  const calculateStampDuty = (contractType: string, contractAmount: number): number => {
    console.log(`Calculating stamp duty: Type=${contractType}, Amount=${contractAmount}`);
    
    if (!contractAmount || contractAmount <= 0) return 0;
    
    if (contractType.toLowerCase() === 'work') {
      for (const range of taxRates.stampDutyRanges) {
        if (contractAmount < range.max) {
          console.log(`Stamp duty calculated: ${range.amount} (Work contract < ${range.max})`);
          return range.amount;
        }
      }
      console.log(`Stamp duty calculated: 30000 (Work contract, very large amount)`);
      return 30000; 
    } else {
      const calculatedAmount = Math.round(contractAmount * 0.0025); 
      console.log(`Stamp duty calculated: ${calculatedAmount} (Procure contract, 0.25%)`);
      return calculatedAmount;
    }
  };

  // Function to calculate GST based on bill nature and amounts
  const calculateGST = (billNature: string, grossAmount: number, goodsAmount: number): number => {
    if (billNature === 'Goods') {
      return Math.round((grossAmount / 118) * 18);
    } else if (billNature === 'Goods+Services') {
      return Math.round((goodsAmount / 100) * 18);
    }
    return 0;
  };

  // Function to calculate PST based on bill nature and amounts
  const calculatePST = (billNature: string, grossAmount: number, servicesAmount: number): number => {
    if (billNature === 'Services') {
      return Math.round((grossAmount / 116) * 16);
    } else if (billNature === 'Goods+Services') {
      return Math.round((servicesAmount / 100) * 16);
    }
    return 0;
  };

  // Enhanced function to calculate all tax-related values
  const calculateTaxValues = (data: any, grossAmountValue: string) => {
    const updatedData = { ...data };
    const grossAmount = parseFloat(grossAmountValue) || 0;
    const goodsAmount = parseFloat(data.goodsAmount) || 0;
    const servicesAmount = parseFloat(data.servicesAmount) || 0;
    const contractAmount = parseFloat(data.contractAmount) || 0;
    
    console.log(`Calculating tax values with: grossAmount=${grossAmount}, goodsAmount=${goodsAmount}, servicesAmount=${servicesAmount}, contractAmount=${contractAmount}`);
    
    const gstAmount = calculateGST(data.billNature, grossAmount, goodsAmount);
    updatedData.gstAmount = gstAmount.toString();
    
    const pstAmount = calculatePST(data.billNature, grossAmount, servicesAmount);
    updatedData.pstAmount = pstAmount.toString();
    
    const stampDuty = calculateStampDuty(data.contractType || 'Work', contractAmount);
    updatedData.stampDuty = stampDuty.toString();
    console.log(`Updated stamp duty: ${updatedData.stampDuty}`);
    
    const purchaseRate = parseFloat(data.incomeTaxPurchaseRate) / 100;
    const gstBaseAmount = gstAmount / 18 * 100 + gstAmount;
    const purchaseAmount = Math.round(purchaseRate * gstBaseAmount);
    updatedData.incomeTaxPurchaseAmount = purchaseAmount.toString();
    
    const serviceRate = parseFloat(data.incomeTaxServiceRate) / 100;
    const pstBaseAmount = pstAmount / 16 * 100 + pstAmount;
    const serviceAmount = Math.round(serviceRate * pstBaseAmount);
    updatedData.incomeTaxServiceAmount = serviceAmount.toString();
    
    const generalSalesTaxRate = parseFloat(data.generalSalesTaxRate) || 0;
    updatedData.generalSalesTaxAmount = Math.round(gstAmount * generalSalesTaxRate / 100).toString();
    
    const punjabSalesTaxRate = parseFloat(data.punjabSalesTaxRate) || 0;
    updatedData.punjabSalesTaxAmount = Math.round(pstAmount * punjabSalesTaxRate / 100).toString();
    
    const stampDutyAmount = parseFloat(updatedData.stampDuty) || 0;
    const advanceIncomeTax = parseFloat(data.advanceIncomeTax) || 0;
    const incomeTaxPurchaseAmount = parseFloat(updatedData.incomeTaxPurchaseAmount) || 0;
    const incomeTaxServiceAmount = parseFloat(updatedData.incomeTaxServiceAmount) || 0;
    const generalSalesTaxAmount = parseFloat(updatedData.generalSalesTaxAmount) || 0;
    const punjabSalesTaxAmount = parseFloat(updatedData.punjabSalesTaxAmount) || 0;
    
    const totalDeductions = stampDutyAmount + advanceIncomeTax + incomeTaxPurchaseAmount + 
                           incomeTaxServiceAmount + generalSalesTaxAmount + punjabSalesTaxAmount;
    
    const netAmount = grossAmount - totalDeductions;
    updatedData.netAmount = netAmount.toFixed(2);
    
    return updatedData;
  };

  // Update tax calculations based on gross amount
  const updateTaxCalculations = (grossAmountValue: number) => {
    const updatedData = calculateTaxValues(formData, grossAmountValue.toString());
    
    setFormData(updatedData);
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    console.log(`Changing ${name}:`, value);  
    
    const updatedFormData = { ...formData } as any; 
    updatedFormData[name] = value;
    
    if (name === 'grossAmount') {
      setGrossAmount(value);
    }
    
    setFormData(updatedFormData);
    
    if (name === 'grossAmount' || name === 'goodsAmount' || name === 'servicesAmount' || 
        name === 'contractAmount' || name === 'advanceIncomeTax') {
      setTimeout(() => {
        const updatedData = calculateTaxValues(updatedFormData, name === 'grossAmount' ? value : grossAmount);
        setFormData(updatedData);
      }, 10);
    }
  };

  // Handle input change for dropdowns and other inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    console.log(`Input changed: ${name} = ${value}`);
    
    const updatedFormData = { ...formData } as any; 
    updatedFormData[name] = value;
    
    setFormData(updatedFormData);
    
    if (name === 'billNature' || name === 'contractType' || 
        name === 'incomeTaxPurchaseRate' || name === 'incomeTaxServiceRate' || 
        name === 'generalSalesTaxRate' || name === 'punjabSalesTaxRate') {
      setTimeout(() => {
        console.log(`Recalculating due to ${name} change to ${value}`);
        const updatedData = calculateTaxValues(updatedFormData, grossAmount);
        setFormData(updatedData);
      }, 10);
    }
  };

  // Force immediate calculation when bill nature changes
  const handleBillNatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Bill nature changed to: ${value}`);
    
    const updatedFormData = { ...formData } as any;
    updatedFormData[name] = value;
    
    setFormData(updatedFormData);
    
    setTimeout(() => {
      console.log(`Calculating taxes after bill nature change to ${value}`);
      const updatedData = calculateTaxValues(updatedFormData, grossAmount);
      setFormData(updatedData);
    }, 10);
  };

  // Force immediate calculation when contract type changes
  const handleContractTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Contract type changed to: ${value}`);
    
    const updatedFormData = { ...formData } as any;
    updatedFormData[name] = value;
    
    setFormData(updatedFormData);
    
    setTimeout(() => {
      console.log(`Calculating taxes after contract type change to ${value}`);
      const updatedData = calculateTaxValues(updatedFormData, grossAmount);
      setFormData(updatedData);
    }, 10);
  };

  // Handle date input changes
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedDate = convertDateFromInput(value);
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: formattedDate };
      
      return calculateDependentValues(updatedData);
    });
  };

  // Calculate all dependent values based on current form data
  const calculateDependentValues = (data: any) => {
    const updatedData = { ...data };
    const grossAmount = parseFloat(data.grossAmount) || 0;
    const goodsAmount = parseFloat(data.goodsAmount) || 0;
    const servicesAmount = parseFloat(data.servicesAmount) || 0;
    
    if (data.billNature === 'Goods') {
      updatedData.gstAmount = Math.round((grossAmount / 118) * 18);
    } else if (data.billNature === 'Goods+Services') {
      updatedData.gstAmount = Math.round((goodsAmount / 100) * 18);
    } else {
      updatedData.gstAmount = 0;
    }
    
    if (data.billNature === 'Services') {
      updatedData.pstAmount = Math.round((grossAmount / 116) * 16);
    } else if (data.billNature === 'Goods+Services') {
      updatedData.pstAmount = Math.round((servicesAmount / 100) * 16);
    } else {
      updatedData.pstAmount = 0;
    }
    
    const contractAmount = parseFloat(data.contractAmount) || 0;
    if (data.contractType === 'Work') {
      if (contractAmount <= 0) {
        updatedData.stampDuty = 0;
      } else if (contractAmount < 500001) {
        updatedData.stampDuty = 3000;
      } else if (contractAmount < 1000001) {
        updatedData.stampDuty = 5000;
      } else if (contractAmount < 5000001) {
        updatedData.stampDuty = 8000;
      } else if (contractAmount < 15000001) {
        updatedData.stampDuty = 15000;
      } else {
        updatedData.stampDuty = 30000;
      }
    } else {
      updatedData.stampDuty = Math.round(contractAmount * 0.0025);
    }
    
    const incomeTaxPurchaseRate = parseFloat(data.incomeTaxPurchaseRate) || 0;
    const gstAmount = parseFloat(updatedData.gstAmount) || 0;
    updatedData.incomeTaxPurchaseAmount = Math.round(incomeTaxPurchaseRate * (gstAmount / 18 * 100 + gstAmount) / 100);
    
    const incomeTaxServiceRate = parseFloat(data.incomeTaxServiceRate) || 0;
    const pstAmount = parseFloat(updatedData.pstAmount) || 0;
    updatedData.incomeTaxServiceAmount = Math.round(incomeTaxServiceRate * (pstAmount / 16 * 100 + pstAmount) / 100);
    
    const generalSalesTaxRate = parseFloat(data.generalSalesTaxRate) || 0;
    updatedData.generalSalesTaxAmount = Math.round(gstAmount * generalSalesTaxRate / 100);
    
    const punjabSalesTaxRate = parseFloat(data.punjabSalesTaxRate) || 0;
    updatedData.punjabSalesTaxAmount = Math.round(pstAmount * punjabSalesTaxRate / 100).toString();
    
    const stampDuty = parseFloat(updatedData.stampDuty) || 0;
    const advanceIncomeTax = parseFloat(data.advanceIncomeTax) || 0;
    const incomeTaxPurchaseAmount = parseFloat(updatedData.incomeTaxPurchaseAmount) || 0;
    const incomeTaxServiceAmount = parseFloat(updatedData.incomeTaxServiceAmount) || 0;
    const generalSalesTaxAmount = parseFloat(updatedData.generalSalesTaxAmount) || 0;
    const punjabSalesTaxAmount = parseFloat(updatedData.punjabSalesTaxAmount) || 0;
    
    updatedData.netAmount = grossAmount - stampDuty - advanceIncomeTax - 
                           incomeTaxPurchaseAmount - incomeTaxServiceAmount - 
                           generalSalesTaxAmount - punjabSalesTaxAmount;
    
    return updatedData;
  };

  // Handle object code selection
  const handleObjectCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const selectedObjectCode = objectCodes.find(code => code.code === value);
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: value,
        objectDescription: selectedObjectCode ? selectedObjectCode.description : ''
      };
      
      if (!editTransaction && !prev.billNumber && value) {
        const billNumber = generateBillNumberSync(value);
        return {
          ...updatedData,
          billNumber
        };
      }
      
      return updatedData;
    });
  };

  // Synchronous version of generateBillNumber that returns the bill number
  const generateBillNumberSync = (objectCode: string): string => {
    if (editTransaction && editTransaction.billNumber) {
      return editTransaction.billNumber;
    }
    
    const existingRecord = billNumbers.find(record => record.objectCode === objectCode);
    
    let newBillNumber: number;
    let updatedBillNumbers: BillNumber[];
    
    if (existingRecord) {
      if (existingRecord.deletedNumbers && existingRecord.deletedNumbers.length > 0) {
        const smallestDeleted = Math.min(...existingRecord.deletedNumbers);
        newBillNumber = smallestDeleted;
        
        const updatedDeletedNumbers = existingRecord.deletedNumbers.filter(
          num => num !== smallestDeleted
        );
        
        updatedBillNumbers = billNumbers.map(record => {
          if (record.objectCode === objectCode) {
            return {
              ...record,
              deletedNumbers: updatedDeletedNumbers
            };
          }
          return record;
        });
      } else {
        newBillNumber = existingRecord.lastNumber + 1;
        
        updatedBillNumbers = billNumbers.map(record => {
          if (record.objectCode === objectCode) {
            return {
              ...record,
              lastNumber: newBillNumber
            };
          }
          return record;
        });
      }
    } else {
      newBillNumber = 1;
      updatedBillNumbers = [
        ...billNumbers,
        {
          objectCode,
          lastNumber: newBillNumber,
          deletedNumbers: []
        }
      ];
    }
    
    setBillNumbers(updatedBillNumbers);
    localStorage.setItem('billNumbers', JSON.stringify(updatedBillNumbers));
    
    try {
      // This would be an API call to save bill numbers
      // For now, we're just using localStorage
    } catch (error) {
      console.error('Error saving bill numbers:', error);
    }
    
    return `${objectCode}-${newBillNumber}`;
  };

  // Handle cost center selection
  const handleCostCenterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const selectedCostCenter = costCenters.find(center => center.code === value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      costCenterName: selectedCostCenter ? selectedCostCenter.name : ''
    }));
  };

  // Handle scheme code selection
  const handleSchemeCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const selectedSchemeCode = schemeCodes.find(scheme => scheme.code === value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      schemeName: selectedSchemeCode ? selectedSchemeCode.name : ''
    }));
  };

  // Handle vendor selection
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const selectedVendor = vendors.find(vendor => vendor.name === value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      vendorNumber: selectedVendor ? selectedVendor.vendorNumber : ''
    }));
  };

  // Directly load settings from the Settings component's initial state
  useEffect(() => {
    // Set initial data for all dropdown lists
    const defaultCostCenters = [
      { id: 1, code: 'LZ4064', name: 'Directorate General Monitoring & Evaluation' },
      { id: 2, code: 'LZ4065', name: 'Planning & Development Department' },
      { id: 3, code: 'LZ4066', name: 'Finance Department' }
    ];
    setCostCenters(defaultCostCenters);
    
    const defaultSchemeCodes = [
      { id: 1, code: 'ADP0001', name: 'Annual Development Program 1' },
      { id: 2, code: 'ADP0002', name: 'Annual Development Program 2' },
      { id: 3, code: 'ADP0003', name: 'Annual Development Program 3' }
    ];
    setSchemeCodes(defaultSchemeCodes);
    
    const defaultObjectCodes = [
      { id: 1, code: 'A01101', description: 'Basic Pay of Officers' },
      { id: 2, code: 'A01151', description: 'Basic Pay of Officials' },
      { id: 3, code: 'A03201', description: 'Postage and Telegraph' },
      { id: 4, code: 'A03770', description: 'Consultancy and Contractual work - Others' }
    ];
    setObjectCodes(defaultObjectCodes);
    
    const defaultVendors = [
      { id: 1, name: 'ABC Corporation', vendorNumber: 'V001' },
      { id: 2, name: 'XYZ Services', vendorNumber: 'V002' },
      { id: 3, name: 'Local Supplier Ltd', vendorNumber: 'V003' }
    ];
    setVendors(defaultVendors);
    
    const years = [
      '2023-24', '2024-25', '2025-26', '2026-27'
    ];
    setFinancialYears(years);
    
    // Try to load from localStorage as a second attempt
    try {
      // Load cost centers
      const storedCostCenters = localStorage.getItem('costCenters');
      if (storedCostCenters) {
        const parsed = JSON.parse(storedCostCenters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCostCenters(parsed);
          console.log("Successfully loaded cost centers from localStorage:", parsed);
        }
      }
      
      // Load scheme codes
      const storedSchemeCodes = localStorage.getItem('schemeCodes');
      if (storedSchemeCodes) {
        const parsed = JSON.parse(storedSchemeCodes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSchemeCodes(parsed);
          console.log("Successfully loaded scheme codes from localStorage:", parsed);
        }
      }
      
      // Load object codes
      const storedObjectCodes = localStorage.getItem('objectCodes');
      if (storedObjectCodes) {
        const parsed = JSON.parse(storedObjectCodes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setObjectCodes(parsed);
          console.log("Successfully loaded object codes from localStorage:", parsed);
        }
      }
      
      // Load vendors
      const storedVendors = localStorage.getItem('vendors');
      if (storedVendors) {
        const parsed = JSON.parse(storedVendors);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVendors(parsed);
          console.log("Successfully loaded vendors from localStorage:", parsed);
        }
      }
      
      // Load financial years
      const storedFinancialYears = localStorage.getItem('financialYears');
      if (storedFinancialYears) {
        const parsed = JSON.parse(storedFinancialYears);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFinancialYears(parsed);
          console.log("Successfully loaded financial years from localStorage:", parsed);
        }
      }
      
      // Load tax rates from localStorage
      const storedTaxSettings = localStorage.getItem('taxSettings');
      if (storedTaxSettings) {
        const parsed = JSON.parse(storedTaxSettings);
        if (parsed) {
          setTaxRates({
            incomeTaxPurchaseRates: Array.isArray(parsed.incomeTaxPurchaseRates) ? parsed.incomeTaxPurchaseRates : taxRates.incomeTaxPurchaseRates,
            incomeTaxServiceRates: Array.isArray(parsed.incomeTaxServiceRates) ? parsed.incomeTaxServiceRates : taxRates.incomeTaxServiceRates,
            generalSalesTaxRates: Array.isArray(parsed.generalSalesTaxRates) ? parsed.generalSalesTaxRates : taxRates.generalSalesTaxRates,
            punjabSalesTaxRates: Array.isArray(parsed.punjabSalesTaxRates) ? parsed.punjabSalesTaxRates : taxRates.punjabSalesTaxRates,
            stampDutyRanges: Array.isArray(parsed.stampDutyRanges) ? parsed.stampDutyRanges : taxRates.stampDutyRanges
          });
          console.log("Successfully loaded tax rates from localStorage:", parsed);
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, []);

  // Initialize form data with default values - only run this once
  useEffect(() => {
    // Skip if we're editing a transaction
    if (editTransaction) {
      console.log("Skipping default initialization because we're editing a transaction");
      return;
    }
    
    console.log("Initializing default form data for new transaction");
    setFormData({
      // Section 1: Basic Information
      financialYear: financialYears[0] || '2024-25',
      costCenter: '',
      costCenterName: '',
      schemeCode: '',
      schemeName: '',
      vendorName: '',
      vendorNumber: '',
      date: formatDateToDDMMYYYY(new Date()),
      billNumber: '',
      
      // Section 2: Bill Nature
      billNature: 'NoTax',
      
      // Section 3: Object Code
      objectCode: '',
      objectDescription: '',
      
      // Section 4: Amount
      grossAmount: '',
      goodsAmount: '',
      servicesAmount: '',
      
      // Section 5: Tax Section
      gstAmount: '0',
      pstAmount: '0',
      contractType: 'Procure',
      contractAmount: '0',
      stampDuty: '0',
      advanceIncomeTax: '0',
      incomeTaxPurchaseRate: '4.5',
      incomeTaxPurchaseAmount: '0',
      incomeTaxServiceRate: '10',
      incomeTaxServiceAmount: '0',
      generalSalesTaxRate: '1/5',
      generalSalesTaxAmount: '0',
      punjabSalesTaxRate: '16',
      punjabSalesTaxAmount: '0',
      netAmount: '0',
      
      // Section 6: Bill Details
      billDetail: '',
      billDescription: ''
    });
    
    setGrossAmount('');
  }, [editTransaction, financialYears]);

  // If we're editing an existing transaction, populate the form with its data
  useEffect(() => {
    if (!editTransaction) return;
    
    console.log("Editing transaction with data:", editTransaction);
    
    // Create a new form data object with all the transaction data
    const newFormData = {
      // Section 1: Basic Information
      financialYear: editTransaction.financialYear || financialYears[0] || '2024-25',
      costCenter: editTransaction.costCenter || '',
      costCenterName: editTransaction.costCenterName || '',
      schemeCode: editTransaction.schemeCode || '',
      schemeName: editTransaction.schemeName || '',
      vendorName: editTransaction.vendorName || '',
      vendorNumber: editTransaction.vendorNumber || '',
      date: editTransaction.date || formatDateToDDMMYYYY(new Date()),
      billNumber: editTransaction.billNumber || '',
      
      // Section 2: Bill Nature
      billNature: editTransaction.billNature || 'NoTax',
      
      // Section 3: Object Code
      objectCode: editTransaction.objectCode || '',
      objectDescription: editTransaction.objectDescription || '',
      
      // Section 4: Amount
      grossAmount: (editTransaction.grossAmount || editTransaction.amount || '').toString(),
      goodsAmount: (editTransaction.goodsAmount || '').toString(),
      servicesAmount: (editTransaction.servicesAmount || '').toString(),
      
      // Section 5: Tax Section
      gstAmount: (editTransaction.gstAmount || '0').toString(),
      pstAmount: (editTransaction.pstAmount || '0').toString(),
      contractType: editTransaction.contractType || 'Procure',
      contractAmount: (editTransaction.contractAmount || '0').toString(),
      stampDuty: (editTransaction.stampDuty || '0').toString(),
      advanceIncomeTax: (editTransaction.advanceIncomeTax || '0').toString(),
      incomeTaxPurchaseRate: (editTransaction.incomeTaxPurchaseRate || '4.5').toString(),
      incomeTaxPurchaseAmount: (editTransaction.incomeTaxPurchaseAmount || '0').toString(),
      incomeTaxServiceRate: (editTransaction.incomeTaxServiceRate || '10').toString(),
      incomeTaxServiceAmount: (editTransaction.incomeTaxServiceAmount || '0').toString(),
      generalSalesTaxRate: (editTransaction.generalSalesTaxRate || '1/5').toString(),
      generalSalesTaxAmount: (editTransaction.generalSalesTaxAmount || '0').toString(),
      punjabSalesTaxRate: (editTransaction.punjabSalesTaxRate || '16').toString(),
      punjabSalesTaxAmount: (editTransaction.punjabSalesTaxAmount || '0').toString(),
      netAmount: (editTransaction.netAmount || '0').toString(),
      
      // Section 6: Bill Details
      billDetail: editTransaction.billDetail || '',
      billDescription: editTransaction.billDescription || ''
    };
    
    // Set gross amount separately (crucial for proper display)
    if (editTransaction.grossAmount) {
      setGrossAmount(editTransaction.grossAmount.toString());
      console.log("Setting gross amount to:", editTransaction.grossAmount.toString());
    } else if (editTransaction.amount) {
      setGrossAmount(editTransaction.amount.toString());
      console.log("Setting gross amount to:", editTransaction.amount.toString());
    }
    
    // Set the form data
    console.log("Setting form data for edit transaction:", newFormData);
    setFormData(newFormData);
    
    // Force recalculation of tax values after a short delay
    setTimeout(() => {
      const grossAmountValue = editTransaction.grossAmount || editTransaction.amount || '0';
      console.log("Recalculating tax values with gross amount:", grossAmountValue);
      const updatedData = calculateTaxValues(newFormData, grossAmountValue.toString());
      setFormData(updatedData);
    }, 200);
  }, [editTransaction]);

  // Initialize calculations when component mounts
  useEffect(() => {
    // Skip initial calculations if we're editing a transaction
    if (editTransaction) {
      console.log("Skipping initial calculations because we're editing a transaction");
      return;
    }
    
    console.log("Triggering initial calculations after setting defaults");
    const updatedData = calculateTaxValues(formData, formData.grossAmount);
    setFormData(updatedData);
  }, []);

  // Initialize default values for form data
  useEffect(() => {
    if (!isLoading) {
      setFormData(prev => ({
        ...prev,
        billNature: 'No Tax',
        contractType: 'Procure',
        incomeTaxPurchaseRate: taxRates.incomeTaxPurchaseRates[0] || '4.5',
        incomeTaxServiceRate: taxRates.incomeTaxServiceRates[0] || '10.0',
        generalSalesTaxRate: taxRates.generalSalesTaxRates[1] || '20.0',
        punjabSalesTaxRate: taxRates.punjabSalesTaxRates[1] || '100.0'
      }));
      
      setTimeout(() => {
        console.log("Triggering initial calculations after setting defaults");
        const updatedData = calculateTaxValues(formData, grossAmount);
        setFormData(updatedData);
      }, 100);
    }
  }, [isLoading, taxRates]);

  // Update calculations when bill nature or contract type changes
  useEffect(() => {
    if (formData.billNature || formData.contractType) {
      console.log(`Bill nature or contract type changed: ${formData.billNature}, ${formData.contractType}`);
      const updatedData = calculateTaxValues(formData, grossAmount);
      setFormData(updatedData);
    }
  }, [formData.billNature, formData.contractType]);

  // Debug function to log form data changes
  useEffect(() => {
    console.log("Form data updated:", formData);
    console.log("Current dropdown data:");
    console.log("- Cost Centers:", costCenters);
    console.log("- Scheme Codes:", schemeCodes);
    console.log("- Object Codes:", objectCodes);
    console.log("- Vendors:", vendors);
    
    // Check if dropdown values exist in their respective lists
    if (formData.costCenter) {
      const matchingCC = costCenters.find(cc => cc.code === formData.costCenter);
      console.log("Matching cost center for", formData.costCenter, ":", matchingCC);
    }
    
    if (formData.schemeCode) {
      const matchingSC = schemeCodes.find(sc => sc.code === formData.schemeCode);
      console.log("Matching scheme code for", formData.schemeCode, ":", matchingSC);
    }
    
    if (formData.objectCode) {
      const matchingOC = objectCodes.find(oc => oc.code === formData.objectCode);
      console.log("Matching object code for", formData.objectCode, ":", matchingOC);
    }
    
    if (formData.vendorName) {
      const matchingVendor = vendors.find(v => v.name === formData.vendorName);
      console.log("Matching vendor for", formData.vendorName, ":", matchingVendor);
    }
  }, [formData, costCenters, schemeCodes, objectCodes, vendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.costCenter || !formData.objectCode || !formData.date || !grossAmount) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Calculate all dependent values one final time
    const finalData = calculateDependentValues({...formData});
    
    // Prepare transaction data
    const transactionData = {
      ...finalData,
      // If editing, preserve the ID
      id: editTransaction?.id,
      // Set transaction type
      type: 'expense',
      // Set description from object code and description
      description: `${finalData.objectCode} - ${finalData.objectDescription}`,
      // Set reference from vendor name and date
      reference: `${finalData.vendorName} - ${finalData.date}`,
      // Set amount from gross amount
      amount: parseFloat(finalData.grossAmount) || 0,
      // Set net amount
      netAmount: parseFloat(finalData.netAmount) || 0,
      // Set status
      status: editTransaction?.status || 'pending',
      // Preserve payment details if editing
      paymentDetails: editTransaction?.paymentDetails,
      // Add fields needed for Cost Center Report
      costCenter: finalData.costCenter,
      costCenterName: finalData.costCenterName,
      objectCode: finalData.objectCode,
      objectDescription: finalData.objectDescription,
      financialYear: finalData.financialYear || localStorage.getItem('financialYear') || '2024-2025'
    };
    
    console.log('Submitting transaction data:', transactionData);
    
    try {
      // First save the transaction data
      await onSave(transactionData);
      
      // Then show the printable forms
      setSavedTransactionData(transactionData);
      setShowPrintableForms(true);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("There was an error saving the transaction. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="loading">Loading form data...</div>;
  }

  return (
    <React.Fragment>
      {showPrintableForms && savedTransactionData && (
        <PrintableForms 
          transactionData={savedTransactionData} 
          onClose={() => setShowPrintableForms(false)} 
          onSaveAndReturn={() => {
            setShowPrintableForms(false);
            onCancel(); // Return to the transactions list
          }}
        />
      )}
      
      {!showPrintableForms && (
        <div className="enhanced-transaction-form">
          <div className="form-header">
            <h2>{editTransaction ? (viewMode ? 'View Transaction' : 'Edit Transaction') : 'Add New Transaction'}</h2>
            <button className="close-button" onClick={onCancel}>×</button>
          </div>
          
          <div className="form-content">
            <form onSubmit={handleSubmit}>
              {/* Section 1: Basic Information */}
              <div className="form-section">
                <h3>1. Basic Information</h3>
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
                      {financialYears.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Cost Center</label>
                    <select
                      name="costCenter"
                      value={formData.costCenter || ''}
                      onChange={handleCostCenterChange}
                      required
                    >
                      <option value="">Select Cost Center</option>
                      {costCenters.map(center => (
                        <option 
                          key={center.id} 
                          value={center.code}
                        >
                          {center.code} - {center.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Scheme Code</label>
                    <select
                      name="schemeCode"
                      value={formData.schemeCode || ''}
                      onChange={handleSchemeCodeChange}
                      required
                    >
                      <option value="">Select Scheme Code</option>
                      {schemeCodes.map(scheme => (
                        <option 
                          key={scheme.id} 
                          value={scheme.code}
                        >
                          {scheme.code} - {scheme.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Vendor Name / Cheque to be</label>
                    <select
                      name="vendorName"
                      value={formData.vendorName || ''}
                      onChange={handleVendorChange}
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option 
                          key={vendor.id} 
                          value={vendor.name}
                        >
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Vendor Number</label>
                    <input
                      type="text"
                      name="vendorNumber"
                      value={formData.vendorNumber}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date (DD-MM-YYYY)</label>
                    <input
                      type="date"
                      name="date"
                      value={convertDateForDateInput(formData.date)}
                      onChange={handleDateInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Bill Number</label>
                    <input
                      type="text"
                      name="billNumber"
                      value={formData.billNumber}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 2: Bill Nature */}
              <div className="form-section">
                <h3>2. Bill Nature</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Select the Bill Nature</label>
                    <select
                      name="billNature"
                      value={formData.billNature || 'NoTax'}
                      onChange={handleBillNatureChange}
                      required
                    >
                      <option value="Goods">Goods</option>
                      <option value="Services">Services</option>
                      <option value="Goods+Services">Goods + Services</option>
                      <option value="NoTax">No Tax</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Section 3: Object Code */}
              <div className="form-section">
                <h3>3. Object Code</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="objectCode">Object Code *</label>
                    <select
                      id="objectCode"
                      name="objectCode"
                      value={formData.objectCode}
                      onChange={handleObjectCodeChange}
                      disabled={viewMode}
                      required
                    >
                      <option value="">Select Object Code</option>
                      {objectCodes.map((code) => (
                        <option 
                          key={code.code} 
                          value={code.code}
                        >
                          {code.code} - {code.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="objectDescription">Object Description</label>
                    <input
                      type="text"
                      id="objectDescription"
                      name="objectDescription"
                      value={formData.objectDescription}
                      onChange={handleInputChange}
                      disabled={true}
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 4: Amount */}
              <div className="form-section">
                <h3>4. Amount</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="grossAmount">Gross Amount *</label>
                    <input
                      type="text"
                      id="grossAmount"
                      name="grossAmount"
                      value={grossAmount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      required
                      className={viewMode ? 'readonly-field' : 'editable-field'}
                      disabled={viewMode}
                      style={{ width: '100%', padding: '8px', fontSize: '16px' }}
                    />
                  </div>
                  
                  {formData.billNature === 'Goods+Services' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="goodsAmount">Goods Amount</label>
                        <input
                          type="number"
                          id="goodsAmount"
                          name="goodsAmount"
                          value={formData.goodsAmount}
                          onChange={handleAmountChange}
                          disabled={viewMode}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="servicesAmount">Services Amount</label>
                        <input
                          type="number"
                          id="servicesAmount"
                          name="servicesAmount"
                          value={formData.servicesAmount}
                          onChange={handleAmountChange}
                          disabled={viewMode}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Section 5: Tax Section */}
              <div className="form-section">
                <h3>5. Tax Section</h3>
                
                {/* GST and PST */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Total GST of Bill</label>
                    <input
                      type="number"
                      name="gstAmount"
                      value={formData.gstAmount}
                      onChange={handleAmountChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Total PST of Bill</label>
                    <input
                      type="number"
                      name="pstAmount"
                      value={formData.pstAmount}
                      onChange={handleAmountChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {/* Contract and Stamp Duty */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Contract Type</label>
                    <select
                      name="contractType"
                      value={formData.contractType}
                      onChange={handleContractTypeChange}
                    >
                      <option value="Work">Work</option>
                      <option value="Procure">Procure</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Contract Amount for Stamp Duty</label>
                    <input
                      type="number"
                      name="contractAmount"
                      value={formData.contractAmount}
                      onChange={handleAmountChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Stamp Duty</label>
                    <input
                      type="number"
                      name="stampDuty"
                      value={formData.stampDuty}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                
                {/* Advance Income Tax */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Advance Income Tax</label>
                    <input
                      type="number"
                      name="advanceIncomeTax"
                      value={formData.advanceIncomeTax}
                      onChange={handleAmountChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                {/* Income Tax on Purchases */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Income Tax (On Purchases)</label>
                    <select
                      name="incomeTaxPurchaseRate"
                      value={formData.incomeTaxPurchaseRate}
                      onChange={handleInputChange}
                    >
                      {taxRates.incomeTaxPurchaseRates.map((rate: string) => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="incomeTaxPurchaseAmount"
                      value={formData.incomeTaxPurchaseAmount}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                
                {/* Income Tax on Services */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Income Tax (On Repair/Services)</label>
                    <select
                      name="incomeTaxServiceRate"
                      value={formData.incomeTaxServiceRate}
                      onChange={handleInputChange}
                    >
                      {taxRates.incomeTaxServiceRates.map((rate: string) => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="incomeTaxServiceAmount"
                      value={formData.incomeTaxServiceAmount}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                
                {/* General Sales Tax */}
                <div className="form-row">
                  <div className="form-group">
                    <label>General Sales Tax (1/5)</label>
                    <select
                      name="generalSalesTaxRate"
                      value={formData.generalSalesTaxRate}
                      onChange={handleInputChange}
                    >
                      {taxRates.generalSalesTaxRates.map((rate: string) => (
                        <option key={rate} value={rate}>{rate}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="generalSalesTaxAmount"
                      value={formData.generalSalesTaxAmount}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                
                {/* Punjab Sales Tax */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Punjab Sales Tax (16%)</label>
                    <select
                      name="punjabSalesTaxRate"
                      value={formData.punjabSalesTaxRate}
                      onChange={handleInputChange}
                    >
                      {taxRates.punjabSalesTaxRates.map((rate: string) => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="punjabSalesTaxAmount"
                      value={formData.punjabSalesTaxAmount}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                
                {/* Net Amount */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Net Amount</label>
                    <input
                      type="number"
                      name="netAmount"
                      value={formData.netAmount}
                      readOnly
                      className="readonly-field net-amount"
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 6: Bill Details */}
              <div className="form-section">
                <h3>6. Bill Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bill Detail</label>
                    <input
                      type="text"
                      name="billDetail"
                      value={formData.billDetail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Bill Description</label>
                    <textarea
                      name="billDescription"
                      value={formData.billDescription}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                {!viewMode && (
                  <button type="submit" className="save-button">
                    {editTransaction ? 'Update Transaction' : 'Save Transaction'}
                  </button>
                )}
                <button type="button" className="cancel-button" onClick={onCancel}>
                  {viewMode ? 'Close' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default EnhancedTransactionForm;
