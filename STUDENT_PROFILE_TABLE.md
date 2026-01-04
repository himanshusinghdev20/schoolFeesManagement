# 🎓 Student Profile Database - Separate Signup Table

## ✅ New Table Structure Created

### Two Separate Tables for Different Purposes:

## 1. **student_profile** Table (Student Signup & Authentication)
This table stores data from student signup forms.

```sql
student_profile
├── profile_id (Primary Key) - Unique identifier
├── roll_number (Unique, NOT NULL) - For login
├── student_name (NOT NULL) - Full name
├── class (NOT NULL) - Student's class (1-12)
├── email (Unique, NOT NULL) - Email address
├── phone - Contact number
├── password_hash (NOT NULL) - Password (plain text)
├── profile_pic (TEXT) - Profile picture
├── date_of_birth - Date of birth
├── father_name - Father's name
├── mother_name - Mother's name
├── address - Full address
├── city - City name
├── state - State name
├── pincode - Postal code
├── admission_date (Default: CURRENT_DATE) - Admission date
├── status (active/inactive/suspended) - Account status
├── created_at (Timestamp) - Account creation date
└── updated_at (Timestamp) - Last update date
```

**Purpose**: 
- Store student signup data
- Handle student authentication (login)
- Manage student profiles with photos
- Track personal and family details

## 2. **students** Table (Admin Management)
This table is for admin-created student records.

```sql
students
├── student_id (Primary Key)
├── roll_number (Unique, NOT NULL)
├── student_name (NOT NULL)
├── email (Unique)
├── phone
├── course
├── admission_date
├── status (active/inactive/completed)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

**Purpose**: 
- Admin-managed student records
- Legacy/existing student data
- Administrative operations

---

## 📊 Related Tables Updated

### **fee_structure** Table
- Now references `profile_id` from `student_profile`
- Links fees to student profiles

### **payments** Table
- Now references `profile_id` from `student_profile`
- Tracks payments by profile

### **receipts** Table
- Now references `profile_id` from `student_profile`
- Generates receipts for profiles

---

## 🔗 Relationships

```
student_profile (1) ──────── (Many) fee_structure
    (profile_id)                     (profile_id)
       │
       │
       ├──────────── (Many) payments
       │                    (profile_id)
       │
       └──────────── (Many) receipts
                           (profile_id)
```

---

## 📍 API Endpoints Using student_profile

### Student Signup
```
POST /api/students/signup
Body: {
  rollNumber: "STU001",
  name: "John Doe",
  class: "10",
  email: "john@test.com",
  phone: "9876543210",
  password: "pass123"
}

Response: {
  success: true,
  message: "Account created successfully",
  profile_id: 1
}
```

### Student Login
```
POST /api/students/login
Body: {
  rollNumber: "STU001",
  password: "pass123"
}

Response: {
  success: true,
  token: "a1b2c3d4...",
  student: {
    profile_id: 1,
    roll_number: "STU001",
    student_name: "John Doe",
    class: "10",
    email: "john@test.com",
    phone: "9876543210",
    profile_pic: null
  }
}
```

### Get Student Profile
```
GET /api/students/profile?profile_id=1
Headers: {
  Authorization: Bearer {token},
  X-Profile-Id: 1
}

Response: {
  success: true,
  student: {
    profile_id: 1,
    roll_number: "STU001",
    student_name: "John Doe",
    class: "10",
    email: "john@test.com",
    phone: "9876543210",
    profile_pic: "data:image...",
    admission_date: "2025-12-23",
    status: "active",
    total_fees: 0.00,
    paid_fees: 0.00,
    pending_fees: 0.00
  }
}
```

### Get Payment History
```
GET /api/students/1/payments

Response: {
  success: true,
  payments: [...]
}
```

---

## 💾 Database View

### student_fee_summary View
Updated to use `student_profile` table:

```sql
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
```

---

## 🔍 Key Differences

| Feature | student_profile | students |
|---------|----------------|----------|
| **Created By** | Student signup | Admin |
| **Authentication** | Yes (password_hash) | No |
| **Profile Picture** | Yes | No |
| **Family Details** | Yes (father/mother) | No |
| **Address** | Yes (full address) | No |
| **Class Info** | Yes | No |
| **Used For** | Student portal | Admin management |
| **Primary Key** | profile_id | student_id |

---

## 🎯 Usage Workflow

### Student Signup Flow:
1. Student fills signup form at `/student-signup`
2. Data saved to `student_profile` table
3. `profile_id` generated automatically
4. Student can login immediately

### Student Login Flow:
1. Student enters roll_number + password
2. System queries `student_profile` table
3. Password matched (plain text)
4. Token generated + `profile_id` returned
5. Token & profile data stored in localStorage

### Student Profile Access:
1. Student logged in with token
2. Profile page queries with `profile_id`
3. Data fetched from `student_profile`
4. Fee data joined from `fee_structure` by `profile_id`
5. Payment history fetched from `payments` by `profile_id`

---

## 📝 Example Data

### Sample student_profile Record:
```sql
INSERT INTO student_profile (
    roll_number, student_name, class, email, phone, 
    password_hash, admission_date, status
) VALUES (
    'STU001', 'John Doe', '10', 'john@test.com', '9876543210',
    'pass123', CURDATE(), 'active'
);
```

### Query Profile with Fees:
```sql
SELECT 
    sp.*,
    COALESCE(SUM(f.total_amount), 0) as total_fees,
    COALESCE(SUM(f.paid_amount), 0) as paid_fees,
    COALESCE(SUM(f.pending_amount), 0) as pending_fees
FROM student_profile sp
LEFT JOIN fee_structure f ON sp.profile_id = f.profile_id
WHERE sp.profile_id = 1
GROUP BY sp.profile_id;
```

---

## 🛠️ Database Commands

### Check student_profile table:
```sql
DESC student_profile;
```

### View all student profiles:
```sql
SELECT profile_id, roll_number, student_name, class, email, status 
FROM student_profile;
```

### Count profiles:
```sql
SELECT COUNT(*) FROM student_profile;
```

### Check profile with fees:
```sql
SELECT * FROM student_fee_summary WHERE roll_number = 'STU001';
```

---

## ✅ System Status

| Component | Status | Table Used |
|-----------|--------|------------|
| Student Signup | ✅ Working | student_profile |
| Student Login | ✅ Working | student_profile |
| Student Profile Page | ✅ Working | student_profile |
| Fee Structure | ✅ Working | fee_structure (profile_id) |
| Payment History | ✅ Working | payments (profile_id) |
| Receipts | ✅ Working | receipts (profile_id) |
| Admin Management | ✅ Working | students (separate) |

---

## 🚀 Ready to Test!

1. **Signup**: http://localhost:3000/student-signup
2. **Login**: http://localhost:3000/student-login
3. **Profile**: http://localhost:3000/student-profile

### Test Data:
```
Roll Number: STU001
Name: Test Student
Class: 10
Email: test@student.com
Phone: 9876543210
Password: test123
```

---

## 📌 Important Notes

✅ **Separate Tables**: `student_profile` for signups, `students` for admin
✅ **New Primary Key**: `profile_id` instead of `student_id`
✅ **All Foreign Keys Updated**: fee_structure, payments, receipts use `profile_id`
✅ **View Updated**: student_fee_summary uses `student_profile`
✅ **API Endpoints Updated**: All routes use `student_profile` table
✅ **Frontend Updated**: Profile page uses `profile_id`

---

**Database**: ✅ student_profile table created
**Server**: ✅ Running on port 3000
**APIs**: ✅ All connected to student_profile
**Frontend**: ✅ Using profile_id

**Status**: 🟢 READY TO USE!

*Last Updated: December 23, 2025*
