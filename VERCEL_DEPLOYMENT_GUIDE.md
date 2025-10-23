# Vercel Deployment Guide for AyoType.com

**Date:** 2025-10-20
**Project:** EmojiFusion / AyoType.com
**Domains:** ayotype.com, emojifusion.ayotype.com

---

## Current Deployment Issue

**Problem:** Vercel is deploying to wrong URL (emojifusion-henna.vercel.app)
**Expected:** Deploy to ayotype.com and emojifusion.ayotype.com
**Solution:** Follow steps below to configure Vercel correctly

---

## Step 1: Vercel Project Setup

### Option A: Using Vercel Dashboard (Recommended)

1. **Login to Vercel**
   - Go to https://vercel.com/dashboard
   - Login with your account

2. **Find Your Project**
   - Look for project named "emojifusion" or "emojifusion-ayotype"
   - If it says "emojifusion-henna", this is the OLD deployment we need to update

3. **Go to Project Settings**
   - Click on the project
   - Click "Settings" tab

4. **Update Project Name** (if needed)
   - Settings → General → Project Name
   - Change to: `ayotype` or `emojifusion-ayotype`
   - Click "Save"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Follow prompts:
# - Set up and deploy? No (we'll do this manually)
# - Which scope? [Your account]
# - Link to existing project? Yes (if exists) or No (if new)
# - Project name: emojifusion-ayotype
```

---

## Step 2: Configure Custom Domains

### In Vercel Dashboard:

1. **Go to Domains Settings**
   - Project → Settings → Domains

2. **Add Primary Domain**
   - Click "Add"
   - Enter: `ayotype.com`
   - Click "Add"
   - Vercel will show DNS configuration

3. **Add Subdomain**
   - Click "Add" again
   - Enter: `emojifusion.ayotype.com`
   - Click "Add"

4. **Configure DNS at Your Domain Registrar**

   For `ayotype.com` (A records):
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   For `www.ayotype.com` (CNAME):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   For `emojifusion.ayotype.com` (CNAME):
   ```
   Type: CNAME
   Name: emojifusion
   Value: cname.vercel-dns.com
   ```

5. **Wait for DNS Propagation**
   - Usually takes 5-60 minutes
   - Check status in Vercel dashboard

---

## Step 3: Configure Environment Variables

1. **Go to Environment Variables**
   - Project → Settings → Environment Variables

2. **Add Required Variables**

   ```
   GROQ_API_KEY=gsk_... (your key)
   ```

   **For SendGrid (if using):**
   ```
   SENDGRID_API_KEY=SG....
   SENDGRID_FROM_EMAIL=noreply@ayotype.com
   ```

   **For Resend (if using):**
   ```
   RESEND_API_KEY=re_...
   ```

   **For reCAPTCHA:**
   ```
   RECAPTCHA_PROJECT_ID=your-project-id
   RECAPTCHA_SITE_KEY=your-site-key
   RECAPTCHA_API_KEY=your-api-key
   ```

3. **Set Environment Scope**
   - Check: Production, Preview, Development (as needed)

---

## Step 4: Configure Build Settings

### In Vercel Dashboard:

1. **Go to Build & Development Settings**
   - Project → Settings → Build & Development Settings

2. **Framework Preset**
   - Select: `Vite`
   - Or: `Other` if Vite is not available

3. **Build Command**
   ```
   npm run build
   ```

4. **Output Directory**
   ```
   dist
   ```

5. **Install Command**
   ```
   npm install
   ```

6. **Root Directory**
   - Leave as `.` (root)

7. **Save Changes**

---

## Step 5: Deploy

### Method 1: Auto-Deploy from Git

1. **Connect GitHub Repository**
   - Project → Settings → Git
   - Connect to: `mariusgm/emojifusion`
   - Production Branch: `main`

2. **Enable Auto-Deploy**
   - Every push to `main` will trigger deployment

3. **Push Code**
   ```bash
   git add .
   git commit -m "Update Vercel configuration for ayotype.com deployment"
   git push origin main
   ```

4. **Monitor Deployment**
   - Go to Vercel dashboard → Deployments
   - Watch build progress
   - Click deployment to see logs

### Method 2: Manual Deploy via CLI

```bash
# From project root
vercel --prod

# Or for preview
vercel
```

---

## Step 6: Verify Deployment

1. **Check Deployment URL**
   - Vercel dashboard → Deployments → Latest
   - Click "Visit" to see live site

2. **Test All Domains**
   ```bash
   # Test main domain
   curl -I https://ayotype.com

   # Test subdomain
   curl -I https://emojifusion.ayotype.com

   # Should return 200 OK
   ```

3. **Test Pages**
   - https://ayotype.com → Main landing page
   - https://ayotype.com/contact → Contact form
   - https://ayotype.com/app → EmojiFusion app
   - https://emojifusion.ayotype.com → EmojiFusion subdomain

4. **Test API**
   ```bash
   curl -X POST https://ayotype.com/api/generate \
     -H "Content-Type: application/json" \
     -d '{"words":"test","mode":"emoji","tone":"fun"}'
   ```

---

## Troubleshooting

### Issue: Deployment Still Goes to emojifusion-henna.vercel.app

**Solution:**
1. Delete the old project in Vercel dashboard
2. Create a new project with correct name
3. Link to GitHub repository
4. Configure domains as above

### Issue: 404 on Custom Domain

**Solution:**
1. Check DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Use `dig ayotype.com` to check DNS resolution
4. Verify domain is added in Vercel dashboard

### Issue: API Routes Not Working

**Solution:**
1. Check `vercel.json` has correct routes
2. Verify environment variables are set
3. Check API logs in Vercel dashboard
4. Ensure CORS headers are configured

### Issue: Build Failing

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Test build locally: `npm run build`
4. Check Node version compatibility

---

## Current vercel.json Configuration

The updated `vercel.json` includes:

✅ **Build Configuration** - Framework, build command, output directory
✅ **API Routes** - Proper routing for /api/generate
✅ **Page Routes** - Contact, combo archive, embed widget
✅ **Rewrites** - SPA routing for Vite
✅ **Headers** - Security headers + CORS for API

---

## Domain Architecture

```
ayotype.com (Main)
├── / → Landing page (public/index.html)
├── /contact → Contact form (contact.html)
├── /app → EmojiFusion app (app.html)
├── /combo-archive → Combo archive (public/combo-archive.html)
├── /embed → Widget embed (public/embed-widget.html)
└── /api/generate → API endpoint (api/generate.ts)

emojifusion.ayotype.com (Subdomain)
└── / → EmojiFusion app (redirects or serves app.html)
```

---

## Deployment Checklist

Before deploying:

- [ ] Git repository is up to date
- [ ] All environment variables are set in Vercel
- [ ] Build runs successfully locally (`npm run build`)
- [ ] vercel.json is configured correctly
- [ ] Custom domains are added in Vercel dashboard
- [ ] DNS records are configured at domain registrar
- [ ] API endpoints are tested
- [ ] All pages are accessible

After deploying:

- [ ] Main domain (ayotype.com) loads correctly
- [ ] Subdomain (emojifusion.ayotype.com) loads correctly
- [ ] Contact form submits successfully
- [ ] API endpoint responds correctly
- [ ] No console errors in browser
- [ ] SSL certificate is active (HTTPS)
- [ ] All links work correctly

---

## Quick Commands

```bash
# Check current deployment
vercel ls

# View deployment logs
vercel logs

# Pull environment variables
vercel env pull

# Deploy to production
vercel --prod

# Check domain status
vercel domains ls

# Add domain
vercel domains add ayotype.com

# Inspect deployment
vercel inspect [deployment-url]
```

---

## Support Links

- **Vercel Documentation:** https://vercel.com/docs
- **Custom Domains Guide:** https://vercel.com/docs/custom-domains
- **Vercel CLI Reference:** https://vercel.com/docs/cli
- **Vercel Support:** https://vercel.com/support

---

## Notes

- **Old deployment URL:** emojifusion-henna.vercel.app (should be removed/redirected)
- **New primary domain:** ayotype.com
- **New subdomain:** emojifusion.ayotype.com
- **Production branch:** main
- **Auto-deploy:** Enabled on push to main

After completing this setup, every push to the `main` branch will automatically deploy to both ayotype.com and emojifusion.ayotype.com.
