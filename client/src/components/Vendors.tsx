import React, { useState, useEffect } from 'react';
import './Vendors.css';

interface Vendor {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  totalSpent: number;
  status: string;
}

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Simulate API call to fetch vendors
    setTimeout(() => {
      setVendors([
        {
          id: 1,
          name: 'Office Depot',
          contactPerson: 'John Smith',
          email: 'john@officedepot.com',
          phone: '555-123-4567',
          address: '123 Supply St, Business City, 12345',
          category: 'Office Supplies',
          totalSpent: 15000,
          status: 'active'
        },
        {
          id: 2,
          name: 'Electric Company',
          contactPerson: 'Jane Doe',
          email: 'jane@electricco.com',
          phone: '555-987-6543',
          address: '456 Power Ave, Energy City, 67890',
          category: 'Utilities',
          totalSpent: 25000,
          status: 'active'
        },
        {
          id: 3,
          name: 'Software Solutions Inc',
          contactPerson: 'Mike Johnson',
          email: 'mike@softwaresolutions.com',
          phone: '555-456-7890',
          address: '789 Code Blvd, Tech City, 54321',
          category: 'Software',
          totalSpent: 35000,
          status: 'active'
        },
        {
          id: 4,
          name: 'Building Management LLC',
          contactPerson: 'Sarah Williams',
          email: 'sarah@buildingmgmt.com',
          phone: '555-789-0123',
          address: '321 Property Ln, Real Estate City, 98765',
          category: 'Rent',
          totalSpent: 120000,
          status: 'active'
        },
        {
          id: 5,
          name: 'Marketing Experts',
          contactPerson: 'David Brown',
          email: 'david@marketingexperts.com',
          phone: '555-234-5678',
          address: '654 Brand St, Ad City, 45678',
          category: 'Marketing',
          totalSpent: 45000,
          status: 'inactive'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="loading">Loading vendors...</div>;
  }

  return (
    <div className="vendors-container">
      <div className="vendors-header">
        <h1>Vendors</h1>
        <div className="actions">
          <button className="add-button">Add Vendor</button>
          <div className="filter-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="vendors-table">
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Category</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map(vendor => (
              <tr key={vendor.id}>
                <td className="vendor-name">{vendor.name}</td>
                <td>{vendor.category}</td>
                <td>{vendor.contactPerson}</td>
                <td>{vendor.email}</td>
                <td>{vendor.phone}</td>
                <td className="amount">Rs. {vendor.totalSpent.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${vendor.status}`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="action-button edit">Edit</button>
                  <button className="action-button view">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vendors;
