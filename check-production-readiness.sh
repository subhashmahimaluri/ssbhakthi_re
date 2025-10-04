#!/bin/bash

# Production Readiness Check Script
# This script checks for common production issues

echo "🚀 Production Readiness Check"
echo "=============================="

# Check for hardcoded localhost URLs
echo "📍 Checking for hardcoded localhost URLs..."
LOCALHOST_COUNT=$(grep -r "http://localhost" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" frontend/pages/api/ frontend/components/ frontend/lib/ backend/src/ 2>/dev/null | wc -l)

if [ "$LOCALHOST_COUNT" -gt 0 ]; then
    echo "❌ Found $LOCALHOST_COUNT hardcoded localhost URLs:"
    grep -r "http://localhost" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" frontend/pages/api/ frontend/components/ frontend/lib/ backend/src/ 2>/dev/null
    echo ""
else
    echo "✅ No hardcoded localhost URLs found in source files"
fi

# Check for environment variable usage
echo "🔧 Checking environment variable usage..."
ENV_VAR_COUNT=$(grep -r "process.env\[.*BACKEND" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" frontend/pages/api/ backend/src/ 2>/dev/null | wc -l)
echo "✅ Found $ENV_VAR_COUNT environment variable usages for backend URLs"

# Check for required environment files
echo "📁 Checking environment files..."
if [ -f "backend/.env.example" ]; then
    echo "✅ Backend .env.example exists"
else
    echo "❌ Backend .env.example missing"
fi

if [ -f "frontend/.env.example" ] || [ -f "frontend/.env.local.example" ]; then
    echo "✅ Frontend environment example exists"
else
    echo "❌ Frontend environment example missing"
fi

# Check for production deployment guide
echo "📚 Checking documentation..."
if [ -f "PRODUCTION_DEPLOYMENT.md" ]; then
    echo "✅ Production deployment guide exists"
else
    echo "❌ Production deployment guide missing"
fi

echo ""
echo "🎯 Production Readiness Summary:"
if [ "$LOCALHOST_COUNT" -eq 0 ]; then
    echo "✅ Ready for production deployment"
    echo "📋 Next steps:"
    echo "   1. Update environment variables for production"
    echo "   2. Configure CORS origins for production domains"
    echo "   3. Set up SSL certificates"
    echo "   4. Configure production database connections"
else
    echo "❌ Not ready for production - fix hardcoded URLs first"
fi