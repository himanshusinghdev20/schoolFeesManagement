const db = require('./config/database');

// Generate receipt number
async function generateReceiptNumber() {
    const year = new Date().getFullYear();
    const [result] = await db.query(
        'SELECT COUNT(*) as count FROM receipts WHERE YEAR(created_at) = ?',
        [year]
    );
    const count = result[0].count + 1;
    return `RCP/${year}/${String(count).padStart(4, '0')}`;
}

// Convert number to words (Indian system)
function numberToWords(num) {
    if (num === 0) return 'Zero Rupees Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
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

// Generate receipt for existing payment
(async () => {
    try {
        console.log('\n🧾 Generating Receipt for Existing Payment\n');
        
        // Get the payment
        const [payments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            WHERE p.payment_id = 1
        `);
        
        if (payments.length === 0) {
            console.log('❌ Payment not found');
            process.exit(1);
        }
        
        const payment = payments[0];
        console.log('✓ Payment found:');
        console.log('  Payment ID:', payment.payment_id);
        console.log('  Student:', payment.student_name);
        console.log('  Roll No:', payment.roll_number);
        console.log('  Amount:', payment.amount_paid);
        
        // Generate receipt number
        const receiptNumber = await generateReceiptNumber();
        console.log('\n✓ Receipt Number:', receiptNumber);
        
        // Convert amount to words
        const amountInWords = numberToWords(Math.floor(payment.amount_paid));
        console.log('✓ Amount in Words:', amountInWords);
        
        // Get balance remaining
        const [balance] = await db.query(`
            SELECT SUM(pending_amount) as balance
            FROM fee_structure
            WHERE profile_id = ?
        `, [payment.profile_id]);
        
        const balanceRemaining = balance[0].balance || 0;
        console.log('✓ Balance Remaining:', balanceRemaining);
        
        // Insert receipt
        const [result] = await db.query(
            `INSERT INTO receipts (receipt_number, payment_id, profile_id, total_amount, amount_in_words, balance_remaining, issued_by, receipt_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [receiptNumber, payment.payment_id, payment.profile_id, payment.amount_paid, amountInWords, balanceRemaining, 'Admin', new Date().toISOString().split('T')[0]]
        );
        
        console.log('\n✅ Receipt Generated Successfully!');
        console.log('   Receipt ID:', result.insertId);
        console.log('   Receipt Number:', receiptNumber);
        console.log('\n🌐 View receipt at: http://localhost:3000/receipts.html\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
