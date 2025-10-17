# Bug Fix: Platform Modal Transition Issue

## Problem

When clicking the Pixieset button on the dashboard, the `PlatformConnectionModal` would open, and when the user clicked "Connect", it would show "Connected successfully!" but nothing would happen - the unified import modal wouldn't open.

## Root Cause

The issue was caused by **state conflict** between two modals:

1. **PlatformConnectionModal**: Used for initial platform selection (old system)
2. **UnifiedPlatformModal**: Used for the actual import process (new unified system)

Both modals were trying to use the **same state variable** (`selectedPlatform`):
- `PlatformConnectionModal` was open when `!!selectedPlatform` was true
- `UnifiedPlatformModal` needed `selectedPlatform` to be set

When `handlePlatformConnect` tried to transition from the old modal to the unified modal, it would:
1. Set `selectedPlatform` to the platform name
2. Set `showUnifiedModal` to `true`
3. But the `PlatformConnectionModal` was still using `selectedPlatform`, causing conflicts

## Solution

**Separated the state** for the two modal systems:

### Before (Broken):
```typescript
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
const [showUnifiedModal, setShowUnifiedModal] = useState(false)

// Both modals used selectedPlatform
<PlatformConnectionModal
  platform={selectedPlatform}
  isOpen={!!selectedPlatform}
/>

<UnifiedPlatformModal
  platform={selectedPlatform}  // CONFLICT!
  isOpen={showUnifiedModal}
/>
```

### After (Fixed):
```typescript
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)  // For old modal
const [showUnifiedModal, setShowUnifiedModal] = useState(false)
const [unifiedPlatform, setUnifiedPlatform] = useState<string | null>(null)  // For unified modal

// Old modal only opens when unified modal is not showing
<PlatformConnectionModal
  platform={selectedPlatform}
  isOpen={!!selectedPlatform && !showUnifiedModal}
/>

// Unified modal has its own platform state
<UnifiedPlatformModal
  platform={unifiedPlatform}  // NO CONFLICT!
  isOpen={showUnifiedModal}
/>
```

### Transition Logic:
```typescript
if (supportedPlatforms.includes(credentials.platform?.toLowerCase())) {
  // Close the old modal and open unified modal
  setSelectedPlatform(null)           // Close old modal
  setUnifiedPlatform(credentials.platform)  // Set platform for unified modal
  setShowUnifiedModal(true)           // Open unified modal
  return
}
```

## Testing

1. Click **Pixieset** button on dashboard
2. Old modal opens with platform selection
3. Click **Connect**
4. Old modal closes
5. **Unified modal opens** with Pixieset branding ✅
6. Enter credentials and import works correctly

## Files Changed

- `src/app/dashboard/page.tsx`:
  - Added `unifiedPlatform` state variable
  - Updated `handlePlatformConnect` to use separate state
  - Updated modal rendering to prevent conflicts

## Related Issues

This also fixed:
- **Session Management**: Added better error handling for expired/corrupted sessions
- **Auth Context**: Improved handling of token refresh errors

## Prevention

For future modal transitions:
- **Use separate state** for each modal system
- **Don't share state** between unrelated modals
- **Add console logs** to track modal state transitions
- **Test the full workflow** from button click to completion

---

**Status**: ✅ FIXED
**Date**: 2025-10-13
**Impact**: Critical - Users can now use Pixieset and SmugMug import features


