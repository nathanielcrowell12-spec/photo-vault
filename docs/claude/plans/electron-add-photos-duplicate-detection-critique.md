# QA Critic Review: Add Photos to Existing Gallery with Duplicate Detection

**Plan Under Review:** `electron-add-photos-duplicate-detection-plan.md`
**Reviewer:** QA Critic Expert
**Date:** 2026-02-02
**Verdict:** NEEDS REVISION

---

## Executive Summary

This is a well-structured plan that addresses a real user need (adding photos to existing galleries). However, there are **significant issues** that must be resolved before implementation. The most critical problems are:

1. **State migration is incomplete** - The plan proposes per-file tracking but migration only covers `files` array, not reconciliation with the existing `queueStore`
2. **Retry button fix treats symptoms, not root cause** - The stuck "Retrying..." button isn't properly diagnosed
3. **Missing authorization on the filenames endpoint** - The plan's endpoint doesn't verify the token matches the gallery owner properly
4. **Filename normalization mismatch risk** - Client normalizes differently than server stores

---

## Detailed Critique by Category

### 1. Completeness - PARTIAL

**What's covered well:**
- Clear phase breakdown (7 phases)
- Test steps for main flows
- Edge cases listed

**What's missing:**

1. **No error recovery for duplicate check failure** (Phase 3, line 328-340):
   ```typescript
   } catch (error) {
     logger.error('[DuplicateDetector] Error fetching filenames:', error)
     return []  // Falls back to "no duplicates" - user won't know check failed
   }
   ```
   **Problem:** If the duplicate check silently fails, user uploads duplicates thinking they were checked. Need explicit error handling that tells user "Duplicate check failed - proceed anyway or cancel?"

2. **ZIP files not handled in duplicate detection** (Phase 3):
   The plan mentions ZIP handling in edge cases (line 783) but the `detectDuplicates` function only works on already-extracted file paths. What happens when user selects a ZIP? The extraction happens AFTER duplicate check is supposed to run. This is a logical flow error.

3. **No cancellation handling during duplicate check** (line 408-429):
   If user closes app or cancels during the async `checkDuplicates` call, what happens? The state machine doesn't account for this.

4. **Missing cleanup of orphaned upload states** - What happens to old `queueStore` entries after migration? The plan says "Remove queueStore" but doesn't specify how to migrate existing queued uploads.

---

### 2. Correctness - ISSUES FOUND

**Issue 1: Token validation in filenames endpoint (Phase 1, lines 106-116)**

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser(token)
```

This uses `supabase.auth.getUser(token)` but the existing codebase uses Supabase service role with `SUPABASE_SERVICE_ROLE_KEY`. The `getUser` method expects a JWT access token, but the desktop app may be passing a different token format (check `SecureAuthStore` implementation).

**Recommendation:** Verify token validation matches existing `/api/v1/upload/prepare` endpoint pattern.

**Issue 2: Filename normalization mismatch (Phase 3, lines 300-308)**

Plan proposes:
```typescript
function normalizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
}
```

But the existing `photos` table stores filenames as-is from `path.basename()`. If the database has `Photo (1).jpg` and user tries to upload `photo (1).jpg`, the normalization would make both `photo__1_.jpg`, so it would correctly detect duplicate. BUT if user uploads `Photo (1).jpg` (exact match), it would also normalize to `photo__1_.jpg` and match.

**The problem:** Normalization happens on both sides but database stores UN-normalized names. When uploading, the file will be stored with its original name. So you could have:
- DB: `Photo (1).jpg` (original upload)
- User attempts: `Photo_(1).jpg` (different file, same normalized name)
- System: "Duplicate detected" - WRONG

**Recommendation:** Either normalize filenames when storing to DB (breaking change), or do exact string comparison only. The current approach will cause false positives.

**Issue 3: State migration code location unclear (Phase 6, lines 803-815)**

```typescript
function migrateOldState(state: UploadState): UploadState {
```

Where does this run? On app startup? On first state load? The plan doesn't specify. This matters because:
- If on startup, all states get migrated even if not used
- If on load, you might have a mix of migrated and unmigrated states

---

### 3. Codebase Consistency - GOOD WITH CONCERNS

**Matches existing patterns:**
- IPC handler structure matches `main.ts` patterns
- Uses electron-store like existing queue
- Uses logger consistently

**Concerns:**

1. **New file creation when extension would suffice** (Phase 3):
   Creating `duplicate-detector.ts` adds a new file, but this is just two functions (~50 lines). Could be added to `upload-manager.ts` or a `utils.ts` file. The skill file says "Search codebase for similar existing functionality... If similar exists -> extend, don't duplicate."

2. **Inconsistent error return format** (Phase 5, lines 502-513):
   The `check-duplicates` handler returns `DuplicateCheckResult` directly on success but no error structure. Compare to existing handlers that return `{ success: boolean; error?: string }`.

---

### 4. Simplicity - OVERCOMPLICATED

**Concern: Two state systems becoming one is risky**

The plan unifies `queueStore` (failed uploads) and `upload-state.ts` (incomplete uploads). These serve different purposes:

| System | Purpose | When Populated |
|--------|---------|----------------|
| queueStore | Failed uploads that threw errors | After catch block |
| upload-state | Incomplete uploads (app closed mid-upload) | During upload |

**Question:** Is the unification necessary for the "Add Photos" feature? No. It's scope creep.

**Recommendation:** Implement "Add Photos" with existing state systems first. Unify state systems as a separate task with its own plan.

---

### 5. Edge Cases - PARTIALLY COVERED

**Covered:**
- ZIP extraction with duplicates
- Filename collisions
- Network interruption
- Gallery deleted between check and upload
- Large galleries (1000+ photos)
- Case sensitivity

**Missing:**

1. **What if gallery has 10,000 photos?** The endpoint returns ALL filenames. At 50 bytes/filename average, that's 500KB per request. Add pagination or warn about this.

2. **What if user has multiple windows/instances?** The plan uses single-instance lock for the app, but what if user opens gallery in browser, clicks "Add Photos", desktop opens, they repeat? Race condition on state.

3. **What if gallery is "archived" or "deleted" status?** The filenames endpoint checks `photographer_id` but not gallery status.

4. **Empty gallery edge case:** If gallery has 0 photos, the endpoint returns `{ filenames: [], count: 0 }`. The duplicate check would pass, but is this the expected behavior? User might think something is wrong.

---

### 6. Technical Debt - CONCERN

**Problem: Retry button fix is a symptom patch**

The plan says (lines 622-656):
```javascript
async function handleRetry(uploadId, btn) {
  ...
  } catch (error) {
    showError(`Retry error: ${error.message}`)
    // Re-enable button on failure
    btn.disabled = false
    btn.textContent = originalText
  }
}
```

This fixes the SYMPTOM (button stays disabled) but not the ROOT CAUSE. Looking at the actual renderer.js (lines 387-403):

```javascript
btn.addEventListener('click', async (e) => {
  const uploadId = e.target.dataset.id
  btn.disabled = true
  btn.textContent = 'Retrying...'

  const result = await window.electronAPI.retryQueuedUpload(uploadId)
  if (result.success) {
    showStatus('Retrying upload...')
    checkQueue() // Refresh queue
  } else {
    showError('Retry failed: ' + (result.error || 'Unknown error'))
    btn.disabled = false  // <-- This DOES re-enable!
    btn.textContent = 'Retry'
  }
})
```

The existing code DOES re-enable the button on failure. So why is it "stuck"? The plan doesn't investigate. Possible causes:
1. `retryQueuedUpload` never resolves (hangs)
2. Success returned but upload still fails (queue not refreshed properly)
3. Event listener attached multiple times

**Iron Law Violation:** "NO FIX WITHOUT ROOT CAUSE IDENTIFIED"

---

### 7. Security - NEEDS ATTENTION

**Issue 1: IPC handler missing input validation (Phase 5, lines 500-527)**

```typescript
ipcMain.handle('check-duplicates', async (_event, { filePaths, galleryId }: { filePaths: string[], galleryId: string }): Promise<DuplicateCheckResult> => {
```

Per the skill file (lines 79-92):
> ❌ **Exposing sensitive functions to renderer**
> // RIGHT: Validate and restrict

The handler should:
1. Validate `galleryId` is a valid UUID format
2. Validate `filePaths` are within expected directories (not system files)
3. Validate array isn't excessively large (DoS protection)

**Issue 2: Path traversal risk**

```typescript
const filename = normalizeFilename(path.basename(filePath))
```

`path.basename` should be safe, but if `filePaths` contains something like `/etc/passwd`, the check runs and leaks whether that file exists. Should validate file extensions before processing.

---

### 8. Performance - ACCEPTABLE

**Concerns noted:**

1. **Serial file processing** - Files uploaded one at a time. For small files, this is slower than parallel. But parallel would complicate state management. Acceptable tradeoff.

2. **Duplicate check is O(n*m)** - Where n=local files, m=existing files. For 1000 files each, that's 1M comparisons. The Set-based approach (line 272-275) makes it O(n+m). Good.

3. **No caching of filenames** - If user adds photos multiple times in one session, they refetch filenames each time. Minor issue.

---

### 9. Testing - INCOMPLETE

**What's provided:**
- API endpoint curl tests
- Manual test steps for duplicate detection
- Resume/retry test steps
- Web integration test steps

**What's missing:**

1. **No unit tests** - The plan doesn't include Jest/Vitest tests for:
   - `normalizeFilename` function
   - `detectDuplicates` function
   - State migration function

2. **No integration test** - How to test the full flow end-to-end in CI?

3. **No error scenario tests** - What to test when:
   - Network fails during duplicate check
   - Gallery is deleted mid-upload
   - Token expires during operation

**Iron Law:** "NO CODE WITHOUT A FAILING TEST FIRST"

The plan should include test file locations and test case outlines.

---

### 10. User Philosophy - MIXED

**Good:**
- Doesn't "quick fix" - properly plans the feature
- Considers UX (confirmation dialog, mode indicator)

**Concern:**
- 15 hours estimate for a feature that could be done simpler
- Scope creep (unifying state systems bundled with add-photos feature)

The user (Nate) wants things "done right" but also doesn't want unnecessary complexity. Unifying two state systems while also adding a new feature is risky - one bug affects both.

---

## Top 3 Concerns

1. **State migration risks** - Unifying queueStore and upload-state is scope creep and risky. Separate this into its own task.

2. **Filename normalization will cause false positives** - The normalization approach doesn't match how files are stored in DB. Will incorrectly flag non-duplicates.

3. **Retry button root cause unknown** - The plan fixes symptoms but doesn't identify why the button gets stuck. This violates the Iron Laws.

---

## Required Changes Before Approval

### Must Fix (Blockers)

1. **Remove state unification from this plan** - Keep existing queue system, add "Add Photos" feature only. Create separate plan for state unification.

2. **Fix filename comparison strategy** - Either:
   - Use exact string match (simple, correct)
   - Or add server-side normalization endpoint that normalizes and returns matches

3. **Investigate retry button root cause** - Add investigation steps before proposing fix. Log statements to identify where it hangs.

4. **Add ZIP handling to duplicate flow** - Currently ZIP extraction happens AFTER startUpload, but duplicate check happens BEFORE. Need to either:
   - Extract ZIP first, then check duplicates
   - Or skip duplicate check for ZIPs (simpler)

5. **Add input validation to IPC handlers** - Per skill file security requirements.

### Should Fix (Important)

6. **Add explicit error handling for duplicate check failure** - Don't silently fall back to "no duplicates."

7. **Add pagination or warning for large galleries** - 10,000 filenames is too many to return in one request.

8. **Specify migration function location and trigger** - When exactly does old state get migrated?

9. **Add test file outlines** - Specify which tests to write and where.

### Nice to Have

10. **Consolidate duplicate-detector into existing file** - Don't create new file for 50 lines of code.

---

## Verdict: NEEDS REVISION

The plan shows good understanding of the codebase and addresses a real need. However, the scope creep (state unification) and the filename normalization bug are serious issues that must be addressed.

**Recommended approach:**
1. Split into two plans: "Add Photos Feature" and "Unified Upload State System"
2. Fix filename comparison to use exact match
3. Add root cause investigation for retry button
4. Add test specifications

Once revised, this plan should be re-reviewed before implementation.

---

*Reviewed against skill file: `electron-skill.md`*
*Codebase files examined: `upload-state.ts`, `upload-manager.ts`, `preload.ts`, `renderer.js`*
