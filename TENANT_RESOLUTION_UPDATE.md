# Tenant Resolution Update - Email-Based

## Major Change Summary

**Previous:** Tenant resolution via headers (`X-Tenant-Domain`) or subdomain  
**New:** Tenant resolution automatically from user's email address

## How It Works

### Email Domain Extraction
- Email: `john.doe@acme-corp.com` → Tenant domain: `acme-corp`
- Email: `user@company.com` → Tenant domain: `company`
- Email: `admin@sub.company.co.uk` → Tenant domain: `sub.company.co`

### Resolution Flow

#### 1. Login Endpoint
```
POST /auth/login
Body: { "email": "john@acme-corp.com", "password": "..." }
```
- TenantGuard extracts `acme-corp` from email
- Resolves organization with `companyDomain: "acme-corp"`
- Connects to tenant database
- Returns JWT token with email included

#### 2. Authenticated Endpoints
```
GET /user
Headers: Authorization: Bearer {token}
```
- JwtAuthGuard validates token and sets `request.user` with email
- TenantGuard extracts tenant from `request.user.email`
- Resolves tenant and processes request

#### 3. Setup Password Endpoint
```
POST /auth/setup-password
Body: { "token": "...", "password": "...", "email": "john@acme-corp.com" }
```
- Email is **required** in request body
- TenantGuard extracts tenant from email
- Service verifies email matches token

## Code Changes

### 1. New Utility Function
**File:** `src/common/utils/email.util.ts`
- `extractTenantDomainFromEmail()` - Extracts domain from email

### 2. Updated TenantGuard
**File:** `src/common/guards/tenant/tenant.guard.ts`
- Priority 1: Extract from `request.user.email` (authenticated requests)
- Priority 2: Extract from `request.body.email` (login, setup-password)
- Priority 3: Extract from `request.query.email` (optional)

### 3. Updated TenantService
**File:** `src/core/tenant/tenant.service.ts`
- `resolveTenant()` now only searches by `companyDomain`
- Removed `clientId` lookup (not needed)

### 4. Updated SetupPasswordDto
**File:** `src/tenant/auth/dto/setup-password.dto.ts`
- Added `email` field (required)
- Used for tenant resolution

### 5. Updated Controllers
- All controllers already use `TenantGuard` + `JwtAuthGuard`
- No changes needed - guards work in correct order

## API Changes

### Removed Requirements
- ❌ `X-Tenant-Domain` header (no longer needed)
- ❌ `X-Tenant-ID` header (no longer needed)
- ❌ Subdomain-based resolution (no longer needed)

### New Requirements
- ✅ Email in request body for login
- ✅ Email in request body for setup-password
- ✅ JWT token includes email (automatic)

## Benefits

1. **Simpler API:** No need to send tenant headers
2. **More Secure:** Tenant is tied to user's email
3. **Better UX:** Users don't need to know their tenant domain
4. **Automatic:** Works seamlessly with JWT authentication

## Migration Notes

### For Frontend Developers
1. Remove all `X-Tenant-Domain` headers from API calls
2. Ensure email is included in login and setup-password requests
3. JWT token automatically includes email for tenant resolution

### For API Consumers
- Login: Include email in body (already required)
- Setup Password: Include email in body (new requirement)
- All other endpoints: No changes needed (uses JWT email)

## Testing

### Test Email Domain Extraction
```typescript
extractTenantDomainFromEmail('john@acme-corp.com') // → 'acme-corp'
extractTenantDomainFromEmail('user@company.com') // → 'company'
extractTenantDomainFromEmail('admin@sub.company.co.uk') // → 'sub.company.co'
```

### Test Login Flow
1. Register organization with `companyDomain: "acme-corp"`
2. Login with `email: "john@acme-corp.com"`
3. System should resolve tenant automatically
4. No headers needed!

## Important Notes

1. **Email Domain Must Match:** The domain extracted from email must match the `companyDomain` in the organization record
2. **Case Insensitive:** Email domains are converted to lowercase
3. **TLD Handling:** The last part after the final dot is removed (e.g., `.com`, `.co.uk`)
4. **Setup Password:** Email is now required to resolve tenant before looking up user by token

## Example Flow

```
1. Organization registered with companyDomain: "acme-corp"
2. Admin user created with email: "john@acme-corp.com"
3. User logs in:
   POST /auth/login
   { "email": "john@acme-corp.com", "password": "..." }
   → System extracts "acme-corp" from email
   → Resolves tenant organization
   → Connects to tenant database
   → Returns JWT with email
4. User makes authenticated request:
   GET /user
   Authorization: Bearer {token}
   → JWT contains email
   → System extracts "acme-corp" from email
   → Resolves tenant
   → Returns user data
```

