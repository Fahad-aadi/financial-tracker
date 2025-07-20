const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'data', 'financial_tracker.db');

// Check if database file exists
const dbExists = fs.existsSync(dbPath);
console.log(`\n=== Database Connection Test ===`);
console.log(`Database path: ${dbPath}`);
console.log(`Database exists: ${dbExists ? '✅ Yes' : '❌ No'}`);

if (!dbExists) {
  console.error('\n❌ Error: Database file does not exist');
  process.exit(1);
}

// Try to connect to the database
console.log('\nConnecting to database...');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  }
  
  console.log('✅ Successfully connected to database');
  
  // Test query to list all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('❌ Error listing tables:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('\n=== Database Tables ===');
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name}`);
    });
    
    // Check if scheme_codes table exists
    const hasSchemeCodes = tables.some(t => t.name === 'scheme_codes');
    console.log(`\nScheme Codes table exists: ${hasSchemeCodes ? '✅ Yes' : '❌ No'}`);
    
    if (hasSchemeCodes) {
      // Get scheme_codes table info
      db.all("PRAGMA table_info('scheme_codes')", [], (err, columns) => {
        if (err) {
          console.error('❌ Error getting table info:', err.message);
        } else {
          console.log('\n=== Scheme Codes Table Structure ===');
          console.log(`Found ${columns.length} columns:`);
          columns.forEach(col => {
            console.log(`- ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
          });
          
          // Count records in scheme_codes
          db.get('SELECT COUNT(*) as count FROM scheme_codes', [], (err, row) => {
            if (err) {
              console.error('❌ Error counting records:', err.message);
            } else {
              console.log(`\nFound ${row.count} records in scheme_codes table`);
              
              // Try to insert a test record
              const testCode = `TEST-${Date.now()}`;
              console.log(`\nInserting test record with code: ${testCode}`);
              
              db.run(
                'INSERT INTO scheme_codes (code, name) VALUES (?, ?)',
                [testCode, `Test Scheme ${new Date().toISOString()}`],
                function(err) {
                  if (err) {
                    console.error('❌ Error inserting test record:', err.message);
                  } else {
                    console.log(`✅ Successfully inserted test record with ID: ${this.lastID}`);
                    
                    // Query the inserted record
                    db.get('SELECT * FROM scheme_codes WHERE id = ?', [this.lastID], (err, row) => {
                      if (err) {
                        console.error('❌ Error querying test record:', err.message);
                      } else if (row) {
                        console.log('\n=== Test Record ===');
                        console.log(`ID: ${row.id}`);
                        console.log(`Code: ${row.code}`);
                        console.log(`Name: ${row.name}`);
                        console.log(`Created At: ${row.createdAt}`);
                        console.log(`Updated At: ${row.updatedAt}`);
                      } else {
                        console.log('❌ Test record not found after insertion');
                      }
                      
                      // Clean up - remove test record
                      console.log('\nCleaning up test record...');
                      db.run('DELETE FROM scheme_codes WHERE id = ?', [this.lastID], (err) => {
                        if (err) {
                          console.error('❌ Error cleaning up test record:', err.message);
                        } else {
                          console.log('✅ Test record cleaned up');
                        }
                        
                        // Close the database connection
                        db.close((err) => {
                          if (err) {
                            console.error('❌ Error closing database:', err.message);
                            process.exit(1);
                          }
                          console.log('\n✅ Database test completed successfully');
                          process.exit(0);
                        });
                      });
                    });
                  }
                }
              );
            }
          });
        }
      });
    } else {
      // Close the database connection if scheme_codes doesn't exist
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
          process.exit(1);
        }
        console.log('\n✅ Database test completed');
      });
    }
  });
});
