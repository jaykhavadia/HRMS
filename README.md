# HRMS Multi-Tenant Backend

Production-grade NestJS backend for a multi-tenant HRMS application with MongoDB Atlas support.

## Features

- ✅ **Multi-Tenancy**: Separate database per organization
- ✅ **Organization Registration**: Complete registration flow with tenant DB creation
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **User Management**: CRUD operations and bulk Excel upload
- ✅ **Attendance Tracking**: Check-in/out with selfie and location validation
- ✅ **Admin Dashboard**: Statistics and analytics
- ✅ **Email Notifications**: Welcome emails and password setup emails
- ✅ **File Upload**: Selfie and Excel file handling
- ✅ **Role-Based Access Control**: Admin and employee roles

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
cd HRMS
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```env
MASTER_DB_URI=mongodb://localhost:27017/hrms-master
MONGO_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
OFFICE_LOCATION_RADIUS=100
PORT=3000
```

4. Start the application
```bash
npm run start:dev
```

## API Endpoints

### Public Endpoints
- `POST /organization/register` - Register new organization

### Tenant-Aware Endpoints (Require X-Tenant-ID header or subdomain)
- `POST /auth/login` - User login
- `POST /auth/setup-password` - Set password using token

### Protected Endpoints (Require JWT + Tenant)
- `POST /user` - Create user (Admin only)
- `POST /user/bulk-upload` - Bulk upload users (Admin only)
- `GET /user` - Get users
- `GET /user/:id` - Get user by ID
- `POST /attendance/check-in` - Check in
- `POST /attendance/check-out` - Check out
- `GET /attendance` - Get attendance records
- `GET /dashboard/stats` - Get dashboard stats (Admin only)

## Tenant Resolution

Tenant is resolved via:
1. `X-Tenant-ID` or `X-Tenant-Domain` header (priority)
2. Subdomain from Host header

Example:
```bash
curl -H "X-Tenant-Domain: acme-corp" http://localhost:3000/auth/login
```

## Project Structure

```
src/
├── config/              # Configuration
├── common/              # Shared utilities (guards, decorators)
├── core/                # Multi-tenancy core
├── master/              # Master database modules
├── shared/              # Shared services (email, file-upload)
└── tenant/              # Tenant-specific modules
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - Detailed architecture documentation
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Complete implementation guide
- [CLI Commands](./CLI_COMMANDS.md) - All NestJS CLI commands used

## Development

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm test
```

## License

Private - All rights reserved
