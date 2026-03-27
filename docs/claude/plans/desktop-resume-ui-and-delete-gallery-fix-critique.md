# QA Critic Critique: Desktop Resume UI & Delete Gallery Bug Fix Plan

**Reviewed:** January 22, 2026
**Plan Location:** `C:\Users\natha\.cursor\Photo Vault\photovault-hub\docs\claude\plans\desktop-resume-ui-and-delete-gallery-fix-plan.md`
**Verdict:** **APPROVE WITH CONCERNS**

---

## Executive Summary

The plan is well-researched and correctly identifies that backend support for resume already exists. However, there are several concerns that need addressing before implementation, primarily around testing verification, edge cases in the delete bug investigation, and missing details about file path validation on resume.

---

## Detailed Critique

### 1. Completeness - PARTIAL PASS

**Strengths:**
- Correctly identified that backend IPC handlers already exist in `main.ts` (lines 767-788)
- Correctly identified that `preload.ts` already exposes the resume APIs (lines 65-72)
- Good decomposition into two independent stories

**Gaps:**
- **Missing: Verification that `resumeUpload()` actually works** - The plan shows code that "should already exist" but doesn't specify verification steps. The `resumeUpload()` function in `upload-manager.ts` should be tested in isolation before building UI.
- **Missing: What happens to files that no longer exist?** - If user deletes source files between upload interruption and resume, the app will crash. Plan needs error handling for this scenario.
- **Missing: Storage cleanup for deleted galleries** - Story 2 mentions "Verify Supabase Storage files are cleaned up (if applicable)" but doesn't investigate whether this is actually happening. Orphaned storage files = money leak.

### 2. Correctness - PASS

**Strengths:**
- Follows Electron skill patterns correctly:
  - Uses IPC via preload bridge (not direct Node access in renderer)
  - Uses `ipcRenderer.invoke()` for async operations
  - Properly handles cleanup functions in event listeners
- Follows existing codebase patterns:
  - CSS styling matches existing `queue-container` patterns
  - JavaScript event handling matches existing renderer.js patterns
  - Button naming and structure consistent with existing UI

**Minor Issues:**
- The `showAlert()` fallback function duplicates existing status message patterns. The codebase already has a `showStatus()` function that handles this - should reuse it instead.

### 3. Codebase Consistency - PASS WITH NOTES

**Confirmed Patterns:**
- Existing `queue-container` UI for failed uploads serves as template
- `checkQueue()` / `renderQueue()` pattern should be followed for incomplete uploads
- The plan's HTML/CSS/JS structure matches existing patterns exactly

**Inconsistency:**
- Plan uses `console.error()` in renderer.js - existing code uses `console.error()` too but the Electron skill states "NEVER use console.log in production code". The renderer currently violates this but fixing it is out of scope.

### 4. Simplicity - PASS

The plan is appropriately scoped:
- Story 1: UI-only changes (HTML, CSS, JS) since backend exists
- Story 2: Investigation-first approach, not jumping to solutions

No over-engineering detected.

### 5. Edge Cases & Error Handling - NEEDS WORK

**Critical Missing Edge Cases:**

| Edge Case | Current Plan | Required |
|-----------|--------------|----------|
| Source files deleted | Not handled | Show error, offer to discard |
| Gallery deleted on server | Not handled | Check gallery exists before resume |
| Auth expired during resume | Partially handled | Auth store validates on app start |
| Stale upload state (weeks old) | Not handled | Consider expiry/cleanup |
| Multiple incomplete uploads | Handled in UI | Good |
| ZIP file extracted but temp folder missing | Not handled | Check temp folder exists |

**Recommendation:** Add error handling in `resumeIncompleteUpload` IPC handler to validate:
1. Source files still exist at original paths
2. Gallery ID still exists and is accessible
3. Temp folder exists if it was a ZIP upload

### 6. Technical Debt - PASS

This is NOT a band-aid fix:
- Uses existing well-designed infrastructure
- Adds proper UI layer that was missing
- Delete bug requires root cause investigation (correct approach)

### 7. Security & Data Integrity - PASS WITH NOTES

**Security Verified:**
- No `nodeIntegration: true` (checked main.ts)
- Uses `contextBridge.exposeInMainWorld` correctly
- IPC handlers validate through auth store

**Data Integrity Note:**
- The `clearUploadState(uploadId)` in "Discard" correctly preserves server-side data
- Plan correctly states: "The gallery with existing photos remains on the server"

### 8. Performance - PASS

- `getIncompleteUploads()` is called once on startup (acceptable)
- Event listener for `incomplete-uploads` uses proper cleanup pattern
- No large data through IPC (just state objects, not file buffers)

### 9. Testing & Verification - NEEDS WORK

**Current Plan Testing:**
- Has good acceptance criteria
- Has testing checklist

**Missing:**
- **No unit test for `resumeUpload()` function** - Should verify it uses existing `galleryId` not new gallery
- **No verification that auth token is still valid** on resume
- **No manual test for delete on empty gallery** - Just SQL investigation

**Recommendation:** Before implementing Story 1 UI, verify backend works:
```bash
# Manual test in electron dev console
await window.electronAPI.getIncompleteUploads()
# Should return array of UploadState objects

# Then simulate resume
await window.electronAPI.resumeIncompleteUpload('upload-id-here')
# Should succeed and use existing galleryId
```

### 10. User's Philosophy Alignment - PASS

- No quick fixes - proper investigation approach
- Does it the right way (UI for existing backend, not hacking around)
- Respects scope discipline (two clear stories, not scope creep)

---

## Top 3 Concerns

### 1. **Source File Validation Missing (HIGH)**
If a user tries to resume an upload after deleting or moving the source photos, the app will either crash or silently fail. The `resumeUpload()` function in upload-manager.ts needs to validate that `filePaths` still exist before attempting upload.

**Required Addition to Plan:**
```typescript
// In resumeUpload(), before starting:
const missingFiles = state.filePaths.filter(p => !fs.existsSync(p))
if (missingFiles.length > 0) {
  throw new Error(`Cannot resume: ${missingFiles.length} source files are missing`)
}
```

### 2. **Delete Bug Root Cause Undetermined (MEDIUM)**
The plan correctly identifies that investigation is needed, but doesn't specify how to reproduce the bug. The user said "empty/incomplete galleries won't delete" - we need to:
1. Create an incomplete gallery (upload 1 photo, cancel)
2. Try to delete it
3. Check browser network tab for error response
4. Check Supabase logs

**Required Addition:** Add specific reproduction steps to Story 2.

### 3. **No Backend Verification Before UI Work (MEDIUM)**
The plan assumes `resumeIncompleteUpload` IPC handler works correctly, but I confirmed it exists at lines 773-782 of main.ts. However, the actual `resumeUpload()` function in `upload-manager.ts` was referenced but not read. We should verify:
- It correctly passes `galleryId` from saved state
- It doesn't create a new gallery

---

## Minor Recommendations

1. **Reuse `showStatus()` instead of creating `showAlert()`** - The plan's `showAlert()` is redundant with line 411-417 of renderer.js.

2. **Add upload state expiry** - Consider auto-discarding incomplete uploads older than 7 days to prevent state accumulation.

3. **Version bump** - Plan mentions "bump to 1.0.3" - ensure this is done in `package.json` after changes.

4. **CSS variable colors** - Plan uses hardcoded colors (`#fff3cd`, `#28a745`). Consider using existing CSS variables if available.

---

## Verdict Rationale

**APPROVE WITH CONCERNS** because:
- The plan is fundamentally sound and follows correct patterns
- Backend infrastructure exists and plan correctly leverages it
- The concerns raised are addressable without major redesign
- Story 2 (delete bug) correctly requires investigation first

**Before Implementation:**
1. Add source file validation to resume logic
2. Add specific reproduction steps for delete bug
3. Verify `resumeUpload()` uses existing galleryId (manual test)

---

*Critique by QA Critic Expert - January 22, 2026*
