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

// Student Signup
router.post('/signup', async (req, res) => {
    try {
        const { rollNumber, name, class: studentClass, email, phone, password } = req.body;

        // Validate required fields
        if (!rollNumber || !name || !studentClass || !email || !password) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided' });
        }

        // Check if roll number or email already exists in student_profile
        const checkQuery = 'SELECT * FROM student_profile WHERE roll_number = ? OR email = ?';
        const [results] = await db.query(checkQuery, [rollNumber, email]);

        if (results.length > 0) {
            return res.status(409).json({ success: false, message: 'Roll number or email already exists' });
        }

        // Store plain text password (matching admin system)
        const password_hash = password;

        // Insert new student profile
        const insertQuery = `
            INSERT INTO student_profile (roll_number, student_name, class, email, phone, password_hash, admission_date, status)
            VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'active')
        `;

        const [result] = await db.query(insertQuery, [rollNumber, name, studentClass, email, phone, password_hash]);

        res.json({
            success: true,
            message: 'Account created successfully',
            profile_id: result.insertId
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// Student Login
router.post('/login', async (req, res) => {
    try {
        // Accept both rollNumber and loginId from frontend
        const rollNumber = req.body.rollNumber || req.body.loginId;
        const { password } = req.body;

        if (!rollNumber || !password) {
            return res.status(400).json({ success: false, message: 'Roll number and password are required' });
        }

        console.log('Student login attempt:', { rollNumber, password: '***' });

        // Find student in student_profile table
        const query = 'SELECT * FROM student_profile WHERE roll_number = ? AND status = "active"';
        const [results] = await db.query(query, [rollNumber]);

        console.log('Query results:', results.length, 'students found');

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid roll number or password' });
        }

        const student = results[0];

        // Verify password (plain text comparison)
        console.log('Password verification:', { 
            provided: password, 
            stored: student.password_hash,
            match: password === student.password_hash 
        });

        if (password !== student.password_hash) {
            console.log('❌ Password mismatch - Login failed');
            return res.status(401).json({ success: false, message: 'Invalid roll number or password' });
        }

        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        console.log('✅ Login successful for:', student.student_name, '- Roll:', rollNumber);

        // Return success with token and user info
        res.json({
            success: true,
            token: sessionToken,
            student: {
                profile_id: student.profile_id,
                roll_number: student.roll_number,
                student_name: student.student_name,
                class: student.class,
                email: student.email,
                phone: student.phone,
                profile_pic: student.profile_pic
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Get Student Profile (with token verification)
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        // Get profile_id from query or header
        const profileId = req.query.profile_id || req.headers['x-profile-id'];

        if (!profileId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        const query = `
            SELECT sp.*, 
                   COALESCE(SUM(f.total_amount), 0) as total_fees,
                   COALESCE(SUM(f.paid_amount), 0) as paid_fees,
                   COALESCE(SUM(f.pending_amount), 0) as pending_fees
            FROM student_profile sp
            LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE sp.profile_id = ?
            GROUP BY sp.profile_id
        `;

        const [results] = await db.query(query, [profileId]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = results[0];
        delete student.password_hash; // Remove password from response

        res.json({ success: true, student });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Student Payments
router.get('/:id/payments', async (req, res) => {
    try {
        const query = `
            SELECT p.*, r.receipt_number, r.receipt_date
            FROM payments p
            LEFT JOIN receipts r ON p.payment_id = r.payment_id
            WHERE p.profile_id = ?
            ORDER BY p.payment_date DESC
        `;

        const [results] = await db.query(query, [req.params.id]);
        res.json({ success: true, payments: results });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all students (for admin dashboard)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                sp.profile_id as student_id, 
                sp.roll_number, 
                sp.student_name, 
                sp.email, 
                sp.phone, 
                sp.class as course, 
                sp.admission_date, 
                sp.status,
                sp.created_at,
                sp.updated_at,
                COALESCE(SUM(f.total_amount), 0) as total_fees,
                COALESCE(SUM(f.paid_amount), 0) as total_paid,
                COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM student_profile sp
            LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
            GROUP BY sp.profile_id
            ORDER BY sp.created_at DESC
        `;
        
        const [students] = await db.query(query);
        console.log('Loaded students with fees:', students.length);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const query = `
            SELECT s.*, 
                   COALESCE(SUM(f.total_amount), 0) as total_fees,
                   COALESCE(SUM(f.paid_amount), 0) as total_paid,
                   COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM students s
            LEFT JOIN fee_structure f ON s.student_id = f.student_id
            WHERE s.student_id = ?
            GROUP BY s.student_id
        `;
        
        const [students] = await db.query(query, [req.params.id]);
        
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: students[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new student (from admin dashboard)
router.post('/', async (req, res) => {
    try {
        const { roll_number, student_name, email, phone, course, admission_date } = req.body;
        
        // Add to student_profile with default password
        const defaultPassword = '123456'; // Default password for new students
        const insertQuery = 'INSERT INTO student_profile (roll_number, student_name, class, email, phone, password_hash, admission_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")';
        
        const [result] = await db.query(insertQuery, [roll_number, student_name, course, email, phone, defaultPassword, admission_date]);
        
        console.log('✅ New student added:', student_name, '- Roll:', roll_number, '- ID:', result.insertId);
        
        res.json({ 
            success: true, 
            message: 'Student added successfully',
            student_id: result.insertId 
        });
    } catch (error) {
        console.error('Add student error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Roll number or email already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const { student_name, email, phone, course, status } = req.body;
        const updateQuery = 'UPDATE student_profile SET student_name = ?, email = ?, phone = ?, class = ?, status = ? WHERE profile_id = ?';
        
        await db.query(updateQuery, [student_name, email, phone, course, status, req.params.id]);
        console.log('✅ Student updated, ID:', req.params.id);
        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE student_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Search students
router.get('/search/:term', async (req, res) => {
    try {
        const searchTerm = `%${req.params.term}%`;
        const query = `
            SELECT sp.profile_id as student_id, sp.roll_number, sp.student_name, 
                   sp.class as course, sp.email, sp.phone, sp.status,
                   COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM student_profile sp
            LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE (sp.student_name LIKE ? OR sp.roll_number LIKE ?) AND sp.status = 'active'
            GROUP BY sp.profile_id
        `;
        
        const [students] = await db.query(query, [searchTerm, searchTerm]);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
