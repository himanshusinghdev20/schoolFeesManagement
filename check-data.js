const db = require('./config/database');

(async () => {
    try {
        const [students] = await db.query('SELECT * FROM student_profile');
        const [receipts] = await db.query('SELECT * FROM receipts');
        const [payments] = await db.query('SELECT * FROM payments');
        const [fees] = await db.query('SELECT * FROM fee_structure');
        
        console.log('\n📊 Database Status:\n');
        console.log('✓ Students:', students.length);
        console.log('✓ Fee Structures:', fees.length);
        console.log('✓ Payments:', payments.length);
        console.log('✓ Receipts:', receipts.length);
        
        if (students.length > 0) {
            console.log('\n👨‍🎓 Sample Student:');
            console.log('  Profile ID:', students[0].profile_id);
            console.log('  Name:', students[0].student_name);
            console.log('  Roll:', students[0].roll_number);
        }
        
        if (fees.length > 0) {
            console.log('\n💰 Sample Fee:');
            console.log('  Fee ID:', fees[0].fee_id);
            console.log('  Profile ID:', fees[0].profile_id);
            console.log('  Type:', fees[0].fee_type);
            console.log('  Total:', fees[0].total_amount);
            console.log('  Paid:', fees[0].paid_amount);
            console.log('  Pending:', fees[0].pending_amount);
        }
        
        if (payments.length > 0) {
            console.log('\n💳 Sample Payment:');
            console.log('  Payment ID:', payments[0].payment_id);
            console.log('  Profile ID:', payments[0].profile_id);
            console.log('  Amount:', payments[0].amount_paid);
            console.log('  Date:', payments[0].payment_date);
        }
        
        if (receipts.length > 0) {
            console.log('\n🧾 Sample Receipt:');
            console.log('  Receipt ID:', receipts[0].receipt_id);
            console.log('  Receipt No:', receipts[0].receipt_number);
            console.log('  Profile ID:', receipts[0].profile_id);
            console.log('  Amount:', receipts[0].total_amount);
        } else {
            console.log('\n⚠️  No receipts found in database!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
