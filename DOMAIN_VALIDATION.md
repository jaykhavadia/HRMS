# Domain Validation Guide

## Overview

All user emails must match the organization's registered domain. This ensures data isolation and security in the multi-tenant system.

## Validation Rules

### Organization Registration

When registering an organization with `companyDomain: "test"`:

1. **Company Email** (`companyEmail`):
   - ✅ Valid: `admin@test.com`, `contact@test.org`, `info@test.net`
   - ❌ Invalid: `admin@acme.com` (domain mismatch)

2. **Admin Email** (`adminEmail`):
   - ✅ Valid: `john@test.com`, `admin@test.org`
   - ❌ Invalid: `john@acme.com` (domain mismatch)

**Example:**
```json
{
  "companyDomain": "test",
  "companyEmail": "admin@test.com",  // ✅ Valid
  "adminEmail": "john@test.com"      // ✅ Valid
}
```

### User Creation

When creating users for an organization with `companyDomain: "test"`:

1. **User Email** must match the tenant domain:
   - ✅ Valid: `user@test.com`, `employee@test.org`
   - ❌ Invalid: `user@acme.com` (domain mismatch)

**Example:**
```json
{
  "email": "jane@test.com",  // ✅ Valid for domain "test"
  "firstName": "Jane",
  "lastName": "Doe"
}
```

### Bulk User Upload

When bulk uploading users via Excel:

- All user emails in the Excel file must match the tenant domain
- If any email doesn't match, that row will fail with a clear error message
- Example error: `"User email domain must match organization domain. Row 3: user@acme.com does not match domain test"`

## Implementation Details

### Validation Function

**File:** `src/common/utils/email.util.ts`

```typescript
validateEmailDomain(email: string, companyDomain: string): boolean
```

- Extracts domain from email (e.g., `test` from `user@test.com`)
- Compares with `companyDomain`
- Returns `true` if they match, `false` otherwise

### Where Validation is Applied

1. **Organization Registration** (`src/master/organization/organization.service.ts`):
   - Validates `companyEmail` matches `companyDomain`
   - Validates `adminEmail` matches `companyDomain` (if provided)

2. **User Creation** (`src/tenant/user/user.service.ts`):
   - Validates user email matches tenant's `companyDomain`
   - Throws `BadRequestException` if domain doesn't match

3. **Bulk User Upload** (`src/tenant/user/user.service.ts`):
   - Validates each user email in Excel file
   - Skips invalid rows and reports errors

## Error Messages

### Organization Registration

```
Company email domain must match company domain. 
Expected domain: test, but got: acme
```

```
Admin email domain must match company domain. 
Expected domain: test, but got: acme
```

### User Creation

```
User email domain must match organization domain. 
Expected domain: test, but email domain is: acme.com
```

### Bulk Upload

```
User email domain must match organization domain. 
Row 3: user@acme.com does not match domain test
```

## Examples

### ✅ Valid Scenarios

**Organization:**
```json
{
  "companyDomain": "acme-corp",
  "companyEmail": "admin@acme-corp.com",
  "adminEmail": "john@acme-corp.com"
}
```

**User Creation:**
```json
{
  "email": "jane@acme-corp.com",  // Matches "acme-corp"
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### ❌ Invalid Scenarios

**Organization:**
```json
{
  "companyDomain": "acme-corp",
  "companyEmail": "admin@test.com",  // ❌ Domain mismatch
  "adminEmail": "john@acme-corp.com"
}
```
**Error:** `Company email domain must match company domain. Expected domain: acme-corp, but got: test`

**User Creation:**
```json
{
  "email": "jane@test.com",  // ❌ Domain mismatch for tenant "acme-corp"
  "firstName": "Jane",
  "lastName": "Smith"
}
```
**Error:** `User email domain must match organization domain. Expected domain: acme-corp, but email domain is: test.com`

## Domain Extraction Logic

The system extracts the domain from email by:
1. Splitting email by `@` to get domain part
2. Removing the TLD (last part after final dot)
3. Comparing with `companyDomain`

**Examples:**
- `user@test.com` → extracts `test` → matches `companyDomain: "test"` ✅
- `user@acme-corp.com` → extracts `acme-corp` → matches `companyDomain: "acme-corp"` ✅
- `user@sub.company.co.uk` → extracts `sub.company.co` → matches `companyDomain: "sub.company.co"` ✅

## Security Benefits

1. **Data Isolation:** Ensures users can only belong to their organization's tenant
2. **Prevents Cross-Tenant Access:** Users cannot be created with emails from other domains
3. **Consistent Domain Policy:** All users must follow the organization's email domain policy
4. **Prevents Mistakes:** Catches domain mismatches early in the creation process

## Testing

To test domain validation:

1. **Register organization** with `companyDomain: "test"`
2. **Try creating user** with `email: "user@test.com"` → ✅ Should succeed
3. **Try creating user** with `email: "user@acme.com"` → ❌ Should fail with domain mismatch error
4. **Try bulk upload** with mixed domains → Only valid emails should be created

