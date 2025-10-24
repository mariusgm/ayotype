# EmojiFusion Project Knowledge

## ⚠️ MANDATORY: Browser Testing Before Deployment

**CRITICAL RULE: ALWAYS test changes in a real browser before deploying to production!**

Before ANY deployment or commit, you MUST:
1. Start dev servers: `npm run dev:api` and `npm run dev:ui`
2. Open browser to: `http://127.0.0.1:3000/apps/emojifusion/index.html` (or relevant page)
3. Test ALL affected features manually
4. Check browser console for errors (F12 → Console tab)
5. Verify forms submit correctly
6. Test user interactions (clicks, inputs, navigation)
7. Fix ALL issues before proceeding

**Why this matters:**
- API tests don't catch frontend issues
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

### Testing Generation

1. **Direct API test**: `curl -X POST http://127.0.0.1:3001/api/generate -H "Content-Type: application/json" -d '{"words": "test", "mode": "both", "tone": "cute", "lines": 1}'`

2. **Proxied API test** (through Vite): `curl -X POST http://127.0.0.1:3000/api/generate -H "Content-Type: application/json" -d '{"words": "test", "mode": "both", "tone": "cute", "lines": 1}'`

3. **Use the test script**: `bash test_generation.sh`

### Architecture Notes

- **Frontend** (Vite): Runs on port 3000
- **API Server**: Runs on port 3001
- **Proxy**: Vite proxies `/api/*` requests to port 3001 (configured in `vite.config.ts`)
- **Local Development**: Uses real Groq API via `real-api-server.cjs` *(UPDATED 2025-10-20)*
- **Mock Development**: `npm run dev:api:mock` for testing without API calls
- **Production**: Uses the edge function in `api/generate.ts`

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

5. **Bug Fixes**
   - Fixed JSON parsing error in contact form (404 → proper endpoint)
   - Fixed API JSON parsing (removed problematic stop sequences)
   - Added proper error handling and logging

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

**2. Email Service Considerations**
- SendGrid: Hit quota limits (100 emails/day on free tier)
- Resend: Better free tier (3,000/month) but requires domain verification
- DNS propagation can take 5-15 minutes

**3. Deployment Process Improvements**
- Always check Vercel logs after deployment
- Use proper error handling (don't silently swallow errors)
- Return actual errors to user for debugging

### 🚀 Production URLs

- Landing: https://ayotype.com
- EmojiFusion: https://emojifusion.ayotype.com
- Contact Form: https://ayotype.com/contact
- API Generate: https://emojifusion.ayotype.com/api/generate
- API Contact: https://ayotype.com/api/contact

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