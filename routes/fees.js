const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all fee structures
router.get('/', async (req, res) => {
    try {
        const [fees] = await db.query(`
            SELECT f.*, s.student_name, s.roll_number, s.course
            FROM fee_structure f
            JOIN students s ON f.student_id = s.student_id
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, data: fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get fees by student ID
router.get('/student/:id', async (req, res) => {
    try {
        const [fees] = await db.query(
            'SELECT * FROM fee_structure WHERE profile_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );
        console.log('Loaded fees for profile_id:', req.params.id, '- Count:', fees.length);
        res.json({ success: true, data: fees });
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add fee structure
router.post('/', async (req, res) => {
    try {
        const { student_id, profile_id, fee_type, total_amount, due_date, academic_year, late_fee } = req.body;
        
        console.log('Received fee data:', req.body); // Debug log
        
        // Use profile_id if provided, otherwise use student_id
        const studentIdentifier = profile_id || student_id;
        
        if (!studentIdentifier) {
            console.error('No student identifier provided');
            return res.status(400).json({ success: false, message: 'student_id or profile_id is required' });
        }
        
        if (!fee_type || !total_amount || !academic_year) {
            return res.status(400).json({ success: false, message: 'fee_type, total_amount, and academic_year are required' });
        }
        
        console.log('Inserting fee with profile_id:', studentIdentifier);
        
        const [result] = await db.query(
            `INSERT INTO fee_structure (profile_id, fee_type, total_amount, pending_amount, due_date, academic_year, late_fee) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentIdentifier, fee_type, total_amount, total_amount, due_date, academic_year, late_fee || 0]
        );
        
        console.log('Fee inserted successfully, ID:', result.insertId);
        
        res.json({ 
            success: true, 
            message: 'Fee structure added successfully',
            fee_id: result.insertId 
        });
    } catch (error) {
        console.error('Fee add error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update fee structure
router.put('/:id', async (req, res) => {
    try {
        const { total_amount, late_fee, due_date } = req.body;
        
        // Get current paid amount
        const [current] = await db.query('SELECT paid_amount FROM fee_structure WHERE fee_id = ?', [req.params.id]);
        const paidAmount = current[0].paid_amount;
        const pendingAmount = total_amount - paidAmount;
        
        await db.query(
            'UPDATE fee_structure SET total_amount = ?, pending_amount = ?, late_fee = ?, due_date = ? WHERE fee_id = ?',
            [total_amount, pendingAmount, late_fee, due_date, req.params.id]
        );
        
        res.json({ success: true, message: 'Fee structure updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get pending fees
router.get('/pending', async (req, res) => {
    try {
        const [fees] = await db.query(`
            SELECT f.*, s.student_name, s.roll_number, s.phone, s.email
            FROM fee_structure f
            JOIN students s ON f.student_id = s.student_id
            WHERE f.pending_amount > 0
            ORDER BY f.due_date ASC
        `);
        res.json({ success: true, data: fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get overdue fees
router.get('/overdue', async (req, res) => {
    try {
        const [fees] = await db.query(`
            SELECT f.*, s.student_name, s.roll_number, s.phone, s.email
            FROM fee_structure f
            JOIN students s ON f.student_id = s.student_id
            WHERE f.pending_amount > 0 AND f.due_date < CURDATE()
            ORDER BY f.due_date ASC
        `);
        res.json({ success: true, data: fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
