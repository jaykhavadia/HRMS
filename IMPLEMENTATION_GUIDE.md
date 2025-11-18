# HRMS Multi-Tenant Backend - Implementation Guide

## Overview
This document provides a complete guide to the HRMS multi-tenant backend implementation, including all NestJS CLI commands used and the architecture.

## NestJS CLI Commands Used

### 1. Project Initialization
```bash
nest new . --package-manager npm --skip-git
```

### 2. Module Generation
```bash
# Config Module
nest g module config
nest g service config

# Core Multi-Tenancy Modules
nest g module core/tenant
nest g service core/tenant
nest g module core/database
nest g service core/database

# Master Database Modules
nest g module master/organization
nest g controller master/organization
nest g service master/organization
nest g module master/subscription
nest g service master/subscription

# Shared Services
nest g module shared/email
nest g service shared/email
nest g module shared/file-upload
nest g service shared/file-upload

# Tenant-Specific Modules
nest g module tenant/auth
nest g controller tenant/auth
nest g service tenant/auth
nest g module tenant/user
nest g controller tenant/user
nest g service tenant/user
nest g module tenant/attendance
nest g controller tenant/attendance
nest g service tenant/attendance
nest g module tenant/dashboard
nest g controller tenant/dashboard
nest g service tenant/dashboard
```

### 3. Guards, Interceptors, and Decorators
```bash
nest g guard common/guards/tenant
nest g guard common/guards/jwt-auth
nest g guard common/guards/roles
nest g interceptor common/interceptors/tenant
nest g decorator common/decorators/tenant
nest g decorator common/decorators/roles
nest g decorator common/decorators/current-user
nest g class tenant/auth/strategies/jwt --no-spec
```

## Architecture

### Database Structure

#### Master Database (hrms-master)
- **organizations**: Organization metadata, subscription info, office location
- **subscription_plans**: Available subscription plans (future use)

#### Tenant Databases ({clientId}_{clientName})
- **users**: Employees and admins
- **attendance**: Check-in/out records with selfie and location
- Collections are created dynamically per tenant

### Module Structure

```
src/
├── config/              # Configuration management
├── common/             # Shared utilities
│   ├── decorators/     # @CurrentUser, @Tenant, @Roles
│   ├── guards/         # TenantGuard, JwtAuthGuard, RolesGuard
│   └── interceptors/   # TenantInterceptor
├── core/               # Multi-tenancy core
│   ├── tenant/         # Tenant resolution service
│   └── database/       # Dynamic DB connection service
├── master/             # Master DB modules
│   ├── organization/   # Organization registration
│   └── subscription/   # Subscription plans (future)
├── shared/             # Shared services
│   ├── email/         # Nodemailer integration
│   └── file-upload/   # File upload handling
└── tenant/             # Tenant-specific modules
    ├── auth/          # Authentication (login, password setup)
    ├── user/          # User management (CRUD, bulk upload)
    ├── attendance/    # Attendance (check-in/out)
    └── dashboard/     # Admin dashboard stats
```

## API Endpoints

### Organization Registration (Public)
- `POST /organization/register` - Register new organization

### Authentication (Tenant-aware)
- `POST /auth/login` - Login (requires tenant header/subdomain)
- `POST /auth/setup-password` - Set password using token

### User Management (Protected, Admin only)
- `POST /user` - Create user
- `POST /user/bulk-upload` - Bulk upload users via Excel
- `GET /user` - Get all users (admin) or own profile (employee)
- `GET /user/:id` - Get user by ID

### Attendance (Protected)
- `POST /attendance/check-in` - Check in with selfie and location
- `POST /attendance/check-out` - Check out with selfie and location
- `GET /attendance` - Get attendance records (admin: all, employee: own)

### Dashboard (Protected, Admin only)
- `GET /dashboard/stats` - Get dashboard statistics

## Tenant Resolution

Tenant is resolved via:
1. `X-Tenant-ID` or `X-Tenant-Domain` header (priority)
2. Subdomain extraction from Host header

Example:
- Header: `X-Tenant-Domain: acme-corp`
- Subdomain: `acme-corp.hrms.example.com`

## Environment Variables

Create a `.env` file with:

```env
# Database
MASTER_DB_URI=mongodb://localhost:27017/hrms-master
MONGO_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3000

# Office Location
OFFICE_LOCATION_RADIUS=100
```

## Key Features Implemented

### 1. Multi-Tenancy
- ✅ Separate database per organization
- ✅ Dynamic database connection per request
- ✅ Tenant resolution via header/subdomain
- ✅ Tenant isolation at database level

### 2. Organization Registration
- ✅ Unique domain validation
- ✅ Automatic tenant database creation
- ✅ Admin user creation
- ✅ Welcome email to organization

### 3. Authentication
- ✅ JWT-based authentication
- ✅ Password setup via email token
- ✅ Role-based access control (admin/employee)

### 4. User Management
- ✅ Create individual users
- ✅ Bulk upload via Excel
- ✅ Password setup email for new users
- ✅ Role-based data access

### 5. Attendance
- ✅ Check-in with selfie and location
- ✅ Check-out with selfie and location
- ✅ Office location validation (geofencing)
- ✅ Attendance listing (admin: all, employee: own)

### 6. Admin Dashboard
- ✅ User statistics
- ✅ Attendance statistics
- ✅ Recent attendance records

## File Upload

### Selfie Upload
- Location: `uploads/selfies/`
- Max size: 5MB
- Allowed types: JPEG, PNG
- Format: `selfie_{userId}_{timestamp}.{ext}`

### Excel Upload
- Location: `uploads/excel/`
- Max size: 10MB
- Allowed types: .xlsx, .xls
- Required columns: First Name, Last Name, Email, Mobile Number, Role, Status

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **Role-Based Access Control**: Admin and employee roles
4. **Tenant Isolation**: Database-level isolation
5. **Input Validation**: class-validator for DTOs
6. **File Validation**: Type and size validation for uploads
7. **Location Validation**: Geofencing for attendance

## Database Indexes

### Master DB
- `organizations.companyDomain` (unique)
- `organizations.companyEmail` (unique)
- `organizations.clientId` (unique)

### Tenant DB
- `users.email` (unique)
- `attendance.userId + date` (unique)
- `attendance.checkInTime` (indexed)

## Email Templates

### Welcome Email
Sent to organization admin upon registration with company details.

### Password Setup Email
Sent to users when created, containing:
- Password setup URL with token
- Token expiration (24 hours)
- Frontend route: `#/setup-password?token={token}`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

## Testing Recommendations

1. **Unit Tests**: Test services and guards
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete flows (registration → login → attendance)

## Deployment Considerations

1. **Environment Variables**: Use secure secret management
2. **File Storage**: Consider cloud storage (S3, Azure Blob) for production
3. **Database**: Use MongoDB Atlas connection pooling
4. **CORS**: Configure allowed origins
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Logging**: Add comprehensive logging
7. **Monitoring**: Set up application monitoring

## Next Steps

1. Add subscription plan management
2. Implement leave management
3. Add payroll module
4. Implement reporting and analytics
5. Add real-time notifications
6. Implement audit logging
7. Add API documentation (Swagger)

