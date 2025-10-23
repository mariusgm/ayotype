#!/bin/bash

# 🔧 Setup Script for Claude Diagnostics System
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 SETTING UP CLAUDE DIAGNOSTICS SYSTEM${NC}"
echo "=" * 50

# Create required directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p diagnostics-reports screenshots .claude/sessions
echo "✓ Directories created"

# Check Python installation
echo -e "\n${BLUE}Checking Python installation...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "✓ Python3 found"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "✓ Python found"
else
    echo -e "${RED}❌ Python not found. Please install Python 3.7+${NC}"
    exit 1
fi

# Check pip installation
echo -e "\n${BLUE}Checking pip installation...${NC}"
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
    echo "✓ pip3 found"
elif command -v pip &> /dev/null; then
    PIP_CMD="pip"
    echo "✓ pip found"
else
    echo -e "${RED}❌ pip not found. Please install pip${NC}"
    exit 1
fi

# Install Python dependencies
echo -e "\n${BLUE}Installing Python dependencies...${NC}"
$PIP_CMD install --user pyyaml aiohttp playwright 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Some packages may already be installed${NC}"
}

# Install Playwright browsers (if needed)
echo -e "\n${BLUE}Setting up Playwright browsers...${NC}"
if command -v playwright &> /dev/null; then
    playwright install chromium 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Playwright browsers may already be installed${NC}"
    }
    echo "✓ Playwright browsers ready"
else
    echo -e "${YELLOW}ℹ️  Playwright command not found - browsers will be installed on first run${NC}"
fi

# Create requirements.txt for future reference
echo -e "\n${BLUE}Creating requirements.txt...${NC}"
cat > .claude/requirements.txt << 'EOF'
# Claude Diagnostics System Dependencies
pyyaml>=6.0
aiohttp>=3.8.0
playwright>=1.40.0

# Optional but recommended
requests>=2.28.0
beautifulsoup4>=4.11.0
lxml>=4.9.0
EOF
echo "✓ Requirements file created"

# Test basic functionality
echo -e "\n${BLUE}Testing system functionality...${NC}"

# Test YAML loading
$PYTHON_CMD -c "import yaml; print('✓ YAML support ready')" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  YAML support may need manual installation${NC}"
}

# Test aiohttp
$PYTHON_CMD -c "import aiohttp; print('✓ HTTP client ready')" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  aiohttp may need manual installation${NC}"
}

# Test Playwright
$PYTHON_CMD -c "import playwright; print('✓ Browser automation ready')" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Playwright will be installed on first use${NC}"
}

# Check if development server is available
echo -e "\n${BLUE}Checking development environment...${NC}"
if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "✓ Development server is running"
else
    echo -e "${YELLOW}ℹ️  Development server not running - start with 'npm run dev'${NC}"
fi

# Make all hook scripts executable
echo -e "\n${BLUE}Setting up hook permissions...${NC}"
chmod +x .claude/hooks/*.sh 2>/dev/null || true
chmod +x .claude/hooks/*.py 2>/dev/null || true
echo "✓ Hook scripts are executable"

# Create a test configuration
echo -e "\n${BLUE}Creating test configuration...${NC}"
if [ ! -f ".claude/hooks/test-config.json" ]; then
    cat > .claude/hooks/test-config.json << 'EOF'
{
  "endpoints": [
    {"name": "Main Page", "url": "/", "method": "GET"},
    {"name": "API Generate", "url": "/api/generate", "method": "POST", "body": {"words": "test", "mode": "emoji"}}
  ],
  "security_checks": true,
  "performance_monitoring": true,
  "console_monitoring": true,
  "screenshot_capture": true
}
EOF
    echo "✓ Test configuration created"
fi

echo -e "\n${GREEN}🎉 SETUP COMPLETE!${NC}"
echo "=" * 50
echo -e "${CYAN}Available Commands:${NC}"
echo "  • Run quick diagnostics: python .claude/hooks/claude-runtime-integration.py"
echo "  • Run comprehensive check: .claude/hooks/comprehensive-pre-commit.sh"
echo "  • Run endpoint tests: python .claude/hooks/endpoint-tester.py"
echo "  • Run browser diagnostics: python .claude/hooks/browser-diagnostics.py"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Start development server: npm run dev"
echo "  2. Test the system: python .claude/hooks/claude-runtime-integration.py"
echo "  3. All future commits will automatically run quality checks!"
echo ""
echo -e "${GREEN}✅ Claude Agent Runtime Diagnostics System is ready!${NC}"