const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Daily collection report
router.get('/daily', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        const [payments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number, f.fee_type
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            WHERE DATE(p.payment_date) = ?
            ORDER BY p.created_at
        `, [targetDate]);
        
        const [summary] = await db.query(`
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE DATE(payment_date) = ?
            GROUP BY payment_mode
        `, [targetDate]);
        
        const [total] = await db.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount_paid) as total_collection
            FROM payments
            WHERE DATE(payment_date) = ?
        `, [targetDate]);
        
        res.json({ 
            success: true, 
            data: {
                payments: payments,
                summary: summary,
                total: total[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Monthly collection report
router.get('/monthly', async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month || (new Date().getMonth() + 1);
        const targetYear = year || new Date().getFullYear();
        
        const [report] = await db.query(`
            SELECT 
                DATE(payment_date) as date,
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
            GROUP BY DATE(payment_date), payment_mode
            ORDER BY date DESC
        `, [targetMonth, targetYear]);
        
        const [summary] = await db.query(`
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
            GROUP BY payment_mode
        `, [targetMonth, targetYear]);
        
        const [total] = await db.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount_paid) as total_collection
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
        `, [targetMonth, targetYear]);
        
        res.json({ 
            success: true, 
            data: {
                report: report,
                summary: summary,
                total: total[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Pending fees report
router.get('/pending', async (req, res) => {
    try {
        const [pending] = await db.query(`
            SELECT sp.profile_id as student_id, sp.roll_number, sp.student_name, sp.class as course, sp.phone,
                   SUM(f.total_amount) as total_fees,
                   SUM(f.paid_amount) as paid_amount,
                   SUM(f.pending_amount) as pending_amount,
                   SUM(f.late_fee) as late_fee,
                   MIN(f.due_date) as earliest_due_date
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0
            GROUP BY sp.profile_id
            ORDER BY pending_amount DESC
        `);
        
        const [summary] = await db.query(`
            SELECT 
                COUNT(DISTINCT sp.profile_id) as total_students,
                SUM(f.pending_amount) as total_pending,
                SUM(f.late_fee) as total_late_fee
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0
        `);
        
        res.json({ 
            success: true, 
            data: {
                pending: pending,
                summary: summary[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Overdue fees report
router.get('/overdue', async (req, res) => {
    try {
        const [overdue] = await db.query(`
            SELECT sp.profile_id as student_id, sp.roll_number, sp.student_name, sp.class as course, sp.phone, sp.email,
                   f.fee_type, f.total_amount, f.paid_amount, f.pending_amount, 
                   f.late_fee, f.due_date,
                   DATEDIFF(CURDATE(), f.due_date) as days_overdue
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0 AND f.due_date < CURDATE()
            ORDER BY days_overdue DESC, pending_amount DESC
        `);
        
        const [summary] = await db.query(`
            SELECT 
                COUNT(DISTINCT sp.profile_id) as total_students,
                COUNT(f.fee_id) as total_overdue_fees,
                SUM(f.pending_amount) as total_overdue_amount,
                SUM(f.late_fee) as total_late_fee
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0 AND f.due_date < CURDATE()
        `);
        
        res.json({ 
            success: true, 
            data: {
                overdue: overdue,
                summary: summary[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Student-wise collection report
router.get('/student-collection', async (req, res) => {
    try {
        const [report] = await db.query(`
            SELECT sp.profile_id as student_id, sp.roll_number, sp.student_name, sp.class as course,
                   COUNT(p.payment_id) as total_payments,
                   SUM(p.amount_paid) as total_collected,
                   MAX(p.payment_date) as last_payment_date
            FROM student_profile sp
            LEFT JOIN payments p ON sp.profile_id = p.profile_id
            GROUP BY sp.profile_id
            ORDER BY total_collected DESC
        `);
        
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        // Total students
        const [totalStudents] = await db.query("SELECT COUNT(*) as count FROM student_profile WHERE status = 'active'");
        
        // Today's collection
        const [todayCollection] = await db.query(`
            SELECT COALESCE(SUM(amount_paid), 0) as total
            FROM payments
            WHERE DATE(payment_date) = CURDATE()
        `);
        
        // This month collection
        const [monthCollection] = await db.query(`
            SELECT COALESCE(SUM(amount_paid), 0) as total
            FROM payments
            WHERE MONTH(payment_date) = MONTH(CURDATE()) 
            AND YEAR(payment_date) = YEAR(CURDATE())
        `);
        
        // Total pending
        const [totalPending] = await db.query(`
            SELECT COALESCE(SUM(pending_amount), 0) as total
            FROM fee_structure
        `);
        
        // Overdue count
        const [overdueCount] = await db.query(`
            SELECT COUNT(DISTINCT profile_id) as count
            FROM fee_structure
            WHERE pending_amount > 0 AND due_date < CURDATE()
        `);
        
        // Recent payments
        const [recentPayments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            ORDER BY p.created_at DESC
            LIMIT 5
        `);
        
        res.json({ 
            success: true, 
            data: {
                totalStudents: totalStudents[0].count,
                todayCollection: todayCollection[0].total,
                monthCollection: monthCollection[0].total,
                totalPending: totalPending[0].total,
                overdueCount: overdueCount[0].count,
                recentPayments: recentPayments
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

module.exports = router;
