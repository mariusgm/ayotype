# Pre-Commit Testing Checklist

**MANDATORY: Claude must complete ALL steps before proposing any git commit**

## Testing Requirements

### 1. Browser UI Testing
- [ ] Open http://127.0.0.1:3000 in browser
- [ ] Test all UI interactions and features
- [ ] Verify responsive design works
- [ ] Test all buttons, inputs, and controls
- [ ] Verify visual appearance matches expectations

### 2. Console Log Verification
- [ ] Open browser DevTools Console (F12)
- [ ] Clear console logs
- [ ] Interact with the application
- [ ] Check for ANY errors (red messages)
- [ ] Check for ANY warnings (yellow messages)
- [ ] Verify API calls succeed (check Network tab)

### 3. API Server Verification
- [ ] Check API server logs for errors
- [ ] Verify API responses are correct
- [ ] Test all API endpoints being used

### 4. Issue Resolution
- [ ] Document all issues found
- [ ] Fix ALL issues before committing
- [ ] Re-test after fixes to confirm resolution

## Commit Only When:
✅ All UI features work correctly
✅ Zero console errors
✅ Zero console warnings (or warnings are documented/expected)
✅ API server runs without errors
✅ All issues have been fixed and re-tested

## Notes
- Never skip testing steps
- Always report findings to user before committing
- If issues found, fix them first, then re-test completely
