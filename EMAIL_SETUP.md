# Email Configuration Guide

## Current Setup: Ethereal Email (Testing)

Your application is configured to use **Ethereal Email** for testing. This is perfect for development!

### What is Ethereal Email?

Ethereal Email is a fake SMTP service designed for testing email functionality:
- ✅ **No real emails sent** - All emails are captured for viewing
- ✅ **No authentication needed** - Works immediately
- ✅ **View emails in browser** - Access via Ethereal website
- ✅ **Perfect for development** - No risk of spamming real users

### Current Configuration

```env
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=rebecca.ziemann38@ethereal.email
EMAIL_PASSWORD=pTkxwqE9EtDU2Ghg33
```

### Viewing Test Emails

1. Go to https://ethereal.email/
2. Login with your credentials:
   - Email: `rebecca.ziemann38@ethereal.email`
   - Password: `pTkxwqE9EtDU2Ghg33`
3. View all captured emails in the inbox

### For Production

When ready for production, update `.env` with real SMTP credentials:

**Gmail (with App Password):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Other Providers:**
- Outlook: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`
- Custom SMTP: Your provider's SMTP server

### Important Notes

1. **Ethereal Email credentials expire** - Generate new ones if needed
2. **For production** - Always use real SMTP with proper authentication
3. **Gmail requires App Password** - Not your regular password
4. **Test emails are safe** - Ethereal doesn't send real emails

### Generating New Ethereal Credentials

If credentials expire, you can:
1. Visit https://ethereal.email/
2. Click "Create Account"
3. Get new credentials
4. Update `.env` file

The current setup is **perfect for development and testing**! ✅

