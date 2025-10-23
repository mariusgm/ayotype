#!/bin/bash

# 🔧 Environment Variables Checker
# ================================
# Checks if required environment variables are configured

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Environment Variables Check${NC}"
echo "═══════════════════════════════════"

# Check for .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    source .env
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo -e "   Create .env file with your API keys"
fi

echo ""
echo -e "${BLUE}Required for API functionality:${NC}"

# GROQ API Key (required)
if [ -n "$GROQ_API_KEY" ]; then
    echo -e "${GREEN}✓ GROQ_API_KEY${NC} is set"
else
    echo -e "${RED}❌ GROQ_API_KEY${NC} is missing (required for generation)"
fi

echo ""
echo -e "${BLUE}Optional (for performance):${NC}"

# Redis configuration (optional)
if [ -n "$UPSTASH_REDIS_REST_URL" ] && [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
    echo -e "${GREEN}✓ Redis caching${NC} is configured"
else
    echo -e "${YELLOW}⚠️  Redis caching${NC} not configured (optional)"
fi

# OpenRouter fallback (optional)
if [ -n "$OPENROUTER_API_KEY" ]; then
    echo -e "${GREEN}✓ OpenRouter fallback${NC} is configured"
else
    echo -e "${YELLOW}⚠️  OpenRouter fallback${NC} not configured (optional)"
fi

# Email service (optional)
if [ -n "$SENDGRID_API_KEY" ] || [ -n "$RESEND_API_KEY" ]; then
    echo -e "${GREEN}✓ Email service${NC} is configured"
else
    echo -e "${YELLOW}⚠️  Email service${NC} not configured (optional)"
fi

# reCAPTCHA (optional)
if [ -n "$RECAPTCHA_SECRET_KEY" ]; then
    echo -e "${GREEN}✓ reCAPTCHA${NC} is configured"
else
    echo -e "${YELLOW}⚠️  reCAPTCHA${NC} not configured (optional)"
fi

echo ""

# Count missing required variables
MISSING_REQUIRED=0
if [ -z "$GROQ_API_KEY" ]; then
    MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
fi

# Final assessment
if [ $MISSING_REQUIRED -eq 0 ]; then
    echo -e "${GREEN}🎉 All required environment variables are configured!${NC}"
    echo -e "${GREEN}✅ API should work correctly${NC}"
else
    echo -e "${RED}🚨 Missing $MISSING_REQUIRED required environment variable(s)${NC}"
    echo -e "${RED}❌ API will not work without GROQ_API_KEY${NC}"
    echo ""
    echo -e "${YELLOW}📋 To fix:${NC}"
    echo -e "   1. Copy .env.example to .env"
    echo -e "   2. Add your GROQ_API_KEY to .env"
    echo -e "   3. Add other optional keys for full functionality"
fi

echo ""
echo -e "${CYAN}💡 Quick setup:${NC}"
echo -e "   ${BLUE}cp .env.example .env${NC}"
echo -e "   ${BLUE}# Edit .env with your API keys${NC}"