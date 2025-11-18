# API Reference - Quick Guide

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require:
- **Header:** `Authorization: Bearer {access_token}`
- **Header:** `X-Tenant-Domain: {company_domain}` OR `X-Tenant-ID: {client_id}`

---

## Public Endpoints

### Register Organization
```
POST /organization/register
```
**No authentication required**

**Request:**
```json
{
  "companyName": "Acme Corporation",
  "companyLocation": "123 Business St, New York, NY 10001",
  "companyEmail": "admin@acme-corp.com",
  "displayName": "Acme Corp",
  "companyDomain": "acme-corp",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "adminEmail": "john.doe@acme-corp.com",
  "officeLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Business St, New York, NY 10001",
    "radius": 100
  }
}
```

---

## Authentication Endpoints

### Login
```
POST /auth/login
```
**Headers:** `X-Tenant-Domain: {domain}`

**Request:**
```json
{
  "email": "john.doe@acme-corp.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "john.doe@acme-corp.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin"
  }
}
```

### Setup Password
```
POST /auth/setup-password
```
**Headers:** `X-Tenant-Domain: {domain}`

**Request:**
```json
{
  "token": "token-from-email",
  "password": "NewSecurePassword123!"
}
```

---

## User Management Endpoints

### Create User
```
POST /user
```
**Auth:** Required (Admin only)  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@acme-corp.com",
  "mobileNumber": "+1234567890",
  "role": "employee",
  "status": "active"
}
```

### Bulk Upload Users
```
POST /user/bulk-upload
```
**Auth:** Required (Admin only)  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Body:** Form-data
- `file`: Excel file (.xlsx or .xls)

**Response:**
```json
{
  "success": 10,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "email": "invalid@example.com",
      "error": "Missing required fields"
    }
  ]
}
```

### Get All Users
```
GET /user?role=employee
```
**Auth:** Required  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Query Params:**
- `role` (optional): Filter by role (admin/employee)

**Response:**
- Admin: All users
- Employee: Only own profile

### Get User By ID
```
GET /user/:id
```
**Auth:** Required  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Response:**
- Admin: Any user
- Employee: Only own profile

---

## Attendance Endpoints

### Check In
```
POST /attendance/check-in
```
**Auth:** Required  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Body:** Form-data
- `latitude`: 40.7128 (number)
- `longitude`: -74.0060 (number)
- `address`: "123 Business St" (optional string)
- `selfie`: Image file (JPEG/PNG, max 5MB)

**Response:**
```json
{
  "id": "attendance_id",
  "checkInTime": "2024-01-15T09:00:00.000Z",
  "status": "checked-in",
  "message": "Checked in successfully"
}
```

### Check Out
```
POST /attendance/check-out
```
**Auth:** Required  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Body:** Form-data (same as check-in)

**Response:**
```json
{
  "id": "attendance_id",
  "checkOutTime": "2024-01-15T17:00:00.000Z",
  "totalHours": 8.0,
  "status": "checked-out",
  "message": "Checked out successfully"
}
```

### Get Attendance Records
```
GET /attendance?userId=&startDate=&endDate=
```
**Auth:** Required  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Query Params:**
- `userId` (optional): Filter by user ID (admin only)
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:**
- Admin: All records (or filtered)
- Employee: Only own records

---

## Dashboard Endpoints

### Get Dashboard Stats
```
GET /dashboard/stats
```
**Auth:** Required (Admin only)  
**Headers:** `Authorization: Bearer {token}`, `X-Tenant-Domain: {domain}`

**Response:**
```json
{
  "users": {
    "total": 10,
    "admins": 1,
    "employees": 9
  },
  "attendance": {
    "today": {
      "checkedIn": 8,
      "checkedOut": 5,
      "pending": 1
    },
    "week": 45,
    "month": 180,
    "averageHours": 8.5
  },
  "recentAttendance": [
    {
      "id": "attendance_id",
      "userId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "date": "2024-01-15T00:00:00.000Z",
      "checkInTime": "2024-01-15T09:00:00.000Z",
      "checkOutTime": "2024-01-15T17:00:00.000Z",
      "status": "checked-out",
      "totalHours": 8.0
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

---

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

---

## Tenant Resolution

Tenant can be identified via:

1. **Header (Recommended):**
   - `X-Tenant-Domain: acme-corp`
   - OR `X-Tenant-ID: {client_id}`

2. **Subdomain:**
   - `acme-corp.localhost:3000/auth/login`

---

## File Upload Limits

| Type | Max Size | Allowed Formats |
|------|----------|----------------|
| Selfie | 5MB | JPEG, PNG |
| Excel | 10MB | .xlsx, .xls |

---

## Excel Bulk Upload Format

Required columns:
- **First Name** (or firstName)
- **Last Name** (or lastName)
- **Email** (or email)
- **Mobile Number** (or mobileNumber, Mobile) - Optional
- **Role** (or role) - Optional, default: employee
- **Status** (or status) - Optional, default: active

---

## Quick Test Flow

1. **Register Organization** → Get `organization_id`, `client_id`, `company_domain`
2. **Setup Password** → Use token from email
3. **Login** → Get `access_token`
4. **Create User** → Add employees
5. **Check In** → Test attendance
6. **Check Out** → Complete attendance
7. **Get Dashboard Stats** → View statistics

---

## Notes

- All dates are in ISO 8601 format (UTC)
- JWT tokens expire after 24 hours (configurable)
- Location validation uses Haversine formula (meters)
- Password setup tokens expire after 24 hours
- Office location radius default: 100 meters

For detailed documentation, see:
- [Postman Guide](./POSTMAN_GUIDE.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)

