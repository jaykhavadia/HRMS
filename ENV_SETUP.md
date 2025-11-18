# Environment Variables Setup Guide

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your actual credentials

3. **Never commit `.env` to version control** (already in .gitignore)

## Required Variables

### Database Configuration

#### MASTER_DB_URI
Master database for storing organizations and tenant metadata.

**Local MongoDB:**
```
MASTER_DB_URI=mongodb://localhost:27017/hrms-master
```

**MongoDB Atlas:**
```
MASTER_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms-master
```

#### MONGO_ATLAS_URI
MongoDB Atlas connection string for tenant databases.

**Format:**
```
MONGO_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net
```

**Note:** 
- Leave empty if using local MongoDB for all databases
- Tenant databases will be created automatically with format: `{clientId}_{clientName}`
- The database name will be appended automatically

**Getting MongoDB Atlas Connection String:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Remove the database name at the end (it will be added automatically)

### JWT Configuration

#### JWT_SECRET
Secret key for signing JWT tokens. **MUST be changed in production!**

**Generate a secure secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**Minimum length:** 32 characters

**Example:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### JWT_EXPIRATION
Token expiration time.

**Options:**
- `24h` - 24 hours (default)
- `7d` - 7 days
- `30d` - 30 days
- `1h` - 1 hour

### Email Configuration (Nodemailer)

#### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "HRMS" as the name
   - Copy the 16-character password

3. **Configure in .env:**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

#### Other Email Providers

**Outlook/Hotmail:**
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Yahoo:**
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP:**
```
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false  # or true for port 465
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

### Frontend URL

URL of your frontend application. Used for generating password setup links.

**Development:**
```
FRONTEND_URL=http://localhost:3000
```

**Production:**
```
FRONTEND_URL=https://yourdomain.com
```

### Office Location

#### OFFICE_LOCATION_RADIUS
Default radius in meters for attendance location validation.

**Options:**
- `50` - 50 meters (strict)
- `100` - 100 meters (default)
- `200` - 200 meters (lenient)
- `500` - 500 meters (very lenient)

**Note:** This can be overridden per organization during registration.

### Server Configuration

#### PORT
Port number for the NestJS server.

**Default:** `3000`

**Production:**
```
PORT=8080
```

## Complete Example

```env
# Database
MASTER_DB_URI=mongodb://localhost:27017/hrms-master
MONGO_ATLAS_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net

# JWT
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRATION=24h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop

# Frontend
FRONTEND_URL=http://localhost:3000

# Office Location
OFFICE_LOCATION_RADIUS=100

# Server
PORT=3000
NODE_ENV=development
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Already in `.gitignore`
   - Use `.env.example` for documentation

2. **Use strong JWT secrets**
   - Minimum 32 characters
   - Use cryptographically secure random strings
   - Different secrets for development and production

3. **Protect database credentials**
   - Use MongoDB Atlas IP whitelist
   - Use strong database passwords
   - Rotate credentials regularly

4. **Use App Passwords for email**
   - Never use your main email password
   - Generate app-specific passwords
   - Revoke if compromised

5. **Environment-specific files**
   - `.env.development` - Development
   - `.env.production` - Production
   - `.env.test` - Testing

## Troubleshooting

### Database Connection Issues

**Error:** "MongoNetworkError: failed to connect"
- Check MongoDB is running (local) or cluster is active (Atlas)
- Verify connection string format
- Check network/firewall settings
- Verify username and password

### Email Not Sending

**Error:** "Invalid login"
- Verify EMAIL_USER and EMAIL_PASSWORD
- For Gmail, use App Password (not regular password)
- Check 2FA is enabled

**Error:** "Connection timeout"
- Check EMAIL_HOST and EMAIL_PORT
- Verify firewall allows SMTP connections
- Try different port (465 for SSL, 587 for TLS)

### JWT Token Issues

**Error:** "Invalid token"
- Verify JWT_SECRET matches between requests
- Check token expiration (JWT_EXPIRATION)
- Ensure token is in Authorization header: `Bearer {token}`

## Testing Configuration

After setting up `.env`, test the configuration:

```bash
# Start the server
npm run start:dev

# Check if it connects to database
# Look for: "Application is running on: http://localhost:3000"

# Test organization registration
# Should create organization and send welcome email
```

## Production Checklist

- [ ] Changed JWT_SECRET to strong random string
- [ ] Updated MONGO_ATLAS_URI with production credentials
- [ ] Configured production email service
- [ ] Updated FRONTEND_URL to production domain
- [ ] Set NODE_ENV=production
- [ ] Configured PORT (or use process manager)
- [ ] Verified .env is in .gitignore
- [ ] Set up environment variables in hosting platform
- [ ] Tested all email functionality
- [ ] Verified database connections

## Environment Variables in Hosting Platforms

### Heroku
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGO_ATLAS_URI=your-connection-string
```

### AWS (Elastic Beanstalk)
Add via AWS Console → Configuration → Software → Environment Properties

### Docker
Use `-e` flag or docker-compose.yml:
```yaml
environment:
  - JWT_SECRET=your-secret
  - MONGO_ATLAS_URI=your-connection-string
```

### Kubernetes
Use ConfigMap or Secrets:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hrms-secrets
data:
  JWT_SECRET: <base64-encoded>
```

