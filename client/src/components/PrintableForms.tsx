import React, { useEffect, useRef } from 'react';
import './PrintableForms.css';

interface PrintableFormsProps {
  transactionData: any;
  onClose: () => void;
  onSaveAndReturn?: () => void;
}

const PrintableForms: React.FC<PrintableFormsProps> = ({ transactionData, onClose, onSaveAndReturn }) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-trigger print dialog when component mounts
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Format amount in words
  const amountInWords = (amount: number): string => {
    // This is a simple implementation - in production, use a more robust library
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const numToWords = (num: number): string => {
      if (num < 20) return ones[num];
      const digit = num % 10;
      if (num < 100) return tens[Math.floor(num / 10)] + (digit ? ' ' + ones[digit] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numToWords(num % 100) : '');
      if (num < 100000) return numToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numToWords(num % 1000) : '');
      if (num < 10000000) return numToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numToWords(num % 100000) : '');
      return numToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numToWords(num % 10000000) : '');
    };
    
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    
    let result = numToWords(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + numToWords(paise) + ' Paise';
    } else {
      result += ' and No Paise';
    }
    
    return result;
  };

  // Calculate values
  const grossAmount = parseFloat(transactionData.grossAmount) || 0;
  const incomeTaxService = parseFloat(transactionData.incomeTaxServiceAmount) || 0;
  const incomeTaxPurchase = parseFloat(transactionData.incomeTaxPurchaseAmount) || 0;
  const generalSalesTax = parseFloat(transactionData.generalSalesTaxAmount) || 0;
  const punjabSalesTax = parseFloat(transactionData.punjabSalesTaxAmount) || 0;
  const stampDuty = parseFloat(transactionData.stampDuty) || 0;
  
  const totalDeductions = incomeTaxService + incomeTaxPurchase + generalSalesTax + punjabSalesTax + stampDuty;
  const netAmount = grossAmount - totalDeductions;
  
  // Get today's date in DD-MM-YYYY format
  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  return (
    <div className="printable-forms-container">
      <div className="print-controls no-print">
        <button onClick={handlePrint} className="print-button">Print Forms</button>
        <button onClick={onClose} className="close-button">Close</button>
        {onSaveAndReturn && (
          <button onClick={onClose} className="save-return-button">Return to Transactions</button>
        )}
      </div>
      
      <div ref={printRef} className="forms-wrapper">
        {/* Form 1: Contingent Bill Summary */}
        <div className="form page-break-after">
          <table className="form-table contingent-bill">
            <tbody>
              <tr>
                <td className="left-header">Provincial</td>
                <td className="right-header">Voucher No</td>
              </tr>
              <tr>
                <td colSpan={2} className="form-title">FULLY VOUCHED CONTINGENT BILL</td>
              </tr>
              <tr>
                <td colSpan={2} className="office-details">
                  <div>Office: DIRECTORATE GENERAL MONITORING & EVALUATION, P&D DEPTT</div>
                  <div>
                    <span className="label">Major Function:</span>
                    <span className="value">01 General Public Service</span>
                    <span className="label dept-code">Deptt. Code:</span>
                    <span className="value highlight">{transactionData.costCenter}</span>
                  </div>
                  <div>
                    <span className="label">Minor Function:</span>
                    <span className="value">015 General Services, 0152 Planning Ser D.D.O Code</span>
                  </div>
                  <div>
                    <span className="label">Detailed Function:</span>
                    <span className="value">015201 Planning, LZ 4064 DGM&E</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="no-col">No of sub.</td>
                <td>
                  <table className="inner-table">
                    <tbody>
                      <tr>
                        <td>Description of Charges</td>
                        <td className="chart-col">Chart/Obj/sr.</td>
                        <td className="amount-col">Amount</td>
                        <td className="ps-col">PS.</td>
                        <td className="ps-col">PS.</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td className="no-col">100</td>
                <td>
                  <div className="charge-heading">PURCHASE OF DURABLE GOODS</div>
                  <div className="charge-item">Transport</div>
                  <div className="charge-item">Machinery & Equipments</div>
                  <div className="charge-item">Furniture & Fixtures</div>
                  <div className="charge-item">Others</div>
                  <div className="charge-total">(a) Total Purchases of Durable Goods</div>
                </td>
              </tr>
              <tr>
                <td className="no-col">400</td>
                <td>
                  <div className="charge-heading">REPAIR AND MAINTENANCE OF DURABLE GOODS AND WORKS</div>
                  <div className="charge-item">Transportation</div>
                  <div className="charge-item">Machinery & Equipments</div>
                  <div className="charge-item">Furniture & Fixtures</div>
                  <div className="charge-item">Building</div>
                  <div className="charge-item">Office Building</div>
                  <div className="charge-item">Other Building</div>
                  <div className="charge-total">(b.) Total repair and maintenance of durable goods</div>
                </td>
              </tr>
              <tr>
                <td className="no-col">500</td>
                <td>
                  <div className="charge-heading">COMMODITIES AND SERVICES</div>
                  <div className="charge-item">Transportation</div>
                  <div className="charge-item">Transportation of goods(freight and cartage)</div>
                  <div className="charge-item">Conveyance charges</div>
                  <div className="charge-item">Other</div>
                  <div className="charge-item">Communication</div>
                  <div className="charge-item">Postage and Telegraph</div>
                  <div className="charge-item highlight-row">
                    {/* <span>Traveling Allowance</span> */}
                    {/* <span>{transactionData.description}</span> */}
                    <span style={{ fontWeight: 'bold' }}>{transactionData.description}</span>
                    <span className="obj-code highlight">{transactionData.objectCode}</span>
                    <span className="amount highlight">{grossAmount.toFixed(0)}</span>
                  </div>
                  <div className="charge-item">Telex & Teleprinters</div>
                  <div className="charge-item">Utilities</div>
                  <div className="charge-item">Gas</div>
                  <div className="charge-item">Water</div>
                  <div className="charge-item">Purchase of Books and Periodicals, Newspapers</div>
                  <div className="charge-item">Uniform and liveries</div>
                  <div className="charge-item">Rent, Royalties, Rate & Taxes</div>
                  <div className="charge-item">Rent of Office Building</div>
                  <div className="charge-item">Rent for Resident Building</div>
                  <div className="charge-item">Other Expenditure</div>
                  <div className="charge-item">Expenditure on fair and exhibitions</div>
                  <div className="charge-item">Publicity and Advertisement</div>
                  <div className="charge-item">Other Stores</div>
                  <div className="charge-item">Other</div>
                  <div className="charge-total">(c.) Total Commodities and Services</div>
                </td>
              </tr>
              <tr>
                <td className="no-col">600</td>
                <td>
                  <div className="charge-heading">TRANSFER PAYMENTS</div>
                  <div className="charge-item">Scholarships and Stipends</div>
                  <div className="charge-item">Awards and Bonuses</div>
                  <div className="charge-item">Entertainment and Gifts</div>
                  <div className="charge-total">(d.) Total Transfer Payments</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="grand-total">
                  <span>GRAND TOTAL</span>
                  <span className="amount highlight">{grossAmount.toFixed(0)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form 2: Certification and Payment Acknowledgement */}
        <div className="form page-break-after">
          <table className="form-table certification">
            <tbody>
              <tr>
                <td colSpan={5}></td>
                <td className="right-header">Rs.</td>
                <td className="right-header">Ps.</td>
              </tr>
              <tr>
                <td colSpan={3}>(i) Allotment of this year</td>
                <td colSpan={2}>= Rs.</td>
                <td className="highlight">4,087,172</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3}>(ii) Total of present bill</td>
                <td colSpan={2}>= Rs.</td>
                <td className="highlight">{grossAmount.toFixed(0)}</td>
                <td className="highlight">{grossAmount.toFixed(0)}</td>
              </tr>
              <tr>
                <td colSpan={3}>(iii) Total of previous bills</td>
                <td colSpan={2}>= Rs.</td>
                <td className="highlight">2087172</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3}>(iv) Total Uptodate (ii) + (iii)</td>
                <td colSpan={2}>= Rs.</td>
                <td className="highlight">2616522</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={3}>(v) Balance (i) - (iv)</td>
                <td colSpan={2}>= Rs.</td>
                <td className="highlight">1,470,650</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={5} className="grand-total-label">GRAND</td>
                <td colSpan={2} className="highlight">{grossAmount.toFixed(0)}</td>
              </tr>
              <tr>
                <td colSpan={7} className="amount-in-words highlight">
                  {amountInWords(grossAmount)}
                </td>
              </tr>
              <tr>
                <td colSpan={7} className="certification-text">
                  Received payment and certified that expenditure charged in this bill could not with due regard to the interest of the
                </td>
              </tr>
              <tr>
                <td colSpan={7} className="signature-line">
                  <div className="signature-block">
                    <div className="signature-title">Head of the office and Designation</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={7} className="certification-points">
                  <p>1. Certified that all the articles detailed in the vouchers attached to the bill and in the those retained in my office have been accounted for in the stock Register.</p>
                  <p>2. Certified that the purchase billed for have been received in the good order, that their quantities are correct and that quality good, that the rates paid are not in excess of the accepted and the market rates and that suitable notes of payment have been recorded against the indents and invoices concerned's prevent double payment.</p>
                  <p>3. Certified that in respect of the conveyance charged for in this bill, a suitable portion of the amount has been charged to Government and the balance sheeting the touring officer's and their subordinates.</p>
                  <p>4. Certified that the charges on account of electricity do not include, any expenses on account of private consumption.</p>
                  <p>5. Certified that Income Tax will be deducted before making payment to the firm at the prescribed rates if due.</p>
                </td>
              </tr>
              <tr>
                <td colSpan={7} className="signature-line">
                  <div className="signature-row">
                    <div className="date-block">
                      <div>Date :</div>
                      <div className="date-line">{formattedDate}</div>
                    </div>
                    <div className="signature-block">
                      <div className="signature-title">Head Office and Designation</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={7} className="audit-section">
                  <div className="audit-title">FOR USE IN AUDIT OFFICE / TREASURY</div>
                  <div className="audit-row">
                    <div className="audit-col">
                      <div>Date :</div>
                      <div className="line"></div>
                    </div>
                    <div className="audit-col">
                      <div>Token No :</div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="audit-row">
                    <div className="audit-col">
                      <div>Pay Rs. :</div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="audit-row">
                    <div className="audit-col">
                      <div>Rupees ( in words ) :</div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="audit-signatures">
                    <div className="audit-signature-block">
                      <div className="line"></div>
                      <div>Asstt. Accountant General</div>
                    </div>
                    <div className="audit-signature-block">
                      <div className="line"></div>
                      <div>Accounts Officer</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Form 3: Computer Information Sheet */}
        <div className="form">
          <table className="form-table computer-info">
            <tbody>
              <tr>
                <td colSpan={7}></td>
                <td>Bill No.</td>
              </tr>
              <tr>
                <td colSpan={8} className="form-title">COMPUTER INFORMATION SHEET</td>
              </tr>
              <tr>
                <td colSpan={8} className="subtitle">(To be attached with each bill referred to the Pre-Audit Centre of the A.G.Punjab at DGM&E in the Punjab)</td>
              </tr>
              <tr>
                <td colSpan={2}>Government:</td>
                <td className="govt-cell">Federal</td>
                <td className="govt-cell">Punjab</td>
                <td className="govt-cell">District</td>
                <td>Dealing Section</td>
                <td>Cost Centre / DDO Code</td>
                <td className="highlight">{transactionData.costCenter}</td>
              </tr>
              <tr>
                <td colSpan={2}>Vendor No:</td>
                <td colSpan={2} className="highlight">30820906</td>
                <td colSpan={2}>PITB</td>
                <td>PAY ROLL 21</td>
                <td className="highlight">LO17007507</td>
              </tr>
              <tr>
                <td colSpan={2}>Cheque to be issued in favour of:</td>
                <td colSpan={6} className="highlight">{transactionData.vendorName}</td>
              </tr>
              <tr>
                <td colSpan={8} className="section-title">Nature of Claim</td>
              </tr>
              <tr className="claim-type-row">
                <td>Establishment</td>
                <td>T.A</td>
                <td>Contin gent</td>
                <td>GPF</td>
                <td>Advance</td>
                <td>Supply</td>
                <td>Scholarship</td>
                <td>Permanent Advance</td>
                {/* <td>Others</td> */}
              </tr>
              <tr>
                <td colSpan={8} className="dept-name">Name of Department / Office: <span className="dept-value">Directorate General Monitoring & Evaluation P&D Deptt</span></td>
              </tr>
              <tr>
                <td colSpan={8} className="payment-codes-section">
                  <table className="payment-codes-table">
                    <tbody>
                      <tr>
                        <td colSpan={3}>Payment Codes</td>
                        <td rowSpan={2}>Description</td>
                        <td rowSpan={2}>Amount (Rs.)</td>
                      </tr>
                      <tr>
                        <td>Old Object Code</td>
                        <td>New Code(5F, A/C)</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td className="highlight">{transactionData.objectCode}</td>
                        <td></td>
                        <td>Traveling Allowance</td>
                        <td className="highlight">{grossAmount.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4}>Total Gross Claim</td>
                        <td className="highlight">{grossAmount.toFixed(0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={8} className="deductions-section">
                  <table className="deductions-table">
                    <tbody>
                      <tr>
                        <td colSpan={3}>Deductions Code</td>
                        <td rowSpan={2}>Description</td>
                        <td rowSpan={2}>%</td>
                        <td rowSpan={2}>Amount (Rs.)</td>
                      </tr>
                      <tr>
                        <td>Old Deduction</td>
                        <td>New Deduction Code</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="highlight">Income Tax (Services/Repair)</td>
                        <td className="highlight">{transactionData.incomeTaxServiceRate}%</td>
                        <td className="highlight">{incomeTaxService.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="highlight">Income Tax (Purchase)</td>
                        <td className="highlight">{transactionData.incomeTaxPurchaseRate}%</td>
                        <td className="highlight">{incomeTaxPurchase.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="highlight">Stamp Duty</td>
                        <td className="highlight">0.00%</td>
                        <td className="highlight">{stampDuty.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td className="highlight">CP777</td>
                        <td></td>
                        <td className="highlight">General Sales Tax</td>
                        <td className="highlight">{transactionData.generalSalesTaxRate}%</td>
                        <td className="highlight">{generalSalesTax.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td className="highlight">PB2385</td>
                        <td></td>
                        <td className="highlight">Punjab Sales Tax</td>
                        <td className="highlight">{transactionData.punjabSalesTaxRate}%</td>
                        <td className="highlight">{punjabSalesTax.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5}>Total Deductions</td>
                        <td className="highlight">{totalDeductions.toFixed(0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td colSpan={8} className="signature-section">
                  <div className="signature-row">
                    <div className="signature-col">
                    <>
                      <span></span>
                      <br />
                      <br />
                      <br />
                      <span></span>
                    </>
                      <div className="signature-line"></div>
                      <div>Signature</div>
                    </div>
                    <div className="net-claim-col">
                      <div className="net-claim-label">Net Claim</div>
                      <div className="net-claim-value highlight">{netAmount.toFixed(0)}</div>
                    </div>
                  </div>
                  <div className="name-row">
                    <div className="name-col">
                      <div>Name & Stamp of DDO</div>
                      <div className="name-line"></div>
                    </div>
                    <div className="rupees-col">
                      <div>Rupees</div>
                      <div className="rupees-value highlight">{amountInWords(netAmount)}</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={8} className="document-section">
                  <div className="document-row">
                    <div className="document-col">
                      <div>Document No</div>
                      <div className="document-line"></div>
                    </div>
                    <div className="cheque-col">
                      <div>Cheque No</div>
                      <div className="cheque-line"></div>
                    </div>
                  </div>
                  <div className="date-row">
                    <div className="date-col">
                      <div>Date</div>
                      <div className="date-line"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintableForms;
