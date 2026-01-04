const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const paymentRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public pages
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/class-fee-structure', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'class-fee-structure.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Authentication pages
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-signup.html'));
});

app.get('/student-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
});

app.get('/student-signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-signup.html'));
});

// Student Profile (protected)
app.get('/student-profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-profile.html'));
});

// Admin dashboard (protected - should check authentication)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Admin pages (protected)
app.get('/students', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'students.html'));
});

app.get('/payments', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

app.get('/receipts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'receipts.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Student Authentication APIs (to be implemented)
app.post('/api/student/login', (req, res) => {
    const { rollNumber, password } = req.body;
    // TODO: Implement proper student authentication with database
    res.json({ success: true, message: 'Login successful', token: 'sample_token' });
});

app.post('/api/student/signup', (req, res) => {
    const studentData = req.body;
    // TODO: Implement student registration with database
    res.json({ success: true, message: 'Signup successful' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error', 
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
         Fees Receipt Management System                  
       Server running on http://localhost:${PORT}
    `);
});

module.exports = app;
