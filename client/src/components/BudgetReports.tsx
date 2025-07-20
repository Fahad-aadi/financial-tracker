import React, { useState, useEffect } from 'react';
import './Reports.css';
import { API } from '../services/api';

interface BudgetEntry {
  id: number;
  objectCode: string;
  codeDescription: string;
  costCenter: string;
  amountAllocated: number;
  budgetReleased: number;
  financialYear: string;
  period: string;
  remarks: string;
  dateCreated: string;
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

const BudgetReports: React.FC = () => {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [objectCodes, setObjectCodes] = useState<ObjectCode[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('');
  const [reportType, setReportType] = useState<string>('summary');
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [budgetEntriesData, objectCodesData, costCentersData] = await Promise.all([
          API.budgets.getAll(),
          API.objectCodes.getAll(),
          API.costCenters.getAll()
        ]);
        setBudgetEntries(Array.isArray(budgetEntriesData) ? budgetEntriesData : []);
        setObjectCodes(Array.isArray(objectCodesData) ? objectCodesData : []);
        setCostCenters(Array.isArray(costCentersData) ? costCentersData : []);
        // Extract unique financial years for filtering
        const years = Array.from(new Set((Array.isArray(budgetEntriesData) ? budgetEntriesData : []).map((entry: BudgetEntry) => entry.financialYear))) as string[];
        setFinancialYears(years);
        if (years.length > 0) {
          setSelectedFinancialYear(years[0]);
        }
      } catch (err) {
        setBudgetEntries([]);
        setObjectCodes([]);
        setCostCenters([]);
        setFinancialYears([]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);
  
  // Filter entries by selected financial year
  const filteredEntries = budgetEntries.filter(entry => 
    !selectedFinancialYear || entry.financialYear === selectedFinancialYear
  );
  
  // Generate summary by object code
  const objectCodeSummary = filteredEntries.reduce((acc: any, entry) => {
    const key = entry.objectCode;
    
    if (!acc[key]) {
      acc[key] = {
        objectCode: entry.objectCode,
        codeDescription: entry.codeDescription,
        totalAllocated: 0,
        totalReleased: 0,
        entries: []
      };
    }
    
    acc[key].totalAllocated += entry.amountAllocated;
    acc[key].totalReleased += entry.budgetReleased;
    acc[key].entries.push(entry);
    
    return acc;
  }, {});
  
  // Generate summary by cost center
  const costCenterSummary = filteredEntries.reduce((acc: any, entry) => {
    const key = entry.costCenter;
    
    if (!acc[key]) {
      acc[key] = {
        costCenter: entry.costCenter,
        totalAllocated: 0,
        totalReleased: 0,
        entries: []
      };
    }
    
    acc[key].totalAllocated += entry.amountAllocated;
    acc[key].totalReleased += entry.budgetReleased;
    acc[key].entries.push(entry);
    
    return acc;
  }, {});
  
  // Calculate grand totals
  const grandTotalAllocated = filteredEntries.reduce((total, entry) => total + entry.amountAllocated, 0);
  const grandTotalReleased = filteredEntries.reduce((total, entry) => total + entry.budgetReleased, 0);
  
  if (isLoading) {
    return <div className="loading">Loading budget reports...</div>;
  }
  
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Budget Reports</h1>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Financial Year</label>
            <select 
              value={selectedFinancialYear} 
              onChange={(e) => setSelectedFinancialYear(e.target.value)}
            >
              <option value="">All Financial Years</option>
              {financialYears.map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="summary">Summary Report</option>
              <option value="objectCode">Object Code Report</option>
              <option value="costCenter">Cost Center Report</option>
              <option value="detailed">Detailed Report</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredEntries.length === 0 ? (
        <div className="reports-section">
          <div className="no-data">No budget data available for the selected financial year.</div>
        </div>
      ) : (
        <>
          <div className="reports-section">
            <h2>
              {selectedFinancialYear 
                ? `Financial Year ${selectedFinancialYear} Budget Summary` 
                : 'All Financial Years Budget Summary'}
            </h2>
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Budget Allocated</h3>
                <p className="amount">Rs. {grandTotalAllocated.toLocaleString()}</p>
              </div>
              <div className="summary-card">
                <h3>Total Budget Released</h3>
                <p className="amount">Rs. {grandTotalReleased.toLocaleString()}</p>
              </div>
              <div className="summary-card">
                <h3>Remaining to Release</h3>
                <p className="amount">Rs. {(grandTotalAllocated - grandTotalReleased).toLocaleString()}</p>
              </div>
              <div className="summary-card">
                <h3>Total Entries</h3>
                <p className="amount">{filteredEntries.length}</p>
              </div>
            </div>
          </div>
          
          {/* Object Code Report */}
          {(reportType === 'summary' || reportType === 'objectCode') && (
            <div className="reports-section">
              <h2>Budget by Object Code</h2>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Object Code</th>
                      <th>Description</th>
                      <th>Total Allocated</th>
                      <th>Total Released</th>
                      <th>Remaining</th>
                      <th>Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(objectCodeSummary).map((summary: any, index) => (
                      <tr key={index}>
                        <td>{summary.objectCode}</td>
                        <td>{summary.codeDescription}</td>
                        <td className="amount">Rs. {summary.totalAllocated.toLocaleString()}</td>
                        <td className="amount">Rs. {summary.totalReleased.toLocaleString()}</td>
                        <td className="amount">Rs. {(summary.totalAllocated - summary.totalReleased).toLocaleString()}</td>
                        <td>{summary.entries.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Cost Center Report */}
          {(reportType === 'summary' || reportType === 'costCenter') && (
            <div className="reports-section">
              <h2>Budget by Cost Center</h2>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cost Center</th>
                      <th>Total Allocated</th>
                      <th>Total Released</th>
                      <th>Remaining</th>
                      <th>Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(costCenterSummary).map((summary: any, index) => (
                      <tr key={index}>
                        <td>{summary.costCenter}</td>
                        <td className="amount">Rs. {summary.totalAllocated.toLocaleString()}</td>
                        <td className="amount">Rs. {summary.totalReleased.toLocaleString()}</td>
                        <td className="amount">Rs. {(summary.totalAllocated - summary.totalReleased).toLocaleString()}</td>
                        <td>{summary.entries.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Detailed Report */}
          {reportType === 'detailed' && (
            <div className="reports-section">
              <h2>Detailed Budget Entries</h2>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date Created</th>
                      <th>Object Code</th>
                      <th>Description</th>
                      <th>Cost Center</th>
                      <th>Period</th>
                      <th>Amount Allocated</th>
                      <th>Budget Released</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.dateCreated}</td>
                        <td>{entry.objectCode}</td>
                        <td>{entry.codeDescription}</td>
                        <td>{entry.costCenter}</td>
                        <td>{entry.period}</td>
                        <td className="amount">Rs. {entry.amountAllocated.toLocaleString()}</td>
                        <td className="amount">Rs. {entry.budgetReleased.toLocaleString()}</td>
                        <td>{entry.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="reports-actions">
        <button className="print-button" onClick={() => window.print()}>
          Print Report
        </button>
        <button className="export-button" onClick={() => alert('Export functionality would be implemented here')}>
          Export to Excel
        </button>
      </div>
    </div>
  );
};

export default BudgetReports;
