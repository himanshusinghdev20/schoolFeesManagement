# Quick Setup Guide - Fees Receipt Management System

## 🚀 Setup Steps (Hindi)

### Step 1: Dependencies Install करें
```bash
npm install
```

### Step 2: MySQL Database Setup
1. MySQL open करें
2. Naya database banayein:
```sql
CREATE DATABASE fees_management;
```
3. Schema file run करें:
```bash
mysql -u root -p fees_management < database/schema.sql
```

### Step 3: Environment Configuration
1. `.env.example` ko copy करके `.env` naam se save करें
2. `.env` file में apni database details dalein:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=apna_password_yahan
DB_NAME=fees_management
```

### Step 4: Server Start करें
```bash
npm start
```

### Step 5: Browser में Open करें
```
http://localhost:3000
```

## ✅ Features Checklist

✓ Student Management (Students ko add, edit, search)
✓ Fee Structure Management (Different types ki fees)
✓ Payment Recording (Cash, UPI, Card, Cheque)
✓ Receipt Generation (Unique number ke sath)
✓ Receipt Print & PDF Download
✓ Daily Collection Reports
✓ Monthly Collection Reports
✓ Pending Fees Tracking
✓ Overdue Fees Alerts
✓ Payment Reminders
✓ Real-time Dashboard
✓ Responsive Design (Mobile, Tablet, Desktop)

## 📱 Page Navigation

1. **Dashboard** (/) - Overview aur statistics
2. **Students** (/students) - Student management
3. **Payments** (/payments) - Payment recording
4. **Receipts** (/receipts) - Receipt management
5. **Reports** (/reports) - Various reports

## 🎯 Common Tasks

### Student Add karna:
Students → Add New Student → Details bhar kar Save

### Payment Record karna:
Payments → Record New Payment → Student search → Fee select → Payment details → Record

### Receipt Print karna:
Receipts → Print icon (printer) → Print

### Report dekhna:
Reports → Report type select → Date select → Generate

## 🔧 Troubleshooting

**Problem**: Database connection error
**Solution**: MySQL running hai check karo, .env file me correct details hain check karo

**Problem**: Port 3000 already in use
**Solution**: .env me PORT number change karo (e.g., PORT=3001)

**Problem**: npm install error
**Solution**: Node.js latest version install karo

## 📞 Help

Koi problem ho to:
1. Console me errors dekho (Browser me F12 press karo)
2. Terminal me server logs dekho
3. README.md file detailed instructions ke liye padho

---
**All the best! System ready hai use karne ke liye 🎉**
