# UI: Mark as Ready Button Resilience - Implementation Plan

**Date:** December 18, 2025
**Status:** Research Complete - Ready for Implementation
**Expert:** Shadcn/UI & Tailwind Expert

---

## Problem Statement

The "Mark as Ready" button in the gallery upload flow can disappear incorrectly in edge cases where:
- Internet connection is interrupted during gallery creation
- Browser crashes mid-flow
- Page is refreshed before completion
- Any transient state is lost

The button should persist based on **actual database state**, not UI state, ensuring photographers can always complete their galleries.

---

## Research Findings

### Current Implementation Analysis

#### 1. Button Location & Visibility Logic

**File:** `src/app/photographer/galleries/[id]/upload/page.tsx`

**Current Condition (Lines 302-307):**
```tsx
{photos.length > 0 && gallery?.gallery_status === 'draft' && (
  <Button onClick={handleMarkAsReady}>
    <Send className="h-4 w-4 mr-2" />
    Mark as Ready
  </Button>
)}
```

**Current Logic:**
- Button shows when: `photos.length > 0` AND `gallery_status === 'draft'`
- Button hides when: Gallery status changes to 'ready'

#### 2. Database Schema

**Table:** `photo_galleries`

**Relevant Columns (from `payment-model-migration.sql` lines 126-128):**
```sql
gallery_status VARCHAR(20) DEFAULT 'draft' CHECK (gallery_status IN ('draft', 'ready', 'live', 'archived'))
email_sent_at TIMESTAMPTZ
```

**Status Flow:**
1. `draft` - Gallery created, photos being uploaded
2. `ready` - Gallery marked ready, email sent to client
3. `live` - (future use - when client activates subscription)
4. `archived` - Gallery archived by photographer

#### 3. Email Sending Flow

**File:** `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx`

**What Happens on Send (Lines 135-201):**
```tsx
const handleSendSneakPeek = async () => {
  // 1. Update gallery status to 'ready'
  await supabase
    .from('photo_galleries')
    .update({ gallery_status: 'ready' })
    .eq('id', galleryId)

  // 2. Mark selected photos as sneak peek
  if (selectedPhotos.size > 0) {
    await supabase
      .from('photos')
      .update({ is_sneak_peek: true })
      .in('id', Array.from(selectedPhotos))
  }

  // 3. Send email via API
  await fetch('/api/email/gallery-ready', {
    method: 'POST',
    body: JSON.stringify({ galleryId, sneakPeekPhotoIds })
  })

  // 4. Redirect to galleries list
  router.push('/photographer/galleries')
}
```

**File:** `src/app/api/email/gallery-ready/route.ts`

**Email API Logic (Lines 64-92):**
- Requires photographer has Stripe Connect set up
- Returns error code `PHOTOGRAPHER_STRIPE_MISSING` if not set up
- Sets `email_sent_at` timestamp (NOT YET IMPLEMENTED - see gap below)
- Sends email via Resend

---

## Gap Analysis

### Critical Gap: Email Sent Tracking

**Problem:** The `email_sent_at` column exists in the schema but is **NOT being set** by the email API.

**Location:** `src/app/api/email/gallery-ready/route.ts`

**Current Flow:**
1. Sneak peek page updates `gallery_status` to 'ready'
2. Email API sends email
3. **BUT email API does NOT update `email_sent_at`**
4. If email fails (Stripe not connected), gallery status is STILL 'ready'

**Consequence:**
- Button disappears even if email was never sent
- Photographer loses ability to retry sending email
- No database record of whether email was successfully sent

---

## Edge Cases Identified

### Case 1: Interrupted Email Send (CURRENT BUG)

**Scenario:**
1. Photographer clicks "Mark as Ready"
2. Page navigates to sneak peek selection
3. Gallery status updates to 'ready'
4. Email API fails (e.g., Stripe not connected, network error)
5. Page shows alert but gallery status remains 'ready'
6. Photographer goes back to upload page
7. **Button is gone** - can't retry sending

**Root Cause:** Button visibility depends on `gallery_status === 'draft'` but status changes before email succeeds

---

### Case 2: Browser Crash During Flow

**Scenario:**
1. Photographer uploads photos
2. Clicks "Mark as Ready"
3. Browser crashes before reaching sneak peek page
4. Photographer reopens browser, navigates back to upload page
5. **Button still shows** (status still 'draft') - ✅ WORKS CORRECTLY

**Status:** NOT A BUG - current logic handles this correctly

---

### Case 3: Page Refresh After Status Change

**Scenario:**
1. Gallery status updated to 'ready'
2. Email sending in progress
3. User refreshes page or network drops
4. **Button is gone** - can't retry

**Root Cause:** Same as Case 1

---

### Case 4: Email Sent Successfully But No Confirmation

**Scenario:**
1. Email sends successfully
2. `gallery_status` is 'ready' but `email_sent_at` is NULL
3. No way to know if email was actually sent

**Root Cause:** `email_sent_at` not being set

---

## Recommended Solution

### Core Principle
**The button should be visible until the email is ACTUALLY sent, regardless of gallery status.**

### Proposed Logic Change

**New Visibility Condition:**
```tsx
// Show button when:
// 1. Photos exist, AND
// 2. EITHER status is 'draft' OR status is 'ready' but email not sent yet
{photos.length > 0 &&
 (gallery?.gallery_status === 'draft' ||
  (gallery?.gallery_status === 'ready' && !gallery?.email_sent_at)) && (
  <Button onClick={handleMarkAsReady}>
    <Send className="h-4 w-4 mr-2" />
    {gallery?.gallery_status === 'ready' ? 'Resend to Client' : 'Complete & Send to Client'}
  </Button>
)}
```

**Button Text Logic:**
- If `gallery_status === 'draft'` → "Complete & Send to Client"
- If `gallery_status === 'ready' && !email_sent_at` → "Resend to Client"

---

## Implementation Plan

### Phase 1: Add Email Sent Tracking

**File:** `src/app/api/email/gallery-ready/route.ts`

**Change:** After successful email send (line 222), add:
```typescript
// Update email_sent_at timestamp
await supabase
  .from('photo_galleries')
  .update({ email_sent_at: new Date().toISOString() })
  .eq('id', galleryId)
```

**Location:** After `resend.emails.send()` succeeds, before the success response

---

### Phase 2: Update Upload Page Query

**File:** `src/app/photographer/galleries/[id]/upload/page.tsx`

**Change 1:** Update Gallery interface (line 27):
```typescript
interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  shoot_fee: number
  total_amount: number
  gallery_status: string
  email_sent_at: string | null  // ADD THIS
  photo_count: number
  client_id: string
  clients?: {
    name: string
    email: string
  }
}
```

**Change 2:** Update query to fetch `email_sent_at` (line 71):
```typescript
const { data, error } = await supabase
  .from('photo_galleries')
  .select(`
    *,
    email_sent_at,  // ADD THIS explicitly
    clients (
      name,
      email
    )
  `)
  .eq('id', galleryId)
  .single()
```

---

### Phase 3: Update Button Visibility Logic

**File:** `src/app/photographer/galleries/[id]/upload/page.tsx`

**Change:** Replace lines 302-307 with:
```tsx
{photos.length > 0 &&
 (gallery?.gallery_status === 'draft' ||
  (gallery?.gallery_status === 'ready' && !gallery?.email_sent_at)) && (
  <Button onClick={handleMarkAsReady}>
    <Send className="h-4 w-4 mr-2" />
    {gallery?.gallery_status === 'ready' && !gallery?.email_sent_at
      ? 'Resend to Client'
      : 'Complete & Send to Client'}
  </Button>
)}
```

---

### Phase 4: Handle Resend Flow

**File:** `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx`

**Optional Enhancement:** Add logic to detect if this is a resend:
```typescript
const isResend = gallery?.gallery_status === 'ready' && !gallery?.email_sent_at

// Update UI messaging if isResend is true
// e.g., "Resend Gallery Notification" instead of "Mark Gallery Ready"
```

---

### Phase 5: Error Recovery

**File:** `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx`

**Change:** Update error handling (lines 178-186):
```typescript
if (!response.ok) {
  const data = await response.json()
  if (data.code === 'PHOTOGRAPHER_STRIPE_MISSING') {
    // Rollback gallery status to 'draft' so button reappears
    await supabase
      .from('photo_galleries')
      .update({ gallery_status: 'draft' })
      .eq('id', galleryId)

    alert('Warning: You must complete your payment setup (Stripe Connect) before sending gallery notifications to clients. Please connect your Stripe account in Settings.')
    router.push(`/photographer/galleries/${galleryId}/upload`)
    return
  } else {
    console.warn('Email send warning:', data.error)
    // For other errors, also rollback
    await supabase
      .from('photo_galleries')
      .update({ gallery_status: 'draft' })
      .eq('id', galleryId)
  }
}
```

**Rationale:** If email fails, reset status to 'draft' so photographer can retry

---

## Database Migration (If Needed)

**Check if `email_sent_at` column exists:**
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'photo_galleries'
  AND column_name = 'email_sent_at';
```

**If NOT exists, run migration:**
```sql
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
```

**Note:** Based on `payment-model-migration.sql` line 128, this column should already exist in production. Verify before deploying.

---

## Testing Plan

### Test Case 1: Normal Flow (Happy Path)

**Steps:**
1. Create gallery with photos
2. Click "Complete & Send to Client"
3. Select sneak peek photos
4. Click send
5. Verify email received
6. Return to upload page
7. **Expected:** Button NOT visible (status = 'ready', email_sent_at is set)

---

### Test Case 2: Stripe Not Connected (Error Recovery)

**Steps:**
1. Create gallery with photos
2. Disconnect Stripe Connect (or use test account without Stripe)
3. Click "Complete & Send to Client"
4. Click send on sneak peek page
5. **Expected:** Error alert, redirected back to upload page
6. **Expected:** Button STILL visible with text "Complete & Send to Client"
7. Connect Stripe
8. Click button again
9. **Expected:** Email sends successfully, button disappears

---

### Test Case 3: Network Interruption During Email Send

**Steps:**
1. Create gallery with photos
2. Click "Complete & Send to Client"
3. On sneak peek page, open browser DevTools Network tab
4. Throttle network to "Offline" BEFORE clicking send
5. Click send
6. **Expected:** Email fails, status reverts to 'draft'
7. Re-enable network
8. Return to upload page
9. **Expected:** Button visible, can retry

---

### Test Case 4: Page Refresh Mid-Flow

**Steps:**
1. Create gallery with photos
2. Click "Complete & Send to Client"
3. On sneak peek page, refresh browser BEFORE clicking send
4. **Expected:** Page reloads, still shows sneak peek selection
5. Click send
6. **Expected:** Email sends, button disappears

---

### Test Case 5: Resend After Partial Failure

**Steps:**
1. Manually set `gallery_status = 'ready'` but `email_sent_at = NULL` in database
2. Navigate to upload page
3. **Expected:** Button shows "Resend to Client"
4. Click button
5. **Expected:** Goes to sneak peek page, can send email
6. Send email
7. **Expected:** `email_sent_at` is set, button disappears

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `src/app/api/email/gallery-ready/route.ts` | Add `email_sent_at` update after email sends | ~222 |
| `src/app/photographer/galleries/[id]/upload/page.tsx` | Update Gallery interface, query, button logic | 27, 71, 302-307 |
| `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx` | Add error rollback logic, resend detection | 178-186 |

**Total Files:** 3
**Estimated Effort:** 1-2 hours implementation + 1 hour testing

---

## Risks & Considerations

### Risk 1: Race Condition (Low)
**Scenario:** Two browser tabs open, both try to send email
**Mitigation:** `email_sent_at` is idempotent - second send will still work

### Risk 2: Email Sent But Database Update Fails (Low)
**Scenario:** Email sends via Resend, but Supabase update fails
**Mitigation:** Button will show "Resend" - sending duplicate email is acceptable
**Future:** Add idempotency key to Resend API call

### Risk 3: Backward Compatibility (Medium)
**Scenario:** Existing galleries in 'ready' status with NULL `email_sent_at`
**Mitigation:** Button will show "Resend to Client" - photographer can resend if needed
**Data Fix:** Run backfill query to set `email_sent_at = updated_at` for old galleries:
```sql
UPDATE photo_galleries
SET email_sent_at = updated_at
WHERE gallery_status = 'ready'
  AND email_sent_at IS NULL;
```

---

## Success Criteria

1. ✅ Button persists through page refreshes when email not sent
2. ✅ Button shows "Resend" text when status is 'ready' but email not sent
3. ✅ Email send failures rollback gallery status to 'draft'
4. ✅ `email_sent_at` timestamp is set on successful send
5. ✅ All 5 test cases pass
6. ✅ No regression in normal happy-path flow

---

## Alternative Approaches Considered

### Alternative 1: Add `email_send_attempted` Boolean
**Pros:** Explicit tracking of send attempts
**Cons:** Adds complexity, timestamp is more useful

### Alternative 2: Keep Status as 'draft' Until Email Succeeds
**Pros:** Simpler logic
**Cons:** Breaks semantic meaning of status, harder to track workflow state

### Alternative 3: Add Retry Button Next to Completed Galleries
**Pros:** Doesn't change main flow
**Cons:** Requires photographer to know they need to retry, not discoverable

**Decision:** Proceed with recommended solution (timestamp-based visibility)

---

## Next Steps

1. **User approval** - Review this plan
2. **Implement Phase 1-3** (core functionality)
3. **Test Cases 1-3** (critical paths)
4. **Implement Phase 4-5** (enhancements)
5. **Test Cases 4-5** (edge cases)
6. **Deploy to production**
7. **Monitor for issues**

---

## Notes

- This is a **resilience fix**, not a UI redesign
- Related to `ui-gallery-completion-flow-plan.md` (UX improvements)
- Should be implemented BEFORE any UX redesign to ensure data integrity
- Consider adding PostHog event tracking for "gallery_email_resent" events

---

**End of Plan**
