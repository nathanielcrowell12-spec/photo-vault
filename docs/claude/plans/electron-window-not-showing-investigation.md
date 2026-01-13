# Electron: Window Not Showing Investigation

## Summary

PhotoVault Desktop processes run but window never appears. Investigation reveals the installed app contains OLD code from Dec 30, while the auth corruption fix was implemented Jan 1.

## Observed Behavior

1. **App processes ARE running** - 3 Electron processes visible in Task Manager
2. **Window NEVER appears** - No UI shows on screen
3. **Error in logs**:
   ```
   {"error":"Unexpected token '�', \"��A��\u000bh���\"... is not valid JSON","level":"error","message":"Unhandled promise rejection"}
   ```

## Evidence Gathered

### Timestamp Analysis

| File | Timestamp | Implication |
|------|-----------|-------------|
| Installed `app.asar` | Dec 30, 2025 8:44 AM | OLD code |
| Dev `dist/main.js` | Jan 1, 2026 5:38 AM | NEW fixed code |
| Installer in `release/` | Dec 30, 2025 8:44 AM | OLD installer |

### Code Comparison

**OLD code (in installed app.asar):**
```javascript
this.store = new Store({
    name: 'photovault-auth',           // OLD v1 filename
    encryptionKey: 'photovault-desktop-v1',  // DOUBLE ENCRYPTION BUG
    clearInvalidConfig: true
});
```

**NEW code (in current dist/):**
```javascript
this.store = new Store({
    name: 'photovault-auth-v2',        // NEW v2 filename
    // NO encryptionKey - single encryption with safeStorage only
    clearInvalidConfig: true
});
// Plus: bulletproof try-catch, recovery logic, safeClearAuth, etc.
```

### Error Analysis

The error shows binary control characters being fed to `JSON.parse()`. This happens when:
1. DPAPI encryption context changes (reinstall, rebuild)
2. Old encrypted data can't be decrypted properly
3. Garbage bytes are passed to JSON.parse instead of valid JSON
4. OLD code lacks proper error handling, causing unhandled rejection

## Root Cause Identified

**The installed app is running OLD v1 code (Dec 30) that doesn't have the auth corruption fix (Jan 1).**

The OLD code:
- Uses double encryption (electron-store encryptionKey + safeStorage DPAPI)
- Lacks bulletproof try-catch around auth restoration
- Doesn't have the v2 store migration
- Crashes on JSON parse errors instead of gracefully recovering

## Proposed Fix

1. **Rebuild installer** with `npm run dist` in photovault-desktop directory
   - This packages the NEW v2 code into a fresh installer
2. **Clean install**:
   - Delete `C:\Users\natha\AppData\Roaming\photovault-desktop\` for clean slate
   - Run new installer
3. **Verify** window appears and app functions

## Testing Steps

1. After rebuild, verify `release/PhotoVault Desktop Setup 1.0.0.exe` has new timestamp (Jan 1 or later)
2. Install new version
3. Verify window appears on launch
4. Check logs for absence of JSON parse errors
5. Test auth flow via web browser

## Files to Modify

| File | Action |
|------|--------|
| `release/PhotoVault Desktop Setup 1.0.0.exe` | Rebuild (will be replaced) |

## Risk Assessment

- **Low risk** - This is a rebuild, not a code change
- The code fix was already implemented and compiled to dist/
- Only packaging step was missed

## Questions for QA Critic

1. Is the timestamp evidence sufficient to conclude old code is installed?
2. Should we add a build verification step to prevent this in future?
3. Are there any other files that might need rebuilding?
