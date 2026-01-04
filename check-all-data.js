const db = require('./config/database');

(async () => {
    try {
        console.log('\n📊 COMPREHENSIVE DATA CHECK\n');
        
        // Check students
        const [students] = await db.query('SELECT * FROM student_profile WHERE status = "active"');
        console.log('✅ Active Students:', students.length);
        students.forEach(s => {
            console.log(`   - ${s.student_name} (${s.roll_number}) - Profile ID: ${s.profile_id}`);
        });
        
        // Check fee structures
        const [fees] = await db.query(`
            SELECT f.*, sp.student_name, sp.roll_number 
            FROM fee_structure f 
            JOIN student_profile sp ON f.profile_id = sp.profile_id
            ORDER BY f.profile_id, f.fee_id
        `);
        console.log('\n💰 Fee Structures:', fees.length);
        fees.forEach(f => {
            console.log(`   - ${f.student_name} (${f.roll_number}): ${f.fee_type} - Total: ${f.total_amount}, Paid: ${f.paid_amount}, Pending: ${f.pending_amount}, Due: ${f.due_date}`);
        });
        
        // Check payments
        const [payments] = await db.query(`
            SELECT p.*, sp.student_name, sp.roll_number, f.fee_type
            FROM payments p
            JOIN student_profile sp ON p.profile_id = sp.profile_id
            JOIN fee_structure f ON p.fee_id = f.fee_id
            ORDER BY p.payment_date DESC
        `);
        console.log('\n💳 Payments:', payments.length);
        payments.forEach(p => {
            console.log(`   - ${p.student_name} (${p.roll_number}): ${p.fee_type} - ₹${p.amount_paid} on ${new Date(p.payment_date).toLocaleDateString()} via ${p.payment_mode}`);
        });
        
        // Check pending fees
        const [pending] = await db.query(`
            SELECT sp.student_name, sp.roll_number, 
                   SUM(f.pending_amount) as total_pending,
                   MIN(f.due_date) as earliest_due
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0
            GROUP BY sp.profile_id
        `);
        console.log('\n⏳ Students with Pending Fees:', pending.length);
        pending.forEach(p => {
            console.log(`   - ${p.student_name} (${p.roll_number}): Pending ₹${p.total_pending} - Due: ${p.earliest_due}`);
        });
        
        // Check overdue fees
        const [overdue] = await db.query(`
            SELECT sp.student_name, sp.roll_number, f.fee_type,
                   f.pending_amount, f.due_date,
                   DATEDIFF(CURDATE(), f.due_date) as days_overdue
            FROM student_profile sp
            JOIN fee_structure f ON sp.profile_id = f.profile_id
            WHERE f.pending_amount > 0 AND f.due_date < CURDATE()
            ORDER BY days_overdue DESC
        `);
        console.log('\n🚨 Overdue Fees:', overdue.length);
        overdue.forEach(o => {
            console.log(`   - ${o.student_name} (${o.roll_number}): ${o.fee_type} - ₹${o.pending_amount} (${o.days_overdue} days overdue)`);
        });
        
        // Check receipts
        const [receipts] = await db.query(`
            SELECT r.*, sp.student_name, sp.roll_number
            FROM receipts r
            JOIN student_profile sp ON r.profile_id = sp.profile_id
        `);
        console.log('\n🧾 Receipts:', receipts.length);
        receipts.forEach(r => {
            console.log(`   - ${r.receipt_number}: ${r.student_name} (${r.roll_number}) - ₹${r.total_amount}`);
        });
        
        console.log('\n✅ Data check complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
