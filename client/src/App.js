import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Transactions from './components/Transactions';
import IntegratedBudgets from './components/IntegratedBudgets';
import CostCenters from './components/CostCenters';
import Vendors from './components/Vendors';
import Settings from './components/Settings';
import Reports from './components/Reports';
import BudgetReports from './components/BudgetReports';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="main-container">
          <Sidebar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<IntegratedBudgets />} />
              <Route path="/cost-centers" element={<CostCenters />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/budget-reports" element={<BudgetReports />} />
              {/* Add more routes here as needed */}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
