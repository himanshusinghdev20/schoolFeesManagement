const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all students
router.get('/', async (req, res) => {
    try {
        const [students] = await db.query(`
            SELECT s.*, 
                   COALESCE(SUM(f.total_amount), 0) as total_fees,
                   COALESCE(SUM(f.paid_amount), 0) as total_paid,
                   COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM students s
            LEFT JOIN fee_structure f ON s.student_id = f.student_id
            GROUP BY s.student_id
            ORDER BY s.created_at DESC
        `);
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const [students] = await db.query(`
            SELECT s.*, 
                   COALESCE(SUM(f.total_amount), 0) as total_fees,
                   COALESCE(SUM(f.paid_amount), 0) as total_paid,
                   COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM students s
            LEFT JOIN fee_structure f ON s.student_id = f.student_id
            WHERE s.student_id = ?
            GROUP BY s.student_id
        `, [req.params.id]);
        
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: students[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new student
router.post('/', async (req, res) => {
    try {
        const { roll_number, student_name, email, phone, course, admission_date } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO students (roll_number, student_name, email, phone, course, admission_date) VALUES (?, ?, ?, ?, ?, ?)',
            [roll_number, student_name, email, phone, course, admission_date]
        );
        
        res.json({ 
            success: true, 
            message: 'Student added successfully',
            student_id: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, message: 'Roll number already exists' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const { student_name, email, phone, course, status } = req.body;
        
        await db.query(
            'UPDATE students SET student_name = ?, email = ?, phone = ?, course = ?, status = ? WHERE student_id = ?',
            [student_name, email, phone, course, status, req.params.id]
        );
        
        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE student_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Search students
router.get('/search/:term', async (req, res) => {
    try {
        const searchTerm = `%${req.params.term}%`;
        const [students] = await db.query(`
            SELECT s.*, 
                   COALESCE(SUM(f.pending_amount), 0) as total_pending
            FROM students s
            LEFT JOIN fee_structure f ON s.student_id = f.student_id
            WHERE s.student_name LIKE ? OR s.roll_number LIKE ?
            GROUP BY s.student_id
        `, [searchTerm, searchTerm]);
        
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
