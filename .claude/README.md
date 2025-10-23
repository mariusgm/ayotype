# Claude Code Configuration

This directory contains Claude Code configuration for the EmojiFusion project.

## Pre-Commit Testing Workflow

**MANDATORY REQUIREMENT:** Before ANY git commit is created, Claude MUST:

1. **Test the UI** at http://127.0.0.1:3000
2. **Check browser console** for errors and warnings
3. **Verify API logs** for any issues
4. **Fix all issues** found during testing
5. **Re-test** after fixes to confirm everything works

### Quick Access
- Run `/pre-commit-test` to see the full testing checklist
- See `pre-commit-checklist.md` for detailed requirements

## Active Hooks

### UserPromptSubmit Hook
- Triggers when commit-related keywords are mentioned
- Reminds about mandatory testing requirements
- Prevents hasty commits without proper testing

## Files
- `settings.local.json` - Project-specific settings and hooks
- `pre-commit-checklist.md` - Detailed testing checklist
- `commands/pre-commit-test.md` - Slash command for quick reference

## Purpose
These configurations ensure that all code committed to the repository has been:
- Manually tested in the browser
- Verified for console errors/warnings
- Confirmed to work with the API
- Free of regressions and bugs
