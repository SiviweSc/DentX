# DentX Quarters Website - Deployment Guide

## Overview
This is a React + Vite application for the DentX Quarters dental practice website. Follow this guide to deploy it to your domain (dentxquarters.co.za).

## Prerequisites
- Node.js 18+ installed on your local machine
- npm or pnpm package manager
- FTP/SFTP access to your web hosting
- OR access to a deployment platform (Netlify, Vercel, Cloudflare Pages, etc.)

---

## Option 1: Download & Build Locally (Recommended)

### Step 1: Download Project Files
Download all the project files from Figma Make. You should have:
```
dentx-quarters/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── components/
│   └── styles/
├── package.json
├── vite.config.ts
├── postcss.config.mjs
└── index.html (if exists)
```

### Step 2: Create index.html (if not exists)
If `index.html` doesn't exist in your root directory, create it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="DentX Quarters - Professional Dental & Medical Care in Nelspruit, South Africa" />
    <title>DentX Quarters | Dental & Medical Care - Nelspruit</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

### Step 3: Create main.tsx (if not exists)
Create `/src/app/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 4: Install Dependencies
Open terminal in the project folder:
```bash
npm install
# or if using pnpm
pnpm install
```

### Step 5: Build for Production
```bash
npm run build
# or
pnpm build
```

This creates a `dist` folder with your production-ready files.

### Step 6: Test the Build Locally (Optional)
```bash
npx vite preview
```
Visit `http://localhost:4173` to test.

---

## Option 2: Deploy to Hosting Platforms

### A. Netlify (Easiest - Free Tier Available)

1. **Via Netlify Drop**
   - Go to https://app.netlify.com/drop
   - Drag the `dist` folder
   - Get instant deployment

2. **Via Git Repository**
   - Push code to GitHub/GitLab
   - Connect to Netlify
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add custom domain: dentxquarters.co.za

### B. Vercel (Free Tier Available)

1. Push code to GitHub
2. Import to Vercel (https://vercel.com)
3. Build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add custom domain

### C. Cloudflare Pages (Free)

1. Push to GitHub/GitLab
2. Connect to Cloudflare Pages
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Configure DNS for dentxquarters.co.za

### D. Traditional Web Hosting (cPanel/FTP)

1. Build the project locally (Step 5 above)
2. Upload contents of `dist` folder via FTP/SFTP to your web root:
   - Usually `public_html` or `www` folder
3. Ensure `.htaccess` file exists for React Router:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Important Configuration

### 1. Environment Variables
No environment variables needed - all configuration is hardcoded.

### 2. WhatsApp Integration
WhatsApp link is configured to: `+27 68 534 0763`
- This will work immediately on mobile devices
- Users will be able to send appointment requests via WhatsApp

### 3. Instagram Embed
The first Instagram post is embedded. To add more:
- Edit `/src/app/components/contact.tsx`
- Replace placeholder cards with actual Instagram post URLs

### 4. Custom Domain Setup
Once deployed:
1. Point your domain's DNS A record to your hosting IP
2. Or use CNAME if using Netlify/Vercel/Cloudflare
3. Configure SSL certificate (usually automatic)

---

## File Structure for Upload

If manually uploading via FTP, upload these files from `dist` folder:

```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other bundled assets]
├── .htaccess (create manually for Apache servers)
└── favicon.ico (if you have one)
```

---

## Post-Deployment Checklist

✅ Website loads at dentxquarters.co.za
✅ All sections display correctly (Hero, Services, Team, Testimonials, Contact)
✅ Booking system works (WhatsApp integration)
✅ Mobile responsive design works
✅ Instagram feed displays
✅ Phone numbers are clickable
✅ Email links work
✅ Navigation menu works
✅ SSL certificate is active (https://)

---

## Troubleshooting

### Issue: Blank page after deployment
- Check browser console for errors
- Verify all asset paths are relative, not absolute
- Check that index.html is in the root directory

### Issue: 404 errors on page refresh
- Add .htaccess file (for Apache)
- Or configure nginx rewrite rules
- Or use platform-specific redirects (Netlify: `_redirects` file)

### Issue: CSS not loading
- Clear browser cache
- Check asset paths in index.html
- Verify build completed successfully

---

## Support Contacts

**Website:** dentxquarters.co.za
**Phone:** +27 68 534 0763
**Email:** 
- admin@dentxquarters.co.za
- info@dentxquarters.co.za

**Address:**
Shop F1A, City Centre Shopping Centre
5 Andrew Street, Nelspruit Extension 7, 1200

---

## Additional Notes

- **Build Time:** ~30-60 seconds
- **Dist Size:** ~500KB-2MB (estimated)
- **Hosting Requirements:** Any static hosting (no server-side rendering needed)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Optimization:** Fully responsive design

---

## Quick Deploy Commands Summary

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Test locally (optional)
npx vite preview

# 4. Upload 'dist' folder contents to your web server
```

---

**Deployment Date:** February 18, 2026
**Built with:** React 18 + Vite 6 + Tailwind CSS v4 + TypeScript
