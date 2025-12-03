# Puppeteer Dependencies Fix for cPanel

## Problem
When generating PM reports (PDF), the system shows error:
```
Failed to launch the browser process: Code: 127
stderr: /home/ivmscom/.cache/puppeteer/chrome/linux-142.0.7444.175/chrome-linux64/chrome: 
error while loading shared libraries: libatk-bridge-2.0.so.0: cannot open shared object file: No such file or directory
```

This happens because Puppeteer's Chrome/Chromium requires system libraries that are not installed on the cPanel server.

## Solution Options

### Option 1: Install System Dependencies (Recommended if you have root/sudo access)

If you have root access or can contact cPanel support, install these packages:

```bash
# For CentOS/RHEL/AlmaLinux (common on cPanel)
sudo yum install -y \
    atk \
    at-spi2-atk \
    cups-libs \
    libXcomposite \
    libXdamage \
    libXrandr \
    libgbm \
    pango \
    cairo \
    gtk3 \
    alsa-lib \
    nss \
    libXScrnSaver

# For Ubuntu/Debian
sudo apt-get install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    libnss3
```

### Option 2: Switch to Alternative PDF Library (No root access needed)

If you **don't have root access** (most shared cPanel hosting), replace Puppeteer with a lighter PDF library that doesn't need system dependencies.

#### Step 1: Install alternative packages

SSH into cPanel and run:

```bash
cd ~/repositories/Inventra/backend
npm uninstall puppeteer
npm install pdf-lib html-pdf-node --save
```

#### Step 2: Update pdfGenerator.js

Replace the Puppeteer implementation with html-pdf-node (which uses a simpler PDF engine).

**Backup current file first:**
```bash
cp utils/pdfGenerator.js utils/pdfGenerator.js.backup
```

#### Step 3: Replace pdfGenerator.js content

The new implementation will use `html-pdf-node` instead of Puppeteer. This library doesn't require Chrome/Chromium or system dependencies.

**Key changes:**
- Replace `const puppeteer = require('puppeteer');` with `const htmlPdf = require('html-pdf-node');`
- Replace browser launch code with simpler PDF generation
- All other logic remains the same

### Option 3: Use Chrome Installed by Puppeteer with All Dependencies

Try using Puppeteer with additional launch arguments that bypass missing libraries:

**Update pdfGenerator.js line 168 and similar browser launch calls:**

```javascript
browser = await puppeteer.launch({
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
    ],
    executablePath: '/usr/bin/chromium-browser' // Try system Chrome if available
});
```

However, this still requires system libraries to be present.

## Recommended Solution for cPanel Shared Hosting

**Use Option 2** - Switch to `html-pdf-node` as it:
- ✅ Works without root access
- ✅ No system dependencies needed
- ✅ Lighter weight
- ✅ Sufficient for PDF report generation
- ❌ Slightly different rendering than Chrome (but acceptable for reports)

## Implementation Steps for Option 2

### 1. SSH into your cPanel server
```bash
ssh ivmscom@ivms2006.com
```

### 2. Navigate to backend directory
```bash
cd ~/repositories/Inventra/backend
```

### 3. Remove Puppeteer and install alternatives
```bash
npm uninstall puppeteer
npm install html-pdf-node --save
```

### 4. Create new pdfGenerator.js file

I'll create an updated version of `pdfGenerator.js` that uses `html-pdf-node` instead of Puppeteer.

### 5. Restart Node.js application
After updating the file:
```bash
# In cPanel, go to: Setup Node.js App → Click "Restart"
# Or via command line:
touch ~/repositories/Inventra/backend/tmp/restart.txt
```

### 6. Test PM report generation
- Go to PM page
- Try generating a report
- Should work without Chrome/Chromium errors

## Alternative: Contact cPanel Support

If you prefer keeping Puppeteer (better rendering quality), contact your hosting provider:

**Email Template:**
```
Subject: Request to Install System Libraries for Chrome/Chromium

Hi Support,

I need the following packages installed on my cPanel server to run Chrome/Chromium for PDF generation:

For CentOS/AlmaLinux:
- atk
- at-spi2-atk  
- cups-libs
- libXcomposite
- libXdamage
- libXrandr
- libgbm
- pango
- cairo
- gtk3
- alsa-lib
- nss

Server: ivms2006.com
Account: ivmscom

These are required for my Node.js application to generate PDF reports.

Thank you!
```

## Verification

After applying the fix, test by:
1. Login to Inventra at https://inventra.ivms2006.com/
2. Go to Preventive Maintenance page
3. Click "Generate Report" on any PM record
4. PDF should download successfully

## Troubleshooting

If still getting errors:

**Check Node.js logs:**
```bash
cd ~/repositories/Inventra/backend
pm2 logs
# or
tail -f logs/combined.log
```

**Verify package installation:**
```bash
npm list html-pdf-node
# Should show installed version
```

**Check file permissions:**
```bash
ls -la utils/pdfGenerator.js
chmod 644 utils/pdfGenerator.js
```
