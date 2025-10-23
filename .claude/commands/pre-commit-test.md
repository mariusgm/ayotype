---
description: Run mandatory pre-commit UI testing and verification
---

# Pre-Commit Testing Protocol

You MUST complete the following steps before proposing ANY git commit:

## Step 1: Browser UI Testing
1. Verify http://127.0.0.1:3000 is accessible
2. Test ALL user interactions:
   - Input fields
   - Buttons and controls
   - Dropdown menus
   - Mode switches
   - Tone selections
   - Generated output display
3. Check responsive design
4. Verify visual appearance

## Step 2: Console Log Check
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear all logs
4. Interact with ALL features
5. Document ANY errors (red)
6. Document ANY warnings (yellow)
7. Check Network tab for failed requests

## Step 3: API Server Check
1. Check terminal logs for API server
2. Verify no error messages
3. Confirm API responses are working

## Step 4: Fix All Issues
- Fix EVERY error found
- Fix EVERY warning found
- Re-test after each fix
- Document what was fixed

## Step 5: Final Verification
- All features work ✅
- Zero console errors ✅
- API calls succeed ✅
- No regressions ✅

**Only after ALL steps pass, proceed with git commit.**

Report your findings to the user before committing.
