# Google SMTP (Gmail) Setup Guide

This guide will help you configure your HRMS application to send emails using Google SMTP (Gmail).

## ⚠️ Important Notes

- **You CANNOT use your regular Gmail password** for SMTP
- **You MUST use an App Password** (16-character code)
- **2-Factor Authentication MUST be enabled** on your Google account
- **App Passwords are account-specific** - each Google account needs its own

---

## Step-by-Step Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts to enable 2FA
   - You'll need to verify your phone number
   - You can use an authenticator app or SMS

### Step 2: Generate App Password

1. Go to **App Passwords** page: https://myaccount.google.com/apppasswords
   - If you can't find it, go to: https://myaccount.google.com/security
   - Scroll to "2-Step Verification" section
   - Click on **App passwords** (at the bottom)

2. You may be asked to sign in again for security

3. Select app and device:
   - **Select app**: Choose "Mail"
   - **Select device**: Choose "Other (Custom name)"
   - Enter name: `HRMS` or `HRMS Application`
   - Click **Generate**

4. **Copy the 16-character password** that appears
   - Format: `xxxx xxxx xxxx xxxx` (with spaces) or `xxxxxxxxxxxxxxxx` (without spaces)
   - **⚠️ IMPORTANT**: Copy it immediately - you won't be able to see it again!
   - You can use it with or without spaces (both work)

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Google SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Example:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=mycompany@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Step 4: Restart Your Application

After updating `.env`, restart your application:

```bash
npm run start:dev
# or
npm run start:prod
```

---

## Troubleshooting

### Error: "Invalid login" or "Authentication failed"

**Possible causes:**
1. ❌ Using regular Gmail password instead of App Password
   - **Solution**: Generate an App Password (Step 2 above)

2. ❌ 2-Factor Authentication not enabled
   - **Solution**: Enable 2FA first (Step 1 above)

3. ❌ Wrong email address
   - **Solution**: Make sure `EMAIL_USER` matches the Google account email

4. ❌ App Password copied incorrectly
   - **Solution**: Regenerate a new App Password and copy it carefully

### Error: "Less secure app access"

**This error should NOT appear** if you're using App Passwords correctly. If you see it:
- You're likely using your regular password
- Switch to App Password (see Step 2)

### Error: "Connection timeout"

**Possible causes:**
1. Firewall blocking port 587
   - **Solution**: Allow outbound connections on port 587

2. Network restrictions
   - **Solution**: Check if your network allows SMTP connections

### Can't find "App Passwords" option?

**If you don't see "App passwords" link:**
1. Make sure 2-Factor Authentication is enabled (Step 1)
2. Wait a few minutes after enabling 2FA
3. Try refreshing the page
4. Make sure you're using a personal Google account (not Google Workspace)

### Using Google Workspace (Business Account)?

If you're using Google Workspace:
1. App Passwords work the same way
2. Your admin may need to enable "Less secure app access" (not recommended)
3. Better: Use OAuth2 with service account (advanced setup)

---

## Alternative: Port 465 (SSL)

If port 587 doesn't work, you can use port 465 with SSL:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Note**: Port 587 (TLS) is recommended and more commonly used.

---

## Security Best Practices

1. ✅ **Never commit `.env` file** to version control
2. ✅ **Use App Passwords** - never use your regular password
3. ✅ **Keep App Passwords secret** - treat them like passwords
4. ✅ **Regenerate App Passwords** if you suspect they're compromised
5. ✅ **Use different App Passwords** for different applications
6. ✅ **Review App Passwords** periodically in your Google Account settings

---

## Testing Your Configuration

After setup, test by:
1. Registering a new organization (sends OTP email)
2. Creating a new user (sends password setup email)
3. Check application logs for connection status

You should see in logs:
```
✅ Email service connected successfully to smtp.gmail.com
```

If you see errors, check the troubleshooting section above.

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **SMTP Server** | `smtp.gmail.com` |
| **Port (TLS)** | `587` |
| **Port (SSL)** | `465` |
| **Security** | `false` for 587, `true` for 465 |
| **Username** | Your Gmail address |
| **Password** | 16-character App Password |

---

## Need Help?

If you're still having issues:
1. Check application logs for specific error messages
2. Verify all environment variables are set correctly
3. Test with a different Gmail account
4. Ensure 2FA is enabled and App Password is generated correctly

---

## Summary Checklist

- [ ] 2-Factor Authentication enabled on Google account
- [ ] App Password generated from Google Account settings
- [ ] App Password copied (16 characters)
- [ ] `.env` file updated with correct values:
  - [ ] `EMAIL_HOST=smtp.gmail.com`
  - [ ] `EMAIL_PORT=587`
  - [ ] `EMAIL_SECURE=false`
  - [ ] `EMAIL_USER=your-email@gmail.com`
  - [ ] `EMAIL_PASSWORD=your-app-password`
- [ ] Application restarted
- [ ] Connection verified in logs

Once all checkboxes are complete, your email service should be working! ✅

