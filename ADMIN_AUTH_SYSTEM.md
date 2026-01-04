# Admin Authentication System

## Overview
Complete backend admin authentication system with secure password hashing, session management, and role-based access control.

## Database Tables

### 1. admin_users
Stores admin user accounts with the following fields:
- `admin_id` (Primary Key, Auto Increment)
- `username` (Unique, Required)
- `password_hash` (Bcrypt hashed, Required)
- `full_name` (Required)
- `email` (Unique, Required)
- `phone` (Optional)
- `role` (Enum: super_admin, admin, accountant, clerk)
- `status` (Enum: active, inactive, suspended)
- `last_login` (Timestamp)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 2. admin_sessions
Manages active user sessions:
- `session_id` (Primary Key, Auto Increment)
- `admin_id` (Foreign Key to admin_users)
- `session_token` (Unique, 64-character hex string)
- `ip_address` (Client IP)
- `user_agent` (Browser info)
- `expires_at` (Session expiration timestamp)
- `created_at` (Timestamp)

## API Endpoints

### POST /api/admin/signup
Create a new admin account.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "email": "john@school.com",
  "phone": "1234567890",
  "role": "admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "admin_id": 2
}
```

### POST /api/admin/login
Authenticate admin user.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123",
  "rememberMe": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "expiresAt": "2025-12-24T10:30:00.000Z",
  "admin": {
    "admin_id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@school.com",
    "role": "super_admin"
  }
}
```

### POST /api/admin/verify
Verify if a session token is valid.

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "admin": {
    "admin_id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@school.com",
    "role": "super_admin"
  }
}
```

### POST /api/admin/logout
End admin session.

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/admin/cleanup-sessions
Remove expired sessions (maintenance).

**Response:**
```json
{
  "success": true,
  "message": "Expired sessions cleaned up",
  "deleted": 5
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 10 salt rounds
2. **Session Tokens**: Cryptographically secure 32-byte random tokens
3. **Session Expiry**: 
   - 1 day for regular login
   - 7 days for "Remember Me" login
4. **IP & User Agent Tracking**: Records client information
5. **Status Management**: Can activate/deactivate/suspend accounts
6. **Role-Based Access**: 4 roles (super_admin, admin, accountant, clerk)

## Default Admin Account

After running `npm run setup`, a default admin account is created:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `super_admin`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure database in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=fees_management
   ```

3. Run database setup:
   ```bash
   npm run setup
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Client-Side Integration

Store the token in localStorage or sessionStorage:
```javascript
// After successful login
localStorage.setItem('adminToken', response.token);

// For API requests
const token = localStorage.getItem('adminToken');
fetch('/api/admin/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});
```

## Pages

- `/admin-login` - Admin login page
- `/admin-signup` - Admin registration page (restrict access in production)
- `/dashboard` - Admin dashboard (requires authentication)

## Access Control

The admin signup page is accessible for initial setup. In production:
1. Restrict `/admin-signup` route to super admins only
2. Or disable public access entirely
3. Use the API endpoint with proper authorization headers

## Role Hierarchy

1. **Super Admin** - Full system access, can manage all admins
2. **Admin** - Can manage students, fees, payments, reports
3. **Accountant** - Can view and manage financial records
4. **Clerk** - Basic data entry and viewing rights

## Files Created/Modified

### Backend:
- `database/schema.sql` - Added admin_users and admin_sessions tables
- `routes/admin.js` - Complete admin authentication routes
- `database/setup.js` - Updated to create default admin with bcrypt
- `server.js` - Added admin routes and signup page route
- `package.json` - Added bcrypt dependency

### Frontend:
- `public/admin-signup.html` - Admin registration page
- `public/admin-login.html` - Admin login page (existing, updated)

## Testing the System

1. **Create First Admin**:
   - Visit: http://localhost:3000/admin-signup
   - Fill in the form
   - Submit to create account

2. **Login**:
   - Visit: http://localhost:3000/admin-login
   - Use credentials: admin/admin123 (or newly created account)
   - Successful login redirects to dashboard

3. **Verify Session**:
   - Token is automatically stored in localStorage
   - Protected pages verify token on load
   - Expired tokens redirect to login

## Best Practices

1. Always use HTTPS in production
2. Implement rate limiting on login endpoint
3. Add CSRF protection for forms
4. Regularly clean up expired sessions
5. Implement password reset functionality
6. Add two-factor authentication for sensitive roles
7. Log all admin actions for audit trail
8. Set secure cookie flags in production
