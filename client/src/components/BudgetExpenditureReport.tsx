import React, { useState, useEffect, useMemo } from 'react';
import './BudgetExpenditureReport.css';
import './Reports.css';
import API, { TransactionAPI, BudgetAPI, ObjectCodeAPI, CostCenterAPI } from '../services/api';

interface CostCenter {
  id: number;
  code: string;
  name: string;
}

interface Budget {
  id: number;
  cost_center: string;
  object_code: string;
  amount: number;
  financial_year: string;
  costCenter?: string;
  objectCode?: string;
  financialYear?: string;
}

interface Transaction {
  id: number;
  cost_center: string;
  object_code: string;
  amount: number;
  date: string;
  description: string;
  financial_year: string;
  costCenter?: string;
  objectCode?: string;
  financialYear?: string;
  costCenterName?: string;
  objectDescription?: string;
  vendorName?: string;
  vendorId?: number;
  vendorNumber?: string;
  status?: string;
  netAmount?: number;
  type?: string;
}

interface BudgetReportItem {
  objectCode: string;
  objectDescription: string;
  budgetReleased: number;
  expenditure: number;
  remainingBudget: number;
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
  type: string;
}

// Object code descriptions can be fetched from the API, but keeping a minimal set as fallback
const OBJECT_CODE_DESCRIPTIONS: Record<string, string> = {
  'A01101': 'Basic Pay of Officers',
  'A01151': 'Basic Pay of Other Staff',
  'A01202': 'House Rent Allowance',
  'A01203': 'Conveyance Allowance'
};

const BudgetExpenditureReport: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetReleases, setBudgetReleases] = useState<BudgetRelease[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [objectCodes, setObjectCodes] = useState<any[]>([]);
  const [availableCostCenters, setAvailableCostCenters] = useState<string[]>([]);
  const [reportData, setReportData] = useState<BudgetReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data needed for the report
        const [budgetsData, transactionsData, costCentersData, objectCodesData] = await Promise.all([
          BudgetAPI.getAll(),
          TransactionAPI.getAll(),
          CostCenterAPI.getAll(),
          ObjectCodeAPI.getAll()
        ]);
        
        setBudgets(budgetsData || []);
        setTransactions(transactionsData || []);
        setCostCenters(costCentersData || []);
        setObjectCodes(objectCodesData || []);
        
        // Extract unique financial years from budgets
        const yearsSet = new Set<string>();
        budgetsData.forEach((budget: any) => {
          if (budget.financialYear) {
            yearsSet.add(budget.financialYear);
          }
        });
        const years = Array.from(yearsSet);
        setFinancialYears(years);
        
        // Extract unique cost centers from budgets
        const centersSet = new Set<string>();
        budgetsData.forEach((budget: any) => {
          if (budget.costCenter && budget.costCenter.trim() !== '') {
            centersSet.add(budget.costCenter);
          }
        });
        const uniqueCostCenters = Array.from(centersSet);
        setAvailableCostCenters(uniqueCostCenters);
        
        // Set default selections
        if (years.length > 0 && !selectedFinancialYear) {
          setSelectedFinancialYear(years[0]);
        }
        
        if (uniqueCostCenters.length > 0 && !selectedCostCenter) {
          // Find the matching cost center object
          const foundCostCenter = costCentersData.find((cc: CostCenter) => 
            cc.code === uniqueCostCenters[0] || cc.name === uniqueCostCenters[0]
          );
          
          if (foundCostCenter) {
            setSelectedCostCenter(foundCostCenter);
          } else if (costCentersData.length > 0) {
            // Fallback to first cost center if no match found
            setSelectedCostCenter(costCentersData[0]);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedFinancialYear, selectedCostCenter]);

  // Generate report data when filters or data change
  useEffect(() => {
    if (!selectedCostCenter || !selectedFinancialYear) return;
    
    // Define common object codes to ensure they always appear in the report
    const commonObjectCodes = [
      'A01101', 'A01151', 'A01202', 'A01203'
    ];
    
    // Create a function to calculate released budget amounts by object code
    const calculateReleasedBudgets = () => {
      // Create a map to store released budget amounts by object code
      const releasedBudgetsByObjectCode: { [key: string]: number } = {};
      
      // Filter budget releases by cost center and financial year
      const filteredReleases = budgetReleases.filter((release: BudgetRelease) => {
        let costCenterMatch = false;
        
        if (!selectedCostCenter) return false;
        
        // More flexible matching for cost centers
        if (selectedCostCenter.code === "LZ4064") {
          costCenterMatch = Boolean(
            release.costCenter === "LZ4064" ||
            release.costCenter === "DDO, DGM&E, P&D Board" ||
            (release.costCenterName && release.costCenterName.includes("DDO"))
          );
        } else if (selectedCostCenter.code === "LO4587") {
          costCenterMatch = Boolean(
            release.costCenter === "LO4587" ||
            release.costCenter === "AO, DGM&E, P&D Board" ||
            (release.costCenterName && release.costCenterName.includes("AO"))
          );
        } else {
          costCenterMatch = Boolean(
            release.costCenter === selectedCostCenter.code ||
            release.costCenterName === selectedCostCenter.name
          );
        }
        
        // Match financial year
        const yearMatch = release.financialYear === selectedFinancialYear;
        
        return costCenterMatch && yearMatch;
      });
      
      console.log("Filtered budget releases:", filteredReleases);
      
      // Sum up released amounts by object code
      filteredReleases.forEach((release: BudgetRelease) => {
        const objectCode = release.objectCode;
        if (!releasedBudgetsByObjectCode[objectCode]) {
          releasedBudgetsByObjectCode[objectCode] = 0;
        }
        releasedBudgetsByObjectCode[objectCode] += release.amount;
      });
      
      console.log("Released budgets by object code:", releasedBudgetsByObjectCode);
      
      return releasedBudgetsByObjectCode;
    };
    
    // Get released budget amounts by object code
    const releasedBudgetsByObjectCode = calculateReleasedBudgets();
    
    // Filter transactions based on selected cost center and financial year
    const filteredTransactions = transactions.filter(
      (t) => {
        // Handle both formats of cost center (cost_center and costCenter)
        const transactionCostCenter = t.cost_center || t.costCenter;
        const transactionObjectCode = t.object_code || t.objectCode;
        
        if (!transactionObjectCode) return false;
        
        let costCenterMatch = false;
        
        if (selectedCostCenter.code === "LZ4064") {
          costCenterMatch = Boolean(
            transactionCostCenter === "LZ4064" ||
            transactionCostCenter === "DDO, DGM&E, P&D Board" ||
            (t.costCenterName && t.costCenterName.includes("DDO"))
          );
        } else if (selectedCostCenter.code === "LO4587") {
          costCenterMatch = Boolean(
            transactionCostCenter === "LO4587" ||
            transactionCostCenter === "AO, DGM&E, P&D Board" ||
            (t.costCenterName && t.costCenterName.includes("AO"))
          );
        } else {
          costCenterMatch = Boolean(
            transactionCostCenter === selectedCostCenter.code ||
            t.costCenterName === selectedCostCenter.name
          );
        }
        
        // Financial year matching
        let yearMatch = false;
        
        if (t.financialYear) {
          // Direct match with the financial year property
          yearMatch = t.financialYear === selectedFinancialYear;
        } else if (t.financial_year) {
          // Direct match with the financial_year property
          yearMatch = t.financial_year === selectedFinancialYear;
        } else {
          // Date-based matching
          const transactionDate = new Date(t.date);
          const transactionYear = transactionDate.getFullYear();
          const financialYearParts = selectedFinancialYear.split('-');
          const financialYearStart = parseInt(financialYearParts[0]);
          const financialYearEnd = parseInt(financialYearParts[1]);
          
          yearMatch = (
            (transactionYear === financialYearStart && transactionDate.getMonth() >= 6) || // July to December of start year
            (transactionYear === financialYearEnd && transactionDate.getMonth() < 6)      // January to June of end year
          );
        }
        
        return costCenterMatch && yearMatch;
      }
    );
    
    console.log("Filtered transactions:", filteredTransactions);
    
    // Calculate expenditure by object code
    const expensesByObjectCode: { [key: string]: number } = {};
    const objectCodeDescriptions: { [key: string]: string } = {};
    
    filteredTransactions.forEach((t) => {
      const objectCode = t.object_code || t.objectCode || '';
      if (!objectCode) return;
      
      if (!expensesByObjectCode[objectCode]) {
        expensesByObjectCode[objectCode] = 0;
        objectCodeDescriptions[objectCode] = t.objectDescription || '';
      }
      expensesByObjectCode[objectCode] += t.amount || 0;
    });
    
    console.log("Expenses by object code:", expensesByObjectCode);
    
    // Get all unique object codes from budget releases, transactions, and common codes
    const objectCodes = Array.from(
      new Set([
        ...Object.keys(releasedBudgetsByObjectCode),
        ...Object.keys(expensesByObjectCode),
        ...commonObjectCodes
      ])
    ).filter(code => code !== ''); // Filter out any empty codes
    
    // Generate report data
    const report: BudgetReportItem[] = objectCodes.map((objectCode) => {
      // Get budget released from actual budget releases
      let budgetReleased = releasedBudgetsByObjectCode[objectCode] || 0;
      
      // Get expenditure
      const expenditure = expensesByObjectCode[objectCode] || 0;
      
      // Get description from object code descriptions or use predefined description
      const description = objectCodeDescriptions[objectCode] || 
                          OBJECT_CODE_DESCRIPTIONS[objectCode] || 
                          'Unknown';
      
      return {
        objectCode: objectCode,
        objectDescription: description,
        budgetReleased,
        expenditure,
        remainingBudget: budgetReleased - expenditure,
      };
    });
    
    // Sort report data by object code
    report.sort((a, b) => a.objectCode.localeCompare(b.objectCode));
    
    // Filter out items with zero budget and zero expenditure
    const filteredReport = report.filter(item => item.budgetReleased > 0 || item.expenditure > 0);
    
    console.log("Final report data:", filteredReport);
    
    setReportData(filteredReport);
  }, [selectedCostCenter, selectedFinancialYear, budgets, budgetReleases, transactions]);

  const handleCostCenterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cc = costCenters.find((c) => c.code === e.target.value);
    if (cc) setSelectedCostCenter(cc);
  };
  const handleFinancialYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFinancialYear(e.target.value);
  };

  const totals = reportData.reduce(
    (acc, item) => {
      acc.totalBudgetReleased += item.budgetReleased;
      acc.totalExpenditure += item.expenditure;
      acc.totalRemainingBudget += item.remainingBudget;
      return acc;
    },
    { totalBudgetReleased: 0, totalExpenditure: 0, totalRemainingBudget: 0 }
  );

  return (
    <div className="budget-expenditure-report">
      <h2>Budget and Expenditure Report</h2>
      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="costCenter">Cost Center:</label>
          <select
            id="costCenter"
            value={selectedCostCenter?.code || ''}
            onChange={handleCostCenterChange}
          >
            {costCenters.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.code} - {cc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="financialYear">Financial Year:</label>
          <select
            id="financialYear"
            value={selectedFinancialYear}
            onChange={handleFinancialYearChange}
          >
            {financialYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="loading">Loading report data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : reportData.length > 0 ? (
        <>
          <div className="report-header">
            <h3>
              Cost Center: {selectedCostCenter?.name} ({selectedCostCenter?.code})
            </h3>
            <p>
              <strong>Financial Year:</strong> {selectedFinancialYear}
            </p>
            <p>
              <strong>Report Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="table-container">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Object Code</th>
                  <th>Description</th>
                  <th>Budget Released</th>
                  <th>Expenditure</th>
                  <th>Remaining Budget</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.objectCode}</td>
                    <td>{item.objectDescription}</td>
                    <td className="amount">{item.budgetReleased.toLocaleString()}</td>
                    <td className="amount">{item.expenditure.toLocaleString()}</td>
                    <td className={`amount ${item.remainingBudget < 0 ? 'negative' : ''}`}>
                      {item.remainingBudget.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="totals-row">
                  <td colSpan={2}>
                    <strong>Totals</strong>
                  </td>
                  <td className="amount">
                    <strong>{totals.totalBudgetReleased.toLocaleString()}</strong>
                  </td>
                  <td className="amount">
                    <strong>{totals.totalExpenditure.toLocaleString()}</strong>
                  </td>
                  <td className={`amount ${totals.totalRemainingBudget < 0 ? 'negative' : ''}`}>
                    <strong>{totals.totalRemainingBudget.toLocaleString()}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="report-footer">
            <p>Report generated on {new Date().toLocaleString()}</p>
          </div>
        </>
      ) : (
        <div className="no-data-message">
          <p>No budget data available for the selected filters.</p>
          <p>
            Please select a different cost center or financial year, or create
            budgets for this selection.
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetExpenditureReport;
