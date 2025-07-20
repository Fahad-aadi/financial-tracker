const fs = require('fs');
const path = require('path');

// List of files that need to be updated
const filesToUpdate = [
  'client/src/components/BudgetReports.tsx',
  'client/src/components/BudgetAllocationPlan.tsx',
  'client/src/components/BudgetCheck.tsx',
  'client/src/components/Budgets.tsx',
  'client/src/components/CostCenterReports.tsx',
  'client/src/components/EnhancedTransactionForm.tsx',
  'client/src/components/Transactions.tsx',
  'client/src/services/budgetService.ts'
];

// Base directory
const baseDir = path.resolve(__dirname);

// Process each file
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(baseDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the import statement
    // This pattern matches import { API } or import { API, something } from '../services/api'
    const importPattern = /import\s+\{\s*API\s*(?:,\s*([^}]*))*\s*\}\s+from\s+['"]([^'"]*)['"]/g;
    
    content = content.replace(importPattern, (match, otherImports, importPath) => {
      if (otherImports) {
        // If there are other imports, keep them
        return `import { API, ${otherImports} } from ${importPath}`;
      } else {
        // If it's just API, keep it as is
        return `import { API } from ${importPath}`;
      }
    });
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All files processed.');
