# AyoType Quick Start Guide

This is your step-by-step checklist to deploy the new AyoType monorepo.

## ✅ Completed Steps

- [x] Restructured repository to monorepo format
- [x] Created unified Vite build configuration
- [x] Updated Vercel deployment configuration
- [x] Created comprehensive documentation
- [x] Local files ready in `/c/git_marius/ayotype`

## 📋 Next Steps (Do These Now)

### Step 1: Archive Old GitHub Repos (5 minutes)

Visit these URLs and archive each repository:

1. **https://github.com/mariusgm/ayotype/settings**
   - Scroll to bottom → "Danger Zone"
   - Click "Archive this repository"
   - Type repository name to confirm

2. **https://github.com/mariusgm/ayotype-43/settings**
   - Scroll to bottom → "Danger Zone"
   - Click "Archive this repository"
   - Type repository name to confirm

### Step 2: Create New GitHub Repo (2 minutes)

1. Go to **https://github.com/new**
2. Fill in:
   - Repository name: `ayotype`
   - Description: `AyoType - Creative digital tools platform (monorepo)`
   - Visibility: **Public** (recommended) or Private
   - **DO NOT** check "Add README", ".gitignore", or "license"
3. Click **"Create repository"**
4. **Leave the page open** - you'll need the commands it shows

### Step 3: Push Code to GitHub (2 minutes)

Open Git Bash or Terminal and run these commands:

```bash
# Navigate to the new ayotype directory
cd /c/git_marius/ayotype

# Add GitHub as remote
git remote add origin git@github.com:mariusgm/ayotype.git
# OR if using HTTPS:
# git remote add origin https://github.com/mariusgm/ayotype.git

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AyoType monorepo

Consolidated structure with:
- apps/landing (ayotype.com)
- apps/emojifusion (emojifusion.ayotype.com)
- Unified Vite + Vercel configuration
- Multi-domain deployment support

🤖 Generated with Claude Code"

# Push to GitHub
git push -u origin main
```

### Step 4: Update Vercel Project (10 minutes)

#### 4.1 Disconnect Old ayotype-landing Project

1. Go to **https://vercel.com/dashboard**
2. Find and click **`ayotype-landing`** project
3. Settings → Danger Zone → **"Delete Project"**
4. Type project name and confirm

#### 4.2 Update emojifusion Project

1. Go to **https://vercel.com/dashboard**
2. Click **`emojifusion`** project
3. **Settings → Git**:
   - Click "Disconnect Git Repository"
   - Click "Connect Git Repository"
   - Select **`mariusgm/ayotype`**
   - Click "Connect"

4. **Settings → General**:
   - Change "Project Name" from `emojifusion` to **`ayotype`**
   - Click "Save"

5. **Settings → Environment Variables**:
   - Verify these exist (add if missing):
     - `GROQ_API_KEY`
     - `GEMINI_API_KEY`
     - `SENDGRID_API_KEY`
     - `CONTACT_EMAIL`

6. **Settings → Domains**:
   - Verify `ayotype.com` is listed
   - Add `emojifusion.ayotype.com` if not present:
     - Click "Add Domain"
     - Enter: `emojifusion.ayotype.com`
     - Click "Add"

### Step 5: Deploy to Production (2 minutes)

In your terminal:

```bash
cd /c/git_marius/ayotype

# Install Vercel CLI if not already installed
npm install -g vercel

# Link to Vercel project (if needed)
vercel link

# Deploy to production
vercel --prod
```

### Step 6: Verify Deployment (5 minutes)

Open these URLs and check they work:

- [ ] **https://ayotype.com** - Landing page loads
- [ ] **https://ayotype.com/contact** - Contact form loads
- [ ] **https://ayotype.com/blog/combo-of-the-day/** - Blog loads
- [ ] **https://emojifusion.ayotype.com** - EmojiFusion app loads
- [ ] **https://emojifusion.ayotype.com → Generate button** - API works

### Step 7: Test in Browser (10 minutes)

1. Open **https://emojifusion.ayotype.com**
2. Enter text: "rainbow cyber unicorn"
3. Click **"Generate"**
4. Verify combos appear
5. Open browser console (F12)
6. Check for **no red errors**

1. Open **https://ayotype.com**
2. Click "Contact" link in footer
3. Verify it goes to `/contact` (NOT `/contact.html`)
4. Verify contact page loads correctly

## 🎉 Success Checklist

- [ ] Old repos archived
- [ ] New `mariusgm/ayotype` repo created
- [ ] Code pushed to GitHub
- [ ] Vercel project updated and renamed
- [ ] Domains configured (ayotype.com + emojifusion.ayotype.com)
- [ ] Deployed to production
- [ ] All URLs verified
- [ ] No console errors
- [ ] Contact link fixed

## 🚨 If Something Goes Wrong

1. **Check deployment logs**: `vercel logs --follow`
2. **Review DEPLOYMENT_GUIDE.md** for detailed troubleshooting
3. **Rollback plan**: Old `emojifusion` repo is still intact

## 📚 Documentation

- **README.md** - General project documentation
- **DEPLOYMENT_GUIDE.md** - Detailed deployment steps
- **RESTRUCTURE_PLAN.md** - Technical restructuring details
- **CONSOLIDATION_SUMMARY.md** - What was changed and why

## ⏱️ Total Time Estimate

- Archive old repos: 5 min
- Create new repo: 2 min
- Push code: 2 min
- Update Vercel: 10 min
- Deploy: 2 min
- Verify: 15 min

**Total: ~35 minutes**

## 🎯 Your Current Location

You are here: **C:\\git_marius\\ayotype**

All files are ready. Just follow the steps above!

---

**Ready to proceed?** Start with Step 1 above!
