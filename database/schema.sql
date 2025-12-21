-- Fees Receipt Management System Database Schema
-- Created: December 20, 2025

CREATE DATABASE IF NOT EXISTS fees_management;
USE fees_management;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    course VARCHAR(100) NOT NULL,
    admission_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fees Structure Table
CREATE TABLE IF NOT EXISTS fee_structure (
    fee_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_type ENUM('tuition', 'exam', 'hostel', 'library', 'sports', 'other') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    pending_amount DECIMAL(10,2) NOT NULL,
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    fee_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('cash', 'upi', 'card', 'cheque', 'bank_transfer') NOT NULL,
    transaction_id VARCHAR(100),
    cheque_number VARCHAR(50),
    payment_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (fee_id) REFERENCES fee_structure(fee_id) ON DELETE CASCADE
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id INT NOT NULL,
    student_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_in_words VARCHAR(255) NOT NULL,
    balance_remaining DECIMAL(10,2) DEFAULT 0.00,
    issued_by VARCHAR(100) NOT NULL,
    receipt_date DATE NOT NULL,
    status ENUM('active', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
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
CREATE INDEX idx_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_payment_date ON payments(payment_date);
CREATE INDEX idx_student_status ON students(status);

-- View for Student Fee Summary
CREATE VIEW student_fee_summary AS
SELECT 
    s.student_id,
    s.roll_number,
    s.student_name,
    s.course,
    SUM(f.total_amount) as total_fees,
    SUM(f.paid_amount) as total_paid,
    SUM(f.pending_amount) as total_pending,
    SUM(f.late_fee) as total_late_fee
FROM students s
LEFT JOIN fee_structure f ON s.student_id = f.student_id
GROUP BY s.student_id;

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
