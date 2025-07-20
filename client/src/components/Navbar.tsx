import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">DGM&E Financial Information Manamgement System (FIMS)</Link>
      </div>
      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            <Link to="/profile">Profile</Link>
          </div>
          <div className="navbar-item">
            <button className="logout-button">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
