#!/bin/bash

# 🚀 EmojiFusion Session Initialization Script
# Validates environment and prepares development session

echo "🚀 Initializing EmojiFusion development session..."
echo "═══════════════════════════════════════════════════════"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Helper functions
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        VALIDATION_PASSED=false
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Check Node.js and npm versions
echo ""
echo "🔍 Checking Node.js environment..."
node --version > /dev/null 2>&1
NODE_STATUS=$?
print_status "Node.js installed" $NODE_STATUS

if [ $NODE_STATUS -eq 0 ]; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -ge 18 ]; then
        print_status "Node.js version >= 18" 0
    else
        print_status "Node.js version >= 18 (found v$NODE_VERSION)" 1
        print_warning "Consider upgrading to Node.js 18+"
    fi
fi

npm --version > /dev/null 2>&1
NPM_STATUS=$?
print_status "npm installed" $NPM_STATUS

# 2. Check if in correct directory
echo ""
echo "🔍 Validating project structure..."
if [ -f "package.json" ] && [ -f "vite.config.ts" ] && [ -d "api" ]; then
    print_status "EmojiFusion project structure" 0
else
    print_status "EmojiFusion project structure" 1
    echo "Expected files/directories not found"
    exit 1
fi

# 3. Check environment variables
echo ""
echo "🔍 Checking environment configuration..."

if [ -f ".env" ]; then
    print_status ".env file exists" 0
    
    # Check for required variables
    if grep -q "GROQ_API_KEY=" .env && ! grep -q "GROQ_API_KEY=your_groq_api_key_here" .env; then
        print_status "GROQ_API_KEY configured" 0
    else
        print_status "GROQ_API_KEY configured" 1
        print_warning "GROQ_API_KEY not set - API will fail in production"
    fi
    
    # Check optional variables
    if grep -q "UPSTASH_REDIS_REST_URL=" .env; then
        print_info "Redis caching configured"
    else
        print_info "Redis caching not configured (optional)"
    fi
else
    print_status ".env file exists" 1
    print_info "Creating .env from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env created from example" 0
        print_warning "Please edit .env with your API keys"
    else
        print_status ".env.example exists" 1
    fi
fi

# 4. Check port availability
echo ""
echo "🔍 Checking port availability..."

lsof -i :3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Port 3000 available" 1
    print_warning "Port 3000 in use - run 'npm run clean' to free ports"
else
    print_status "Port 3000 available" 0
fi

lsof -i :3001 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Port 3001 available" 1
    print_warning "Port 3001 in use - run 'npm run clean' to free ports"
else
    print_status "Port 3001 available" 0
fi

# 5. Check dependencies
echo ""
echo "🔍 Checking dependencies..."

if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
    print_status "Node.js dependencies installed" 0
else
    print_status "Node.js dependencies installed" 1
    print_info "Running npm install..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "npm install completed" 0
    else
        print_status "npm install completed" 1
    fi
fi

# 6. Check Python environment (for diagnostics)
echo ""
echo "🔍 Checking Python environment (for AI diagnostics)..."

python3 --version > /dev/null 2>&1
PYTHON_STATUS=$?
print_status "Python 3 available" $PYTHON_STATUS

if [ $PYTHON_STATUS -eq 0 ]; then
    # Try importing required packages
    python3 -c "import aiohttp, yaml" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Python diagnostic packages available" 0
    else
        print_status "Python diagnostic packages available" 1
        print_warning "aiohttp/yaml not available - AI diagnostics may not work"
        print_info "This is expected on macOS due to environment restrictions"
    fi
fi

# 7. TypeScript compilation check
echo ""
echo "🔍 Checking TypeScript configuration..."

npx tsc --noEmit > /dev/null 2>&1
TS_STATUS=$?
print_status "TypeScript compilation passes" $TS_STATUS

if [ $TS_STATUS -ne 0 ]; then
    print_warning "TypeScript errors found - check with 'npx tsc --noEmit'"
fi

# 8. Test build process
echo ""
echo "🔍 Testing build process..."

npm run build > /dev/null 2>&1
BUILD_STATUS=$?
print_status "Production build succeeds" $BUILD_STATUS

# 9. Check Claude Code MCP configuration (ADDED 2025-10-20)
echo ""
echo "🔍 Checking Claude Code MCP configuration..."

claude mcp list > /dev/null 2>&1
if [ $? -eq 0 ]; then
    MCP_OUTPUT=$(claude mcp list)
    if echo "$MCP_OUTPUT" | grep -q "playwright-mcp"; then
        print_status "Playwright MCP configured" 0
    else
        print_status "Playwright MCP configured" 1
        print_warning "Browser automation unavailable - install with:"
        print_info "claude mcp add playwright-mcp npx @modelcontextprotocol/server-playwright"
    fi
    
    if echo "$MCP_OUTPUT" | grep -q "No MCP servers configured"; then
        print_status "MCP servers configured" 1
        print_warning "No MCP servers - browser testing will not work"
    else
        print_status "MCP servers configured" 0
    fi
else
    print_status "Claude Code MCP available" 1
    print_warning "claude mcp command not working"
fi

# 10. Check git status
echo ""
echo "🔍 Checking git repository..."

git status > /dev/null 2>&1
GIT_STATUS=$?
print_status "Git repository initialized" $GIT_STATUS

if [ $GIT_STATUS -eq 0 ]; then
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_info "Uncommitted changes detected"
        git status --short
    else
        print_status "Working directory clean" 0
    fi
fi

# 11. Summary
echo ""
echo "📋 Session Initialization Summary"
echo "═══════════════════════════════════════════════════════"

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All critical validations passed!${NC}"
    echo ""
    echo "🚀 Ready to start development:"
    echo "   npm run dev      # Start both UI and API servers"
    echo "   npm run build    # Test production build"
    echo "   npm run clean    # Clean up ports if needed"
    echo ""
    echo "🧪 Testing workflow:"
    echo "   ./.claude/hooks/comprehensive-pre-commit.sh  # Full verification"
    echo "   ./.claude/hooks/production-api-test.py       # API tests"
    echo ""
else
    echo -e "${RED}⚠️  Some validations failed - review above output${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "   npm install                    # Install dependencies"
    echo "   npm run clean                  # Free up ports"
    echo "   cp .env.example .env          # Create environment file"
    echo "   vim .env                      # Add your API keys"
    echo ""
fi

echo "📖 For detailed setup info: cat .claude/DEV_SETUP.md"
echo "🔍 For configuration analysis: cat .claude/CONFIG_ANALYSIS.md"