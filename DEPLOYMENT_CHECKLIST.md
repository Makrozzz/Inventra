# ✅ Pre-Deployment Verification Checklist

## Code Changes ✅

- [x] **API Configuration Created**
  - File: `frontend/src/config/api.js`
  - Exports: `API_URL` constant
  - Uses: `process.env.REACT_APP_API_URL` with fallback

- [x] **All Components Updated** (24 files)
  - All `fetch()` calls use `${API_URL}` instead of hardcoded URLs
  - Import statement added: `import { API_URL } from '../config/api';`
  - Zero hardcoded `localhost:5000` URLs remaining in production code

- [x] **Environment Files Created**
  - `frontend/.env.production` ✓ (API URL: https://inventra.ivms2006.com/api/v1)
  - `backend/.env.production` ✓ (Database: ivmscom_Inventra)

- [x] **Backend CORS Configuration Verified**
  - `server.js` includes `https://inventra.ivms2006.com` in allowed origins
  - Credentials enabled
  - All HTTP methods allowed

- [x] **Documentation Created**
  - `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
  - `DEPLOY_BRANCH_SUMMARY.md` - Overview of all changes

---

## Pre-Deploy Tests (Do Before Upload)

### Local Testing
- [ ] Run `npm run build` in frontend folder successfully
- [ ] Check `frontend/build/` folder exists and contains files
- [ ] Verify no build errors or warnings (critical ones)

### Code Review
- [ ] Verify `.env.production` files have correct values
- [ ] Check database credentials match cPanel database
- [ ] Confirm no sensitive data in code comments
- [ ] Review `.gitignore` includes `.env` (not `.env.production`)

---

## During Deployment

### File Upload
- [ ] Backend folder uploaded to cPanel
- [ ] Frontend build folder uploaded
- [ ] `.env.production` renamed to `.env` (both frontend and backend)
- [ ] `node_modules/` NOT uploaded (will install on server)
- [ ] Test files NOT uploaded (debug-*.js, test-*.js)

### cPanel Configuration
- [ ] Node.js app created in cPanel
- [ ] Application root set correctly
- [ ] Startup file: `backend/server.js`
- [ ] Environment variables configured
- [ ] Dependencies installed: `npm install --production`

### Server Setup
- [ ] Node.js app status shows "Running"
- [ ] No errors in application logs
- [ ] `uploads/` folder exists with correct permissions
- [ ] `uploads/pm-reports/` exists
- [ ] `uploads/bulkpm-reports/` exists

---

## Post-Deployment Tests

### Basic Functionality
- [ ] Website loads at https://inventra.ivms2006.com
- [ ] No blank page or loading errors
- [ ] CSS and assets load correctly
- [ ] Favicon displays

### Authentication
- [ ] Login page displays
- [ ] Can login with valid credentials
- [ ] Invalid credentials show error
- [ ] Redirects to dashboard after login
- [ ] Logout works

### Pages Load Data
- [ ] Dashboard shows statistics
- [ ] Assets page displays assets from database
- [ ] Projects page displays projects
- [ ] Models page displays models
- [ ] PM page loads
- [ ] Account settings page loads

### API Calls Working
- [ ] No CORS errors in browser console (F12)
- [ ] No 404 errors for `/api/v1/` endpoints
- [ ] Network tab shows successful 200 responses
- [ ] Data is fetching from production database

### CRUD Operations
- [ ] Can view asset details
- [ ] Can view project details
- [ ] Can add new asset (if permissions allow)
- [ ] Can edit existing records
- [ ] Can delete records (if permissions allow)

### Advanced Features
- [ ] PM report download works
- [ ] Bulk PM download works
- [ ] CSV upload works (if applicable)
- [ ] Search functionality works
- [ ] Filters work on all pages
- [ ] Pagination works

### Mobile Testing
- [ ] Site is responsive on mobile
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile

---

## Security Checks

- [ ] `SESSION_SECRET` changed from default
- [ ] `JWT_SECRET` changed from default
- [ ] Database password is secure
- [ ] `.env` file not accessible via web browser
- [ ] No sensitive data in browser console logs
- [ ] HTTPS enforced (not HTTP)

---

## Performance Checks

- [ ] Page load time is acceptable (< 3 seconds)
- [ ] Images and assets load quickly
- [ ] No excessive API calls in console
- [ ] Database queries are efficient

---

## Documentation

- [ ] README updated with production URL
- [ ] Team members have access to deployment guide
- [ ] Database backup created before deployment
- [ ] Rollback plan understood

---

## Troubleshooting Reference

### If site doesn't load:
1. Check Node.js app status in cPanel
2. Check application logs for errors
3. Verify .htaccess rules
4. Check file permissions

### If API calls fail:
1. Check CORS configuration in `server.js`
2. Verify `.env` has correct values
3. Check if backend is running
4. Test API endpoint directly: `https://inventra.ivms2006.com/api/health`

### If database errors occur:
1. Verify database credentials in `.env`
2. Check database exists: `ivmscom_Inventra`
3. Verify database user has permissions
4. Check database connection in logs

---

## Success Criteria

**Deployment is successful when:**
- ✅ All pages load without errors
- ✅ Data displays from production database
- ✅ CRUD operations work
- ✅ No console errors
- ✅ Users can login and use the system
- ✅ PM reports can be generated and downloaded

---

## Post-Deployment Actions

- [ ] Monitor application for first 24 hours
- [ ] Check logs daily for first week
- [ ] Notify users of new production URL
- [ ] Update bookmarks/shortcuts
- [ ] Document any issues encountered
- [ ] Plan regular maintenance schedule

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Status:** [ ] Success [ ] Issues Found [ ] Rolled Back

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
