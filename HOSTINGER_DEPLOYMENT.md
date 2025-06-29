# Hostinger Deployment Guide for Zelmu Esports

## Prerequisites
- Hostinger hosting plan with Node.js support
- Access to hPanel
- Your domain name

## Step 1: Prepare Your Files
1. Your app is already built (`.next` folder exists)
2. All required files are ready

## Step 2: Access hPanel
1. Log in to your Hostinger account
2. Go to your hosting control panel (hPanel)
3. Navigate to "Advanced" → "Node.js"

## Step 3: Configure Node.js in hPanel
1. **Enable Node.js**: Turn on Node.js for your domain
2. **Node.js Version**: Select version 18.x or 20.x (recommended)
3. **Application URL**: Set to your domain (e.g., `yourdomain.com`)
4. **Application Root**: Set to `/public_html` or your preferred directory
5. **Application Startup File**: Set to `server.js` (we'll create this)
6. **Node.js Environment**: Set to `production`

## Step 4: Upload Your Files
1. Go to "Files" → "File Manager" in hPanel
2. Navigate to your application root directory
3. Upload all files from your project folder:
   - `package.json`
   - `package-lock.json`
   - `.next/` folder (entire folder)
   - `public/` folder (entire folder)
   - `.htaccess`
   - `next.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `tsconfig.json`

## Step 5: Create Server File
Create a `server.js` file in your root directory with this content:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

## Step 6: Install Dependencies
1. Go to "Advanced" → "SSH Access" in hPanel
2. Connect via SSH to your server
3. Navigate to your application directory
4. Run: `npm install --production`

## Step 7: Start Your Application
1. In the Node.js section of hPanel, click "Restart" or "Start"
2. Your app should now be running on your domain

## Step 8: Configure Domain (if needed)
1. Go to "Domains" in hPanel
2. Point your domain to the correct directory
3. Set up SSL certificate if not already done

## Troubleshooting
- **Port Issues**: Make sure the port in hPanel matches your `server.js`
- **Dependencies**: Ensure all dependencies are installed
- **Permissions**: Check file permissions (should be 644 for files, 755 for folders)
- **Logs**: Check error logs in hPanel for any issues

## Environment Variables (if needed)
If you need to set environment variables:
1. Go to "Advanced" → "Environment Variables" in hPanel
2. Add any required environment variables

## Important Notes
- Your app will be accessible at your domain
- Static files are served from the `public` folder
- API routes will work at `/api/*`
- Make sure your Supabase and Firebase configurations are correct for production 