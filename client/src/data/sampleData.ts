// Sample data for the Financial Tracker application
// This is used when the server is not available

// Sample cost centers
export const sampleCostCenters = [
  { id: 1, code: "CC001", name: "Administration" },
  { id: 2, code: "CC002", name: "Finance Department" },
  { id: 3, code: "CC003", name: "IT Department" },
  { id: 4, code: "CC004", name: "Human Resources" }
];

// Sample scheme codes
export const sampleSchemeCodes = [
  { id: 1, code: "SC001", name: "General Operations" },
  { id: 2, code: "SC002", name: "Development Projects" },
  { id: 3, code: "SC003", name: "Training Programs" },
  { id: 4, code: "SC004", name: "Infrastructure" }
];

// Sample object codes
export const sampleObjectCodes = [
  { id: 1, code: "A01101", description: "Basic Pay" },
  { id: 2, code: "A01151", description: "House Rent Allowance" },
  { id: 3, code: "A01270", description: "Other Allowances" },
  { id: 4, code: "A03201", description: "Postage and Telegraph" },
  { id: 5, code: "A03202", description: "Telephone and Trunk Calls" },
  { id: 6, code: "A03303", description: "Electricity" },
  { id: 7, code: "A03805", description: "Traveling Allowance" },
  { id: 8, code: "A03807", description: "POL Charges" },
  { id: 9, code: "A03901", description: "Stationery" },
  { id: 10, code: "A03902", description: "Printing and Publication" },
  { id: 11, code: "A03970", description: "Others" },
  { id: 12, code: "A09601", description: "Plant and Machinery" }
];

// Sample vendors
export const sampleVendors = [
  { id: 1, name: "ABC Suppliers", vendorNumber: "V001", contactPerson: "John Doe", phone: "123-456-7890", email: "john@abcsuppliers.com" },
  { id: 2, name: "XYZ Corporation", vendorNumber: "V002", contactPerson: "Jane Smith", phone: "234-567-8901", email: "jane@xyzcorp.com" },
  { id: 3, name: "123 Services", vendorNumber: "V003", contactPerson: "Bob Johnson", phone: "345-678-9012", email: "bob@123services.com" },
  { id: 4, name: "Tech Solutions", vendorNumber: "V004", contactPerson: "Alice Brown", phone: "456-789-0123", email: "alice@techsolutions.com" }
];

// Sample transactions
export const sampleTransactions = [
  {
    id: 1,
    financialYear: "2024-25",
    costCenter: "1-CC001",
    costCenterName: "Administration",
    schemeCode: "SC001",
    schemeName: "General Operations",
    vendorName: "ABC Suppliers",
    vendorNumber: "V001",
    date: "10-04-2025",
    billNumber: "A01101-001",
    billNature: "goods",
    objectCode: "A01101",
    objectDescription: "Basic Pay",
    grossAmount: "50000",
    goodsAmount: "50000",
    servicesAmount: "0",
    gstAmount: "0",
    pstAmount: "0",
    contractType: "none",
    contractAmount: "0",
    stampDuty: "0",
    advanceIncomeTax: "0",
    incomeTaxPurchaseRate: "5.5",
    incomeTaxPurchaseAmount: "2750",
    incomeTaxServiceRate: "11.0",
    incomeTaxServiceAmount: "0",
    generalSalesTaxRate: "20.0",
    generalSalesTaxAmount: "10000",
    punjabSalesTaxRate: "100.0",
    punjabSalesTaxAmount: "0",
    netAmount: "37250",
    billDetail: "Monthly salary payment",
    billDescription: "Basic pay for April 2025",
    status: "pending"
  },
  {
    id: 2,
    financialYear: "2024-25",
    costCenter: "2-CC002",
    costCenterName: "Finance Department",
    schemeCode: "SC002",
    schemeName: "Development Projects",
    vendorName: "XYZ Corporation",
    vendorNumber: "V002",
    date: "08-04-2025",
    billNumber: "A03970-001",
    billNature: "services",
    objectCode: "A03970",
    objectDescription: "Others",
    grossAmount: "75000",
    goodsAmount: "0",
    servicesAmount: "75000",
    gstAmount: "0",
    pstAmount: "0",
    contractType: "none",
    contractAmount: "0",
    stampDuty: "0",
    advanceIncomeTax: "0",
    incomeTaxPurchaseRate: "5.5",
    incomeTaxPurchaseAmount: "0",
    incomeTaxServiceRate: "11.0",
    incomeTaxServiceAmount: "8250",
    generalSalesTaxRate: "20.0",
    generalSalesTaxAmount: "15000",
    punjabSalesTaxRate: "100.0",
    punjabSalesTaxAmount: "0",
    netAmount: "51750",
    billDetail: "Consulting services",
    billDescription: "Financial advisory services for Q2 2025",
    status: "cheque-issued"
  }
];

// Sample bill numbers
export const sampleBillNumbers = [
  { objectCode: "A01101", lastNumber: 1, deletedNumbers: [] },
  { objectCode: "A03970", lastNumber: 1, deletedNumbers: [] }
];
