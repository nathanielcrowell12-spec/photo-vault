# QA Critic Review: Electron Window Not Showing Investigation

**Reviewer:** QA Critic Expert
**Date:** 2026-01-01
**Plan Reviewed:** `electron-window-not-showing-investigation.md`
**Related Plan:** `electron-auth-corruption-fix-plan.md`

---

## Executive Summary

The investigation correctly identifies the root cause: the installed app is running old code (Dec 30) that does not contain the auth corruption fix (Jan 1). The proposed fix (rebuild installer) is the correct immediate action. However, the plan has **critical gaps** that could lead to the same problem recurring or other issues going undetected.

**Verdict: APPROVE WITH CONCERNS**

The rebuild will likely fix the immediate issue, but additional safeguards are needed to prevent recurrence and ensure the fix is actually deployed.

---

## Critique Framework Analysis

### 1. COMPLETENESS - Does it address the actual problem?

**Rating: PARTIAL (7/10)**

**What the plan gets right:**
- Correctly identifies timestamp mismatch between installed and dev code
- Correctly traces the error to JSON.parse receiving binary DPAPI garbage
- Correctly identifies the OLD v1 code as the culprit

**What the plan misses:**

1. **No verification that the NEW code actually works**
   - The plan assumes the v2 code in `dist/` is functional
   - There is no evidence that `npm run dist` was ever run successfully after the fix
   - What if the fix itself has bugs? The plan jumps straight to "rebuild and install"

2. **No explanation for WHY the window never shows**
   - The error is in auth restoration, but auth restoration happens AFTER `createWindow()` (line 459 in main.ts)
   - The window should appear even if auth fails
   - Something else is causing the window to not show - this is not investigated

3. **Missing investigation of the `show: false` behavior**
   - Line 82-83 in main.ts: `show: false // Don't show until ready`
   - Line 88-90: `mainWindow.once('ready-to-show', () => { mainWindow?.show() })`
   - If `ready-to-show` never fires (e.g., due to a crash in renderer), window stays hidden
   - This should be investigated

4. **No log review from the NEW code path**
   - If the auth corruption fix is working, it should log specific messages
   - Plan should verify what log messages appear with NEW code running

### 2. CORRECTNESS - Is the root cause analysis sound?

**Rating: GOOD (8/10)**

**What is correct:**
- DPAPI encryption context changes on rebuild - TRUE
- Old code has double encryption bug - TRUE, confirmed in secure-store.ts history
- The error message pattern matches JSON.parse receiving binary data - TRUE
- Old code lacks safeClearAuth and bulletproof try-catch - TRUE

**What is questionable:**

1. **Assumption that timestamp proves old code is running**
   - The app.asar timestamp is Dec 30, but this only proves the PACKAGE was built Dec 30
   - It does not prove the currently RUNNING process loaded that code
   - A process started from the old installer would show these symptoms, but so would:
     - A cached renderer process
     - A preload script mismatch
     - An electron-builder packaging error

2. **The "3 Electron processes" observation is unexplained**
   - Normal Electron app = main process + GPU process + renderer process = 3 processes
   - BUT if the window never shows, something is blocking the renderer
   - This is consistent with a crash in preload.ts or renderer.js, not main.ts

### 3. EDGE CASES - What could still go wrong after the fix?

**Rating: NEEDS IMPROVEMENT (5/10)**

The plan does not consider:

1. **The new installer might have the same problem**
   - If `npm run dist` pulls from a cache or uses old artifacts, the new installer could still contain old code
   - Need: `npm run build && npm run dist` to ensure fresh TypeScript compilation

2. **The corrupted auth file might persist**
   - Plan says "Delete AppData/Roaming/photovault-desktop/ for clean slate"
   - But the NEW code has logic to clean up old files (cleanupOldStoreFile in secure-store.ts)
   - If this cleanup fails (file locked, permissions), auth corruption will recur
   - Need: Verify the cleanup logic works OR provide manual cleanup instructions

3. **DPAPI will corrupt again on next rebuild**
   - The v2 fix HANDLES corruption gracefully, but does not PREVENT it
   - After every rebuild, user will see login screen (expected behavior)
   - This should be documented for the user

4. **Electron auto-updater is disabled but code references remain**
   - Lines 46-57 in main.ts say auto-updater is disabled
   - But if re-enabled in future, same DPAPI problem could recur
   - Need: Add a note about auto-updater considerations

5. **The plaintext fallback was REMOVED from implemented code**
   - The fix plan (electron-auth-corruption-fix-plan.md) includes `plaintextAuth` fallback
   - The IMPLEMENTED code (secure-store.ts) does NOT have this fallback
   - Lines 113-115 in implemented secure-store.ts:
     ```typescript
     if (!safeStorage.isEncryptionAvailable()) {
       logger.warn('[SecureStore] Encryption unavailable - auth will not persist')
       return  // <-- No plaintext fallback!
     }
     ```
   - This is actually GOOD (more secure), but the investigation plan references the wrong behavior

### 4. TECHNICAL DEBT - Is this a proper fix or band-aid?

**Rating: PROPER FIX (9/10)**

The underlying fix (already implemented in dist/) is solid:
- Removes double encryption - correct
- Adds version marker - correct
- Adds safeClearAuth - correct
- Wraps all operations in try-catch - correct
- Cleans up old v1 files - correct

The "rebuild" proposed in the investigation IS the deployment step, not a band-aid.

**However:**
- The investigation plan does not acknowledge that the fix was already implemented
- It presents "rebuild" as if it is discovering the solution
- This could lead to confusion about what work was actually done

### 5. USER'S PHILOSOPHY - Is this done "the right way"?

**Rating: MOSTLY (7/10)**

**Aligns with philosophy:**
- Root cause was identified (not just symptoms)
- Proper fix was implemented (not a quick patch)
- Evidence-based investigation (timestamps, code comparison)

**Violates philosophy:**
- Skips verification step before deployment
- Does not include rollback plan
- No mention of testing on clean machine
- Investigation ended without explaining why window does not show (if auth is the only issue, window SHOULD show)

---

## Critical Questions Not Answered

1. **Why does the window not show even though createWindow() is called BEFORE auth restoration?**
   - This is the biggest gap. The error is in auth, but auth happens after window creation.
   - Hypothesis: The unhandled promise rejection causes Electron to abort render
   - Need: Test with `--enable-logging` flag to see full Electron output

2. **What happens if the new installer ALSO fails?**
   - Plan has no fallback or diagnostic steps
   - Need: Add "If window still does not appear after rebuild, check X, Y, Z"

3. **Was the TypeScript compiled after the fix was written?**
   - The plan notes dist/main.js has Jan 1 timestamp
   - This is good, but does not confirm the TS was compiled CORRECTLY
   - Need: Verify by grep-ing dist/main.js for v2-specific strings

---

## Specific Issues Found

### Issue 1: Missing Build Verification

**Location:** Testing Steps, line 76-80

**Problem:** Steps jump straight to "Install new version" without verifying the build succeeded.

**Recommendation:** Add step between rebuild and install:
```
1.5. Open release/PhotoVault Desktop Setup 1.0.0.exe properties, verify:
     - File size is reasonable (not truncated)
     - Digital signature (if any) is valid

1.6. Extract and inspect app.asar to verify it contains v2 code:
     - npx asar extract "C:\...\app.asar" temp-asar
     - grep "photovault-auth-v2" temp-asar/dist/secure-store.js
```

### Issue 2: Incomplete AppData Cleanup

**Location:** Proposed Fix, step 2

**Problem:** Says "Delete AppData/Roaming/photovault-desktop/" but does not explain:
- What files are in there
- What is safe to delete
- Whether this deletes user preferences or just auth

**Recommendation:** Be specific:
```
2. Clean install:
   - Delete ONLY auth files:
     - C:\Users\natha\AppData\Roaming\photovault-desktop\photovault-auth.json
     - C:\Users\natha\AppData\Roaming\photovault-desktop\photovault-auth-v2.json
   - OR delete entire folder if fresh start is acceptable:
     - C:\Users\natha\AppData\Roaming\photovault-desktop\
     - This will also delete: config.json (if any), logs (in logs/ subfolder)
```

### Issue 3: No Rollback Plan

**Location:** Risk Assessment

**Problem:** Says "Low risk - This is a rebuild, not a code change" but what if rebuild makes things worse?

**Recommendation:** Add:
```
Rollback Plan:
- Keep backup of old installer before rebuild
- If new installer fails, user can restore old installer
- Old installer will still have auth corruption issue, but can be worked around by:
  - Deleting AppData folder before each launch
  - Running in dev mode: npm run start
```

### Issue 4: Window Not Showing Root Cause is Assumed, Not Proven

**Location:** Entire plan

**Problem:** The plan ASSUMES auth corruption causes window to not show. But:
- `createWindow()` is called at line 459 in app.whenReady()
- Auth restoration is at lines 461-487, AFTER createWindow()
- The window has `show: false` initially, and shows on `ready-to-show` event
- If `ready-to-show` never fires, window stays hidden

**The investigation does not prove auth corruption prevents `ready-to-show` from firing.**

**Recommendation:** Add diagnostic step:
```
Additional Investigation (if rebuild does not fix):
1. Check if mainWindow.loadFile() fails silently
2. Add console.log in createWindow() before and after loadFile()
3. Check ui/index.html exists and is valid
4. Look for renderer process crashes in Windows Event Viewer
```

---

## Verdict

### APPROVE WITH CONCERNS

The plan is correct in its diagnosis and the proposed fix (rebuild) will likely work. However:

1. **Before approving for execution**, verify dist/main.js contains v2 code:
   ```bash
   grep "photovault-auth-v2" "C:\Users\natha\.cursor\Photo Vault\photovault-desktop\dist\secure-store.js"
   ```
   This should return matches. If not, TypeScript needs to be recompiled.

2. **Add the build verification step** (Issue 1) to prevent deploying another bad build.

3. **Document the remaining mystery**: Why does window not show if auth fails AFTER window creation? This should be a follow-up investigation item.

4. **Add rollback instructions** for the user.

---

## Suggested Actions Before Proceeding

1. [ ] Verify dist/ contains v2 code (grep for "photovault-auth-v2")
2. [ ] Run `npm run build` in photovault-desktop to ensure fresh TypeScript compilation
3. [ ] Then run `npm run dist` to build installer
4. [ ] Verify new installer timestamp is current
5. [ ] Test on clean user account (not just AppData deletion) if possible
6. [ ] Document in plan that user will need to re-authenticate after update

---

## Appendix: Code Snippets Supporting Analysis

### Evidence that auth happens AFTER window creation (main.ts):

```typescript
// Line 456-492
app.whenReady().then(async () => {
  uploadManager = new TusUploadManager()
  createTray()
  createWindow()  // <-- Window created here

  // Restore auth from secure storage on startup
  // Wrapped in try-catch to ensure app NEVER crashes from auth issues
  try {
    const storedAuth = authStore.getAuth()  // <-- Auth happens AFTER window
    // ...
  } catch (error: unknown) {
    // ...
  }
```

### Evidence of v2 implementation in current secure-store.ts:

```typescript
// Line 53
this.store = new Store({
    name: 'photovault-auth-v2',  // <-- v2 naming
    // NO encryptionKey - we only use safeStorage for encryption
    clearInvalidConfig: true
})
```

### Evidence that plaintext fallback was NOT implemented (differs from plan):

```typescript
// Lines 111-115
if (!safeStorage.isEncryptionAvailable()) {
    logger.warn('[SecureStore] Encryption unavailable - auth will not persist')
    return  // <-- Returns without storing, no plaintextAuth fallback
}
```

---

*Critique generated by QA Critic Expert*
*"What could go wrong?" - Everything that was not tested.*
