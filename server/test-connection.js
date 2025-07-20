const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');
console.log(`Testing database connection to: ${dbPath}`);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error('Error: Database file does not exist at path:', dbPath);
  process.exit(1);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Successfully connected to the database');
  
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err.message);
      process.exit(1);
    }
    
    console.log('\nDatabase tables:');
    console.table(tables);
    
    // Check scheme_codes table
    db.all("PRAGMA table_info('scheme_codes');", [], (err, columns) => {
      if (err) {
        console.error('Error getting scheme_codes table info:', err.message);
      } else {
        console.log('\nscheme_codes table columns:');
        console.table(columns);
      }
      
      // Check vendors table
      db.all("PRAGMA table_info('vendors');", [], (err, columns) => {
        if (err) {
          console.error('Error getting vendors table info:', err.message);
        } else {
          console.log('\nvendors table columns:');
          console.table(columns);
        }
        
        // Try to insert a test record into scheme_codes
        const now = new Date().toISOString();
        const testCode = 'TEST' + Date.now();
        
        db.run(
          'INSERT INTO scheme_codes (code, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          [testCode, 'Test Scheme ' + now, now, now],
          function(err) {
            if (err) {
              console.error('Error inserting test record:', err.message);
            } else {
              console.log(`\nSuccessfully inserted test record with ID: ${this.lastID}`);
              
              // Query the test record
              db.get(
                'SELECT * FROM scheme_codes WHERE id = ?',
                [this.lastID],
                (err, row) => {
                  if (err) {
                    console.error('Error querying test record:', err.message);
                  } else {
                    console.log('\nTest record from database:');
                    console.log(row);
                  }
                  
                  // Close the database connection
                  db.close();
                }
              );
            }
          }
        );
      });
    });
  });
});
