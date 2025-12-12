# 🚀 Deploy HRMS to Render

## Option 1: Render Docker Service (Recommended)

### Step 1: Change Service Type in Render
1. Go to your Render dashboard
2. Select your HRMS service
3. Go to Settings → Advanced
4. Change **Service Type** from "Node" to "Docker"
5. Click Save

### Step 2: Update Build Settings
1. In your Render service settings:
   - **Dockerfile Path**: `render.Dockerfile`
   - **Build Command**: Leave empty (Docker will use Dockerfile)
   - **Start Command**: Leave empty (Docker will use CMD from Dockerfile)

### Step 3: Set Environment Variables
Add these environment variables in Render:

```
NODE_ENV=production
DB_URI=your-mongodb-atlas-connection-string
MASTER_DB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRATION=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://your-render-app.onrender.com
OFFICE_LOCATION_RADIUS=100
```

### Step 4: Deploy
Trigger a new deployment in Render. It will use the `render.Dockerfile`.

---

## Option 2: Render Node.js Service (Alternative)

### Step 1: Keep Node.js Service Type
- Keep your service as "Node" type

### Step 2: Update Build Settings
In your Render service settings:
- **Build Command**: `npm run render-build`
- **Start Command**: `npm run render-start`

### Step 3: Set Environment Variables
Same as Option 1 above.

### Step 4: Database Setup
You'll need MongoDB Atlas (cloud) instead of local Docker MongoDB:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist Render's IP (0.0.0.0/0 for testing)
5. Get your connection string

---

## 🔧 Environment Variables Required

### Database (Choose one):
```
# For MongoDB Atlas (cloud):
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms
MASTER_DB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms

# OR for local Docker (only works with Docker service type):
DB_URI=mongodb://admin:admin123@mongodb:27017/hrms?authSource=admin
MASTER_DB_URI=mongodb://admin:admin123@mongodb:27017/hrms?authSource=admin
```

### Authentication:
```
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION=24h
```

### Email (Required for registration):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Other:
```
NODE_ENV=production
FRONTEND_URL=https://your-app-name.onrender.com
OFFICE_LOCATION_RADIUS=100
```

---

## 📋 Pre-Deployment Checklist

- [ ] Choose deployment option (Docker vs Node.js)
- [ ] Set up MongoDB (Atlas for Node.js, or keep Docker for Docker service)
- [ ] Configure all environment variables
- [ ] Set up Gmail SMTP (see GOOGLE_SMTP_SETUP.md)
- [ ] Test locally with Docker first
- [ ] Update FRONTEND_URL to your Render domain

---

## 🔍 Troubleshooting

### Build Fails with "docker-compose not found"
- **Cause**: Using Node.js service type but Docker build commands
- **Solution**: Either switch to Docker service type OR use Option 2 (Node.js)

### MongoDB Connection Issues
- **Cause**: Wrong connection string or IP not whitelisted
- **Solution**: Check MongoDB Atlas network access settings

### Email Not Working
- **Cause**: Gmail app password not configured
- **Solution**: Follow GOOGLE_SMTP_SETUP.md

### Application Won't Start
- **Cause**: Missing environment variables
- **Solution**: Check all required env vars are set in Render dashboard

---

## 🚀 Post-Deployment

1. **Register Organization**: Visit your Render app URL
2. **Create Admin Account**: Complete the registration flow
3. **Test Features**: Verify all functionality works
4. **Monitor Logs**: Check Render logs for any issues

---

## 💡 Which Option to Choose?

### Choose **Docker Service** if:
- You want to keep your local Docker setup
- You prefer MongoDB Atlas for production
- You need more control over the deployment environment

### Choose **Node.js Service** if:
- You want simpler deployment
- You're comfortable with MongoDB Atlas
- You want faster cold starts

Both options work great! The Docker service gives you more control, while Node.js service is simpler to set up.
