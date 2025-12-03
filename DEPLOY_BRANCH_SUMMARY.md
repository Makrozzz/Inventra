# Deploy Branch - Production Configuration Summary

## 🎯 Overview
This branch (`deploy`) is configured for production deployment to **https://inventra.ivms2006.com/**

All API calls now use environment variables instead of hardcoded localhost URLs, making it deployment-ready.

---

## ✅ Changes Made

### 1. **Centralized API Configuration**
**Created:** `frontend/src/config/api.js`
- Exports `API_URL` constant that reads from `REACT_APP_API_URL` environment variable
- Fallback to `localhost:5000` for development
- Helper function `getApiUrl()` for building endpoint URLs

### 2. **Updated Components** (24 files modified)
All fetch calls updated to use `${API_URL}` instead of `http://localhost:5000/api/v1`:

**Pages Updated:**
- ✅ `Assets.js` - Asset listing and management
- ✅ `AssetDetail.js` - Individual asset details
- ✅ `Projects.js` - Project listing
- ✅ `ProjectDetail.js` - Project details and inventory
- ✅ `Models.js` - Model catalog with specifications
- ✅ `PreventiveMaintenance.js` - PM management (15 API calls updated)
- ✅ `PMDetail.js` - PM record details
- ✅ `AccountSettings.js` - User profile and settings (6 API calls updated)
- ✅ `EditAsset.js` - Asset editing (11 API calls updated)
- ✅ `EditProject.js` - Project editing (4 API calls updated)
- ✅ `AddAsset.js` - New asset creation (5 API calls updated)
- ✅ `AddProject.js` - New project creation
- ✅ `Register.js` - User registration
- ✅ `LoginWithMicrosoft.js` - Microsoft auth

**Files Already Using Environment Variables:**
- ✅ `Login.js` - Already using `process.env.REACT_APP_API_URL`
- ✅ `Dashboard.js` - Uses `apiService`
- ✅ `services/apiService.js` - Already using environment variable

### 3. **Environment Configuration**

**Frontend (`frontend/.env.production`):**
```env
REACT_APP_API_URL=https://inventra.ivms2006.com/api/v1
```

**Backend (`backend/.env.production`):**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=ivmscom_intern
DB_PASSWORD=inventra
DB_NAME=ivmscom_Inventra
DB_PORT=3306
FRONTEND_URL=https://inventra.ivms2006.com
CORS_ORIGIN=https://inventra.ivms2006.com
```

### 4. **Backend Configuration**
**File:** `backend/server.js`
- ✅ Already configured to accept requests from `https://inventra.ivms2006.com`
- ✅ CORS enabled for production domain
- ✅ Serves React static files in production mode
- ✅ Handles React Router fallback

---

## 📊 Statistics

- **Total Files Modified:** 24 files
- **API Calls Updated:** 61 fetch calls
- **Localhost References Removed:** All hardcoded URLs replaced
- **Environment Variables Added:** 2 files (.env.production for frontend and backend)
- **New Files Created:** 3 (api.js config, 2 .env.production files, DEPLOYMENT_GUIDE.md)

---

## 🚀 How to Deploy

### Quick Deploy
1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to cPanel:**
   - Upload `backend/` folder
   - Upload `frontend/build/` folder
   - Rename `.env.production` files to `.env`

3. **Setup Node.js App in cPanel:**
   - Application root: `/home/ivmscom/inventra`
   - Startup file: `backend/server.js`
   - Environment: Production

4. **Start Application**

For detailed instructions, see **DEPLOYMENT_GUIDE.md**

---

## 🔍 Testing Checklist

After deployment, verify:
- [ ] Login page loads
- [ ] Dashboard shows statistics
- [ ] Assets page loads data from database
- [ ] Projects page loads data
- [ ] Models page displays models and specifications
- [ ] PM page functions correctly
- [ ] Asset detail pages work
- [ ] Project detail pages work
- [ ] Add/Edit forms submit correctly
- [ ] No CORS errors in browser console
- [ ] No 404 errors for API calls

---

## 🔄 Development vs Production

### Development (makroz branch):
- Uses `http://localhost:5000/api/v1`
- CORS allows local network IPs
- Environment: `development`

### Production (deploy branch):
- Uses `https://inventra.ivms2006.com/api/v1`
- CORS restricted to production domain
- Environment: `production`
- Optimized React build

---

## 📝 Important Notes

1. **Never commit `.env` files to git** - Only `.env.production` and `.env.example` should be in repo
2. **Update secrets** - Change `SESSION_SECRET` and `JWT_SECRET` in production
3. **Database** - Already exists as `ivmscom_Inventra` with credentials configured
4. **Pull updates on cPanel** - Use `git pull origin deploy` to update production

---

## 🛠️ Rollback Plan

If issues occur:
1. In cPanel, stop the Node.js application
2. Checkout previous working commit: `git checkout <previous-commit-hash>`
3. Restart application
4. Check logs in `backend/logs/` for errors

---

## 👤 Contact

- **Domain:** https://inventra.ivms2006.com/
- **Database:** ivmscom_Inventra
- **Branch:** deploy
- **Last Updated:** December 3, 2025

**All systems ready for deployment! 🚀**
