# Complete NestJS CLI Commands Used

This document lists all NestJS CLI commands executed to create the HRMS multi-tenant backend.

## Project Initialization
```bash
npm i -g @nestjs/cli
nest new . --package-manager npm --skip-git
```

## Dependencies Installation
```bash
npm install @nestjs/mongoose mongoose @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/config nodemailer multer @types/multer @types/nodemailer @types/passport-jwt class-validator class-transformer xlsx @types/xlsx bcrypt @types/bcrypt uuid @types/uuid
```

## Module Generation Commands

### Configuration Module
```bash
nest g module config
nest g service config
```

### Core Multi-Tenancy Modules
```bash
nest g module core/tenant
nest g service core/tenant
nest g module core/database
nest g service core/database
```

### Master Database Modules
```bash
nest g module master/organization
nest g controller master/organization
nest g service master/organization
nest g module master/subscription
nest g service master/subscription
```

### Shared Services
```bash
nest g module shared/email
nest g service shared/email
nest g module shared/file-upload
nest g service shared/file-upload
```

### Tenant-Specific Modules
```bash
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

### Guards, Interceptors, and Decorators
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

### Common Module
```bash
nest g module common
```

## Directory Structure Created
```bash
mkdir -p src/common/decorators src/common/guards src/common/interceptors src/common/pipes
mkdir -p src/master/organization/schemas src/master/organization/dto
mkdir -p src/tenant/auth/dto src/tenant/auth/strategies
mkdir -p src/tenant/user/dto src/tenant/user/schemas
mkdir -p src/tenant/attendance/dto src/tenant/attendance/schemas
```

## Summary

Total modules created: 15
Total services created: 12
Total controllers created: 5
Total guards created: 3
Total decorators created: 3
Total interceptors created: 1
Total strategies created: 1

All commands were executed in the project root directory: `/home/jay/Jay/husky/HRMS`

