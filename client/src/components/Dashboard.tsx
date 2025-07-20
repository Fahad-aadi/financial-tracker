import React, { useEffect, useState } from 'react';
import './Dashboard.css';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  status: string;
}

interface CostCenter {
  id: number;
  name: string;
  code: string;
  budget: number;
}

const Dashboard: React.FC = () => {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setRecentTransactions([
        { id: 1, description: 'Office supplies purchase', amount: 1500, date: '2025-04-01', status: 'completed' },
        { id: 2, description: 'Utility bill payment', amount: 2500, date: '2025-04-02', status: 'completed' }
      ]);
      
      setCostCenters([
        { id: 1, name: 'IT Department', code: 'IT-001', budget: 50000 },
        { id: 2, name: 'HR Department', code: 'HR-001', budget: 30000 },
        { id: 3, name: 'Marketing', code: 'MKT-001', budget: 40000 }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Financial Dashboard</h1>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Budget</h3>
          <p className="amount">Rs. 120,000</p>
        </div>
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <p className="amount">Rs. 45,000</p>
        </div>
        <div className="summary-card">
          <h3>Remaining</h3>
          <p className="amount">Rs. 75,000</p>
        </div>
        <div className="summary-card">
          <h3>Transactions</h3>
          <p className="amount">24</p>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Transactions</h2>
          <div className="transaction-list">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{transaction.description}</td>
                    <td>{transaction.date}</td>
                    <td>Rs. {transaction.amount.toLocaleString()}</td>
                    <td>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Cost Centers</h2>
          <div className="cost-center-list">
            {costCenters.map(costCenter => (
              <div className="cost-center-card" key={costCenter.id}>
                <h3>{costCenter.name}</h3>
                <p className="code">{costCenter.code}</p>
                <p className="budget">Budget: Rs. {costCenter.budget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
