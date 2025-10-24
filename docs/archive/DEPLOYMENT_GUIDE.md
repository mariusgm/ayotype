# AyoType Deployment Guide

This guide covers the complete process of deploying the AyoType monorepo from scratch.

## Prerequisites

- [x] Archive old GitHub repos: `ayotype` and `ayotype-43`
- [x] Create new GitHub repo: `mariusgm/ayotype`
- [x] Vercel account with access to `ayotype.com` domain
- [x] API keys for Gemini and Groq

## Step 1: GitHub Repository Setup

### 1.1 Archive Old Repositories (Manual)

1. Go to https://github.com/mariusgm/ayotype/settings
2. Scroll to "Danger Zone"
3. Click "Archive this repository"
4. Repeat for https://github.com/mariusgm/ayotype-43/settings

### 1.2 Create New Repository

**Option A: Via GitHub Web UI**
1. Go to https://github.com/new
2. Repository name: `ayotype`
3. Description: `AyoType - Creative digital tools platform (monorepo)`
4. Visibility: Public or Private (your choice)
5. **DO NOT** initialize with README (we'll push existing code)
6. Click "Create repository"

**Option B: Via Git CLI** (if you have gh CLI installed)
```bash
cd /c/git_marius/ayotype
gh repo create mariusgm/ayotype --public --source=. --remote=origin --push
```

## Step 2: Push Code to New Repository

```bash
cd /c/git_marius/ayotype

# Add remote
git remote add origin git@github.com:mariusgm/ayotype.git

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AyoType monorepo

Consolidated structure:
- apps/landing: ayotype.com landing page + blog
- apps/emojifusion: emojifusion.ayotype.com app
- Unified Vite build configuration
- Multi-domain Vercel deployment

🤖 Generated with Claude Code"

# Push to GitHub
git push -u origin main
```

## Step 3: Vercel Project Setup

### 3.1 Delete Old `ayotype-landing` Project

1. Go to https://vercel.com/dashboard
2. Find `ayotype-landing` project
3. Settings → Delete Project

### 3.2 Link Existing `emojifusion` Project to New Repo

**Option A: Via Vercel CLI** (Recommended)
```bash
cd /c/git_marius/ayotype

# Link to Vercel project
vercel link

# When prompted:
# - Scope: Select your account
# - Link to existing project? Yes
# - Project name: emojifusion
# - Which directory? ./ (root)

# Rename project to 'ayotype'
# (Do this via Vercel dashboard: Settings → General → Project Name)
```

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select `emojifusion` project
3. Settings → Git → Disconnect Git Repository
4. Connect Git Repository → Select `mariusgm/ayotype`
5. Settings → General → Project Name → Change to `ayotype`

### 3.3 Configure Build Settings

In Vercel Project Settings:

**Build & Development Settings:**
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `./` (leave empty for root)

**Environment Variables:**
Add these in Settings → Environment Variables:
```
GROQ_API_KEY=your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
SENDGRID_API_KEY=your_sendgrid_key_here
CONTACT_EMAIL=your_contact_email@example.com
```

## Step 4: Domain Configuration

### 4.1 Configure Domains in Vercel

Go to Project Settings → Domains:

1. **Add `ayotype.com`** (if not already added)
   - Click "Add Domain"
   - Enter: `ayotype.com`
   - Click "Add"

2. **Add `emojifusion.ayotype.com`**
   - Click "Add Domain"
   - Enter: `emojifusion.ayotype.com`
   - Click "Add"

3. **Add `www.ayotype.com`** (optional)
   - Redirect to `ayotype.com`

### 4.2 DNS Configuration

Ensure your DNS has these records:

```
# Root domain
A     ayotype.com              → 76.76.21.21 (Vercel)
AAAA  ayotype.com              → 2606:4700:10::ac43:1515 (Vercel)

# Subdomain
CNAME emojifusion.ayotype.com  → cname.vercel-dns.com

# WWW redirect (optional)
CNAME www.ayotype.com          → cname.vercel-dns.com
```

## Step 5: Deploy

```bash
cd /c/git_marius/ayotype

# Deploy to production
vercel --prod

# Verify deployment
curl -I https://ayotype.com
curl -I https://emojifusion.ayotype.com
```

## Step 6: Verification Checklist

- [ ] ayotype.com loads landing page
- [ ] ayotype.com/contact loads contact form
- [ ] ayotype.com/blog/combo-of-the-day/ loads blog
- [ ] emojifusion.ayotype.com loads EmojiFusion app
- [ ] emojifusion.ayotype.com/api/generate works
- [ ] Contact form submissions work
- [ ] All console errors resolved
- [ ] Mobile responsiveness verified
- [ ] SEO meta tags present

## Step 7: Monitor Deployment

```bash
# Check deployment logs
vercel logs --follow

# Inspect specific deployment
vercel inspect <deployment-url>

# List all deployments
vercel ls
```

## Troubleshooting

### Issue: 404 on subdomain
**Solution**: Check DNS CNAME record, wait for propagation (up to 24h)

### Issue: Build fails
**Solution**:
```bash
# Test build locally
cd /c/git_marius/ayotype
npm run build

# Check build logs
vercel logs <deployment-id>
```

### Issue: API calls failing
**Solution**: Verify environment variables are set in Vercel dashboard

### Issue: Cached old content
**Solution**:
- Clear browser cache
- Wait for Vercel CDN cache to expire (~60s)
- Force redeploy: `vercel --prod --force`

## Rollback Plan

If issues arise:

1. **Revert domains** to old `ayotype-landing` and `emojifusion` projects
2. **Keep** `mariusgm/emojifusion` repo active
3. **Debug** new setup in preview deployments
4. **Re-attempt** after fixes

## Post-Deployment

1. **Archive old repo**: `mariusgm/emojifusion` (after successful verification)
2. **Update links**: Any external references to old URLs
3. **Monitor**: Check Vercel analytics for errors
4. **Celebrate**: You've successfully consolidated! 🎉
