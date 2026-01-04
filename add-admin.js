const mysql = require('mysql2');
require('dotenv').config();

// Get admin details from command line arguments
// Usage: node add-admin.js <username> <email> <password> <fullname> <role> [phone]
const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const fullName = process.argv[5];
const role = process.argv[6] || 'clerk';
const phone = process.argv[7] || null;

// Validation
if (!username || !email || !password || !fullName) {
    console.error('\n❌ Error: Missing required fields!\n');
    console.log('Usage: node add-admin.js <username> <email> <password> <fullname> <role> [phone]');
    console.log('\nExample:');
    // console.log('  node add-admin.js admin admin@school.com admin123 "John Doe" admin 9876543210');
    console.log('\nRoles: super_admin, admin, accountant, clerk');
    console.log('\nRequired Fields:');
    console.log('  - username    : 3-20 characters (letters, numbers, underscore)');
    console.log('  - email       : Valid email address');
    console.log('  - password    : Minimum 6 characters');
    console.log('  - fullname    : Full name (use quotes if contains spaces)');
    console.log('  - role        : super_admin, admin, accountant, or clerk (default: clerk)');
    console.log('  - phone       : Optional - 10 digit phone number\n');
    process.exit(1);
}

// Validate fields
if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    console.error('\n❌ Error: Username must be 3-20 characters (letters, numbers, underscore only)\n');
    process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('\n❌ Error: Invalid email format\n');
    process.exit(1);
}

if (password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters\n');
    process.exit(1);
}

if (!['super_admin', 'admin', 'accountant', 'clerk'].includes(role)) {
    console.error('\n❌ Error: Invalid role. Must be: super_admin, admin, accountant, or clerk\n');
    process.exit(1);
}

if (phone && !/^[0-9]{10}$/.test(phone)) {
    console.error('\n❌ Error: Phone must be exactly 10 digits\n');
    process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║         🔐 Creating Admin User Account           ║');
console.log('╚════════════════════════════════════════════════════╝\n');
console.log('📋 Admin Details:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Username      :', username);
console.log('  Email         :', email);
console.log('  Password      :', password);
console.log('  Full Name     :', fullName);
console.log('  Role          :', role);
console.log('  Phone         :', phone || 'Not provided');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⏳ Connecting to database...\n');

// Create database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fees_management'
});

connection.connect(async (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }

    console.log('✓ Connected to database\n');

    try {
        // Store plain text password (INSECURE - For development only!)
        const password_hash = password;
        
        // Insert the admin user with proper field structure
        const query = `
            INSERT INTO admin_users (username, email, password_hash, full_name, phone, role, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `;

        connection.query(query, [username, email, password_hash, fullName, phone, role], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error('❌ Error: Username or email already exists!\n');
                } else {
                    console.error('❌ Database error:', err.message, '\n');
                }
                connection.end();
                process.exit(1);
            }

            console.log('✅ Admin user created successfully!\n');
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║           📝 Account Details                       ║');
            console.log('╚════════════════════════════════════════════════════╝\n');
            console.log('  Admin ID      :', result.insertId);
            console.log('  Username      :', username);
            console.log('  Email         :', email);
            console.log('  Password      :', password);
            console.log('  Full Name     :', fullName);
            console.log('  Role          :', role);
            console.log('  Phone         :', phone || 'N/A');
            console.log('  Status        : active\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🌐 Login URL: http://localhost:3000/admin-login');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            connection.end();
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Error:', error.message, '\n');
        connection.end();
        process.exit(1);
    }
});
