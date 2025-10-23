# EmojiFusion Incident Response Playbook

## Quick Diagnostic Commands

```bash
# 1. Health Check
npm run doctor

# 2. Session Init (comprehensive check)
npm run init

# 3. API Test
npm run test:api

# 4. Browser Test  
npm run test:browser

# 5. MCP Status
claude mcp list
```

## Common Issues & Fixes

### 🚨 Issue: Generation Failing on localhost

**Symptoms:**
- API calls work (`npm run test:api` succeeds)
- Browser shows no results or errors

**Root Cause Check:**
```bash
# Check if components use correct API endpoint
grep -r "127.0.0.1:3001" src/
# Should return NO results - all should use "/api/generate"
```

**Fix:**
```bash
# Update any files that call http://127.0.0.1:3001/api/generate
# Change to: /api/generate (to use Vite proxy)
```

**Files to Check:**
- `src/MobileApp-v2.tsx`
- `src/MobileApp.tsx` 
- `src/App.tsx`

### 🚨 Issue: Browser Automation Not Working

**Symptoms:**
- Playwright tests hanging or failing
- "No MCP servers configured" message

**Root Cause Check:**
```bash
claude mcp list
# Should show: playwright-mcp: npx @modelcontextprotocol/server-playwright
```

**Fix:**
```bash
# Install Playwright MCP
claude mcp add playwright-mcp npx @modelcontextprotocol/server-playwright

# Install browser drivers
npx playwright install chromium

# Verify
claude mcp list
```

### 🚨 Issue: Ports in Use

**Symptoms:**
- "Port already in use" errors
- Dev servers won't start

**Fix:**
```bash
npm run clean
# Then restart servers
npm run dev
```

### 🚨 Issue: TypeScript Errors

**Symptoms:**
- Build warnings
- IDE showing red errors

**Check:**
```bash
npm run typecheck
```

**Note:** TypeScript errors don't prevent builds but should be addressed.

## Incident Response Workflow

### Phase 1: Immediate Assessment
1. `npm run doctor` - Get system health
2. `npm run test:api` - Test backend
3. `npm run test:browser` - Test frontend manually

### Phase 2: Root Cause Analysis
1. Check server processes: `ps aux | grep -E "vite|node.*local-api"`
2. Check ports: `lsof -i :3000,3001`
3. Check MCP: `claude mcp list`
4. Review recent changes: `git log --oneline -10`

### Phase 3: Fix Application
1. Apply appropriate fix from common issues above
2. Restart services: `npm run clean && npm run dev`
3. Re-test: `npm run test:api && npm run test:browser`

### Phase 4: Prevent Recurrence
1. Update documentation if new issue found
2. Add checks to `session-init.sh` if preventable
3. Update this playbook

## Prevention Checklist

- [ ] Always use `/api/generate` in frontend code (never direct port URLs)
- [ ] Run `npm run init` at start of sessions
- [ ] Test in actual browser, not just API calls
- [ ] Keep MCP servers configured
- [ ] Use `npm run doctor` for quick health checks

## Emergency Reset

If everything is broken:

```bash
# 1. Clean slate
npm run clean
pkill -f "vite|local-api-server" || true

# 2. Reset MCP
claude mcp remove playwright-mcp 2>/dev/null || true
claude mcp add playwright-mcp npx @modelcontextprotocol/server-playwright

# 3. Fresh start
npm install
npm run dev

# 4. Verify
npm run doctor
npm run test:api
```

## Contact & Escalation

For issues not covered here:
1. Check `CLAUDE.md` for detailed development info
2. Review session history for similar issues
3. Create new incident response entry in this file

---

*Last Updated: 2025-10-20*
*Created after session incidents involving API endpoint configuration and MCP setup*