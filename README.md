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

### Prerequisites (आवश्यकताएं)
- Node.js (v14 या उससे ऊपर)
- MySQL (v5.7 या उससे ऊपर)
- npm या yarn

### Step 1: Clone या Download करें
```bash
# यदि Git installed है
git clone <repository-url>

# या सीधे folder download करें
```

### Step 2: Dependencies Install करें
```bash
npm install
```

### Step 3: Database Setup करें

1. MySQL में login करें:
```bash
mysql -u root -p
```

2. Database schema चलाएं:
```bash
mysql -u root -p < database/schema.sql
```

या MySQL Workbench में `database/schema.sql` file को import करें।

### Step 4: Environment Variables Setup करें

1. `.env.example` file को copy करें:
```bash
copy .env.example .env
```

2. `.env` file में अपनी database details डालें:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fees_management
```

### Step 5: Server Start करें
```bash
npm start
```

Development mode के लिए (auto-reload के साथ):
```bash
npm run dev
```

### Step 6: Application Open करें
Browser में जाएं:
```
http://localhost:3000
```

## 📁 Project Structure (प्रोजेक्ट संरचना)

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

## 🔧 API Endpoints

### Students
- `GET /api/students` - सभी students
- `GET /api/students/:id` - एक student की details
- `POST /api/students` - नया student जोड़ें
- `PUT /api/students/:id` - Student update करें
- `GET /api/students/search/:term` - Students खोजें

### Fees
- `GET /api/fees` - सभी fee structures
- `GET /api/fees/student/:id` - Student की fees
- `POST /api/fees` - नया fee structure जोड़ें
- `GET /api/fees/pending` - सभी pending fees
- `GET /api/fees/overdue` - Overdue fees

### Payments
- `GET /api/payments` - सभी payments
- `GET /api/payments/:id` - Payment details
- `POST /api/payments` - नया payment record करें
- `GET /api/payments/student/:id` - Student के payments
- `GET /api/payments/today/summary` - आज की summary

### Receipts
- `GET /api/receipts` - सभी receipts
- `GET /api/receipts/:id` - Receipt details
- `POST /api/receipts` - नई receipt generate करें
- `GET /api/receipts/number/:receiptNumber` - Receipt number से खोजें

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/daily` - Daily collection report
- `GET /api/reports/monthly` - Monthly collection report
- `GET /api/reports/pending` - Pending fees report
- `GET /api/reports/overdue` - Overdue fees report

## 💡 Usage (उपयोग कैसे करें)

### 1. Student Add करना
1. **Students** page पर जाएं
2. **Add New Student** button पर क्लिक करें
3. सभी details भरें (Roll No, Name, Course, etc.)
4. **Save Student** पर क्लिक करें

### 2. Fee Structure Add करना
1. Students list में student के सामने **$** (dollar) icon पर क्लिक करें
2. Fee Type, Amount, Due Date भरें
3. **Save Fee** पर क्लिक करें

### 3. Payment Record करना
1. **Payments** page पर जाएं
2. **Record New Payment** पर क्लिक करें
3. Student को search करें और select करें
4. Fee type select करें
5. Amount, Payment mode और date भरें
6. **Record Payment** पर क्लिक करें
7. Automatically receipt generate होगी

### 4. Receipt Print/Download करना
1. **Receipts** page पर जाएं
2. Receipt के सामने:
   - 👁️ (Eye icon) - Receipt देखने के लिए
   - 🖨️ (Print icon) - Print करने के लिए
   - 📥 (Download icon) - PDF download करने के लिए

### 5. Reports देखना
1. **Reports** page पर जाएं
2. Report type select करें:
   - Pending Fees
   - Overdue Fees
   - Daily Collection
   - Monthly Collection
3. Date/Month select करें (जरूरत हो तो)
4. **Generate Report** पर क्लिक करें

## 🎨 Customization (अनुकूलन)

### Institute Information बदलना
Database में `system_settings` table में जाकर edit करें:
- Institute Name
- Address
- Phone
- Email
- GST Number

या MySQL में:
```sql
UPDATE system_settings 
SET setting_value = 'Your Institute Name' 
WHERE setting_key = 'institute_name';
```

### Receipt Number Format बदलना
```sql
UPDATE system_settings 
SET setting_value = 'YOUR-PREFIX' 
WHERE setting_key = 'receipt_prefix';
```

## 📱 Responsive Design
- ✅ Mobile-friendly
- ✅ Tablet-optimized
- ✅ Desktop responsive
- ✅ Bootstrap 5 based

## 🔒 Security Features
- ✅ SQL Injection protection (Prepared statements)
- ✅ Input validation
- ✅ Error handling
- ✅ Transaction management

## 🆘 Troubleshooting (समस्या समाधान)

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
- MySQL service running है check करें
- `.env` में correct credentials हैं check करें

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: 
- `.env` में PORT number बदलें
- या running process को stop करें

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**:
```bash
npm install
```

## 📞 Support

किसी भी problem के लिए:
1. Error message note करें
2. Console में errors check करें (F12 > Console)
3. Database logs देखें

## 📝 License
यह प्रोजेक्ट educational purposes के लिए है।

##  Credits
Built with:
- Node.js & Express
- MySQL
- Bootstrap 5
- Font Awesome
- html2pdf.js

---
