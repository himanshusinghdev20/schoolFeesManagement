const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create connection without database
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

// Read schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Connect and execute schema statement-by-statement (idempotent)
connection.connect(async (err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        console.error('\nPlease ensure:');
        console.error('1. MySQL server is running');
        console.error('2. Database credentials in .env are correct');
        console.error('3. User has proper permissions');
        process.exit(1);
    }

    console.log('✓ Connected to MySQL server');

    // Split statements by semicolon and run sequentially
    const statements = schema
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const runStatement = (sql) => {
        return new Promise((resolve) => {
            connection.query(sql, (err) => {
                if (err) {
                    const msg = (err.message || '').toLowerCase();
                    // Ignore common idempotent errors
                    if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('duplicate key name')) {
                        console.warn('⚠️ Ignored error for statement (likely already exists):', err.message);
                        return resolve();
                    }
                    console.error('❌ Error executing statement:', err.message);
                    return resolve({ error: true, message: err.message });
                }
                resolve();
            });
        });
    };

    for (const stmt of statements) {
        // append semicolon if missing
        const sql = stmt.trim().endsWith(';') ? stmt : stmt + ';';
        // eslint-disable-next-line no-await-in-loop
        const res = await runStatement(sql);
        if (res && res.error) {
            console.error('\nSetup aborted due to error.');
            connection.end();
            process.exit(1);
        }
    }

    console.log('✓ Database schema executed (idempotent)');
    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm start');

    connection.end();
});
