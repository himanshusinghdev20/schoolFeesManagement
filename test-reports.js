const db = require('./config/database');

(async () => {
    try {
        console.log('\n🧪 TESTING REPORTS API QUERIES\n');
        
        // Test Pending Fees Query
        console.log('1️⃣ PENDING FEES REPORT:');
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
        console.log('   Students with pending:', pending.length);
        pending.forEach(p => {
            console.log(`   ✓ ${p.student_name}: Pending ₹${p.pending_amount} (Total: ₹${p.total_fees})`);
        });
        
        const [pendingSummary] = await db.query(`
            SELECT 
                COUNT(DISTINCT sp.profile_id) as total_students,
                SUM(f.pending_amount) as total_pending,
                SUM(f.late_fee) as total_late_fee
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0
        `);
        console.log('   Summary:', pendingSummary[0]);
        
        // Test Overdue Fees Query
        console.log('\n2️⃣ OVERDUE FEES REPORT:');
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
        console.log('   Overdue fees:', overdue.length);
        if (overdue.length > 0) {
            overdue.forEach(o => {
                console.log(`   ⚠️ ${o.student_name}: ${o.fee_type} - ₹${o.pending_amount} (${o.days_overdue} days)`);
            });
        } else {
            console.log('   ✓ No overdue fees (all due dates are today or future)');
        }
        
        // Test Monthly Collection Query
        console.log('\n3️⃣ MONTHLY COLLECTION REPORT (Dec 2025):');
        const month = 12;
        const year = 2025;
        
        const [monthlyReport] = await db.query(`
            SELECT 
                DATE(payment_date) as date,
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
            GROUP BY DATE(payment_date), payment_mode
            ORDER BY date DESC
        `, [month, year]);
        console.log('   Records:', monthlyReport.length);
        monthlyReport.forEach(r => {
            console.log(`   ✓ ${r.date.toLocaleDateString()}: ${r.payment_mode} - ${r.count} txns - ₹${r.total}`);
        });
        
        const [monthlySummary] = await db.query(`
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
            GROUP BY payment_mode
        `, [month, year]);
        console.log('   Summary by Mode:');
        monthlySummary.forEach(s => {
            console.log(`     - ${s.payment_mode}: ${s.count} payments = ₹${s.total}`);
        });
        
        const [monthlyTotal] = await db.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount_paid) as total_collection
            FROM payments
            WHERE MONTH(payment_date) = ? AND YEAR(payment_date) = ?
        `, [month, year]);
        console.log('   Monthly Total:', monthlyTotal[0]);
        
        // Test Daily Collection Query
        console.log('\n4️⃣ DAILY COLLECTION REPORT (Today):');
        const today = new Date().toISOString().split('T')[0];
        
        const [dailyPayments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number, f.fee_type
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            WHERE DATE(p.payment_date) = ?
            ORDER BY p.created_at
        `, [today]);
        console.log('   Today\'s Payments:', dailyPayments.length);
        dailyPayments.forEach(p => {
            console.log(`   ✓ ${p.student_name}: ${p.fee_type} - ₹${p.amount_paid} via ${p.payment_mode}`);
        });
        
        const [dailySummary] = await db.query(`
            SELECT 
                payment_mode,
                COUNT(*) as count,
                SUM(amount_paid) as total
            FROM payments
            WHERE DATE(payment_date) = ?
            GROUP BY payment_mode
        `, [today]);
        console.log('   Summary by Mode:');
        dailySummary.forEach(s => {
            console.log(`     - ${s.payment_mode}: ${s.count} payments = ₹${s.total}`);
        });
        
        const [dailyTotal] = await db.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount_paid) as total_collection
            FROM payments
            WHERE DATE(payment_date) = ?
        `, [today]);
        console.log('   Daily Total:', dailyTotal[0]);
        
        console.log('\n✅ All report queries working!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
})();
