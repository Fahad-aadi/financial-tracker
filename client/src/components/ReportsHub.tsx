import React, { useState } from 'react';
import './Reports.css';
import CostCenterReports from './CostCenterReports';
import BudgetExpenditureReport from './BudgetExpenditureReport';

const ReportsHub: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const handleReportSelection = (reportType: string) => {
    setActiveReport(reportType);
  };

  const handleBackToReports = () => {
    setActiveReport(null);
  };

  // If a report is selected, render that report
  if (activeReport === 'cost-center') {
    return (
      <div className="reports-container">
        <button className="back-button" onClick={handleBackToReports}>
          ← Back to Reports
        </button>
        <CostCenterReports />
      </div>
    );
  }

  if (activeReport === 'budget-expenditure') {
    return (
      <div className="reports-container">
        <button className="back-button" onClick={handleBackToReports}>
          ← Back to Reports
        </button>
        <BudgetExpenditureReport />
      </div>
    );
  }

  // Otherwise, render the report selection screen
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Financial Reports</h1>
        <p>Select a report type to view detailed financial information</p>
      </div>
      
      <div className="reports-grid">
        <div className="report-card">
          <h2>Budget & Expenditure Report</h2>
          <p>View comprehensive budget and expenditure data by cost center and financial year</p>
          <ul>
            <li>Object code breakdown</li>
            <li>Budget released amounts</li>
            <li>Actual expenditure</li>
            <li>Remaining budget analysis</li>
          </ul>
          <button 
            className="report-button"
            onClick={() => handleReportSelection('budget-expenditure')}
          >
            View Budget & Expenditure Report
          </button>
        </div>
        
        <div className="report-card">
          <h2>Cost Center Reports</h2>
          <p>Analyze spending and budget allocation by cost center</p>
          <ul>
            <li>Cost center performance</li>
            <li>Budget utilization</li>
            <li>Spending trends</li>
            <li>Allocation analysis</li>
          </ul>
          <button 
            className="report-button"
            onClick={() => handleReportSelection('cost-center')}
          >
            View Cost Center Reports
          </button>
        </div>
        
        <div className="report-card">
          <h2>Transaction Reports</h2>
          <p>Analyze transaction data with customizable filters and grouping options</p>
          <ul>
            <li>Monthly transaction summaries</li>
            <li>Expense categorization</li>
            <li>Vendor payment history</li>
            <li>Cost center expenditures</li>
          </ul>
          <button className="report-button disabled" disabled>
            Coming Soon
          </button>
        </div>
        
        <div className="report-card">
          <h2>Financial Statements</h2>
          <p>Generate standard financial statements for accounting and compliance</p>
          <ul>
            <li>Income statements</li>
            <li>Balance sheets</li>
            <li>Cash flow statements</li>
            <li>Budget variance reports</li>
          </ul>
          <button className="report-button disabled" disabled>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsHub;
