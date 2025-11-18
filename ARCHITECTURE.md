# HRMS Multi-Tenant Backend Architecture

## Overview
Production-grade NestJS backend for multi-tenant HRMS with MongoDB Atlas, supporting dynamic database per tenant.

## Architecture Principles

### 1. Multi-Tenancy Strategy
- **Master Database**: Stores organizations, subscription plans, tenant metadata
- **Tenant Databases**: Separate MongoDB database per organization (`{clientId}_{clientName}`)
- **Tenant Resolution**: Via subdomain/domain or custom header (`X-Tenant-ID`)
- **Dynamic Connection**: Per-request database connection switching

### 2. Database Schema

#### Master DB Collections:
- `organizations`: Organization metadata, subscription info
- `subscription_plans`: Available plans and features
- `tenant_connections`: Connection strings and credentials (encrypted)

#### Tenant DB Collections (per organization):
- `users`: Employees and admins
- `attendance`: Check-in/out records with selfie and location
- `roles`: Role definitions
- `permissions`: Permission mappings

### 3. Module Structure

```
src/
├── common/              # Shared utilities, decorators, guards
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/             # Configuration management
├── core/               # Multi-tenancy core
│   ├── tenant/
│   └── database/
├── master/             # Master DB modules
│   ├── organization/
│   └── subscription/
├── tenant/             # Tenant-specific modules
│   ├── auth/
│   ├── user/
│   ├── attendance/
│   └── dashboard/
├── shared/             # Shared services
│   ├── email/
│   └── file-upload/
└── main.ts
```

### 4. Key Flows

#### Organization Registration Flow:
1. Client sends registration data
2. Validate uniqueness (domain, email)
3. Create organization in Master DB
4. Create tenant database
5. Initialize tenant DB with default collections
6. Create admin user in tenant DB
7. Send welcome email to admin
8. Return organization details

#### Authentication Flow:
1. Extract tenant identifier (subdomain/header)
2. Resolve tenant from Master DB
3. Connect to tenant database
4. Authenticate user credentials
5. Generate JWT with tenant context
6. Return token with user details

#### Attendance Check-in Flow:
1. Authenticate request (JWT + tenant context)
2. Validate user role (employee/admin)
3. Validate location (within office radius)
4. Upload selfie image
5. Create attendance record in tenant DB
6. Return attendance confirmation

### 5. Security Considerations
- JWT with tenant ID in payload
- Role-based access control (RBAC)
- Tenant isolation at database level
- Encrypted connection strings
- File upload validation (size, type)
- Location validation (geofencing)

### 6. Technology Stack
- **Framework**: NestJS
- **Database**: MongoDB (Atlas)
- **ORM/ODM**: Mongoose
- **Authentication**: JWT (@nestjs/jwt, @nestjs/passport)
- **File Upload**: Multer (@nestjs/platform-express)
- **Email**: Nodemailer
- **Excel Parsing**: xlsx
- **Validation**: class-validator, class-transformer

