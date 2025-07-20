const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'financial-tracker.db');
console.log('Database path:', dbPath);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
  
  // Test query
  db.get("SELECT sqlite_version() as version", [], (err, row) => {
    if (err) {
      console.error('Error querying database:', err);
      db.close();
      return;
    }
    console.log('SQLite version:', row.version);
    
    // Test scheme_codes table
    testSchemeCodesTable(db);
  });
});

function testSchemeCodesTable(db) {
  console.log('\n=== Testing scheme_codes table ===');
  
  // 1. Create a test record
  const testCode = `TEST-${Date.now()}`;
  const testName = 'Test Scheme Code';
  const now = new Date().toISOString();
  
  console.log('Inserting test record...');
  db.run(
    'INSERT INTO scheme_codes (code, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [testCode, testName, now, now],
    function(err) {
      if (err) {
        console.error('Error inserting record:', err);
        db.close();
        return;
      }
      
      const id = this.lastID;
      console.log(`Inserted record with ID: ${id}`);
      
      // 2. Query the record
      db.get('SELECT * FROM scheme_codes WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error querying record:', err);
          cleanupTestRecord(db, id);
          return;
        }
        
        console.log('Retrieved record:', row);
        
        // 3. Clean up
        cleanupTestRecord(db, id);
      });
    }
  );
}

function cleanupTestRecord(db, id) {
  console.log('\nCleaning up test record...');
  db.run('DELETE FROM scheme_codes WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error cleaning up test record:', err);
    } else {
      console.log('Test record cleaned up');
    }
    
    // Close the database connection
    db.close();
    console.log('Database connection closed');
  });
}
