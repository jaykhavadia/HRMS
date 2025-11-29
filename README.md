# HRMS - Human Resource Management System

## 📋 Table of Contents
- [What is HRMS?](#what-is-hrms)
- [Getting Started](#getting-started)
- [For Administrators](#for-administrators)
- [For Employees](#for-employees)
- [Testing Guide for QA](#testing-guide-for-qa)
- [Common Issues & Solutions](#common-issues--solutions)

---

## What is HRMS?

HRMS is a Human Resource Management System that helps organizations:
- ✅ Manage employees
- ✅ Track attendance with location verification
- ✅ Monitor work hours and productivity
- ✅ Generate reports and exports

---

## Getting Started

### Step 1: Register Your Organization

1. **Check if your email is available**
   - Visit: `GET /organization/check-email?email=your@email.com`
   - You should see: `{ "exists": false }`
   - If `exists: true`, use a different email

2. **Register your organization**
   - Visit: `POST /organization/register`
   - Fill in the form:
     ```
     Email: admin@yourcompany.com
     Company Name: Your Company Name
     Full Name: Your Full Name
     Password: YourSecurePassword123!
     Confirm Password: YourSecurePassword123!
     Longitude: -74.0060 (your office longitude)
     Latitude: 40.7128 (your office latitude)
     Radius: 100 (meters - how far from office employees can check in)
     Office Address: Your office address
     Agreement Accepted: true
     ```
   - Click Submit
   - ✅ You'll receive an email with a 6-digit OTP code

3. **Verify your email**
   - Check your email for the OTP (valid for 15 minutes)
   - Visit: `POST /organization/verify-otp`
   - Enter:
     ```
     Email: admin@yourcompany.com
     OTP: 123456 (the code from email)
     ```
   - ✅ Registration complete! You can now login.

### Step 2: Login

1. Visit: `POST /auth/login`
2. Enter your email and password
3. ✅ You'll receive an access token - save this for future requests!

---

## For Administrators

### Managing Employees

#### Create a New Employee

1. Visit: `POST /user`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Fill in employee details:
   ```
   First Name: Jane
   Last Name: Smith
   Email: jane.smith@yourcompany.com
   Mobile Number: +1234567890
   Role: employee
   Status: active
   ```
4. ✅ Employee created! They'll receive an email to set up their password.
5. ✅ Employee will get an auto-generated ID (EMP001, EMP002, etc.)

#### View All Employees

1. Visit: `GET /user`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. ✅ See list of all employees with their details

#### Update Employee Information

1. Visit: `PUT /user/:id` (replace :id with employee ID)
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Update any fields you want to change
4. ✅ Employee information updated

#### Delete Employee

⚠️ **Important Rules:**
- ❌ Cannot delete active employees (must deactivate first)
- ❌ Cannot delete admin user (protected)
- ✅ Can only delete inactive employees

1. First, deactivate the employee (set status to "inactive")
2. Then visit: `DELETE /user/:id`
3. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
4. ✅ Employee deleted

### Company Profile Settings

#### View Company Profile

1. Visit: `GET /organization/profile`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. ✅ See all company settings including:
   - Work hours (start/end time)
   - Weekly off days
   - Office location
   - Agreement acceptance

#### Update Company Profile

1. Visit: `PUT /organization/profile`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Update settings:
   ```
   Work Start Time: 09:00 (24-hour format)
   Work End Time: 18:00 (24-hour format)
   Weekly Off Days: [0, 6] (0=Sunday, 1=Monday, ..., 6=Saturday)
   Office Address: Your new address
   Latitude: 40.7128
   Longitude: -74.0060
   Radius: 100 (meters)
   ```
4. ✅ Settings updated

**Weekly Off Days Guide:**
- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

Example: `[0, 6]` means Sunday and Saturday are off.

### Viewing Attendance

#### View All Attendance Records

1. Visit: `GET /attendance`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Optional filters:
   - `?userId=EMPLOYEE_ID` - Filter by specific employee
   - `?startDate=2025-01-01` - Start date
   - `?endDate=2025-01-31` - End date
4. ✅ See all attendance records

#### Export Attendance Data

1. Visit: `GET /attendance/export`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Optional filters (same as above)
4. ✅ Download CSV file with all attendance data

#### View Check-in Locations on Map

1. Visit: `GET /attendance/map-locations`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Optional date filters
4. ✅ Get all check-in locations with coordinates for map display

### Dashboard

1. Visit: `GET /dashboard/stats`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. ✅ See:
   - Total users (admins, employees)
   - Today's attendance (checked in, checked out, pending)
   - Weekly and monthly statistics
   - Average hours worked
   - Recent attendance records
   - Recent employee actions (check-ins/check-outs)
   - Map locations for today's check-ins

---

## For Employees

### Setting Up Your Password

When an admin creates your account, you'll receive an email with a password setup link.

1. Click the link in the email (or use the token)
2. Visit: `POST /auth/setup-password`
3. Enter:
   ```
   Token: token-from-email
   Password: YourNewPassword123!
   ```
4. ✅ Password set! You can now login.

**Password Requirements:**
- At least 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain a number

### Login

1. Visit: `POST /auth/login`
2. Enter your email and password
3. ✅ You'll receive an access token

### Check In

**Requirements:**
- Must be within office radius (set by admin)
- Need to take a selfie
- Can only check in once per day

**Steps:**
1. Visit: `POST /attendance/check-in`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Use form-data (multipart/form-data):
   ```
   Latitude: 40.7128 (your current latitude)
   Longitude: -74.0060 (your current longitude)
   Address: Your current address (optional)
   Selfie: [Upload your selfie image]
   ```
4. ✅ Checked in successfully!

### Check Out

**Requirements:**
- Must have checked in first
- Must be within office radius
- Need to take a selfie
- Can only check out once per day

**Steps:**
1. Visit: `POST /attendance/check-out`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Use form-data (multipart/form-data):
   ```
   Latitude: 40.7128 (your current latitude)
   Longitude: -74.0060 (your current longitude)
   Address: Your current address (optional)
   Selfie: [Upload your selfie image]
   ```
4. ✅ Checked out successfully! Total hours worked will be calculated.

### View Your Attendance

1. Visit: `GET /attendance`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. Optional date filters:
   - `?startDate=2025-01-01`
   - `?endDate=2025-01-31`
4. ✅ See your attendance records

### View Your Profile

1. Visit: `GET /user`
2. Add Authorization header: `Bearer YOUR_ACCESS_TOKEN`
3. ✅ See your profile information

---

## Testing Guide for QA

### Test Scenarios

#### 1. Registration Flow

**Test Case 1.1: Successful Registration**
- ✅ Check email availability
- ✅ Register with valid data
- ✅ Receive OTP email
- ✅ Verify OTP
- ✅ Login successfully

**Test Case 1.2: Duplicate Email**
- ❌ Try to register with existing email
- ✅ Should get error: "Email already exists"

**Test Case 1.3: Invalid OTP**
- ✅ Register successfully
- ❌ Enter wrong OTP
- ✅ Should get error: "Invalid OTP"

**Test Case 1.4: Expired OTP**
- ✅ Register successfully
- ⏰ Wait 16 minutes (OTP expires in 15 minutes)
- ❌ Try to verify OTP
- ✅ Should get error: "OTP has expired"

**Test Case 1.5: Password Mismatch**
- ❌ Register with password and confirmPassword not matching
- ✅ Should get error: "Passwords do not match"

#### 2. Login Flow

**Test Case 2.1: Successful Login**
- ✅ Login with correct credentials
- ✅ Receive access token
- ✅ Token should be valid

**Test Case 2.2: Wrong Password**
- ❌ Login with wrong password
- ✅ Should get error: "Invalid credentials"

**Test Case 2.3: Non-existent Email**
- ❌ Login with email that doesn't exist
- ✅ Should get error: "Invalid credentials"

**Test Case 2.4: Password Not Set**
- ✅ Create employee (no password)
- ❌ Try to login
- ✅ Should get error: "Password not set"

#### 3. Employee Management

**Test Case 3.1: Create Employee**
- ✅ Admin creates employee
- ✅ Employee receives password setup email
- ✅ Employee can set password
- ✅ Employee can login

**Test Case 3.2: Duplicate Email**
- ✅ Create employee with email
- ❌ Try to create another with same email
- ✅ Should get error: "User with this email already exists"

**Test Case 3.3: Auto-Generated Employee ID**
- ✅ Create first employee
- ✅ Should get EMP001
- ✅ Create second employee
- ✅ Should get EMP002
- ✅ Admin (created during registration) should have EMP001

**Test Case 3.4: Cannot Create Admin**
- ❌ Try to create user with role "admin"
- ✅ Should get error: "Cannot create additional admin users"

**Test Case 3.5: Delete Active Employee**
- ✅ Create employee with status "active"
- ❌ Try to delete
- ✅ Should get error: "Active employees cannot be deleted"

**Test Case 3.6: Delete Admin**
- ❌ Try to delete admin user
- ✅ Should get error: "Admin user cannot be deleted"

**Test Case 3.7: Update Admin**
- ❌ Try to update admin user
- ✅ Should get error: "Admin user cannot be updated"

#### 4. Attendance Flow

**Test Case 4.1: Check In Successfully**
- ✅ Employee within office radius
- ✅ Upload selfie
- ✅ Check in successfully
- ✅ Status should be "checked-in"

**Test Case 4.2: Check In Outside Radius**
- ❌ Employee outside office radius
- ✅ Should get error with distance and allowed radius

**Test Case 4.3: Double Check In**
- ✅ Check in successfully
- ❌ Try to check in again same day
- ✅ Should get error: "You have already checked in today"

**Test Case 4.4: Check Out Without Check In**
- ❌ Try to check out without checking in
- ✅ Should get error: "You must check in before checking out"

**Test Case 4.5: Check Out Successfully**
- ✅ Check in first
- ✅ Check out within office radius
- ✅ Total hours should be calculated
- ✅ Status should be "checked-out"

**Test Case 4.6: Double Check Out**
- ✅ Check in and check out
- ❌ Try to check out again
- ✅ Should get error: "You have already checked out today"

#### 5. Company Profile

**Test Case 5.1: View Profile**
- ✅ Admin views company profile
- ✅ See all settings

**Test Case 5.2: Update Work Hours**
- ✅ Update workStartTime and workEndTime
- ✅ Verify changes saved

**Test Case 5.3: Update Weekly Off Days**
- ✅ Set weekly off days to [0, 6] (Sunday and Saturday)
- ✅ Verify saved correctly

**Test Case 5.4: Employee Cannot Access Profile**
- ❌ Employee tries to access company profile
- ✅ Should get error: "Forbidden" or "Insufficient permissions"

#### 6. Dashboard

**Test Case 6.1: View Dashboard Stats**
- ✅ Admin views dashboard
- ✅ See user counts, attendance stats, recent records

**Test Case 6.2: Employee Cannot Access Dashboard**
- ❌ Employee tries to access dashboard
- ✅ Should get error: "Forbidden"

**Test Case 6.3: Dashboard Data Accuracy**
- ✅ Create employees
- ✅ Record attendance
- ✅ Verify dashboard counts match actual data

#### 7. Export & Map

**Test Case 7.1: Export Attendance**
- ✅ Export attendance data
- ✅ Verify CSV format is correct
- ✅ Verify all data is included

**Test Case 7.2: Map Locations**
- ✅ Get map locations
- ✅ Verify coordinates are correct
- ✅ Verify user information included

#### 8. Edge Cases

**Test Case 8.1: Invalid Token**
- ❌ Use expired or invalid token
- ✅ Should get error: "Unauthorized"

**Test Case 8.2: Missing Required Fields**
- ❌ Submit request without required fields
- ✅ Should get validation errors

**Test Case 8.3: Invalid Date Format**
- ❌ Use invalid date format in filters
- ✅ Should handle gracefully or show error

**Test Case 8.4: Large File Upload**
- ❌ Upload selfie larger than 5MB
- ✅ Should get error or reject file

---

## Common Issues & Solutions

### Issue: "Email already exists"
**Solution:** Use a different email address or check if you've already registered.

### Issue: "OTP has expired"
**Solution:** Register again to receive a new OTP. OTPs expire in 15 minutes.

### Issue: "Invalid credentials"
**Solution:** 
- Check if email and password are correct
- Make sure you've set your password (for employees created by admin)
- Verify you've verified your email (for new registrations)

### Issue: "You are not within the office location radius"
**Solution:** 
- Make sure you're at the office location
- Check with admin if office location/radius is correct
- Verify your GPS is working correctly

### Issue: "Active employees cannot be deleted"
**Solution:** 
1. Update employee status to "inactive" first
2. Then delete the employee

### Issue: "Cannot create additional admin users"
**Solution:** Only one admin is allowed per organization. Create employees with role "employee" instead.

### Issue: "Token has expired"
**Solution:** Login again to get a new access token. Tokens expire after 24 hours.

### Issue: "Password setup token has expired"
**Solution:** Contact admin to resend password setup email. Tokens expire after 24 hours.

### Issue: "Admin user cannot be updated/deleted"
**Solution:** This is by design for security. Admin user is protected.

### Issue: File upload fails
**Solution:**
- Check file size (max 5MB)
- Check file format (JPEG or PNG)
- Verify internet connection

### Issue: Cannot check in/out
**Solution:**
- Verify you're within office radius
- Make sure you've uploaded a selfie
- Check if you've already checked in/out today
- For check out: make sure you've checked in first

---

## Quick Reference

### Employee ID Format
- Format: `EMP001`, `EMP002`, `EMP003`, etc.
- Auto-generated sequentially
- Admin always gets `EMP001`

### Time Formats
- Work hours: `HH:mm` (24-hour format)
  - Example: `09:00`, `18:00`
- Dates: `YYYY-MM-DD`
  - Example: `2025-01-01`

### Weekly Off Days
- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### File Upload Limits
- Max file size: 5MB
- Allowed formats: JPEG, PNG

### Token Expiry
- Access token: 24 hours
- OTP: 15 minutes
- Password setup token: 24 hours

---

## Support

If you encounter any issues not covered here:
1. Check the error message carefully
2. Verify all required fields are filled
3. Ensure you have the correct permissions (admin vs employee)
4. Contact your system administrator

---

## Notes

- All times are in UTC unless specified
- Location coordinates use decimal degrees (latitude, longitude)
- Office radius is measured in meters
- Employee IDs are unique per organization
- Email addresses must be unique across all organizations
