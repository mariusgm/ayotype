# AyoType Project Knowledge

## ⚠️ MANDATORY: Browser Testing Before Deployment

**CRITICAL RULE: ALWAYS test changes in a real browser after making changes to functionality using endpoints. Always test all endpoints before deploying to production!**

Before ANY deployment or commit, you MUST:
1. Start dev servers: `npm run dev:api` and `npm run dev:ui`
2. Open browser to: `http://127.0.0.1:3000/apps/emojifusion/index.html` (or relevant page)
3. Test ALL affected features manually
4. Test ALL API endpoints with curl or browser dev tools
5. Check browser console for errors (F12 → Console tab)
6. Verify forms submit correctly
7. Test user interactions (clicks, inputs, navigation)
8. Fix ALL issues before proceeding

**Why this matters:**
- API tests don't catch frontend issues
- Endpoint changes can break functionality silently
- JSON parsing errors only show in browser
- Form submissions need real browser testing
- Console errors indicate broken functionality

**No exceptions - headless testing is NOT sufficient!**

---

## Development Server Commands

### Important: Avoiding Timeouts

When running development servers, use short timeout values or run commands that return immediately:

```bash
# DON'T DO THIS - will timeout after 2 minutes
npm run dev

# DO THIS INSTEAD - use nohup to run in background and return immediately
nohup npm run dev > dev.log 2>&1 &

# Or run individual servers with explicit background (&) 
npm run dev:api > api.log 2>&1 &
npm run dev:ui > ui.log 2>&1 &

# Or use a short timeout (10 seconds)
timeout 10 npm run dev
```

### Server Management

```bash
# Clean ports before starting
npm run clean

# Start servers individually in background
npm run dev:api &
npm run dev:ui &

# Check if servers are running
lsof -i :3000,3001 | grep LISTEN

# Kill all dev processes
pkill -f "vite"
pkill -f "local-api-server"
```

### Testing Endpoints

**1. EmojiFusion Generation API**
- **Direct API test**: `curl -X POST http://127.0.0.1:3001/api/generate -H "Content-Type: application/json" -d '{"words": "test", "mode": "both", "tone": "cute", "lines": 1}'`
- **Proxied API test** (through Vite): `curl -X POST http://127.0.0.1:3000/api/generate -H "Content-Type: application/json" -d '{"words": "test", "mode": "both", "tone": "cute", "lines": 1}'`
- **Production test**: `curl -X POST https://emojifusion.ayotype.com/api/generate -H "Content-Type: application/json" -d '{"words": "test", "mode": "both", "tone": "cute", "lines": 1}'`

**2. Contact Form API**
- **Production test**: `curl -X POST https://ayotype.com/api/contact -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'`

**3. Static Files**
- **ads.txt**: `curl https://ayotype.com/ads.txt`

### Architecture Notes

**Monorepo Structure:**
- `apps/landing/` - Landing page and contact form
- `apps/emojifusion/` - EmojiFusion app
- `api/` - Serverless API functions (generate, contact)
- `shared/ad-manager/` - Modular ad integration system (GDPR compliant)
- `public/` - Static files served at root (ads.txt, robots.txt, etc.)
- `dist/` - Build output directory

**Development:**
- **Frontend** (Vite): Runs on port 3000
- **API Server**: Runs on port 3001
- **Proxy**: Vite proxies `/api/*` requests to port 3001 (configured in `vite.config.ts`)
- **Local Development**: Uses real Groq API via `real-api-server.cjs` *(UPDATED 2025-10-20)*
- **Mock Development**: `npm run dev:api:mock` for testing without API calls

**Production (Vercel):**
- **Output Directory**: `dist/` - Vite builds to this directory
- **Public Files**: Files in `public/` are copied to `dist/` root during build
- **Static File Serving**: Vercel serves files from `dist/` at root URL
- **API Functions**: Serverless functions in `api/` directory
  - `api/generate.ts` - EmojiFusion generation (Gemini 1.5 Pro / Groq Llama 3.3 70B)
  - `api/contact.ts` - Contact form email delivery (Resend)
- **Routing**: `vercel.json` configures domain routing and rewrites
  - Main domain (ayotype.com) → `apps/landing/`
  - Subdomain (emojifusion.ayotype.com) → `apps/emojifusion/`
  - Static files (ads.txt) excluded from catch-all rewrites

**Ad Integration System** (`shared/ad-manager/`):
- **Core**: AdManager orchestrates ad lifecycle, async loading, consent integration
- **Containers**: Pre-built responsive ad components (Sidebar, InFeed, Anchor)
- **Consent**: GDPR/CCPA compliant consent management with cookie banner
- **A/B Testing**: Data-driven optimization framework for ad placements
- **Performance**: Zero CLS impact, lazy loading, Core Web Vitals optimized
- **Accessibility**: WCAG 2.1 AA compliant with skip links and ARIA labels
- See `AD_ARCHITECTURE.md` for full documentation

### Browser Testing (REQUIRED after changes)

**ALWAYS test in browser after making changes to UI/API code:**

```bash
# 1. System health check
npm run doctor

# 2. Quick API test
npm run test:api

# 3. Manual browser test (ALWAYS do this)
npm run test:browser

# 4. Full E2E test (if MCP configured)
npm run test:e2e

# 5. Session initialization (comprehensive check)
npm run init
```

**Manual Test Steps:**
1. Navigate to `http://127.0.0.1:3000/app.html`
2. Enter text in the textarea (e.g., "rainbow cyber unicorn")
3. Click "Generate" button
4. Verify combos appear
5. Check console for errors (should be no red errors)

**Test Selectors:**
- Input field: `textarea.query-input`
- Generate button: `button:has-text("Generate")`
- Results: `.combo`

### Common Issues & Solutions

1. **Ports in use**: Run `npm run clean` to free up ports
2. **TypeScript errors**: Run `npx tsc --noEmit` to check, but build still works
3. **API calls failing**: Ensure both servers are running (ports 3000 and 3001)
4. **Generation not working**: Check that components use `/api/generate` (NOT `http://127.0.0.1:3001/api/generate`)
5. **Browser automation failing**: Ensure MCP servers are configured (see Browser Testing section)
6. **Console errors in app**: Always test in actual browser, not just API calls

---

## 📋 SESSION SUMMARY (2025-10-24)

### ✅ Completed in This Session

1. **Vercel Project Consolidation**
   - Consolidated 3 separate Vercel projects → 1 monorepo
   - Deleted legacy projects: `emojifusion-henna`, `ayotype-landing`
   - Migrated custom domains to monorepo
   - Result: Cleaner deployment, single source of truth

2. **Redis Caching (Upstash)**
   - Added Redis caching for API responses (7-day cache)
   - Implemented rate limiting (10 req/min per IP)
   - Environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - Status: ✅ Working

3. **EmojiFusion Mode Support**
   - Fixed `mode: "both"` to generate mixed emoji + ASCII combos
   - Examples: `"🎉 (^_^) fun"`, `":D 🌟 happy"`
   - Updated Gemini and Groq prompts with mode instructions
   - Status: ✅ Working

4. **Contact Form API**
   - Created `/api/contact.ts` endpoint
   - Added form validation (name, email, message)
   - Integrated Resend API for email delivery (replaced SendGrid)
   - Status: ⏳ Pending domain verification

5. **Google AdSense ads.txt Implementation**
   - Created ads.txt file with publisher ID: pub-9365314553407219
   - Placed in `public/` directory for Vite to copy to dist root
   - Modified `vercel.json` to exclude ads.txt from catch-all rewrites
   - Enabled Vite `publicDir` option to copy static files
   - Status: ✅ Working - accessible at https://ayotype.com/ads.txt

6. **Modular Ad Integration Architecture**
   - Designed comprehensive ad system architecture (see `AD_ARCHITECTURE.md`)
   - Implemented core modules:
     - `AdManager` - Central orchestration with consent integration
     - `AdLoader` - Async script loading (non-blocking, performance-optimized)
     - `AdContainer` - Base React component with lazy loading
     - `SidebarAd`, `InFeedAd`, `AnchorAd` - Pre-built responsive containers
     - `ConsentManager` - GDPR/CCPA compliant consent management
     - `ConsentBanner` - User-friendly consent UI with granular controls
     - `ABTestManager` - A/B testing framework for optimization
     - `VariantAssigner` - Stable user bucketing for tests
   - Features:
     - Zero CLS impact with reserved space for ads
     - Lazy loading with IntersectionObserver (500px margin)
     - WCAG 2.1 AA accessible with skip links and ARIA labels
     - Performance monitoring (CLS, LCP, FID tracking)
     - Test mode for development (shows placeholders)
   - Status: ✅ Complete - ready for integration

7. **Bug Fixes**
   - Fixed JSON parsing error in contact form (404 → proper endpoint)
   - Fixed API JSON parsing (removed problematic stop sequences)
   - Added proper error handling and logging

8. **Google Analytics Integration**
   - Installed Google Analytics (G-RWETGB9C39) across all HTML pages
   - Implemented GDPR-compliant consent integration using Consent Mode v2
   - Analytics defaults to 'denied' until user consent is granted
   - Integrates with existing `ayotype_ad_consent` localStorage key
   - Granular consent controls:
     - `analytics_storage` - Google Analytics tracking
     - `ad_storage` - Ad targeting and measurement
     - `ad_user_data` and `ad_personalization` - Advanced ad features
   - Files updated:
     - `apps/landing/index.html` - Landing page
     - `apps/landing/contact.html` - Contact form page
     - `apps/emojifusion/index.html` - EmojiFusion app
   - Status: ✅ Complete - ready for deployment

### ⏳ Pending Tasks (Start Here Next Session)

**PRIORITY 1: Contact Form Email Delivery**
- Issue: Resend domain verification pending
- DNS records added to Namecheap, waiting for propagation
- Error: `"The ayotype.com domain is not verified"`
- Next steps:
  1. Check Resend dashboard: https://resend.com/domains
  2. Click "Verify" on each DNS record
  3. Test: `curl -X POST https://ayotype.com/api/contact -d '{"name":"Test","email":"test@example.com","message":"Test"}'`
  4. If still failing: Use temporary `onboarding@resend.dev` for testing

**PRIORITY 2: Browser Testing**
- Contact form needs end-to-end browser testing
- Test URL: https://ayotype.com/contact
- Verify form submission UX and error messages

### 🔑 Environment Variables Configured

Production (Vercel):
- ✅ `GOOGLEGEMINI_API_KEY` - Gemini 1.5 Pro (primary LLM)
- ✅ `GROQ_API_KEY` - Llama 3.3 70B (fallback LLM)
- ✅ `UPSTASH_REDIS_REST_URL` - Redis caching
- ✅ `UPSTASH_REDIS_REST_TOKEN` - Redis auth
- ✅ `RESEND_API_KEY` - Email delivery
- ✅ `RECAPTCHA_SECRET_KEY` - Spam protection (optional)
- ⚙️ `CONTACT_EMAIL` - Where emails are sent (defaults to support@ayotype.com)

### 📚 Lessons Learned

**1. Always Test in Browser Before Deployment**
- Added mandatory browser testing section to docs
- Headless API tests don't catch frontend issues
- JSON parsing errors only show in browser console
- Always test all endpoints before deploying to production

**2. Email Service Considerations**
- SendGrid: Hit quota limits (100 emails/day on free tier)
- Resend: Better free tier (3,000/month) but requires domain verification
- DNS propagation can take 5-15 minutes

**3. Deployment Process Improvements**
- Always check Vercel logs after deployment
- Use proper error handling (don't silently swallow errors)
- Return actual errors to user for debugging

**4. Static File Serving on Vercel with Vite**
- Place static files (ads.txt, robots.txt) in `public/` directory at project root
- Enable `publicDir: 'public'` in `vite.config.ts` to copy files to `dist/`
- Vercel serves files from the `outputDirectory` (dist/) at root URL
- Use negative lookahead regex in rewrites to exclude static files: `/((?!ads\\.txt$).*)`
- Static files must be in build output to be served in production

### 🚀 Production URLs

- Landing: https://ayotype.com
- EmojiFusion: https://emojifusion.ayotype.com
- Contact Form: https://ayotype.com/contact
- API Generate: https://emojifusion.ayotype.com/api/generate
- API Contact: https://ayotype.com/api/contact
- ads.txt: https://ayotype.com/ads.txt

---

### Session Issues Resolved (2025-10-20)

**Issue**: Generation failing on localhost
- **Root Cause**: Mobile components calling `http://127.0.0.1:3001/api/generate` instead of `/api/generate`
- **Fix**: Updated `MobileApp-v2.tsx` and `MobileApp.tsx` to use Vite proxy
- **Files Changed**: `src/MobileApp-v2.tsx`, `src/MobileApp.tsx`
- **Prevention**: Always use `/api/generate` in frontend code

**Issue**: Browser automation/testing not working
- **Root Cause**: No MCP servers configured for Playwright
- **Fix**: Installed Playwright MCP server: `claude mcp add playwright-mcp npx @modelcontextprotocol/server-playwright`
- **Prevention**: Session init hook now checks MCP configuration

**Issue**: Repetitive AI-generated combos (always 🌮🚀💜✨)
- **Root Cause**: Using mock API server with hardcoded responses
- **Fix**: Switched to real Groq API via `real-api-server.cjs`
- **Files Changed**: `package.json` (dev:api script), added `real-api-server.cjs`
- **Prevention**: Always use real APIs for testing, keep mock for CI only