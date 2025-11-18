# Postman API Collection Guide

Complete guide for using the HRMS Multi-Tenant API Postman collection.

## Import Collection

1. Open Postman
2. Click **Import** button
3. Select `postman_collection.json` file
4. Select `postman_environment.json` file
5. Click **Import**

## Environment Setup

The collection uses environment variables. Make sure to:

1. Select the **HRMS Environment** from the environment dropdown (top right)
2. Update `base_url` if your server runs on a different port
3. Update `company_domain` with your organization's domain

## API Workflow

### Step 1: Register Organization

**Endpoint:** `POST /organization/register`

This is a public endpoint (no authentication required).

**Request Body:**
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

**Response:**
- Creates organization in master DB
- Creates tenant database
- Creates admin user
- Sends welcome email
- Auto-saves `organization_id`, `client_id`, `client_name`, `company_domain` to environment

### Step 2: Setup Admin Password

**Endpoint:** `POST /auth/setup-password`

Check the admin email inbox for the password setup email. Use the token from the email.

**Request Body:**
```json
{
  "token": "token-from-email",
  "password": "SecurePassword123!"
}
```

**Headers:**
- `X-Tenant-Domain: acme-corp` (or your domain)

### Step 3: Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john.doe@acme-corp.com",
  "password": "SecurePassword123!"
}
```

**Headers:**
- `X-Tenant-Domain: acme-corp`

**Response:**
- Auto-saves `access_token`, `user_id`, `user_role` to environment
- Use this token for all subsequent authenticated requests

### Step 4: Create Users

**Option A: Single User**
**Endpoint:** `POST /user`

**Headers:**
- `Authorization: Bearer {{access_token}}`
- `X-Tenant-Domain: {{company_domain}}`

**Request Body:**
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

**Option B: Bulk Upload**
**Endpoint:** `POST /user/bulk-upload`

**Headers:**
- `Authorization: Bearer {{access_token}}`
- `X-Tenant-Domain: {{company_domain}}`

**Body:** Form-data
- `file`: Select Excel file (.xlsx or .xls)

**Excel Format:**
| First Name | Last Name | Email | Mobile Number | Role | Status |
|------------|-----------|-------|---------------|------|--------|
| Jane | Smith | jane@example.com | +1234567890 | employee | active |
| Bob | Johnson | bob@example.com | +1234567891 | employee | active |

### Step 5: Attendance Check-In

**Endpoint:** `POST /attendance/check-in`

**Headers:**
- `Authorization: Bearer {{access_token}}`
- `X-Tenant-Domain: {{company_domain}}`

**Body:** Form-data
- `latitude`: 40.7128 (must be within office radius)
- `longitude`: -74.0060 (must be within office radius)
- `address`: "123 Business St, New York, NY 10001" (optional)
- `selfie`: Select image file (JPEG/PNG, max 5MB)

**Note:** Location must be within the office radius specified during registration.

### Step 6: Attendance Check-Out

**Endpoint:** `POST /attendance/check-out`

Same format as check-in. Must have checked in first on the same day.

### Step 7: View Attendance

**Endpoint:** `GET /attendance`

**Query Parameters:**
- `userId`: Optional (admin only) - Filter by user ID
- `startDate`: Optional - Format: YYYY-MM-DD
- `endDate`: Optional - Format: YYYY-MM-DD

**Headers:**
- `Authorization: Bearer {{access_token}}`
- `X-Tenant-Domain: {{company_domain}}`

**Response:**
- Admin: All attendance records (or filtered)
- Employee: Only own records

### Step 8: Dashboard Stats

**Endpoint:** `GET /dashboard/stats`

**Headers:**
- `Authorization: Bearer {{access_token}}`
- `X-Tenant-Domain: {{company_domain}}`

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
  "recentAttendance": [...]
}
```

## Tenant Resolution

The API supports two methods for tenant resolution:

### Method 1: Header (Recommended)
Add header to all requests:
- `X-Tenant-Domain: acme-corp`
- OR `X-Tenant-ID: {clientId}`

### Method 2: Subdomain
Use subdomain in URL:
- `acme-corp.localhost:3000/auth/login`

The Postman collection uses **Method 1** (headers).

## Authentication

All protected endpoints require:
1. **JWT Token** in `Authorization` header: `Bearer {token}`
2. **Tenant Identifier** in `X-Tenant-Domain` or `X-Tenant-ID` header

## Role-Based Access

### Admin
- Can create users
- Can bulk upload users
- Can view all users
- Can view all attendance records
- Can access dashboard

### Employee
- Can view own profile only
- Can view own attendance records only
- Can check in/out
- Cannot access dashboard

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Organization with this domain already exists",
  "error": "Conflict"
}
```

## Testing Tips

1. **Auto-save Variables**: The collection automatically saves tokens and IDs to environment variables
2. **Use Environment**: Always select the correct environment before making requests
3. **Check Headers**: Ensure tenant headers are present for all tenant-aware endpoints
4. **File Uploads**: For selfie uploads, use actual image files (JPEG/PNG)
5. **Location Testing**: Use coordinates within the office radius for attendance testing
6. **Token Expiry**: JWT tokens expire after 24h (configurable). Re-login if token expires

## Sample Excel File Structure

Create an Excel file with the following columns for bulk upload:

| First Name | Last Name | Email | Mobile Number | Role | Status |
|------------|-----------|-------|---------------|------|--------|
| John | Doe | john@example.com | +1234567890 | employee | active |
| Jane | Smith | jane@example.com | +1234567891 | employee | active |

**Column Names (case-insensitive):**
- First Name / firstName
- Last Name / lastName
- Email / email
- Mobile Number / mobileNumber / Mobile
- Role / role (admin or employee)
- Status / status (active or inactive)

## Common Issues

### "Tenant identifier is required"
- Add `X-Tenant-Domain` or `X-Tenant-ID` header

### "Invalid credentials"
- Check email and password
- Ensure password is set (use setup-password endpoint if not)

### "You are not within the office location radius"
- Use coordinates within the office radius set during registration
- Default radius is 100 meters

### "You have already checked in today"
- Can only check in once per day
- Check out first, or wait for next day

### "File size exceeds limit"
- Selfie: Max 5MB
- Excel: Max 10MB

## Collection Structure

```
HRMS Multi-Tenant API
├── Organization
│   └── Register Organization
├── Authentication
│   ├── Login
│   └── Setup Password
├── Users
│   ├── Create User
│   ├── Bulk Upload Users
│   ├── Get All Users
│   └── Get User By ID
├── Attendance
│   ├── Check In
│   ├── Check Out
│   └── Get Attendance Records
└── Dashboard
    └── Get Dashboard Stats
```

## Next Steps

1. Import both JSON files into Postman
2. Select the HRMS Environment
3. Start with "Register Organization"
4. Follow the workflow steps above
5. Explore all endpoints with the provided examples

For more details, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API README](./README.md)

