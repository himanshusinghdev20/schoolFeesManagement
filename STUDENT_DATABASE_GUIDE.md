# Student Database & Profile System Guide

## ✅ Database Tables Created and Connected

### 1. **Students Table** (Main Student Profile)
```sql
students
├── student_id (Primary Key, Auto Increment)
├── roll_number (Unique, Required) - For login
├── student_name (Required)
├── class (Required) - Student's class (1-12)
├── email (Unique, Required)
├── phone
├── password_hash (Required) - Plain text password storage
├── profile_pic (Text) - Profile picture URL/path
├── course - Generated as "Class {class_number}"
├── admission_date (Default: Current Date)
├── status (active/inactive/completed, Default: active)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

### 2. **Fee Structure Table** (Student Fees Details)
```sql
fee_structure
├── fee_id (Primary Key)
├── student_id (Foreign Key → students)
├── fee_type (tuition/exam/hostel/library/sports/other)
├── total_amount
├── paid_amount
├── pending_amount
├── late_fee
├── due_date
├── academic_year
└── created_at
```

### 3. **Payments Table** (Payment History)
```sql
payments
├── payment_id (Primary Key)
├── student_id (Foreign Key → students)
├── fee_id (Foreign Key → fee_structure)
├── amount_paid
├── payment_mode (cash/upi/card/cheque/bank_transfer)
├── transaction_id
├── cheque_number
├── payment_date
├── remarks
└── created_at
```

### 4. **Receipts Table** (Payment Receipts)
```sql
receipts
├── receipt_id (Primary Key)
├── receipt_number (Unique)
├── payment_id (Foreign Key → payments)
├── student_id (Foreign Key → students)
├── total_amount
├── amount_in_words
├── balance_remaining
├── issued_by
├── receipt_date
├── status (active/cancelled)
└── created_at
```

## 🔌 API Endpoints Connected

### Student Authentication
| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/api/students/signup` | POST | Register new student | rollNumber, name, class, email, phone, password |
| `/api/students/login` | POST | Student login | rollNumber, password |
| `/api/students/profile` | GET | Get student profile | Headers: Authorization: Bearer {token}, x-student-id |

### Student Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students/:id/payments` | GET | Get payment history |
| `/api/students/:id` | GET | Get student by ID |
| `/api/students/` | GET | Get all students (admin) |

## 📱 Frontend Pages Connected

### Student Portal Pages:
1. **Signup Page**: `/student-signup` → `public/student-signup.html`
   - Form fields: Roll Number, Name, Class, Email, Phone, Password
   - API: POST `/api/students/signup`
   - Redirect to login on success

2. **Login Page**: `/student-login` → `public/student-login.html`
   - Form fields: Roll Number, Password
   - API: POST `/api/students/login`
   - Stores token and student data in localStorage
   - Redirect to profile on success

3. **Profile Page**: `/student-profile` → `public/student-profile.html`
   - Displays: Profile pic, personal details, fee summary, fee structure, payment history
   - APIs: GET `/api/students/profile`, GET `/api/students/:id/payments`
   - Features: Profile picture upload, fee structure by class, payment history

## 🔐 Authentication Flow

```
1. Student Signup
   ↓
   POST /api/students/signup
   ↓
   Validate fields (rollNumber, name, class, email, password)
   ↓
   Check duplicate roll number/email
   ↓
   Store plain text password in password_hash field
   ↓
   Insert into students table
   ↓
   Return success with student_id

2. Student Login
   ↓
   POST /api/students/login
   ↓
   Find student by roll_number
   ↓
   Compare password (plain text)
   ↓
   Generate session token (crypto.randomBytes)
   ↓
   Return token + student data
   ↓
   Store in localStorage/sessionStorage

3. Access Profile
   ↓
   GET /api/students/profile
   ↓
   Check Authorization header
   ↓
   Get student_id from header/query
   ↓
   Fetch student with aggregated fees
   ↓
   Return complete profile data
```

## 💾 Data Storage

### Client-Side (localStorage/sessionStorage)
```javascript
// Stored after login
localStorage.setItem('studentToken', token);
localStorage.setItem('studentData', JSON.stringify(studentData));

// Retrieved in profile page
const token = localStorage.getItem('studentToken');
const student = JSON.parse(localStorage.getItem('studentData'));
```

### Server-Side (MySQL Database)
- All student records in `students` table
- Password stored as plain text in `password_hash` column
- Profile pictures stored as text (base64 or URL)
- Fee data linked via `student_id` foreign key

## 🎯 Complete Student Signup Process

### Step 1: Student Fills Signup Form
```html
Roll Number: STU001
Name: John Doe
Class: 10
Email: john@example.com
Phone: 9876543210
Password: pass123
```

### Step 2: Form Submission
```javascript
POST /api/students/signup
Content-Type: application/json

{
  "rollNumber": "STU001",
  "name": "John Doe",
  "class": "10",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "pass123"
}
```

### Step 3: Database Insertion
```sql
INSERT INTO students (
  roll_number, 
  student_name, 
  class, 
  email, 
  phone, 
  password_hash, 
  course, 
  admission_date, 
  status
) VALUES (
  'STU001',
  'John Doe',
  '10',
  'john@example.com',
  '9876543210',
  'pass123',  -- Plain text password
  'Class 10',
  CURDATE(),
  'active'
);
```

### Step 4: Response
```json
{
  "success": true,
  "message": "Account created successfully",
  "student_id": 1
}
```

## 🔍 Complete Student Login & Profile Flow

### Login Request
```javascript
POST /api/students/login
{
  "rollNumber": "STU001",
  "password": "pass123"
}
```

### Login Response
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "student": {
    "student_id": 1,
    "roll_number": "STU001",
    "student_name": "John Doe",
    "class": "10",
    "email": "john@example.com",
    "phone": "9876543210",
    "profile_pic": null
  }
}
```

### Profile Request
```javascript
GET /api/students/profile?student_id=1
Headers: {
  Authorization: Bearer a1b2c3d4e5f6...
  x-student-id: 1
}
```

### Profile Response
```json
{
  "success": true,
  "student": {
    "student_id": 1,
    "roll_number": "STU001",
    "student_name": "John Doe",
    "class": "10",
    "email": "john@example.com",
    "phone": "9876543210",
    "profile_pic": "data:image/png;base64,...",
    "course": "Class 10",
    "admission_date": "2025-12-23",
    "status": "active",
    "total_fees": 50000.00,
    "paid_fees": 30000.00,
    "pending_fees": 20000.00
  }
}
```

## ⚠️ Security Notes

**CURRENT IMPLEMENTATION:**
- ❌ Plain text password storage (INSECURE)
- ❌ No token verification from database
- ❌ No session expiry
- ❌ No rate limiting

**FOR PRODUCTION:**
- ✅ Use bcrypt for password hashing
- ✅ Store sessions in database (student_sessions table)
- ✅ Implement JWT tokens with expiry
- ✅ Add HTTPS only
- ✅ Implement CSRF protection

## 🧪 Testing the System

### 1. Test Signup
```bash
Visit: http://localhost:3000/student-signup
Fill form and submit
```

### 2. Test Login
```bash
Visit: http://localhost:3000/student-login
Use roll number and password from signup
```

### 3. Test Profile
```bash
After login, automatically redirects to:
http://localhost:3000/student-profile
```

## 📊 Database Relationships

```
students (1) ──────── (Many) fee_structure
    │                           │
    │                           │
    │                           │
    └────────── (Many) payments ┘
                      │
                      │
                      │
                  (1) receipts
```

## ✅ System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Created | All tables exist |
| Student Table | ✅ Working | With auth fields |
| API Routes | ✅ Connected | signup, login, profile |
| Signup Page | ✅ Working | Form connected to API |
| Login Page | ✅ Working | Authentication working |
| Profile Page | ✅ Working | Displays all data |
| Fee Structure | ✅ Working | Class-wise fees displayed |
| Payment History | ✅ Working | Shows transactions |
| Server | ✅ Running | Port 3000 |

## 🎉 Ready to Use!

Your student database and profile system is fully set up and connected. Students can:

1. ✅ Sign up with their details
2. ✅ Login with roll number + password
3. ✅ View their complete profile
4. ✅ See fee structure for their class
5. ✅ Check payment history
6. ✅ Upload profile picture

**Access URLs:**
- Student Signup: http://localhost:3000/student-signup
- Student Login: http://localhost:3000/student-login
- Student Profile: http://localhost:3000/student-profile (after login)
- Admin Portal: http://localhost:3000/admin-login

---
*Last Updated: December 23, 2025*
