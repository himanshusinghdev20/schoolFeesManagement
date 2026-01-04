const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all payments
router.get('/', async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number, f.fee_type
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            ORDER BY p.payment_date DESC
        `);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number, sp.class, f.fee_type, f.total_amount
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            WHERE p.payment_id = ?
        `, [req.params.id]);
        
        if (payments.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.json({ success: true, data: payments[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Record new payment
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // Accept both profile_id and student_id for backward compatibility
        const profile_id = req.body.profile_id || req.body.student_id;
        const { fee_id, amount_paid, payment_mode, transaction_id, cheque_number, payment_date, remarks } = req.body;
        
        console.log('Recording payment:', { profile_id, fee_id, amount_paid, payment_mode });
        
        // Insert payment record
        const [result] = await connection.query(
            `INSERT INTO payments (profile_id, fee_id, amount_paid, payment_mode, transaction_id, cheque_number, payment_date, remarks) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [profile_id, fee_id, amount_paid, payment_mode, transaction_id, cheque_number, payment_date, remarks]
        );
        
        // Update fee structure
        await connection.query(`
            UPDATE fee_structure 
            SET paid_amount = paid_amount + ?,
                pending_amount = pending_amount - ?
            WHERE fee_id = ?
        `, [amount_paid, amount_paid, fee_id]);
        
        console.log('✅ Payment recorded successfully, fee_id:', fee_id, 'amount:', amount_paid);
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Payment recorded successfully',
            payment_id: result.insertId 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// Get payments by student
router.get('/student/:id', async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT p.*, f.fee_type
            FROM payments p
            JOIN fee_structure f ON p.fee_id = f.fee_id
            WHERE p.profile_id = ?
            ORDER BY p.payment_date DESC
        `, [req.params.id]);
        
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get today's payments
router.get('/today/summary', async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE DATE(payment_date) = CURDATE()
            GROUP BY payment_mode
        `);
        
        const [total] = await db.query(`
            SELECT SUM(amount_paid) as total_collection
            FROM payments
            WHERE DATE(payment_date) = CURDATE()
        `);
        
        res.json({ 
            success: true, 
            data: {
                summary: summary,
                total: total[0].total_collection || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
