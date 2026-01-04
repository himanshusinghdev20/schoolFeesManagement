const mysql = require('mysql2');
require('dotenv').config();

const username = 'adminmain';
const email = 'admin12345@gmail.com';

console.log('\n🔄 Removing existing admin...\n');

// Create database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fees_management'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }

    console.log('✓ Connected to database\n');

    // Delete existing admin with this username or email
    const deleteQuery = 'DELETE FROM admin_users WHERE username = ? OR email = ?';
    
    connection.query(deleteQuery, [username, email], (err, result) => {
        if (err) {
            console.error('❌ Error deleting admin:', err.message);
            connection.end();
            process.exit(1);
        }

        if (result.affectedRows > 0) {
            console.log(`✓ Removed ${result.affectedRows} existing admin(s)\n`);
        } else {
            console.log('ℹ No existing admin found with that username/email\n');
        }

        connection.end();
        console.log('✅ Done! Now you can add the new admin.\n');
        process.exit(0);
    });
});
