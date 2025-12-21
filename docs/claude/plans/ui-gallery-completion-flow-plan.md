# UI: Gallery Completion Flow - Investigation Plan

**Date:** December 18, 2025
**Status:** Research Complete

---

## Summary

The gallery completion flow **DOES exist** but is not obvious. After uploading photos, there's a "Mark as Ready" button that leads to sneak-peek selection, which then sends the email to the client.

---

## Current Flow (What Exists)

```
1. Create Gallery → 2. Upload Photos → 3. "Mark as Ready" button →
4. Sneak Peek Selection → 5. Send Email → 6. Gallery List
```

### Key Files:
- `/photographer/galleries/[id]/upload/page.tsx` - Has "Mark as Ready" button
- `/photographer/galleries/[id]/sneak-peek-select/page.tsx` - Sends email to client
- `/api/email/gallery-ready/route.ts` - Email sending endpoint

---

## The Gap Identified

### Problem 1: Unclear Button Label
- "Mark as Ready" doesn't clearly indicate it leads to sending the gallery to the client
- Should be "Complete & Send to Client" or similar

### Problem 2: Sneak Peek Page is Confusing
- Primary action is selecting sneak peek photos
- The gallery sending is a side-effect, not the main action
- Photographer may think sneak peek is optional and skip it

### Problem 3: No Clear Confirmation
- After sending, redirect happens quickly
- No confirmation of what email was sent or to whom

---

## Proposed Quick Fix

1. **Rename button** from "Mark as Ready" to "Complete & Send to Client"
2. **Add subtitle** explaining what will happen
3. **Improve success message** on sneak-peek completion

---

## Proposed Full Solution

Create a dedicated "Complete & Send Gallery" wizard:

1. **Step 1 - Review:** Summary of gallery, photo count, client, price
2. **Step 2 - Sneak Peek (Optional):** Current photo selection UI
3. **Step 3 - Confirm:** Show email preview, send button
4. **Step 4 - Success:** Confirmation with details

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/photographer/galleries/[id]/upload/page.tsx` | Rename button, add helper text |
| `src/app/photographer/galleries/[id]/sneak-peek-select/page.tsx` | Improve messaging |
| `src/app/photographer/galleries/page.tsx` | Add "Sent" date column |

---

## Next Steps

1. User to decide: Quick fix (rename button) or full solution (new wizard)?
2. Implement chosen approach
3. Test E2E flow again
