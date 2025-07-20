import React, { useState, useEffect, useMemo } from 'react';
import './CostCenterReports.css';
import './Reports.css';
import { API, CostCenterAPI } from '../services/api';
import { FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
import * as XLSX from 'xlsx';

interface CostCenter {
  id: number;
  code: string;
  name: string;
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
  financialYear?: string;
  // Add snake_case versions for API compatibility
  cost_center?: string;
  object_code?: string;
  financial_year?: string;
}

interface Transaction {
  id: number;
  type: string;
  date: string;
  description: string;
  amount: number;
  costCenter?: string;
  costCenterName?: string;
  objectCode?: string;
  objectDescription?: string;
  [key: string]: any;
}

interface ObjectCodeDescriptions {
  [key: string]: string;
}

interface BudgetReportData {
  objectCode: string;
  description: string;
  releasedBudget: number;
  expenses: number;
  balance: number;
  utilizationPercentage: number;
}

// Add a new interface for budget releases
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

const CostCenterReports: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetReleases, setBudgetReleases] = useState<BudgetRelease[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFinancialYear, setCurrentFinancialYear] = useState('2024-25');
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>(['2023-24', '2024-25', '2025-26']);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    console.log("CostCenterReports component mounted");
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Direct test to fetch budgets and log them
        const directBudgetsTest = await fetch('http://localhost:4001/api/budgets')
          .then(response => response.json());
        console.log("Direct budget fetch test:", directBudgetsTest);
        
        // Fetch cost centers first
        let costCentersData: CostCenter[] = [];
        try {
          costCentersData = await CostCenterAPI.getAll();
        } catch (err) {
          console.error('Error fetching cost centers from API:', err);
        }
        // Fallback to default if API returns nothing
        if (!Array.isArray(costCentersData) || costCentersData.length === 0) {
          costCentersData = [
            { id: 1, code: 'LO4587', name: 'AO, DGM&E, P&D Board' },
            { id: 2, code: 'LZ4064', name: 'DDO, DGM&E, P&D Board' }
          ];
          console.warn('Using default cost centers as fallback.');
        }
        setCostCenters(costCentersData);
        
        // Then fetch budgets separately to ensure we see the response
        console.log("Fetching budgets...");
        const budgetsData = await API.budgets.getAll();
        console.log("Budgets data received:", budgetsData);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
        
        // Fetch budget releases
        console.log("Fetching budget releases...");
        const releasesResponse = await fetch('http://localhost:4001/api/budget-releases');
        if (releasesResponse.ok) {
          const releasesData = await releasesResponse.json();
          console.log("Budget releases data received:", releasesData);
          setBudgetReleases(Array.isArray(releasesData) ? releasesData : []);
        } else {
          console.error("Failed to fetch budget releases:", releasesResponse.statusText);
          setBudgetReleases([]);
        }
        
        // Finally fetch transactions
        const transactionsData = await API.transactions.getAll();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        
        if (Array.isArray(costCentersData) && costCentersData.length > 0) {
          const lz4064CostCenter = costCentersData.find((cc: CostCenter) => cc.code === 'LZ4064');
          const lo4587CostCenter = costCentersData.find((cc: CostCenter) => cc.code === 'LO4587');
          if (lz4064CostCenter) {
            setSelectedCostCenter(lz4064CostCenter);
          } else if (lo4587CostCenter) {
            setSelectedCostCenter(lo4587CostCenter);
          } else {
            setSelectedCostCenter(costCentersData[0]);
          }
        }
        
        // Extract available financial years from budgets
        if (Array.isArray(budgetsData) && budgetsData.length > 0) {
          const years = Array.from(new Set(budgetsData
            .filter(budget => budget.financialYear)
            .map(budget => budget.financialYear || '2024-25')));
          
          if (years.length > 0) {
            setAvailableFinancialYears(prev => {
              const combined = [...prev, ...years];
              return Array.from(new Set(combined)); // Remove duplicates
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCostCenters([]);
        setBudgets([]);
        setBudgetReleases([]);
        setTransactions([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCostCenter) {
      console.log(`Selected cost center changed to: ${selectedCostCenter.name}`);
    }
  }, [selectedCostCenter]);

  useEffect(() => {
    if (budgets.length > 0) {
      console.log("Current budgets state:", budgets);
      if (selectedCostCenter) {
        const relevantBudgets = budgets.filter(budget => {
          const costCenterMatch = 
            budget.costCenter === selectedCostCenter.code || 
            (selectedCostCenter.code === "LZ4064" && 
             (budget.costCenter === "DDO, DGM&E, P&D Board" || 
              (budget.costCenter && budget.costCenter.includes("DDO")))) ||
            (selectedCostCenter.code === "LO4587" && 
             (budget.costCenter === "AO, DGM&E, P&D Board" || 
              (budget.costCenter && budget.costCenter.includes("AO"))));
          return costCenterMatch;
        });
        console.log(`Budgets for ${selectedCostCenter.code}:`, relevantBudgets);
      }
    }
  }, [budgets, selectedCostCenter]);

  useEffect(() => {
    console.log("Filtering budgets based on selected cost center and financial year");
    console.log("All budgets:", budgets);
    console.log("Selected cost center:", selectedCostCenter);
    console.log("Current financial year:", currentFinancialYear);
    
    if (selectedCostCenter && budgets.length > 0) {
      // Log each budget to see its properties
      budgets.forEach((budget, index) => {
        console.log(`Budget ${index}:`, budget);
        console.log(`  - name: ${budget.name}`);
        console.log(`  - costCenter: ${budget.costCenter}`);
        console.log(`  - costCenterName: ${budget.costCenterName}`);
        console.log(`  - financialYear: ${budget.financialYear}`);
      });
      
      const filteredByCenter = budgets.filter((budget: Budget) => {
        let costCenterMatch = false;
        
        // More flexible matching for cost centers
        if (selectedCostCenter.code === "LZ4064") {
          costCenterMatch = Boolean(
            budget.costCenter === "LZ4064" ||
            budget.cost_center === "LZ4064" ||
            budget.costCenter === "DDO, DGM&E, P&D Board" ||
            (budget.costCenterName && budget.costCenterName.includes("DDO"))
          );
        } else if (selectedCostCenter.code === "LO4587") {
          costCenterMatch = Boolean(
            budget.costCenter === "LO4587" ||
            budget.cost_center === "LO4587" ||
            budget.costCenter === "AO, DGM&E, P&D Board" ||
            (budget.costCenterName && budget.costCenterName.includes("AO"))
          );
        } else {
          costCenterMatch = Boolean(
            budget.costCenter === selectedCostCenter.code ||
            budget.cost_center === selectedCostCenter.code ||
            budget.costCenterName === selectedCostCenter.name
          );
        }
        
        // More flexible matching for financial year
        const yearMatch = 
          budget.financialYear === currentFinancialYear || 
          budget.financial_year === currentFinancialYear;
        
        const result = costCenterMatch && yearMatch;
        console.log(`Budget ${budget.name} match: costCenter=${costCenterMatch}, year=${yearMatch}, overall=${result}`);
        return result;
      });
      
      console.log("Filtered budgets:", filteredByCenter);
      
      if (filteredByCenter.length > 0) {
        setFilteredBudgets(filteredByCenter);
      } else {
        console.log("No matching budgets found, showing empty report");
        setFilteredBudgets([]);
      }
    }
  }, [selectedCostCenter, budgets, currentFinancialYear]);

  const loadBudgetsAndTransactions = () => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const [budgetsData, transactionsData] = await Promise.all([
          API.budgets.getAll(),
          API.transactions.getAll()
        ]);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (error) {
        setBudgets([]);
        setTransactions([]);
      }
      setIsLoading(false);
    };
    fetchData();
  };

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
      const yearMatch = release.financialYear === currentFinancialYear;
      
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

  const budgetReportData: BudgetReportData[] = useMemo(() => {
    console.log("Calculating budget report data...");
    
    // Get released budget amounts by object code
    const releasedBudgetsByObjectCode = calculateReleasedBudgets();
    
    // Create a map to store expenses by object code
    const expensesByObjectCode: { [key: string]: number } = {};
    const objectCodeDescriptions: { [key: string]: string } = {};
    
    // Calculate expenses by object code
    if (transactions && transactions.length > 0) {
      console.log("Processing transactions for Cost Center Report:", transactions);
      
      transactions.forEach((transaction: Transaction) => {
        // Skip transactions without object code
        if (!transaction.objectCode) {
          console.log(`Skipping transaction ${transaction.id} - missing object code`);
          return;
        }
        
        let costCenterMatch = false;
        if (selectedCostCenter) {
          // Log transaction cost center info for debugging
          console.log(`Transaction ${transaction.id} cost center info:`, {
            transactionCostCenter: transaction.costCenter,
            transactionCostCenterName: transaction.costCenterName,
            selectedCostCenter: selectedCostCenter.code,
            selectedCostCenterName: selectedCostCenter.name
          });
          
          if (selectedCostCenter.code === "LZ4064") {
            costCenterMatch = Boolean(
              transaction.costCenter === "LZ4064" ||
              transaction.costCenter === "DDO, DGM&E, P&D Board" ||
              (transaction.costCenterName && transaction.costCenterName.includes("DDO"))
            );
          } else if (selectedCostCenter.code === "LO4587") {
            costCenterMatch = Boolean(
              transaction.costCenter === "LO4587" ||
              transaction.costCenter === "AO, DGM&E, P&D Board" ||
              (transaction.costCenterName && transaction.costCenterName.includes("AO"))
            );
          } else {
            costCenterMatch = Boolean(
              transaction.costCenter === selectedCostCenter.code ||
              transaction.costCenterName === selectedCostCenter.name
            );
          }
        }
        
        // Only include transactions for the current financial year
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear();
        const financialYearParts = currentFinancialYear.split('-');
        const financialYearStart = parseInt(financialYearParts[0]);
        const financialYearEnd = parseInt(financialYearParts[1]);
        
        // Alternative financial year matching if transaction has financialYear property
        let yearMatch = false;
        
        if (transaction.financialYear) {
          // Direct match with the financial year property
          yearMatch = transaction.financialYear === currentFinancialYear;
          console.log(`Transaction ${transaction.id} has financialYear property: ${transaction.financialYear}, match: ${yearMatch}`);
        } else {
          // Date-based matching
          yearMatch = (
            (transactionYear === financialYearStart && transactionDate.getMonth() >= 6) || // July to December of start year
            (transactionYear === financialYearEnd && transactionDate.getMonth() < 6)      // January to June of end year
          );
          console.log(`Transaction ${transaction.id} date-based year match: ${yearMatch} (date: ${transaction.date})`);
        }
        
        console.log(`Transaction ${transaction.id}, Object Code: ${transaction.objectCode}, Cost Center: ${transaction.costCenter}, Match: ${costCenterMatch && yearMatch}`);
        
        if (costCenterMatch && yearMatch) {
          const objectCode = transaction.objectCode;
          if (!expensesByObjectCode[objectCode]) {
            expensesByObjectCode[objectCode] = 0;
            objectCodeDescriptions[objectCode] = transaction.objectDescription || '';
          }
          expensesByObjectCode[objectCode] += transaction.amount || 0;
          console.log(`Added expense: ${transaction.amount} to object code ${objectCode}, total now: ${expensesByObjectCode[objectCode]}`);
        }
      });
    }
    
    console.log("Expenses by object code:", expensesByObjectCode);
    
    // Create the report data
    const reportData: BudgetReportData[] = [];
    
    // First, add entries for all object codes with released budgets
    Object.keys(releasedBudgetsByObjectCode).forEach(objectCode => {
      const releasedBudget = releasedBudgetsByObjectCode[objectCode];
      const expenses = expensesByObjectCode[objectCode] || 0;
      const balance = releasedBudget - expenses;
      const utilizationPercentage = releasedBudget > 0 ? Math.round((expenses / releasedBudget) * 100) : 0;
      
      // Get description from filtered budgets or transactions
      let description = '';
      const matchingBudget = filteredBudgets.find(budget => budget.name === objectCode || budget.object_code === objectCode);
      if (matchingBudget) {
        description = matchingBudget.categoryName;
      } else {
        description = objectCodeDescriptions[objectCode] || '';
      }
      
      reportData.push({
        objectCode,
        description,
        releasedBudget,
        expenses,
        balance,
        utilizationPercentage
      });
    });
    
    // Then, add entries for object codes with expenses but no released budget
    Object.keys(expensesByObjectCode).forEach(objectCode => {
      if (!releasedBudgetsByObjectCode[objectCode]) {
        const expenses = expensesByObjectCode[objectCode];
        const releasedBudget = 0;
        const balance = -expenses; // Negative balance since there's no budget
        const utilizationPercentage = 100; // 100% utilization (or more)
        
        // Get description from filtered budgets or transactions
        let description = '';
        const matchingBudget = filteredBudgets.find(budget => budget.name === objectCode || budget.object_code === objectCode);
        if (matchingBudget) {
          description = matchingBudget.categoryName;
        } else {
          description = objectCodeDescriptions[objectCode] || '';
        }
        
        reportData.push({
          objectCode,
          description,
          releasedBudget,
          expenses,
          balance,
          utilizationPercentage
        });
      }
    });
    
    // Sort by object code
    reportData.sort((a, b) => a.objectCode.localeCompare(b.objectCode));
    
    console.log("Final budget report data:", reportData);
    return reportData;
  }, [selectedCostCenter, currentFinancialYear, filteredBudgets, budgetReleases, transactions]);

  console.log("Budget report data:", budgetReportData);

  const totalReleasedBudget = budgetReportData.reduce((total: number, item: BudgetReportData) => total + item.releasedBudget, 0);
  const totalExpenses = budgetReportData.reduce((total: number, item: BudgetReportData) => total + item.expenses, 0);
  const totalBalance = totalReleasedBudget - totalExpenses;
  const overallUtilizationPercentage = totalReleasedBudget > 0 ? Math.round((totalExpenses / totalReleasedBudget) * 100) : 0;

  // Function to handle printing the report
  const handlePrint = () => {
    window.print();
  };

  // Function to export report data to Excel
  const exportToExcel = () => {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(
      budgetReportData.map(item => ({
        'Object Code': item.objectCode,
        'Description': item.description,
        'Released Budget': item.releasedBudget,
        'Expenditure': item.expenses,
        'Balance': item.balance,
        'Utilization %': item.utilizationPercentage
      }))
    );

    // Add totals row
    const totalReleasedBudget = budgetReportData.reduce((sum, item) => sum + item.releasedBudget, 0);
    const totalExpenses = budgetReportData.reduce((sum, item) => sum + item.expenses, 0);
    const totalBalance = budgetReportData.reduce((sum, item) => sum + item.balance, 0);
    const totalUtilization = totalReleasedBudget > 0 
      ? Math.round((totalExpenses / totalReleasedBudget) * 100) 
      : 0;

    XLSX.utils.sheet_add_json(
      worksheet, 
      [{
        'Object Code': 'TOTAL',
        'Description': '',
        'Released Budget': totalReleasedBudget,
        'Expenditure': totalExpenses,
        'Balance': totalBalance,
        'Utilization %': totalUtilization
      }],
      { origin: -1, skipHeader: true }
    );

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Object Code
      { wch: 30 }, // Description
      { wch: 15 }, // Released Budget
      { wch: 15 }, // Expenditure
      { wch: 15 }, // Balance
      { wch: 15 }  // Utilization %
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Budget Report');

    // Generate filename with cost center and financial year
    const costCenterCode = selectedCostCenter?.code || 'All';
    const filename = `Budget_Report_${costCenterCode}_${currentFinancialYear}.xlsx`;

    // Export to file
    XLSX.writeFile(workbook, filename);
  };

  if (isLoading) {
    return <div className="loading">Loading report data...</div>;
  }

  return (
    <div className="cost-center-reports">
      <h2>Budget Utilization Report</h2>
      
      {isLoading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="costCenter">Cost Center:</label>
              <select 
                id="costCenter" 
                value={selectedCostCenter?.code} 
                onChange={(e) => {
                  const selected = costCenters.find((cc: CostCenter) => cc.code === e.target.value);
                  console.log("Selected cost center from dropdown:", selected);
                  setSelectedCostCenter(selected || null);
                }}
              >
                {costCenters.map((cc: CostCenter, index: number) => (
                  <option key={index} value={cc.code}>{cc.code} - {cc.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="financialYear">Financial Year:</label>
              <select 
                id="financialYear" 
                value={currentFinancialYear} 
                onChange={(e) => {
                  setCurrentFinancialYear(e.target.value);
                }}
              >
                {availableFinancialYears.map((year: string, index: number) => (
                  <option key={index} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {budgetReportData.length > 0 ? (
            <>
              <div className="report-actions">
                <button 
                  className="report-button print"
                  onClick={handlePrint}
                >
                  <FaPrint /> Print Report
                </button>
                <button 
                  className="report-button export"
                  onClick={exportToExcel}
                >
                  <FaFileExcel /> Export to Excel
                </button>
              </div>
              <div className="report-header">
                <h2>Budget Utilization Report</h2>
                <div className="report-meta">
                  <div>
                    <strong>Cost Center:</strong> {selectedCostCenter?.code} - {selectedCostCenter?.name}
                  </div>
                  <div>
                    <strong>Financial Year:</strong> {currentFinancialYear}
                  </div>
                  <div>
                    <strong>Report Date:</strong> {new Date().toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Note:</strong> This report shows only released budgets, not allocated budgets.
                  </div>
                </div>
              </div>
              
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Object Code</th>
                      <th>Description</th>
                      <th>Released Budget</th>
                      <th>Expenditure</th>
                      <th>Balance</th>
                      <th>Utilization %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetReportData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.objectCode}</td>
                        <td>{item.description}</td>
                        <td className="amount">{item.releasedBudget.toLocaleString()}</td>
                        <td className="amount">{item.expenses.toLocaleString()}</td>
                        <td className={`amount ${item.balance < 0 ? 'negative' : ''}`}>
                          {item.balance.toLocaleString()}
                        </td>
                        <td className="amount">{item.utilizationPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}><strong>Total</strong></td>
                      <td className="amount">
                        <strong>
                          {budgetReportData
                            .reduce((sum, item) => sum + item.releasedBudget, 0)
                            .toLocaleString()}
                        </strong>
                      </td>
                      <td className="amount">
                        <strong>
                          {budgetReportData
                            .reduce((sum, item) => sum + item.expenses, 0)
                            .toLocaleString()}
                        </strong>
                      </td>
                      <td className={`amount ${budgetReportData.reduce((sum, item) => sum + item.balance, 0) < 0 ? 'negative' : ''}`}>
                        <strong>
                          {budgetReportData
                            .reduce((sum, item) => sum + item.balance, 0)
                            .toLocaleString()}
                        </strong>
                      </td>
                      <td className="amount">
                        <strong>
                          {budgetReportData.reduce((sum, item) => sum + item.releasedBudget, 0) > 0
                            ? Math.round(
                                (budgetReportData.reduce((sum, item) => sum + item.expenses, 0) /
                                  budgetReportData.reduce((sum, item) => sum + item.releasedBudget, 0)) *
                                  100
                              )
                            : 0}%
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="report-footer">
                <p>Report generated on {new Date().toLocaleString()}</p>
              </div>
            </>
          ) : (
            <div className="no-data-message">
              <p>No budget data available for the selected cost center.</p>
              <p>This could be because:</p>
              <ul>
                <li>There are no transactions with this cost center</li>
                <li>There are no budgets defined for this cost center</li>
              </ul>
              <button 
                className="action-button"
                onClick={() => {
                  console.log("Generate Sample Budget Data button clicked");
                }}
              >
                Generate Sample Budget Data
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CostCenterReports;
