#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Preparing to release @contentgrowth/content-auth ..."
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  WARNING: You have uncommitted changes!"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release cancelled."
        exit 1
    fi
fi

# Show what will be published
echo "📦 Package contents preview:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm pack --dry-run
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Security check: Verify no .env files are included
if npm pack --dry-run 2>&1 | grep -q "\<\.env\>"; then
    echo "🚨 SECURITY ERROR: .env file detected in package!"
    echo "❌ Release cancelled for security reasons."
    exit 1
fi

# Confirm before publishing
read -p "Proceed with publishing? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled."
    exit 1
fi

echo ""
echo "📤 Publishing to npm..."

# Note: No build step required as this is a pure ES module project
# If a build step is added later (e.g. TypeScript), add 'npm run build' here

# Publish to npm
# --access public is required for scoped packages to be public
npm publish --access public

echo ""
echo "✅ Release complete!"
echo "📦 Package published: @contentgrowth/content-auth@$(node -p "require('./package.json').version")"
