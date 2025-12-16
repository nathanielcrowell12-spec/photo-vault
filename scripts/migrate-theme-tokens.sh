#!/bin/bash
# Theme Token Migration Script
# Converts hardcoded colors to semantic tokens across all page files

set -e

echo "========================================"
echo "  PhotoVault Theme Token Migration"
echo "========================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Verify we're in the right place
if [ ! -d "src/app" ]; then
  echo "ERROR: src/app not found. Run from photovault-hub directory."
  exit 1
fi

echo "Working directory: $(pwd)"
echo ""

# Create backup info
echo "Creating backup reference..."
git status --short src/app > /tmp/theme-migration-before.txt 2>/dev/null || true

# Define replacements (order matters - longer patterns first)
echo "Starting replacements..."
echo ""

# BACKGROUNDS (with opacity first)
echo "  [1/7] Replacing background colors..."
find src/app -name "*.tsx" -exec sed -i 's/bg-neutral-800\/50/bg-card\/50/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-neutral-900\/80/bg-background\/80/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-white\/\[0\.03\]/bg-card/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-white\/5/bg-muted/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-neutral-900/bg-background/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-neutral-800/bg-card/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/bg-neutral-700/bg-secondary/g' {} +

# TEXT COLORS
echo "  [2/7] Replacing text colors..."
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-100/text-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-200/text-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-300/text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-400/text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-500/text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-neutral-600/text-muted-foreground/g' {} +

# SLATE TEXT COLORS
echo "  [3/7] Replacing slate text colors..."
find src/app -name "*.tsx" -exec sed -i 's/text-slate-300/text-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-slate-400/text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-slate-500/text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/text-slate-600/text-muted-foreground/g' {} +

# TEXT WHITE (be careful - only replace standalone text-white, not hover:text-white yet)
echo "  [4/7] Replacing text-white..."
# This is tricky - we want text-white but not inside other patterns
find src/app -name "*.tsx" -exec sed -i 's/\btext-white\b/text-foreground/g' {} +

# BORDERS
echo "  [5/7] Replacing border colors..."
find src/app -name "*.tsx" -exec sed -i 's/border-white\/5/border-border/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/border-white\/10/border-border/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/border-white\/20/border-border/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/border-neutral-700/border-border/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/border-slate-700/border-border/g' {} +

# PLACEHOLDERS
echo "  [6/7] Replacing placeholder colors..."
find src/app -name "*.tsx" -exec sed -i 's/placeholder:text-neutral-500/placeholder:text-muted-foreground/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/placeholder:text-neutral-400/placeholder:text-muted-foreground/g' {} +

# HOVER STATES
echo "  [7/7] Replacing hover states..."
find src/app -name "*.tsx" -exec sed -i 's/hover:bg-white\/5/hover:bg-accent\/50/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/hover:bg-white\/10/hover:bg-accent\/50/g' {} +
find src/app -name "*.tsx" -exec sed -i 's/hover:text-white/hover:text-foreground/g' {} +

echo ""
echo "========================================"
echo "  Migration Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run 'git diff src/app' to review changes"
echo "  2. Check for edge cases (gradients, composite classes)"
echo "  3. Test locally with 'npm run dev -- -p 3002'"
echo "  4. Toggle between light/dark modes"
echo ""

# Show summary
CHANGED_FILES=$(git diff --name-only src/app 2>/dev/null | wc -l)
echo "Files changed: $CHANGED_FILES"
echo ""
