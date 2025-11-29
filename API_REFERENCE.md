# HRMS API Reference

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Organization Management

### 1.1 Check Email Exists
**GET** `/organization/check-email?email={email}`

Check if an email already exists in the system.

**Query Parameters:**
- `email` (required): Email address to check

**Response:**
```json
{
  "exists": true/false
}
```

---

### 1.2 Register Organization
**POST** `/organization/register`

Step 2 of registration. Stores data temporarily and sends OTP to email.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "companyName": "Acme Corporation",
  "fullName": "John Doe",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "longitude": -74.0060,
  "latitude": 40.7128,
  "radius": 100,
  "officeAddress": "123 Business St, New York, NY 10001",
  "agreementAccepted": true,
  "agreementVersion": "1.0"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email for OTP verification.",
  "email": "admin@example.com"
}
```

---

### 1.3 Verify OTP
**POST** `/organization/verify-otp`

Step 3 of registration. Verifies OTP and creates organization + admin user.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Registration verified successfully. Please login to continue."
}
```

---

### 1.4 Get Company Profile
**GET** `/organization/profile`  
**Auth:** Admin only

Get company profile details.

**Response:**
```json
{
  "id": "...",
  "companyName": "Acme Corporation",
  "officeAddress": "123 Business St, New York, NY 10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 100,
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "weeklyOffDays": [0, 6],
  "agreementAccepted": true,
  "agreementAcceptedAt": "2025-01-01T00:00:00.000Z",
  "agreementVersion": "1.0",
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 1.5 Update Company Profile
**PUT** `/organization/profile`  
**Auth:** Admin only

Update company profile settings.

**Request Body (all fields optional):**
```json
{
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "weeklyOffDays": [0, 6],
  "officeAddress": "123 Business St, New York, NY 10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 100
}
```

**Notes:**
- `workStartTime` / `workEndTime`: Format HH:mm (24-hour)
- `weeklyOffDays`: Array of numbers (0=Sunday, 1=Monday, ..., 6=Saturday)

---

## 2. Authentication

### 2.1 Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "organizationId": "..."
  }
}
```

---

### 2.2 Setup Password
**POST** `/auth/setup-password`

Set password for employees created by admin.

**Request Body:**
```json
{
  "token": "token-from-email",
  "password": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password set successfully"
}
```

---

## 3. User Management

### 3.1 Create User
**POST** `/user`  
**Auth:** Admin only

Create a new employee user.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "mobileNumber": "+1234567890",
  "role": "employee",
  "status": "active"
}
```

**Response:**
```json
{
  "id": "...",
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "employee",
  "status": "active",
  "employeeId": "EMP002"
}
```

**Notes:**
- Email must be unique across all organizations
- Role can only be 'employee' (admin role not allowed)
- Employee ID is auto-generated (EMP001, EMP002, etc.)
- Password setup email is sent automatically

---

### 3.2 Bulk Upload Users
**POST** `/user/bulk-upload`  
**Auth:** Admin only

Upload users from Excel file.

**Request:** Form-data with `file` field (Excel file)

**Excel Format:**
- Columns: First Name, Last Name, Email, Mobile Number, Role, Status
- Role must be 'employee' (admin role will be rejected)

**Response:**
```json
{
  "success": 10,
  "failed": 2,
  "errors": [
    {
      "row": 3,
      "email": "invalid@example.com",
      "error": "User with this email already exists"
    }
  ]
}
```

---

### 3.3 Get All Users
**GET** `/user`  
**Auth:** Required

Get all users. Admin sees all users in organization, employee sees only own profile.

**Response:**
```json
[
  {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "mobileNumber": "+1234567890",
    "role": "admin",
    "status": "active",
    "employeeId": "EMP001",
    "organizationId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### 3.4 Get User By ID
**GET** `/user/:id`  
**Auth:** Required

Get user by ID. Employees can only view their own profile.

---

### 3.5 Update User
**PUT** `/user/:id`  
**Auth:** Admin only

Update user information.

**Request Body (all fields optional):**
```json
{
  "firstName": "Jane Updated",
  "lastName": "Smith Updated",
  "email": "jane.updated@example.com",
  "mobileNumber": "+1234567890",
  "status": "active"
}
```

**Notes:**
- Admin user cannot be updated (protected)
- Role cannot be updated (immutable)
- Email must be unique if being updated

---

### 3.6 Delete User
**DELETE** `/user/:id`  
**Auth:** Admin only

Delete a user.

**Notes:**
- Admin user cannot be deleted (protected)
- Active employees cannot be deleted (must deactivate first)
- Only inactive employees can be deleted

---

## 4. Attendance Management

### 4.1 Check In
**POST** `/attendance/check-in`  
**Auth:** Required

Check in with selfie and location.

**Request:** Form-data (multipart/form-data)
- `latitude` (required): Number
- `longitude` (required): Number
- `address` (optional): String
- `selfie` (required): File (JPEG/PNG, max 5MB)

**Response:**
```json
{
  "id": "...",
  "checkInTime": "2025-01-01T09:00:00.000Z",
  "status": "checked-in",
  "message": "Checked in successfully"
}
```

**Notes:**
- Location must be within office radius
- Can only check in once per day

---

### 4.2 Check Out
**POST** `/attendance/check-out`  
**Auth:** Required

Check out with selfie and location.

**Request:** Form-data (multipart/form-data)
- `latitude` (required): Number
- `longitude` (required): Number
- `address` (optional): String
- `selfie` (required): File (JPEG/PNG, max 5MB)

**Response:**
```json
{
  "id": "...",
  "checkOutTime": "2025-01-01T18:00:00.000Z",
  "totalHours": 9.0,
  "status": "checked-out",
  "message": "Checked out successfully"
}
```

**Notes:**
- Must check in before checking out
- Location must be within office radius

---

### 4.3 Get Attendance Records
**GET** `/attendance?userId=&startDate=&endDate=`  
**Auth:** Required

Get attendance records.

**Query Parameters:**
- `userId` (optional): Filter by user ID (admin only)
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "...",
    "userId": {
      "_id": "...",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    "date": "2025-01-01T00:00:00.000Z",
    "checkInTime": "2025-01-01T09:00:00.000Z",
    "checkOutTime": "2025-01-01T18:00:00.000Z",
    "checkInLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Business St"
    },
    "checkOutLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Business St"
    },
    "status": "checked-out",
    "totalHours": 9.0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### 4.4 Export Attendance
**GET** `/attendance/export?userId=&startDate=&endDate=`  
**Auth:** Required

Export attendance records as CSV.

**Query Parameters:** Same as Get Attendance Records

**Response:**
```json
{
  "csv": "Date,Employee Name,Email,Check-In Time,Check-Out Time,Total Hours,Status,Check-In Location,Check-Out Location\n...",
  "filename": "attendance_export_2025-01-01.csv"
}
```

---

### 4.5 Get Map Locations
**GET** `/attendance/map-locations?startDate=&endDate=`  
**Auth:** Required

Get check-in locations for map visualization.

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "...",
    "userId": {
      "_id": "...",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "employeeId": "EMP002"
    },
    "date": "2025-01-01T00:00:00.000Z",
    "checkInTime": "2025-01-01T09:00:00.000Z",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Business St"
    },
    "status": "checked-in"
  }
]
```

---

## 5. Dashboard

### 5.1 Get Dashboard Stats
**GET** `/dashboard/stats`  
**Auth:** Admin only

Get dashboard statistics.

**Response:**
```json
{
  "users": {
    "total": 50,
    "admins": 1,
    "employees": 49
  },
  "attendance": {
    "today": {
      "checkedIn": 45,
      "checkedOut": 40,
      "pending": 5
    },
    "week": 250,
    "month": 1000,
    "averageHours": 8.5
  },
  "recentAttendance": [
    {
      "id": "...",
      "userId": {...},
      "date": "...",
      "checkInTime": "...",
      "checkOutTime": "...",
      "status": "checked-out",
      "totalHours": 9.0
    }
  ],
  "recentEmployeeActions": [
    {
      "id": "...",
      "userId": {...},
      "date": "...",
      "checkInTime": "...",
      "checkOutTime": "...",
      "action": "check-in",
      "actionTime": "...",
      "status": "checked-in",
      "totalHours": null,
      "updatedAt": "..."
    }
  ],
  "mapLocations": [
    {
      "id": "...",
      "userId": {...},
      "checkInTime": "...",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "123 Business St"
      }
    }
  ]
}
```

---

## Key Features

### Employee ID
- Auto-generated for all users (format: EMP001, EMP002, etc.)
- Admin user created during registration gets EMP001
- Sequential per organization

### Registration Agreement
- Stored during registration
- Recorded in organization profile
- Includes acceptance date and version

### Work Hours & Weekly Off
- Configurable work start/end time (default: 09:00 - 18:00)
- Weekly off days selection (0=Sunday, 1=Monday, ..., 6=Saturday)
- Updated via company profile endpoint

### Active Employee Protection
- Active employees cannot be deleted
- Must deactivate first, then delete
- Admin user is always protected

### Export & Map Features
- Export attendance data as CSV
- Get check-in locations for map visualization
- Filter by date range and user

---

## Error Responses

All errors follow this format:
```json
{
  "message": "Error message or array of validation errors",
  "error": "Error type",
  "statusCode": 400
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `500` - Internal Server Error

---

## Notes

1. **JWT Token:** Valid for 24 hours (configurable)
2. **OTP:** Valid for 15 minutes
3. **Password Setup Token:** Valid for 24 hours
4. **File Uploads:** Max 5MB for selfies
5. **Location Validation:** Must be within office radius
6. **Email Uniqueness:** Enforced across all organizations
7. **Admin Protection:** Admin user cannot be updated or deleted
8. **Role Immutability:** User role cannot be changed after creation
