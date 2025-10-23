#!/bin/bash

# 🧪 Manual Testing Guide for EmojiFusion
# =======================================
# Quick reference for manual browser testing requirements

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🧪 MANUAL TESTING GUIDE - EmojiFusion        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📋 QUICK CHECKLIST FOR EVERY COMMIT:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}1. 🌐 BROWSER SETUP${NC}"
echo -e "   ${YELLOW}•${NC} Open http://127.0.0.1:3000 in browser"
echo -e "   ${YELLOW}•${NC} Open Developer Tools (F12 or Cmd+Opt+I)"
echo -e "   ${YELLOW}•${NC} Navigate to Console tab"
echo -e "   ${YELLOW}•${NC} Clear any existing console messages"
echo ""

echo -e "${GREEN}2. 🧪 LOCALHOST FUNCTIONALITY TEST${NC}"
echo -e "   ${YELLOW}•${NC} Enter test words: ${CYAN}'coffee morning'${NC}"
echo -e "   ${YELLOW}•${NC} Test Mode selection: emoji → ascii → both"
echo -e "   ${YELLOW}•${NC} Test Tone options: cute → cool → chaotic → minimal → nostalgic → aesthetic"
echo -e "   ${YELLOW}•${NC} Test Lines: 1 line → 2 lines"
echo -e "   ${YELLOW}•${NC} Click ${CYAN}'Generate Combos'${NC} button"
echo -e "   ${YELLOW}•${NC} Verify results appear correctly"
echo -e "   ${YELLOW}•${NC} Check Network tab: /api/generate returns 200 status"
echo ""

echo -e "${GREEN}3. 🚀 PRODUCTION BUILD TEST${NC}"
echo -e "   ${YELLOW}•${NC} Run: ${CYAN}npm run build${NC}"
echo -e "   ${YELLOW}•${NC} Verify build completes without errors"
echo -e "   ${YELLOW}•${NC} Check build size is reasonable"
echo -e "   ${YELLOW}•${NC} Test production build: ${CYAN}npx serve dist${NC}"
echo -e "   ${YELLOW}•${NC} Open served URL and repeat functionality tests"
echo -e "   ${YELLOW}•${NC} Verify API calls work in production build"
echo ""

echo -e "${GREEN}4. 🔍 CONSOLE LOG VERIFICATION (Both Dev & Prod)${NC}"
echo -e "   ${RED}⚠️  CRITICAL: Check for red error messages${NC}"
echo -e "   ${YELLOW}⚠️  WARNING: Check for yellow warning messages${NC}"
echo -e "   ${YELLOW}•${NC} Verify no network failures in Network tab"
echo -e "   ${YELLOW}•${NC} Confirm API calls complete successfully"
echo -e "   ${YELLOW}•${NC} No JavaScript errors during interactions"
echo -e "   ${YELLOW}•${NC} Test in BOTH localhost AND production build"
echo ""

echo -e "${GREEN}5. ☁️  PRODUCTION API VERIFICATION${NC}"
echo -e "   ${YELLOW}•${NC} Run automated production API test:"
echo -e "   ${CYAN}     python .claude/hooks/production-api-test.py${NC}"
echo -e "   ${YELLOW}•${NC} Verify all test scenarios pass"
echo -e "   ${YELLOW}•${NC} Check environment variables are configured"
echo -e "   ${YELLOW}•${NC} If deployed, test live production URLs"
echo ""

echo -e "${GREEN}6. 🎨 UI/UX VERIFICATION${NC}"
echo -e "   ${YELLOW}•${NC} Test copy functionality on generated combos"
echo -e "   ${YELLOW}•${NC} Resize browser window (test responsiveness)"
echo -e "   ${YELLOW}•${NC} Test keyboard navigation (Tab through elements)"
echo -e "   ${YELLOW}•${NC} Check for visual regressions or layout issues"
echo -e "   ${YELLOW}•${NC} Verify animations and transitions work smoothly"
echo ""

echo -e "${GREEN}7. 📱 MOBILE TESTING${NC}"
echo -e "   ${YELLOW}•${NC} Switch to mobile view (DevTools device toolbar)"
echo -e "   ${YELLOW}•${NC} Test touch interactions"
echo -e "   ${YELLOW}•${NC} Check mobile layout and readability"
echo -e "   ${YELLOW}•${NC} Verify all buttons/controls are accessible"
echo ""

echo -e "${RED}🚨 CRITICAL FAILURE INDICATORS:${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
echo -e "${RED}❌ Any red error messages in console (dev OR production)${NC}"
echo -e "${RED}❌ Failed network requests (red in Network tab)${NC}"
echo -e "${RED}❌ Generate button doesn't work${NC}"
echo -e "${RED}❌ No combos appear after generation${NC}"
echo -e "${RED}❌ Copy functionality broken${NC}"
echo -e "${RED}❌ Layout broken on mobile${NC}"
echo -e "${RED}❌ Unresponsive or frozen interface${NC}"
echo -e "${RED}❌ Production build fails (npm run build)${NC}"
echo -e "${RED}❌ API endpoints fail in production${NC}"
echo -e "${RED}❌ Production API test script fails${NC}"
echo ""

echo -e "${YELLOW}⚠️  WARNING INDICATORS:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  Yellow warning messages in console${NC}"
echo -e "${YELLOW}⚠️  Slow API responses (>3 seconds)${NC}"
echo -e "${YELLOW}⚠️  Visual inconsistencies or misalignments${NC}"
echo -e "${YELLOW}⚠️  Animations stuttering or broken${NC}"
echo -e "${YELLOW}⚠️  Accessibility issues (can't navigate with keyboard)${NC}"
echo ""

echo -e "${GREEN}✅ SUCCESS INDICATORS:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Clean console (no red errors, minimal warnings)${NC}"
echo -e "${GREEN}✓ All API calls succeed quickly${NC}"
echo -e "${GREEN}✓ Generate button produces results consistently${NC}"
echo -e "${GREEN}✓ Copy functionality works on all combos${NC}"
echo -e "${GREEN}✓ UI responds smoothly on desktop and mobile${NC}"
echo -e "${GREEN}✓ All controls accessible via keyboard${NC}"
echo -e "${GREEN}✓ No visual regressions from previous version${NC}"
echo ""

echo -e "${CYAN}🔧 TESTING SCENARIOS TO TRY:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${MAGENTA}Scenario A: Basic Generation${NC}"
echo -e "   Input: ${CYAN}'coffee'${NC}, Mode: ${CYAN}emoji${NC}, Tone: ${CYAN}cute${NC}, Lines: ${CYAN}1${NC}"
echo -e "   Expected: 6 cute emoji combos, single line each"
echo ""

echo -e "${MAGENTA}Scenario B: Multi-line ASCII${NC}"
echo -e "   Input: ${CYAN}'space cat'${NC}, Mode: ${CYAN}ascii${NC}, Tone: ${CYAN}cool${NC}, Lines: ${CYAN}2${NC}"
echo -e "   Expected: 6 ASCII art combos, two lines each"
echo ""

echo -e "${MAGENTA}Scenario C: Mixed Mode${NC}"
echo -e "   Input: ${CYAN}'neon cyberpunk'${NC}, Mode: ${CYAN}both${NC}, Tone: ${CYAN}chaotic${NC}, Lines: ${CYAN}1${NC}"
echo -e "   Expected: Mix of emoji and ASCII, chaotic style"
echo ""

echo -e "${MAGENTA}Scenario D: Edge Cases${NC}"
echo -e "   • Empty input (should show error or placeholder)"
echo -e "   • Very long input (should truncate gracefully)"
echo -e "   • Special characters: ${CYAN}'café münchën'${NC}"
echo -e "   • Numbers and symbols: ${CYAN}'2024 $money$'${NC}"
echo ""

echo -e "${BLUE}⏱️  ESTIMATED TESTING TIME: 3-5 minutes${NC}"
echo ""
echo -e "${CYAN}💡 PRO TIPS:${NC}"
echo -e "   • Keep DevTools open during all testing"
echo -e "   • Test immediately after making ANY code changes"
echo -e "   • If you see ANY console errors, investigate before committing"
echo -e "   • Mobile testing is just as important as desktop"
echo -e "   • When in doubt, test more scenarios"
echo ""

echo -e "${GREEN}📞 QUICK COMMANDS:${NC}"
echo -e "   Run full verification: ${CYAN}./.claude/hooks/comprehensive-pre-commit.sh${NC}"
echo -e "   Show this guide: ${CYAN}./.claude/hooks/manual-testing-guide.sh${NC}"
echo -e "   Start dev server: ${CYAN}npm run dev${NC}"
echo -e "   Test production build: ${CYAN}npm run build && npx serve dist${NC}"
echo -e "   Test production APIs: ${CYAN}python .claude/hooks/production-api-test.py${NC}"
echo ""

echo -e "${YELLOW}Remember: Your users depend on this working flawlessly! 🚀${NC}"