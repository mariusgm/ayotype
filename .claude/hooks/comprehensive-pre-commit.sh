#!/bin/bash

# 🚀 COMPREHENSIVE PRE-COMMIT VERIFICATION SYSTEM
# =============================================
# This hook ensures all security, testing, and quality checks pass before commits
# Integrates with Claude Agent Runtime for browser/console diagnostics

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Global counters
TOTAL_ISSUES=0
SECURITY_ISSUES=0
API_ISSUES=0
BROWSER_ISSUES=0
CONSOLE_ERRORS=0

# Project root
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🚀 COMPREHENSIVE PRE-COMMIT VERIFICATION 🚀      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to run tests and track results
run_test() {
    local test_name="$1"
    local command="$2"
    local critical="$3"  # true/false
    local category="$4"  # security/api/browser/console
    
    echo ""
    echo -e "${BLUE}🔍 Running: ${test_name}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        
        case "$category" in
            "security")
                SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
                ;;
            "api")
                API_ISSUES=$((API_ISSUES + 1))
                ;;
            "browser")
                BROWSER_ISSUES=$((BROWSER_ISSUES + 1))
                ;;
            "console")
                CONSOLE_ERRORS=$((CONSOLE_ERRORS + 1))
                ;;
        esac
        
        if [ "$critical" = "true" ]; then
            echo -e "${RED}🚨 CRITICAL FAILURE - Cannot proceed with commit${NC}"
            exit 1
        fi
        return 1
    fi
}

# ═══════════════════════════════════════════
# 1. SECURITY VERIFICATION
# ═══════════════════════════════════════════
echo -e "${MAGENTA}┌─────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  🔐 SECURITY VERIFICATION   │${NC}"
echo -e "${MAGENTA}└─────────────────────────────┘${NC}"

# Check for exposed secrets
run_test "Secret Detection" "
    echo 'Checking for exposed secrets and API keys...'
    
    # Common patterns for secrets
    SECRET_PATTERNS=(
        'api[_-]?key.*=.*[\"'\''][a-zA-Z0-9]{20,}'
        'secret.*=.*[\"'\''][a-zA-Z0-9]{20,}'
        'password.*=.*[\"'\''][^\"'\'']{8,}'
        'token.*=.*[\"'\''][a-zA-Z0-9]{20,}'
        'GROQ_API_KEY.*=.*[^$]'
        'OPENROUTER_API_KEY.*=.*[^$]'
        'UPSTASH_REDIS_REST_TOKEN.*=.*[^$]'
        'SENDGRID_API_KEY.*=.*[^$]'
        'RESEND_API_KEY.*=.*[^$]'
        'RECAPTCHA_SECRET_KEY.*=.*[^$]'
    )
    
    SECRETS_FOUND=0
    for pattern in \"\${SECRET_PATTERNS[@]}\"; do
        if git diff --cached --name-only | xargs -I {} grep -E \"\$pattern\" {} 2>/dev/null | grep -v '.env.example' | grep -v 'process.env'; then
            echo \"❌ Potential secret exposed (pattern: \$pattern)\"
            SECRETS_FOUND=1
        fi
    done
    
    if [ \$SECRETS_FOUND -eq 0 ]; then
        echo '✓ No secrets detected in staged files'
        return 0
    else
        echo '❌ Secrets detected! Move them to environment variables'
        return 1
    fi
" true "security"

# Check environment configuration
run_test "Environment Variable Security" "
    echo 'Verifying environment variable usage...'
    
    # Ensure .env files are not committed
    if git diff --cached --name-only | grep -E '^\\.env$|^\\.env\\.local$|^\\.env\\.production$'; then
        echo '❌ Attempting to commit .env file!'
        return 1
    fi
    
    # Check that sensitive operations use environment variables
    if [ -f 'api/generate.ts' ]; then
        if grep -q 'process\\.env\\.' api/generate.ts; then
            echo '✓ API uses environment variables correctly'
        else
            echo '⚠️  API should use environment variables for configuration'
        fi
    fi
    
    # Verify .env.example exists and is up to date
    if [ -f '.env.example' ]; then
        echo '✓ .env.example file exists for reference'
        return 0
    else
        echo '⚠️  Create .env.example with required variables (without values)'
        return 1
    fi
" false "security"

# CORS and security headers check
run_test "Security Headers Validation" "
    echo 'Checking security headers configuration...'
    
    HEADERS_OK=1
    
    # Check Vercel security headers
    if [ -f 'vercel.json' ]; then
        REQUIRED_HEADERS=(
            'X-Content-Type-Options'
            'Referrer-Policy'
            'Permissions-Policy'
        )
        
        for header in \"\${REQUIRED_HEADERS[@]}\"; do
            if grep -q \"\$header\" vercel.json; then
                echo \"✓ \$header configured\"
            else
                echo \"❌ Missing security header: \$header\"
                HEADERS_OK=0
            fi
        done
    fi
    
    # Check API CORS configuration
    if [ -f 'api/generate.ts' ]; then
        if grep -q 'Access-Control-Allow-Origin' api/generate.ts; then
            echo '✓ CORS headers configured in API'
        else
            echo '⚠️  API missing CORS configuration'
            HEADERS_OK=0
        fi
    fi
    
    [ \$HEADERS_OK -eq 1 ]
" false "security"

# Input validation and sanitization
run_test "Input Validation Security" "
    echo 'Checking input validation and sanitization...'
    
    # Check for SQL injection prevention (if using SQL)
    if git diff --cached --name-only | xargs -I {} grep -l 'SELECT\\|INSERT\\|UPDATE\\|DELETE' {} 2>/dev/null; then
        echo 'ℹ️  SQL queries detected - ensure using parameterized queries'
    fi
    
    # Check for XSS prevention in React
    if git diff --cached --name-only | grep -E '\\.(tsx?|jsx?)$' | xargs -I {} grep -l 'dangerouslySetInnerHTML' {} 2>/dev/null; then
        echo '⚠️  dangerouslySetInnerHTML usage detected - ensure content is sanitized'
    fi
    
    # Check reCAPTCHA implementation
    if [ -f 'src/components/ContactForm.tsx' ]; then
        if grep -q 'grecaptcha\\.enterprise\\.execute' src/components/ContactForm.tsx; then
            echo '✓ reCAPTCHA Enterprise properly implemented'
        else
            echo '⚠️  Ensure reCAPTCHA is properly integrated'
        fi
    fi
    
    return 0
" false "security"

# ═══════════════════════════════════════════
# 2. API ENDPOINT VERIFICATION
# ═══════════════════════════════════════════
echo ""
echo -e "${MAGENTA}┌─────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  🔧 API ENDPOINT TESTING    │${NC}"
echo -e "${MAGENTA}└─────────────────────────────┘${NC}"

# TypeScript compilation check
run_test "API TypeScript Compilation" "
    echo 'Compiling API endpoints...'
    
    API_FILES=(
        'api/generate.ts'
        'contact-api-server.cjs'
        'combo-api-server.cjs'
    )
    
    COMPILATION_OK=1
    for api_file in \"\${API_FILES[@]}\"; do
        if [ -f \"\$api_file\" ]; then
            if [[ \"\$api_file\" == *.ts ]]; then
                if npx tsc --noEmit \"\$api_file\" 2>/dev/null; then
                    echo \"✓ \$api_file compiles successfully\"
                else
                    echo \"❌ \$api_file has TypeScript errors\"
                    COMPILATION_OK=0
                fi
            else
                echo \"✓ \$api_file exists (JavaScript)\"
            fi
        fi
    done
    
    [ \$COMPILATION_OK -eq 1 ]
" true "api"

# API error handling verification
run_test "API Error Handling" "
    echo 'Verifying comprehensive error handling...'
    
    ERROR_HANDLING_OK=1
    
    if [ -f 'api/generate.ts' ]; then
        # Check for try-catch blocks
        if ! grep -q 'try.*{' api/generate.ts; then
            echo '❌ Missing try-catch error handling'
            ERROR_HANDLING_OK=0
        fi
        
        # Check for proper error responses
        if ! grep -q 'Response.*json.*error' api/generate.ts; then
            echo '❌ Missing JSON error responses'
            ERROR_HANDLING_OK=0
        fi
        
        # Check for rate limiting
        if grep -q 'rate.*limit\\|rateLimit' api/generate.ts; then
            echo '✓ Rate limiting implemented'
        else
            echo '⚠️  Consider implementing rate limiting'
        fi
    fi
    
    [ \$ERROR_HANDLING_OK -eq 1 ]
" false "api"

# API response validation
run_test "API Response Structure" "
    echo 'Checking API response structure consistency...'
    
    if [ -f 'api/generate.ts' ]; then
        # Check for consistent response format
        if grep -q 'Response\\.json({' api/generate.ts; then
            echo '✓ API returns JSON responses'
            
            # Check for standard response fields
            if grep -q 'success\\|error\\|data' api/generate.ts; then
                echo '✓ Standardized response structure'
                return 0
            else
                echo '⚠️  Consider using standardized response format'
                return 1
            fi
        else
            echo '❌ API response format unclear'
            return 1
        fi
    fi
" false "api"

# ═══════════════════════════════════════════
# 3. BROWSER & UI TESTING
# ═══════════════════════════════════════════
echo ""
echo -e "${MAGENTA}┌─────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  🌐 BROWSER & UI TESTING    │${NC}"
echo -e "${MAGENTA}└─────────────────────────────┘${NC}"

# Check if development server is running
DEV_SERVER_RUNNING=false
if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    DEV_SERVER_RUNNING=true
    echo -e "${GREEN}✓ Development server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Development server not running - starting it now...${NC}"
    
    # Start dev server in background
    npm run dev > /tmp/emojifusion-dev.log 2>&1 &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
            DEV_SERVER_RUNNING=true
            echo -e "${GREEN}✓ Development server started${NC}"
            break
        fi
        sleep 1
    done
    
    if [ "$DEV_SERVER_RUNNING" = false ]; then
        echo -e "${RED}❌ Failed to start development server${NC}"
        [ -n "$DEV_SERVER_PID" ] && kill $DEV_SERVER_PID 2>/dev/null
    fi
fi

if [ "$DEV_SERVER_RUNNING" = true ]; then
    # Run Claude Agent Runtime for browser testing
    run_test "Browser Console Diagnostics" "
        echo 'Running browser console diagnostics with Claude Agent Runtime...'
        
        # Check if Claude Agent Runtime is available
        if [ -d 'claude-agent-runtime' ] && [ -f 'claude-agent-runtime/examples/diagnose_rendering.py' ]; then
            cd claude-agent-runtime
            
            # Create a temporary diagnostic script
            cat > /tmp/browser_diagnostics.py << 'EOF'
import asyncio
from playwright.async_api import async_playwright
import json
import sys

async def check_browser_health():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        console_errors = []
        network_errors = []
        
        # Capture console errors
        page.on('console', lambda msg: console_errors.append({
            'type': msg.type,
            'text': msg.text
        }) if msg.type in ['error', 'warning'] else None)
        
        # Capture network errors
        page.on('requestfailed', lambda request: network_errors.append({
            'url': request.url,
            'failure': request.failure
        }))
        
        try:
            # Navigate to the app
            response = await page.goto('http://127.0.0.1:3000', wait_until='networkidle')
            
            if response.status != 200:
                print(f'❌ Page returned status {response.status}')
                return False
            
            # Wait for app to load
            await page.wait_for_timeout(3000)
            
            # Check for React errors
            react_error = await page.query_selector('.error-boundary, #error-root')
            if react_error:
                print('❌ React error boundary triggered')
                return False
            
            # Check if main app element exists
            app_element = await page.query_selector('#root, .App, [data-app-root]')
            if not app_element:
                print('❌ Main app element not found')
                return False
            
            # Report findings
            if console_errors:
                print(f'⚠️  Found {len(console_errors)} console errors/warnings:')
                for error in console_errors[:5]:  # Show first 5
                    print(f'   - {error[\"type\"]}: {error[\"text\"][:100]}')
            
            if network_errors:
                print(f'⚠️  Found {len(network_errors)} network errors')
            
            # Take a screenshot for reference
            await page.screenshot(path='screenshots/pre-commit-check.png')
            
            await browser.close()
            
            # Return success if no critical errors
            return len([e for e in console_errors if e['type'] == 'error']) == 0
            
        except Exception as e:
            print(f'❌ Browser test failed: {str(e)}')
            await browser.close()
            return False

if __name__ == '__main__':
    success = asyncio.run(check_browser_health())
    sys.exit(0 if success else 1)
EOF
            
            # Run the diagnostic script
            if python /tmp/browser_diagnostics.py; then
                echo '✓ Browser console checks passed'
                cd ..
                return 0
            else
                echo '❌ Browser console has errors'
                cd ..
                return 1
            fi
        else
            echo 'ℹ️  Claude Agent Runtime not configured - skipping advanced diagnostics'
            
            # Fallback to basic curl test
            if curl -s http://127.0.0.1:3000 | grep -q 'root\\|React\\|app'; then
                echo '✓ Basic page load successful'
                return 0
            else
                echo '❌ Page load failed'
                return 1
            fi
        fi
    " false "browser"
    
    # UI Component Testing
    run_test "UI Component Verification" "
        echo 'Checking critical UI components...'
        
        # Test main features
        FEATURES_TO_TEST=(
            '/api/generate:Emoji generation API'
            '/:Main application page'
        )
        
        ALL_GOOD=1
        for feature in \"\${FEATURES_TO_TEST[@]}\"; do
            URL=\$(echo \$feature | cut -d: -f1)
            DESC=\$(echo \$feature | cut -d: -f2)
            
            if [[ \"\$URL\" == /api/* ]]; then
                # API endpoint test
                RESPONSE=\$(curl -s -X POST http://127.0.0.1:3000\$URL \\
                    -H 'Content-Type: application/json' \\
                    -d '{\"words\":\"test\",\"mode\":\"emoji\",\"tone\":\"fun\"}' \\
                    -w '\\n%{http_code}' 2>/dev/null | tail -1)
                
                if [[ \"\$RESPONSE\" == \"200\" ]] || [[ \"\$RESPONSE\" == \"400\" ]]; then
                    echo \"✓ \$DESC responding correctly\"
                else
                    echo \"❌ \$DESC returned status \$RESPONSE\"
                    ALL_GOOD=0
                fi
            else
                # Page test
                if curl -s http://127.0.0.1:3000\$URL | grep -qE 'root|React|app'; then
                    echo \"✓ \$DESC loads successfully\"
                else
                    echo \"❌ \$DESC failed to load\"
                    ALL_GOOD=0
                fi
            fi
        done
        
        [ \$ALL_GOOD -eq 1 ]
    " false "browser"
fi

# ═══════════════════════════════════════════
# 4. BUILD & LINT VERIFICATION
# ═══════════════════════════════════════════
echo ""
echo -e "${MAGENTA}┌─────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  🏗️  BUILD & LINT CHECK     │${NC}"
echo -e "${MAGENTA}└─────────────────────────────┘${NC}"

# TypeScript type checking
run_test "TypeScript Type Check" "
    echo 'Running TypeScript type checking...'
    
    if [ -f 'tsconfig.json' ]; then
        if npm run typecheck 2>/dev/null || npx tsc --noEmit; then
            echo '✓ TypeScript types are valid'
            return 0
        else
            echo '❌ TypeScript type errors found'
            return 1
        fi
    else
        echo 'ℹ️  No TypeScript configuration found'
        return 0
    fi
" true "build"

# ESLint check
run_test "ESLint Code Quality" "
    echo 'Running ESLint checks...'
    
    if [ -f '.eslintrc' ] || [ -f '.eslintrc.js' ] || [ -f '.eslintrc.json' ] || [ -f 'package.json' ]; then
        if npm run lint 2>/dev/null || npx eslint . --ext .js,.jsx,.ts,.tsx; then
            echo '✓ Code passes linting rules'
            return 0
        else
            echo '❌ Linting errors found'
            return 1
        fi
    else
        echo 'ℹ️  No ESLint configuration found'
        return 0
    fi
" false "build"

# Production build test
run_test "Production Build" "
    echo 'Testing production build...'
    
    if npm run build 2>&1 | tee /tmp/build-output.log; then
        echo '✓ Production build successful'
        
        # Check build size
        if [ -d 'dist' ]; then
            BUILD_SIZE=\$(du -sh dist | cut -f1)
            echo \"ℹ️  Build size: \$BUILD_SIZE\"
        fi
        
        return 0
    else
        echo '❌ Production build failed'
        cat /tmp/build-output.log | tail -20
        return 1
    fi
" true "build"

# ═══════════════════════════════════════════
# 5. DATABASE & REDIS VERIFICATION
# ═══════════════════════════════════════════
echo ""
echo -e "${MAGENTA}┌─────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  💾 DATABASE VERIFICATION   │${NC}"
echo -e "${MAGENTA}└─────────────────────────────┘${NC}"

run_test "Redis Configuration" "
    echo 'Checking Redis/Upstash configuration...'
    
    # Check if Redis is used in the code
    if grep -r 'upstash\\|redis' --include='*.ts' --include='*.js' . 2>/dev/null | grep -v node_modules | grep -q .; then
        echo '✓ Redis integration found'
        
        # Check for proper Redis error handling
        if grep -r 'redis.*catch\\|upstash.*catch' --include='*.ts' --include='*.js' . 2>/dev/null | grep -v node_modules | grep -q .; then
            echo '✓ Redis error handling implemented'
            return 0
        else
            echo '⚠️  Ensure Redis operations have error handling'
            return 1
        fi
    else
        echo 'ℹ️  No Redis usage detected'
        return 0
    fi
" false "api"

# ═══════════════════════════════════════════
# MANUAL BROWSER VERIFICATION REQUIREMENT
# ═══════════════════════════════════════════
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🖥️  MANDATORY MANUAL VERIFICATION 🖥️         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  AUTOMATED TESTS COMPLETE - MANUAL VERIFICATION REQUIRED${NC}"
echo ""
echo -e "${MAGENTA}📋 REQUIRED MANUAL TESTING CHECKLIST:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if dev server is running for manual testing
if [ "$DEV_SERVER_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Development server is running at http://127.0.0.1:3000${NC}"
else
    echo -e "${RED}❌ Development server not running${NC}"
    echo -e "${YELLOW}   → Please start with: npm run dev${NC}"
    echo -e "${YELLOW}   → Then re-run this verification${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}🌐 DEVELOPMENT TESTING (LOCALHOST):${NC}"
echo -e "${YELLOW}   1. Open http://127.0.0.1:3000 in your browser${NC}"
echo -e "${YELLOW}   2. Open Developer Tools (F12 or Cmd+Opt+I)${NC}"
echo -e "${YELLOW}   3. Navigate to the Console tab${NC}"
echo -e "${YELLOW}   4. Clear any existing console messages${NC}"
echo ""

echo -e "${CYAN}🧪 LOCALHOST FUNCTIONALITY TESTING:${NC}"
echo -e "${YELLOW}   5. Test emoji generation:${NC}"
echo -e "${YELLOW}      • Enter words: 'coffee morning'${NC}"
echo -e "${YELLOW}      • Select mode: emoji, ascii, both${NC}"
echo -e "${YELLOW}      • Try different tones: cute, cool, chaotic${NC}"
echo -e "${YELLOW}      • Test 1 line and 2 line options${NC}"
echo -e "${YELLOW}      • Click 'Generate Combos'${NC}"
echo -e "${YELLOW}      • Verify results appear correctly${NC}"
echo -e "${YELLOW}   6. Check API endpoints in Network tab:${NC}"
echo -e "${YELLOW}      • Verify /api/generate returns 200 status${NC}"
echo -e "${YELLOW}      • Check response time < 3 seconds${NC}"
echo -e "${YELLOW}      • Confirm JSON response structure${NC}"
echo ""

echo -e "${CYAN}🔍 LOCALHOST CONSOLE VERIFICATION:${NC}"
echo -e "${YELLOW}   7. Check console for errors (red messages)${NC}"
echo -e "${YELLOW}   8. Check console for warnings (yellow messages)${NC}"
echo -e "${YELLOW}   9. Verify no network failures in Network tab${NC}"
echo -e "${YELLOW}  10. Test API calls complete successfully${NC}"
echo -e "${YELLOW}  11. Verify no JavaScript errors during interactions${NC}"
echo ""

echo -e "${CYAN}🚀 PRODUCTION READINESS VERIFICATION:${NC}"
echo -e "${YELLOW}  12. Build production version: ${BLUE}npm run build${NC}"
echo -e "${YELLOW}  13. Check build completes without errors${NC}"
echo -e "${YELLOW}  14. Verify build size is reasonable${NC}"
echo -e "${YELLOW}  15. Test production build locally:${NC}"
echo -e "${YELLOW}      • ${BLUE}npx serve dist${NC} (or similar local server)${NC}"
echo -e "${YELLOW}      • Open the served URL${NC}"
echo -e "${YELLOW}      • Test same functionality as above${NC}"
echo -e "${YELLOW}      • Verify API calls work in production build${NC}"
echo ""

echo -e "${CYAN}☁️  PRODUCTION API VALIDATION:${NC}"
echo -e "${YELLOW}  16. Run automated production API tests:${NC}"
echo -e "${YELLOW}      • ${BLUE}python .claude/hooks/production-api-test.py${NC}"
echo -e "${YELLOW}      • Verify all test scenarios pass${NC}"
echo -e "${YELLOW}      • Check environment variables are configured${NC}"
echo -e "${YELLOW}  17. If you have a staging/production environment:${NC}"
echo -e "${YELLOW}      • Test the deployed version manually${NC}"
echo -e "${YELLOW}      • Verify API endpoints respond correctly${NC}"
echo -e "${YELLOW}      • Confirm rate limiting works${NC}"
echo -e "${YELLOW}      • Test with real LLM providers (Groq/OpenRouter)${NC}"
echo ""

echo -e "${CYAN}🎨 UI/UX VERIFICATION (Both Dev & Production):${NC}"
echo -e "${YELLOW}  17. Test copy functionality on generated combos${NC}"
echo -e "${YELLOW}  18. Verify mobile responsiveness (resize browser)${NC}"
echo -e "${YELLOW}  19. Test accessibility (keyboard navigation)${NC}"
echo -e "${YELLOW}  20. Check for visual regressions or layout issues${NC}"
echo -e "${YELLOW}  21. Verify animations and transitions work smoothly${NC}"
echo ""

echo -e "${CYAN}📱 MOBILE TESTING:${NC}"
echo -e "${YELLOW}  22. Test on mobile device or mobile view${NC}"
echo -e "${YELLOW}  23. Verify touch interactions work correctly${NC}"
echo -e "${YELLOW}  24. Check mobile layout and readability${NC}"
echo ""

echo -e "${RED}🚨 CRITICAL VERIFICATION POINTS:${NC}"
echo -e "${RED}   • NO RED ERRORS in console (dev AND production)${NC}"
echo -e "${RED}   • NO FAILED NETWORK REQUESTS${NC}"
echo -e "${RED}   • ALL CORE FUNCTIONALITY WORKS${NC}"
echo -e "${RED}   • NO VISUAL REGRESSIONS${NC}"
echo -e "${RED}   • RESPONSIVE DESIGN INTACT${NC}"
echo -e "${RED}   • PRODUCTION BUILD SUCCEEDS${NC}"
echo -e "${RED}   • API ENDPOINTS WORK IN PRODUCTION${NC}"
echo ""

# Wait for user confirmation
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 AUTOMATED VERIFICATION SUMMARY:${NC}"
echo -e "🔐 Security Issues:      ${SECURITY_ISSUES}"
echo -e "🔧 API Issues:          ${API_ISSUES}"
echo -e "🌐 Browser Issues:      ${BROWSER_ISSUES}"
echo -e "📝 Console Errors:      ${CONSOLE_ERRORS}"
echo -e "📊 Total Issues:        ${TOTAL_ISSUES}"
echo ""

if [ $TOTAL_ISSUES -gt 0 ]; then
    echo -e "${RED}❌ AUTOMATED TESTS FAILED - FIX ISSUES BEFORE MANUAL TESTING${NC}"
    echo ""
    echo -e "${YELLOW}📋 REQUIRED ACTIONS:${NC}"
    [ $SECURITY_ISSUES -gt 0 ] && echo -e "${YELLOW}   • Fix security vulnerabilities${NC}"
    [ $API_ISSUES -gt 0 ] && echo -e "${YELLOW}   • Resolve API endpoint issues${NC}"
    [ $BROWSER_ISSUES -gt 0 ] && echo -e "${YELLOW}   • Fix browser/UI problems${NC}"
    [ $CONSOLE_ERRORS -gt 0 ] && echo -e "${YELLOW}   • Clear console errors${NC}"
    echo ""
    
    # Cleanup
    if [ -n "$DEV_SERVER_PID" ] && [ "$DEV_SERVER_RUNNING" = true ]; then
        echo "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null
    fi
    
    exit 1
fi

echo -e "${GREEN}✅ AUTOMATED TESTS PASSED${NC}"
echo ""
echo -e "${YELLOW}⏳ WAITING FOR MANUAL VERIFICATION...${NC}"
echo ""
echo -e "${BLUE}Please complete the manual testing checklist above, then choose an option:${NC}"
echo ""

while true; do
    echo -e "${CYAN}Choose your verification status:${NC}"
    echo -e "${GREEN}  ✅ [p] PASSED - All manual tests completed successfully${NC}"
    echo -e "${RED}  ❌ [f] FAILED - Issues found during manual testing${NC}"
    echo -e "${YELLOW}  ⏸️  [s] SKIP - Skip manual verification (NOT RECOMMENDED)${NC}"
    echo -e "${BLUE}  📋 [h] HELP - Show testing checklist again${NC}"
    echo ""
    read -p "Enter your choice [p/f/s/h]: " choice
    
    case $choice in
        [Pp]* )
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║   🎉 VERIFICATION COMPLETE - SAFE TO COMMIT! 🎉     ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${GREEN}✅ Automated tests: PASSED${NC}"
            echo -e "${GREEN}✅ Manual verification: CONFIRMED${NC}"
            echo -e "${GREEN}✅ Browser testing: COMPLETED${NC}"
            echo -e "${GREEN}✅ Console logs: VERIFIED${NC}"
            echo ""
            echo -e "${CYAN}🚀 Your commit is ready for deployment!${NC}"
            
            # Cleanup
            if [ -n "$DEV_SERVER_PID" ] && [ "$DEV_SERVER_RUNNING" = true ]; then
                echo "Stopping development server..."
                kill $DEV_SERVER_PID 2>/dev/null
            fi
            
            exit 0
            ;;
        [Ff]* )
            echo ""
            echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
            echo -e "${RED}║   ❌ MANUAL VERIFICATION FAILED - FIX ISSUES ❌     ║${NC}"
            echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${RED}❌ Manual testing revealed issues${NC}"
            echo ""
            echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
            echo -e "${YELLOW}   1. Fix the issues you found during manual testing${NC}"
            echo -e "${YELLOW}   2. Re-run the verification: ${BLUE}./.claude/hooks/comprehensive-pre-commit.sh${NC}"
            echo -e "${YELLOW}   3. Complete manual testing again${NC}"
            echo -e "${YELLOW}   4. Only commit when all issues are resolved${NC}"
            echo ""
            
            # Cleanup
            if [ -n "$DEV_SERVER_PID" ] && [ "$DEV_SERVER_RUNNING" = true ]; then
                echo "Stopping development server..."
                kill $DEV_SERVER_PID 2>/dev/null
            fi
            
            exit 1
            ;;
        [Ss]* )
            echo ""
            echo -e "${YELLOW}╔══════════════════════════════════════════════════════╗${NC}"
            echo -e "${YELLOW}║   ⚠️  MANUAL VERIFICATION SKIPPED - RISKY! ⚠️       ║${NC}"
            echo -e "${YELLOW}╚══════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${YELLOW}⚠️  You chose to skip manual verification${NC}"
            echo -e "${YELLOW}⚠️  This increases the risk of deployment issues${NC}"
            echo ""
            echo -e "${RED}🚨 POTENTIAL RISKS:${NC}"
            echo -e "${RED}   • Undetected runtime errors${NC}"
            echo -e "${RED}   • Console errors in production${NC}"
            echo -e "${RED}   • UI/UX regressions${NC}"
            echo -e "${RED}   • Mobile compatibility issues${NC}"
            echo -e "${RED}   • Performance degradation${NC}"
            echo ""
            echo -e "${YELLOW}📋 STRONGLY RECOMMENDED:${NC}"
            echo -e "${YELLOW}   • Test manually before deployment${NC}"
            echo -e "${YELLOW}   • Monitor production closely${NC}"
            echo -e "${YELLOW}   • Be prepared for hotfixes${NC}"
            echo ""
            
            read -p "Are you sure you want to skip? [y/N]: " confirm
            case $confirm in
                [Yy]* )
                    echo -e "${YELLOW}✅ Proceeding with automated verification only${NC}"
                    
                    # Cleanup
                    if [ -n "$DEV_SERVER_PID" ] && [ "$DEV_SERVER_RUNNING" = true ]; then
                        echo "Stopping development server..."
                        kill $DEV_SERVER_PID 2>/dev/null
                    fi
                    
                    exit 0
                    ;;
                * )
                    echo -e "${CYAN}👍 Good choice! Please complete manual testing.${NC}"
                    echo ""
                    continue
                    ;;
            esac
            ;;
        [Hh]* )
            echo ""
            echo -e "${CYAN}📋 MANUAL TESTING CHECKLIST:${NC}"
            echo ""
            echo -e "${YELLOW}🌐 Browser Setup:${NC}"
            echo -e "   • Open http://127.0.0.1:3000"
            echo -e "   • Open Developer Tools (F12)"
            echo -e "   • Go to Console tab"
            echo -e "   • Clear existing messages"
            echo ""
            echo -e "${YELLOW}🧪 Test Core Functionality:${NC}"
            echo -e "   • Enter test words and generate combos"
            echo -e "   • Try different modes (emoji, ascii, both)"
            echo -e "   • Test all tone options"
            echo -e "   • Test 1-line and 2-line options"
            echo -e "   • Verify copy functionality works"
            echo ""
            echo -e "${YELLOW}🔍 Console Verification:${NC}"
            echo -e "   • No red error messages"
            echo -e "   • No yellow warning messages"
            echo -e "   • No failed network requests"
            echo -e "   • API calls complete successfully"
            echo ""
            echo -e "${YELLOW}🎨 UI/UX Testing:${NC}"
            echo -e "   • Test mobile responsiveness"
            echo -e "   • Check for visual regressions"
            echo -e "   • Verify animations work"
            echo -e "   • Test keyboard navigation"
            echo ""
            continue
            ;;
        * )
            echo -e "${RED}Invalid choice. Please enter p, f, s, or h.${NC}"
            echo ""
            continue
            ;;
    esac
done