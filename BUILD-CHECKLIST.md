# Build & Deploy Checklist

## ✅ Pre-Deployment Checklist

### 1. File Verification
- [ ] All source files are present in `/src` folder
- [ ] `package.json` exists with correct dependencies
- [ ] `index.html` exists in root
- [ ] `vite.config.ts` is configured correctly
- [ ] Brand colors are correct (#9A7B1D and #F5F1E8)

### 2. Content Verification
- [ ] Contact phone number: +27 68 534 0763
- [ ] Email addresses: admin@dentxquarters.co.za, info@dentxquarters.co.za
- [ ] Address: Shop F1A, City Centre Shopping Centre, Nelspruit
- [ ] Instagram: @dentxquarters
- [ ] All 7 patient testimonials are included
- [ ] Team members are correctly listed
- [ ] Services are accurate

### 3. Functionality Testing
- [ ] Navigation menu works on all devices
- [ ] "Book Appointment" button opens booking form
- [ ] Booking form has all steps (Service → Practitioner → Date/Time → Details)
- [ ] WhatsApp integration works on mobile
- [ ] All phone numbers are clickable (tel: links)
- [ ] All email addresses are clickable (mailto: links)
- [ ] Instagram links open in new tab
- [ ] Testimonials scroll horizontally
- [ ] "Read more" functionality works in reviews

### 4. Responsive Design
- [ ] Mobile view (320px - 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (1024px+)
- [ ] Large desktop (1440px+)

---

## 🔨 Build Process

### Step 1: Prepare Environment
```bash
# Navigate to project folder
cd dentx-quarters

# Verify Node.js version (should be 18+)
node --version

# Verify npm is installed
npm --version
```

### Step 2: Install Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
pnpm install
```

### Step 3: Run Development Build (Test First)
```bash
npm run dev
# Opens at http://localhost:5173
```

### Step 4: Build for Production
```bash
npm run build
```

**Expected Output:**
```
✓ built in [time]
dist/index.html                    [size]
dist/assets/index-[hash].css       [size]
dist/assets/index-[hash].js        [size]
```

### Step 5: Preview Production Build
```bash
npm run preview
# Opens at http://localhost:4173
```

---

## 📤 Deployment Options

### Option A: Netlify (Recommended for Beginners)

**Method 1: Drag & Drop**
1. Build the project: `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder into the upload area
4. Wait for deployment
5. Get your URL (e.g., `random-name.netlify.app`)
6. Configure custom domain in Netlify settings

**Method 2: Git Integration**
1. Create a Git repository (GitHub/GitLab)
2. Push your code
3. Connect to Netlify
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy automatically on every push

**Custom Domain Setup:**
1. In Netlify: Domain Settings → Add custom domain
2. Add: `dentxquarters.co.za` and `www.dentxquarters.co.za`
3. Configure DNS at your domain registrar:
   ```
   Type: A Record
   Name: @
   Value: [Netlify IP - provided in dashboard]

   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```
4. SSL certificate auto-generates (takes ~1 hour)

---

### Option B: Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Import repository
4. Vercel auto-detects Vite configuration
5. Deploy
6. Add custom domain in project settings

---

### Option C: Traditional Web Hosting (cPanel/FTP)

**Step 1: Build**
```bash
npm run build
```

**Step 2: Prepare Files**
- Contents of `dist` folder
- `.htaccess` file from `public` folder

**Step 3: Upload via FTP**
1. Connect to your hosting via FTP (FileZilla, etc.)
2. Navigate to `public_html` or `www` folder
3. Upload ALL files from `dist` folder
4. Upload `.htaccess` file to same location
5. Set file permissions (usually 644 for files, 755 for folders)

**Step 4: Configure Domain**
- Ensure domain points to your hosting
- A Record should point to hosting server IP
- Wait for DNS propagation (up to 48 hours)

---

## 🧪 Post-Deployment Testing

### Immediate Tests (After Deploy)
- [ ] Website loads at https://dentxquarters.co.za
- [ ] SSL certificate is active (green padlock)
- [ ] No console errors in browser
- [ ] All images load correctly
- [ ] Navigation works on all pages

### Functional Tests
- [ ] Book Appointment button works
- [ ] Booking form completes all steps
- [ ] WhatsApp link works on mobile
- [ ] Phone numbers are clickable
- [ ] Email links open email client
- [ ] Instagram links work
- [ ] Testimonials scroll properly

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (Mac/iOS)
- [ ] Mobile browsers (Chrome, Safari)

### Performance Tests
- [ ] Run Google PageSpeed Insights
- [ ] Check mobile performance score
- [ ] Check desktop performance score
- [ ] Target: 90+ score

---

## 🔧 Troubleshooting

### Issue: White/Blank Page
**Solution:**
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check `.htaccess` file is present
4. Clear browser cache

### Issue: CSS Not Loading
**Solution:**
1. Check asset paths in `index.html`
2. Verify CSS file exists in `dist/assets/`
3. Check file permissions (644)
4. Clear CDN/browser cache

### Issue: 404 on Page Refresh
**Solution:**
1. Verify `.htaccess` file is uploaded
2. Check mod_rewrite is enabled on server
3. For Nginx, add rewrite rules
4. For Netlify/Vercel, check `_redirects` or `vercel.json`

### Issue: WhatsApp Not Working
**Solution:**
1. Test on actual mobile device (not desktop)
2. Verify phone number format: +27685340763
3. Ensure WhatsApp is installed on device

### Issue: Instagram Embed Not Loading
**Solution:**
1. Check Instagram post is public
2. Verify embed URL is correct
3. Check CORS/CSP headers
4. May need to refresh after 24 hours

---

## 📊 Performance Optimization

### Before Deploy
- [ ] Remove console.log statements
- [ ] Compress images (if any added)
- [ ] Enable gzip compression (.htaccess)
- [ ] Minify code (Vite does this automatically)

### After Deploy
- [ ] Enable CDN if available
- [ ] Configure browser caching
- [ ] Enable HTTP/2
- [ ] Monitor with Google Analytics (if added)

---

## 🔒 Security Checklist

- [ ] HTTPS/SSL certificate active
- [ ] No sensitive data in code
- [ ] No API keys exposed
- [ ] CORS configured properly
- [ ] Security headers configured

---

## 📞 Support Contacts

**Technical Issues:**
- Check DEPLOYMENT-GUIDE.md
- Check README.md

**Business Information:**
- Phone: +27 68 534 0763
- Email: admin@dentxquarters.co.za

---

## 📅 Maintenance Schedule

### Weekly
- Check website is online
- Test booking form
- Monitor uptime

### Monthly
- Check all links still work
- Update testimonials if needed
- Review Google Analytics (if added)

### As Needed
- Update team members
- Update services
- Add new Instagram posts
- Update contact information

---

**Checklist Version:** 1.0
**Last Updated:** February 18, 2026
**Next Review:** Monthly
