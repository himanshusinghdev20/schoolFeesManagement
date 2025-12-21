const express = require('express');
const router = express.Router();
const db = require('../config/database');
const moment = require('moment');

// Generate receipt number
async function generateReceiptNumber() {
    try {
        const [settings] = await db.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'receipt_prefix'"
        );
        const prefix = settings[0].setting_value;
        const year = new Date().getFullYear();
        
        // Get last receipt number
        const [lastReceipt] = await db.query(
            "SELECT receipt_number FROM receipts WHERE receipt_number LIKE ? ORDER BY receipt_id DESC LIMIT 1",
            [`${prefix}-${year}-%`]
        );
        
        let nextNumber = 1;
        if (lastReceipt.length > 0) {
            const lastNum = parseInt(lastReceipt[0].receipt_number.split('-')[2]);
            nextNumber = lastNum + 1;
        }
        
        return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
        throw error;
    }
}

// Convert number to words (Indian system)
function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    
    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);
    
    return result.trim() + ' Rupees Only';
}

// Get all receipts
router.get('/', async (req, res) => {
    try {
        const [receipts] = await db.query(`
            SELECT r.*, s.student_name, s.roll_number, p.payment_mode
            FROM receipts r
            JOIN students s ON r.student_id = s.student_id
            JOIN payments p ON r.payment_id = p.payment_id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, data: receipts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get receipt by ID
router.get('/:id', async (req, res) => {
    try {
        const [receipts] = await db.query(`
            SELECT r.*, s.*, p.payment_mode, p.transaction_id, p.cheque_number,
                   f.fee_type, f.total_amount as fee_total
            FROM receipts r
            JOIN students s ON r.student_id = s.student_id
            JOIN payments p ON r.payment_id = p.payment_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            WHERE r.receipt_id = ?
        `, [req.params.id]);
        
        if (receipts.length === 0) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        
        // Get institute details
        const [settings] = await db.query('SELECT * FROM system_settings');
        const instituteInfo = {};
        settings.forEach(s => {
            instituteInfo[s.setting_key] = s.setting_value;
        });
        
        res.json({ 
            success: true, 
            data: {
                receipt: receipts[0],
                institute: instituteInfo
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Generate receipt
router.post('/', async (req, res) => {
    try {
        const { payment_id, student_id, total_amount, issued_by, receipt_date } = req.body;
        
        // Generate receipt number
        const receiptNumber = await generateReceiptNumber();
        
        // Convert amount to words
        const amountInWords = numberToWords(Math.floor(total_amount));
        
        // Get balance remaining
        const [balance] = await db.query(`
            SELECT SUM(pending_amount) as balance
            FROM fee_structure
            WHERE student_id = ?
        `, [student_id]);
        
        const balanceRemaining = balance[0].balance || 0;
        
        // Insert receipt
        const [result] = await db.query(
            `INSERT INTO receipts (receipt_number, payment_id, student_id, total_amount, amount_in_words, balance_remaining, issued_by, receipt_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [receiptNumber, payment_id, student_id, total_amount, amountInWords, balanceRemaining, issued_by, receipt_date]
        );
        
        res.json({ 
            success: true, 
            message: 'Receipt generated successfully',
            receipt_id: result.insertId,
            receipt_number: receiptNumber
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get receipt by number
router.get('/number/:receiptNumber', async (req, res) => {
    try {
        const [receipts] = await db.query(`
            SELECT r.*, s.*, p.payment_mode, p.transaction_id
            FROM receipts r
            JOIN students s ON r.student_id = s.student_id
            JOIN payments p ON r.payment_id = p.payment_id
            WHERE r.receipt_number = ?
        `, [req.params.receiptNumber]);
        
        if (receipts.length === 0) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        res.json({ success: true, data: receipts[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cancel receipt
router.put('/:id/cancel', async (req, res) => {
    try {
        await db.query(
            "UPDATE receipts SET status = 'cancelled' WHERE receipt_id = ?",
            [req.params.id]
        );
        res.json({ success: true, message: 'Receipt cancelled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
