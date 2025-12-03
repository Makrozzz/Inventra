# Deployment Checklist for cPanel

## ✅ Completed Pre-Deployment Tasks

### 1. Frontend Configuration ✅
- [x] Created centralized API configuration (`frontend/src/config/api.js`)
- [x] Updated all page components to use `API_URL` from config
- [x] Created `.env.production` with production API URL: `https://inventra.ivms2006.com/api/v1`
- [x] Replaced all hardcoded `localhost:5000` URLs (61 instances updated)

### 2. Backend Configuration ✅
- [x] CORS configured to accept requests from `https://inventra.ivms2006.com`
- [x] Created `backend/.env.production` with production database credentials
- [x] Static file serving configured for React build
- [x] Upload directories configured (`uploads/pm-reports`, `uploads/bulkpm-reports`)

### 3. Database ✅
- Database already exists on cPanel: `ivmscom_Inventra`
- Database credentials configured in `.env.production`

---

## 📋 Deployment Steps for cPanel

### Step 1: Build the Frontend
```bash
cd frontend
npm run build
```
This creates an optimized production build in `frontend/build/`

### Step 2: Prepare Files for Upload
**Files to upload to cPanel:**
- `backend/` folder (entire backend application)
- `frontend/build/` folder (built React app)
- Root `.env.production` (rename to `.env` on server)
- `backend/.env.production` (rename to `.env` on server)
- `package.json` files

**Do NOT upload:**
- `node_modules/` (will install on server)
- `.git/` folder
- Test files (debug-*.js, test-*.js)
- Development `.env` files

### Step 3: cPanel File Manager Setup
1. Upload backend folder to: `/home/ivmscom/inventra/` (or your chosen directory)
2. The file structure should be:
   ```
   /home/ivmscom/inventra/
   ├── backend/
   │   ├── server.js
   │   ├── .env (production config)
   │   ├── package.json
   │   └── ... (all backend files)
   ├── frontend/
   │   └── build/ (React production build)
   └── package.json (workspace root)
   ```

### Step 4: Install Dependencies
In cPanel Terminal or SSH:
```bash
cd /home/ivmscom/inventra/backend
npm install --production
```

### Step 5: Set Environment Variables
Rename `.env.production` to `.env` in both root and backend folders:
```bash
mv .env.production .env
mv backend/.env.production backend/.env
```

**Important:** Update these values in `backend/.env`:
- `SESSION_SECRET` - Generate a strong random string
- `JWT_SECRET` - Generate a different strong random string
- Verify `DB_PASSWORD=inventra` is correct

### Step 6: Setup Node.js App in cPanel
1. Go to cPanel → **Setup Node.js App**
2. Click "Create Application"
3. Configure:
   - **Node.js version:** 22.x or latest LTS
   - **Application mode:** Production
   - **Application root:** `/home/ivmscom/inventra`
   - **Application URL:** `https://inventra.ivms2006.com`
   - **Application startup file:** `backend/server.js`
   - **Environment variables:** (Load from .env or set manually)
     - `NODE_ENV=production`
     - `PORT=5000`
     - `CORS_ORIGIN=https://inventra.ivms2006.com`

### Step 7: Configure .htaccess (if needed)
Create/edit `.htaccess` in your public_html or domain root:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # API requests go to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
  
  # Static files (React build)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /index.html [L]
</IfModule>
```

### Step 8: Start the Application
In cPanel Node.js App interface:
1. Click "Start Application"
2. Check for any errors in the log
3. Verify the app status shows "Running"

### Step 9: Test the Deployment
1. Visit `https://inventra.ivms2006.com`
2. Test login functionality
3. Check Projects page loads data
4. Check Assets page loads data
5. Test Models page
6. Test PM functionality
7. Check browser console for any errors

---

## 🔧 Troubleshooting

### Issue: "Cannot GET /api/v1/..."
**Solution:** Ensure Node.js app is running and .htaccess proxy rules are correct

### Issue: CORS errors
**Solution:** Verify `CORS_ORIGIN` in backend `.env` matches your domain exactly

### Issue: Database connection failed
**Solution:** 
- Verify database credentials in `backend/.env`
- Check if database `ivmscom_Inventra` exists
- Ensure database user has proper permissions

### Issue: Assets/uploads not loading
**Solution:** 
- Ensure `uploads/` folder exists with proper permissions (755)
- Check `uploads/pm-reports/` and `uploads/bulkpm-reports/` exist

### Issue: 404 on page refresh
**Solution:** Ensure .htaccess rewrite rules are configured for React Router

---

## 📝 Post-Deployment

### Update Git Repository
After successful deployment, push the deploy branch:
```bash
git add .
git commit -m "Production deployment configuration"
git push origin deploy
```

### Monitor Application
- Check cPanel Node.js App logs regularly
- Monitor `backend/logs/` for application errors
- Set up log rotation if needed

### Security Checklist
- [ ] Changed default SESSION_SECRET and JWT_SECRET
- [ ] Database credentials are secure
- [ ] File permissions are correct (644 for files, 755 for directories)
- [ ] Sensitive files are not publicly accessible
- [ ] HTTPS is enforced

---

## 🔄 Future Updates

To update the application:
1. On cPanel, pull latest code: `git pull origin deploy`
2. Install new dependencies: `npm install --production`
3. Rebuild frontend (if changed): `npm run build` in frontend folder
4. Restart Node.js app in cPanel interface

---

## 📞 Important Notes

- **Current API URL:** `https://inventra.ivms2006.com/api/v1`
- **Database:** `ivmscom_Inventra` (already exists)
- **DB User:** `ivmscom_intern`
- **Backend Port:** 5000 (internal, proxied through cPanel)
- **Node Version:** 22.19.0 (verify cPanel supports this or use closest LTS)

All configuration files are ready for deployment on the `deploy` branch.
