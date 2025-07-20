import React, { useState, useEffect } from 'react';
import './PaymentStatusForm.css';

interface PaymentDetails {
  chequeNumber: string;
  chequeDate: string;
  chequeAmount: string;
  remarks: string;
}

interface PaymentStatusFormProps {
  transactionId: number;
  onSave: (transactionId: number, paymentDetails: PaymentDetails, status: string) => void;
  onCancel: () => void;
  currentStatus?: string;
  currentPaymentDetails?: PaymentDetails;
}

const PaymentStatusForm: React.FC<PaymentStatusFormProps> = ({
  transactionId,
  onSave,
  onCancel,
  currentStatus = 'pending',
  currentPaymentDetails
}) => {
  // Format date to YYYY-MM-DD for date input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    // Check if date is in DD-MM-YYYY format
    const ddmmyyyyPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (ddmmyyyyPattern.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  };
  
  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    chequeNumber: currentPaymentDetails?.chequeNumber || '',
    chequeDate: currentPaymentDetails?.chequeDate || '',
    chequeAmount: currentPaymentDetails?.chequeAmount || '',
    remarks: currentPaymentDetails?.remarks || ''
  });
  
  const [isEditing, setIsEditing] = useState(!currentPaymentDetails);

  useEffect(() => {
    if (currentPaymentDetails) {
      setPaymentDetails({
        chequeNumber: currentPaymentDetails.chequeNumber || '',
        chequeDate: currentPaymentDetails.chequeDate || '',
        chequeAmount: currentPaymentDetails.chequeAmount || '',
        remarks: currentPaymentDetails.remarks || ''
      });
    }
  }, [currentPaymentDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convert from YYYY-MM-DD to DD-MM-YYYY for storage
    const formattedDate = value ? formatDateToDDMMYYYY(value) : '';
    
    setPaymentDetails(prev => ({
      ...prev,
      [name]: formattedDate
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!paymentDetails.chequeNumber || !paymentDetails.chequeDate || !paymentDetails.chequeAmount) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSave(transactionId, paymentDetails, 'cheque-prepared');
  };
  
  const handleDelete = () => {
    // Reset payment details and change status back to pending
    const emptyPaymentDetails = {
      chequeNumber: '',
      chequeDate: '',
      chequeAmount: '',
      remarks: ''
    };
    
    onSave(transactionId, emptyPaymentDetails, 'pending');
  };

  return (
    <div className="payment-status-overlay">
      <div className="payment-status-container">
        <div className="payment-status-header">
          <h2>Payment Details</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="payment-status-content">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cheque/MPG Number <span className="required">*</span></label>
                <input
                  type="text"
                  name="chequeNumber"
                  value={paymentDetails.chequeNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Cheque/MPG Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="chequeDate"
                  value={formatDateForInput(paymentDetails.chequeDate)}
                  onChange={handleDateChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Cheque/MPG Amount <span className="required">*</span></label>
                <input
                  type="number"
                  name="chequeAmount"
                  value={paymentDetails.chequeAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={paymentDetails.remarks}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {currentStatus === 'pending' ? 'Issue Cheque' : 'Update Payment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="payment-details-view">
              <div className="detail-row">
                <span className="detail-label">Cheque/MPG Number:</span>
                <span className="detail-value">{paymentDetails.chequeNumber}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Cheque/MPG Date:</span>
                <span className="detail-value">{paymentDetails.chequeDate}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Cheque/MPG Amount:</span>
                <span className="detail-value">Rs. {parseFloat(paymentDetails.chequeAmount).toLocaleString()}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Remarks:</span>
                <span className="detail-value">{paymentDetails.remarks || '-'}</span>
              </div>
              
              <div className="form-actions">
                <button type="button" className="edit-button" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button type="button" className="delete-button" onClick={handleDelete}>
                  Delete
                </button>
                <button type="button" className="close-button" onClick={onCancel}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusForm;
