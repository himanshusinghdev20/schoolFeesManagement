const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Get database connection
let db;
try {
    db = require('../config/database');
} catch (err) {
    console.error('Database connection error:', err);
}

// Admin Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, full_name, email, phone, role } = req.body;

        // Validate required fields
        if (!username || !password || !full_name || !email || !role) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate field formats
        if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore only)' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (!['super_admin', 'admin', 'accountant', 'clerk'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        if (phone && !/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits' });
        }

        // Check if username or email already exists
        const checkQuery = 'SELECT * FROM admin_users WHERE username = ? OR email = ?';
        const [results] = await db.query(checkQuery, [username, email]);

        if (results.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Store plain text password (INSECURE - NOT RECOMMENDED!)
        const password_hash = password;

        // Insert new admin user with structured field order
        const insertQuery = `
            INSERT INTO admin_users (username, email, password_hash, full_name, phone, role, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        `;

        const [result] = await db.query(insertQuery, [username, email, password_hash, full_name, phone, role]);

        res.json({
            success: true,
            message: 'Account created successfully',
            admin_id: result.insertId
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find admin user
        const query = 'SELECT * FROM admin_users WHERE username = ? AND status = "active"';
        const [results] = await db.query(query, [username]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const admin = results[0];

        // Verify password (plain text comparison - INSECURE!)
        if (password !== admin.password_hash) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        
        // Set expiry: 7 days if remember me, 1 day otherwise
        expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 7 : 1));

        // Get client IP and user agent
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Insert session
        const sessionQuery = `
            INSERT INTO admin_sessions (admin_id, session_token, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        await db.query(sessionQuery, [admin.admin_id, sessionToken, ipAddress, userAgent, expiresAt]);

        // Update last login
        const updateQuery = 'UPDATE admin_users SET last_login = NOW() WHERE admin_id = ?';
        await db.query(updateQuery, [admin.admin_id]);

        // Return success with token and user info
        res.json({
            success: true,
            token: sessionToken,
            expiresAt: expiresAt,
            admin: {
                admin_id: admin.admin_id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Verify Token
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const query = `
            SELECT s.*, a.admin_id, a.username, a.full_name, a.email, a.role
            FROM admin_sessions s
            JOIN admin_users a ON s.admin_id = a.admin_id
            WHERE s.session_token = ? AND s.expires_at > NOW() AND a.status = 'active'
        `;

        const [results] = await db.query(query, [token]);

        if (results.length === 0) {
            return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
        }

        const session = results[0];
        res.json({
            valid: true,
            admin: {
                admin_id: session.admin_id,
                username: session.username,
                full_name: session.full_name,
                email: session.email,
                role: session.role
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const query = 'DELETE FROM admin_sessions WHERE session_token = ?';
        await db.query(query, [token]);

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
});

// Clean expired sessions (maintenance endpoint)
router.post('/cleanup-sessions', async (req, res) => {
    try {
        const query = 'DELETE FROM admin_sessions WHERE expires_at < NOW()';
        const [result] = await db.query(query);

        res.json({
            success: true,
            message: 'Expired sessions cleaned up',
            deleted: result.affectedRows
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Server error during cleanup' });
    }
});

module.exports = router;
