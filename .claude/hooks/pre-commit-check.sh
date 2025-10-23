#!/bin/bash

# Pre-commit hook to prevent common EmojiFusion issues
# Add to .git/hooks/pre-commit to run automatically

echo "🔍 Running EmojiFusion pre-commit checks..."

# Check for hardcoded localhost URLs in frontend code
echo "Checking for hardcoded API URLs..."
HARDCODED_URLS=$(grep -r "127\.0\.0\.1:3001\|localhost:3001" src/ 2>/dev/null || true)

if [ ! -z "$HARDCODED_URLS" ]; then
    echo "❌ COMMIT BLOCKED: Found hardcoded API URLs in frontend code:"
    echo "$HARDCODED_URLS"
    echo ""
    echo "Fix: Change to '/api/generate' to use Vite proxy"
    echo "Files to check: src/MobileApp-v2.tsx, src/MobileApp.tsx, src/App.tsx"
    exit 1
fi

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript errors found (build will still work):"
    npx tsc --noEmit 2>&1 | head -10
    echo ""
    echo "Consider fixing TypeScript errors before commit"
    echo "Continue commit? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed!"
exit 0