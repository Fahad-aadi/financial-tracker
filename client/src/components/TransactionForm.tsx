import React, { useState, useEffect } from 'react';
import './TransactionForm.css';

interface Category {
  id: number;
  name: string;
}

interface CostCenter {
  id: number;
  name: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transaction: any) => void;
  editTransaction?: any;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onClose, 
  onSave,
  editTransaction 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    type: editTransaction?.type || 'expense',
    date: editTransaction?.date || new Date().toISOString().split('T')[0],
    description: editTransaction?.description || '',
    amount: editTransaction?.amount || '',
    categoryId: editTransaction?.categoryId || '',
    costCenterId: editTransaction?.costCenterId || '',
    vendorId: editTransaction?.vendorId || '',
    reference: editTransaction?.reference || '',
    notes: editTransaction?.notes || ''
  });

  useEffect(() => {
    // Simulate API calls to get categories, cost centers, and vendors
    Promise.all([
      // These would be actual API calls in a real app
      Promise.resolve([
        { id: 1, name: 'Food & Dining' },
        { id: 2, name: 'Office Supplies' },
        { id: 3, name: 'Utilities' },
        { id: 4, name: 'Rent' },
        { id: 5, name: 'Salary' }
      ]),
      Promise.resolve([
        { id: 1, name: 'Marketing Department' },
        { id: 2, name: 'Engineering Department' },
        { id: 3, name: 'Sales Department' },
        { id: 4, name: 'Administration' }
      ]),
      Promise.resolve([
        { id: 1, name: 'Office Depot' },
        { id: 2, name: 'Electric Company' },
        { id: 3, name: 'Software Vendor' },
        { id: 4, name: 'Building Management' }
      ])
    ]).then(([categoriesData, costCentersData, vendorsData]) => {
      setCategories(categoriesData);
      setCostCenters(costCentersData);
      setVendors(vendorsData);
      setIsLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to appropriate types
    const formattedData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      categoryId: parseInt(formData.categoryId.toString()),
      costCenterId: parseInt(formData.costCenterId.toString()),
      vendorId: parseInt(formData.vendorId.toString()),
    };
    
    onSave(formattedData);
    onClose();
  };

  if (isLoading) {
    return <div className="loading">Loading form data...</div>;
  }

  return (
    <div className="transaction-form-overlay">
      <div className="transaction-form-container">
        <div className="form-header">
          <h2>{editTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Transaction Type</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange}
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Amount (Rs.)</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleChange}
                min="0.01" 
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Reference/Invoice #</label>
              <input 
                type="text" 
                name="reference" 
                value={formData.reference} 
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select 
                name="categoryId" 
                value={formData.categoryId} 
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Cost Center</label>
              <select 
                name="costCenterId" 
                value={formData.costCenterId} 
                onChange={handleChange}
                required
              >
                <option value="">Select a cost center</option>
                {costCenters.map(costCenter => (
                  <option key={costCenter.id} value={costCenter.id}>
                    {costCenter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Vendor/Payee</label>
            <select 
              name="vendorId" 
              value={formData.vendorId} 
              onChange={handleChange}
              required
            >
              <option value="">Select a vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              {editTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
