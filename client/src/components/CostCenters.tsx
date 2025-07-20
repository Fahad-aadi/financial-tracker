import React, { useState, useEffect } from 'react';
import './CostCenters.css';

interface CostCenter {
  id: number;
  name: string;
  code: string;
  description: string;
  manager: string;
  budget: number;
  spent: number;
  remaining: number;
  status: string;
}

const CostCenters: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call to fetch cost centers
    setTimeout(() => {
      setCostCenters([
        {
          id: 1,
          name: 'Marketing Department',
          code: 'MKT-001',
          description: 'All marketing related expenses',
          manager: 'John Smith',
          budget: 50000,
          spent: 35000,
          remaining: 15000,
          status: 'active'
        },
        {
          id: 2,
          name: 'Engineering Department',
          code: 'ENG-001',
          description: 'Software development and engineering expenses',
          manager: 'Jane Doe',
          budget: 75000,
          spent: 45000,
          remaining: 30000,
          status: 'active'
        },
        {
          id: 3,
          name: 'Sales Department',
          code: 'SLS-001',
          description: 'Sales team expenses and commissions',
          manager: 'Mike Johnson',
          budget: 60000,
          spent: 58000,
          remaining: 2000,
          status: 'active'
        },
        {
          id: 4,
          name: 'Administration',
          code: 'ADM-001',
          description: 'General administrative expenses',
          manager: 'Sarah Williams',
          budget: 30000,
          spent: 20000,
          remaining: 10000,
          status: 'active'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredCostCenters = costCenters.filter(costCenter => 
    costCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    costCenter.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    costCenter.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculatePercentage = (spent: number, total: number) => {
    return Math.round((spent / total) * 100);
  };

  if (isLoading) {
    return <div className="loading">Loading cost centers...</div>;
  }

  return (
    <div className="cost-centers-container">
      <div className="cost-centers-header">
        <h1>Cost Centers</h1>
        <div className="actions">
          <button className="add-button">Add Cost Center</button>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search cost centers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="cost-centers-grid">
        {filteredCostCenters.map(costCenter => {
          const percentage = calculatePercentage(costCenter.spent, costCenter.budget);
          let statusClass = 'good';
          if (percentage > 90) {
            statusClass = 'danger';
          } else if (percentage > 70) {
            statusClass = 'warning';
          }

          return (
            <div className="cost-center-card" key={costCenter.id}>
              <div className="cost-center-header">
                <div className="cost-center-title">
                  <h3>{costCenter.name}</h3>
                  <span className="cost-center-code">{costCenter.code}</span>
                </div>
                <span className={`status-badge ${costCenter.status}`}>
                  {costCenter.status}
                </span>
              </div>
              
              <div className="cost-center-details">
                <p className="description">{costCenter.description}</p>
                <div className="manager">
                  <span className="label">Manager:</span>
                  <span className="value">{costCenter.manager}</span>
                </div>
              </div>
              
              <div className="budget-info">
                <div className="budget-row">
                  <div className="budget-item">
                    <span className="label">Budget</span>
                    <span className="value">Rs. {costCenter.budget.toLocaleString()}</span>
                  </div>
                  <div className="budget-item">
                    <span className="label">Spent</span>
                    <span className="value">Rs. {costCenter.spent.toLocaleString()}</span>
                  </div>
                  <div className="budget-item">
                    <span className="label">Remaining</span>
                    <span className={`value ${costCenter.remaining <= 0 ? 'danger' : ''}`}>
                      Rs. {costCenter.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${statusClass}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{percentage}% of budget used</span>
                </div>
              </div>
              
              <div className="cost-center-actions">
                <button className="action-button edit">Edit</button>
                <button className="action-button view">View Transactions</button>
                <button className="action-button reports">Reports</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CostCenters;
