const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');
console.log(`Connecting to database at: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Successfully connected to the database');
  
  // Check if scheme_codes table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='scheme_codes';", [], (err, row) => {
    if (err) {
      console.error('Error checking for scheme_codes table:', err.message);
      return;
    }
    
    if (row) {
      console.log('scheme_codes table exists');
      
      // Check the schema of the scheme_codes table
      db.all("PRAGMA table_info('scheme_codes');", [], (err, columns) => {
        if (err) {
          console.error('Error getting table info:', err.message);
          return;
        }
        
        console.log('\nScheme Codes Table Schema:');
        console.table(columns);
        
        // Try to insert a test record
        const now = new Date().toISOString();
        db.run(
          'INSERT INTO scheme_codes (code, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          ['TEST001', 'Test Scheme', now, now],
          function(err) {
            if (err) {
              console.error('Error inserting test record:', err.message);
              return;
            }
            console.log('\nSuccessfully inserted test record with ID:', this.lastID);
            
            // Query the test record
            db.get('SELECT * FROM scheme_codes WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                console.error('Error querying test record:', err.message);
                return;
              }
              console.log('\nTest record from database:');
              console.log(row);
              
              // Close the database connection
              db.close();
            });
          }
        );
      });
    } else {
      console.log('scheme_codes table does not exist');
      db.close();
    }
  });
});
