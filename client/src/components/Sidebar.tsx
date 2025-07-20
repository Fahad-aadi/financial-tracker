import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <div className="sidebar-item">
          <Link to="/">Dashboard</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/transactions">Transactions</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/budgets">Budgets</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/cost-centers">Cost Centers</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/vendors">Vendors</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/reports">Reports</Link>
        </div>
        <div className="sidebar-item">
          <Link to="/settings">Settings</Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
