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

    // Create default admin user with plain text password (INSECURE!)
    try {
        const defaultPassword = 'admin123';
        
        const insertAdminQuery = `
            INSERT IGNORE INTO admin_users (username, email, password_hash, full_name, phone, role, status)
            VALUES ('admin', 'admin@school.com', ?, 'System Administrator', NULL, 'super_admin', 'active')
        `;
        
        await new Promise((resolve, reject) => {
            connection.query(insertAdminQuery, [defaultPassword], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        
        console.log('✓ Default admin user created');
        console.log('  ⚠️  WARNING: Passwords are stored in PLAIN TEXT - VERY INSECURE!');
    } catch (err) {
        console.warn('⚠️ Admin user setup:', err.message);
    }

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║         🔐 Default Admin Account Created          ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log('  Username      : admin');
    console.log('  Email         : admin@school.com');
    console.log('  Password      : admin123');
    console.log('  Full Name     : System Administrator');
    console.log('  Role          : super_admin');
    console.log('  Status        : active\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Login URL: http://localhost:3000/admin-login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  SECURITY WARNING: Change default password immediately!');
    console.log('\n💡 Add more admins using:');
    console.log('   node add-admin.js <username> <email> <password> <fullname> <role>\n');
    console.log('Start server: npm start\n');

    connection.end();
});
