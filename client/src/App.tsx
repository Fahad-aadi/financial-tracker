import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import EnhancedTransactionForm from './components/EnhancedTransactionForm';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Budgets from './components/Budgets';
import Settings from './components/Settings';

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
              <Route path="/reports" element={<Reports />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/settings" element={<Settings />} />
              {/* Removing the direct route to EnhancedTransactionForm since it requires props */}
              {/* <Route path="/enhanced-transaction-form" element={<EnhancedTransactionForm />} /> */}
              {/* Add more routes here as needed */}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
