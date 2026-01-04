-- Fees Receipt Management System Database Schema
-- Created: December 20, 2025

CREATE DATABASE IF NOT EXISTS fees_management;
USE fees_management;

-- Students Table (for admin management)
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    course VARCHAR(100),
    admission_date DATE,
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student Profile Table (for student signup and authentication)
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

-- Fees Structure Table
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

-- Payments Table
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

-- Receipts Table
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

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings (ignore duplicates)
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('institute_name', 'ABC Educational Institute', 'Name of the institute'),
('institute_address', 'Main Street, City - 123456', 'Institute address'),
('institute_phone', '+91-9876543210', 'Contact number'),
('institute_email', 'info@institute.com', 'Email address'),
('gst_number', 'GST123456789', 'GST registration number'),
('receipt_prefix', 'REC', 'Receipt number prefix'),
('current_year', '2024-2025', 'Current academic year');

-- Create indexes for better performance
CREATE INDEX idx_student_roll ON students(roll_number);
CREATE INDEX idx_profile_roll ON student_profile(roll_number);
CREATE INDEX idx_profile_email ON student_profile(email);
CREATE INDEX idx_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_payment_date ON payments(payment_date);
CREATE INDEX idx_student_status ON students(status);
CREATE INDEX idx_profile_status ON student_profile(status);

-- View for Student Profile Fee Summary
CREATE OR REPLACE VIEW student_fee_summary AS
SELECT 
    sp.profile_id,
    sp.roll_number,
    sp.student_name,
    sp.class,
    sp.email,
    sp.phone,
    SUM(f.total_amount) as total_fees,
    SUM(f.paid_amount) as total_paid,
    SUM(f.pending_amount) as total_pending,
    SUM(f.late_fee) as total_late_fee
FROM student_profile sp
LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
GROUP BY sp.profile_id;

-- View for Monthly Collection Report
CREATE VIEW monthly_collection AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') as month,
    payment_mode,
    COUNT(*) as transaction_count,
    SUM(amount_paid) as total_collection
FROM payments
GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), payment_mode
ORDER BY month DESC;

-- Admin Users Table (for authentication)
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    role ENUM('super_admin', 'admin', 'accountant', 'clerk') DEFAULT 'clerk',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin Sessions Table (for token-based authentication)
CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE CASCADE
);

-- Create indexes for admin tables
CREATE INDEX idx_admin_username ON admin_users(username);
CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_session_token ON admin_sessions(session_token);
CREATE INDEX idx_session_expiry ON admin_sessions(expires_at);
