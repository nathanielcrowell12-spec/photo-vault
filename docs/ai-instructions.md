# AI Development Instructions for PhotoVault

## Pre-Deployment Checklist

**CRITICAL: Always run this before pushing to GitHub**

1. **Local Build Verification**
   ```bash
   npm run build
   ```
   - Must pass without TypeScript errors
   - Warnings are acceptable, errors are not

2. **Error Resolution Priority**
   - Fix all TypeScript errors before pushing
   - Interface mismatches take priority
   - Function hoisting issues (functions used before declaration)
   - Component usage errors (wrong props, missing imports)

3. **Testing Checkpoint**
   - Verify critical user flows work locally
   - Test authentication, upload, and gallery viewing
   - Only push when local build is clean

## Common Error Patterns to Watch For

- Interface mismatches: Check if usage matches interface definitions
- Missing imports: Verify all components and interfaces are properly imported
- Function hoisting: Ensure functions are declared before useEffect dependencies
- Component misuse: Lucide icons don't use `alt` attributes

---
*This document will be updated as we identify more patterns and best practices.*
