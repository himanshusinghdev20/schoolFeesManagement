# Fees Receipt Management System

A complete Fees Receipt Management System built using Bootstrap, JavaScript, CSS, Node.js, Express, and MySQL.

 Features (Key Features)
1. Student Management

✅ Add new students

✅ View and update student details

✅ Search students by name or roll number

✅ View the complete list of students

2. Fee Structure Management

✅ Add different types of fees (Tuition, Exam, Hostel, Library, Sports)

✅ Track total fees, paid amount, and pending balance

✅ Add late fees

✅ Set due dates

3. Payment Recording

✅ Accept payments through multiple modes (Cash, UPI, Card, Cheque, Bank Transfer)

✅ Record Transaction ID and Cheque Number

✅ View today’s total collection

✅ Payment mode–wise collection breakdown

4. Receipt Generation

✅ Unique receipt number (REC-2024-0001 format)

✅ Display amount in words

✅ Complete student and payment details

✅ Professional receipt with institute information

✅ Direct receipt printing

✅ Download receipt in PDF format

5. Reports & Analytics

✅ Pending Fees Report – list of all unpaid fees

✅ Overdue Fees Report – late pending fees

✅ Daily Collection Report

✅ Monthly Collection Report

✅ Facility to send payment reminders

6. Dashboard

✅ Real-time statistics

✅ Total students count

✅ Today’s and monthly collection

✅ Total pending fees

✅ Overdue students alerts

✅ Recent payments list


## 📁 Project Structure

```
Fees-Receipt-Management/
│
├── config/
│   └── database.js          # Database configuration
│
├── database/
│   └── schema.sql            # Database schema
│
├── routes/
│   ├── students.js           # Student APIs
│   ├── fees.js               # Fee structure APIs
│   ├── payments.js           # Payment APIs
│   ├── receipts.js           # Receipt APIs
│   └── reports.js            # Reports APIs
│
├── public/
│   ├── css/
│   │   └── style.css         # Custom styles
│   ├── js/
│   │   ├── dashboard.js      # Dashboard functionality
│   │   ├── students.js       # Students page
│   │   ├── payments.js       # Payments page
│   │   ├── receipts.js       # Receipts page
│   │   └── reports.js        # Reports page
│   ├── index.html            # Dashboard page
│   ├── students.html         # Students management
│   ├── payments.html         # Payment recording
│   ├── receipts.html         # Receipt management
│   └── reports.html          # Reports page
│
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

Built with:
- Node.js & Express
- MySQL
- Bootstrap 5
- Font Awesome
- html2pdf.js

---
