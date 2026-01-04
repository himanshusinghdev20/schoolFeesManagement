-- Create student_profile table separately
USE fees_management;

-- -- Drop existing tables with foreign key dependencies (in correct order)
-- DROP TABLE IF EXISTS receipts;
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS fee_structure;

-- Create Student Profile Table (for student signup and authentication)
CREATE TABLE IF NOT EXISTS student_profile (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    class VARCHAR(10) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    profile_pic TEXT,
    date_of_birth DATE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    admission_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recreate Fees Structure Table with profile_id
CREATE TABLE IF NOT EXISTS fee_structure (
    fee_id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT NOT NULL,
    fee_type ENUM('tuition', 'exam', 'hostel', 'library', 'sports', 'other') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    pending_amount DECIMAL(10,2) NOT NULL,
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES student_profile(profile_id) ON DELETE CASCADE
);

-- Recreate Payments Table with profile_id
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    profile_id INT NOT NULL,
    fee_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('cash', 'upi', 'card', 'cheque', 'bank_transfer') NOT NULL,
    transaction_id VARCHAR(100),
    cheque_number VARCHAR(50),
    payment_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES student_profile(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (fee_id) REFERENCES fee_structure(fee_id) ON DELETE CASCADE
);

-- Recreate Receipts Table with profile_id
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id INT NOT NULL,
    profile_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_in_words VARCHAR(255) NOT NULL,
    balance_remaining DECIMAL(10,2) DEFAULT 0.00,
    issued_by VARCHAR(100) NOT NULL,
    receipt_date DATE NOT NULL,
    status ENUM('active', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES student_profile(profile_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_profile_roll_new ON student_profile(roll_number);
CREATE INDEX idx_profile_email_new ON student_profile(email);
CREATE INDEX idx_profile_status_new ON student_profile(status);

-- Drop and recreate the view
-- DROP VIEW IF EXISTS student_fee_summary;
CREATE VIEW student_fee_summary AS
SELECT 
    sp.profile_id,
    sp.roll_number,
    sp.student_name,
    sp.class,
    sp.email,
    sp.phone,
    COALESCE(SUM(f.total_amount), 0) as total_fees,
    COALESCE(SUM(f.paid_amount), 0) as total_paid,
    COALESCE(SUM(f.pending_amount), 0) as total_pending,
    COALESCE(SUM(f.late_fee), 0) as total_late_fee
FROM student_profile sp
LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
GROUP BY sp.profile_id;

SELECT 'Student Profile table and related tables created successfully!' as Status;
