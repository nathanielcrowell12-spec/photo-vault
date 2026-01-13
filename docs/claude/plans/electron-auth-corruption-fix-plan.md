# Electron Auth Corruption Fix Plan

**Date:** 2025-01-01
**Priority:** High (App-breaking bug)
**Files Affected:** `photovault-desktop/src/secure-store.ts`, `photovault-desktop/src/main.ts`

---

## Problem Statement

The PhotoVault Desktop app fails to start after rebuilds because the auth store becomes corrupted. The error is:

```
error: Unhandled promise rejection {"error":"Unexpected token '...' is not valid JSON"}
```

The app uses `electron-store` with an `encryptionKey` plus Windows `safeStorage.encryptString()` for double-encryption. When the app is rebuilt/reinstalled, Windows DPAPI encryption keys change, making the stored auth data unreadable.

---

## Root Cause Analysis

### The Problem: Double Encryption with Incompatible Recovery Mechanisms

The current implementation has **two layers of encryption** that interact poorly:

1. **Layer 1: electron-store with `encryptionKey`**
   - Uses AES-256-CBC encryption on the JSON file
   - `clearInvalidConfig: true` should clear the store if JSON parsing fails
   - BUT: This only catches `SyntaxError` during config file reading

2. **Layer 2: Electron's `safeStorage` API**
   - Uses Windows DPAPI to encrypt the auth data string before storing
   - When DPAPI keys change (reinstall, rebuild, user change), decryption fails with a hard error
   - The encrypted string is still valid JSON (it's a base64 string), so `clearInvalidConfig` never triggers
   - `safeStorage.decryptString()` throws an exception on corrupted data

### Why DPAPI Keys Change

According to [Electron's safeStorage documentation](https://www.electronjs.org/docs/latest/api/safe-storage):

> "On Windows, encryption keys are generated via DPAPI. As per the Windows documentation: 'Typically, only a user with the same logon credential as the user who encrypted the data can typically decrypt the data.'"

Key scenarios where DPAPI keys become invalid:
- **App rebuild/reinstall**: DPAPI context may change
- **Windows user profile changes**: Different user = different keys
- **Machine migration**: Encrypted data is tied to the original machine
- **Windows updates/repairs**: Can sometimes reset credential stores

The [GitHub issue #32598](https://github.com/electron/electron/issues/32598) confirms this behavior: "encryption relies on 'user backed credentials' across all platforms. Encrypting data under one Windows user account and attempting decryption under a different user will fail."

### Why `clearInvalidConfig` Doesn't Help

According to [electron-store documentation](https://github.com/sindresorhus/electron-store):

> "The config is cleared if reading the config file causes a SyntaxError."

The catch is: when `safeStorage` encrypted data becomes unreadable, the **stored value is still valid JSON** (a base64-encoded string). The `SyntaxError` only triggers when the JSON file itself is malformed, not when the encrypted content inside fails to decrypt.

### The Current Exception Path

```
1. App starts
2. authStore.getAuth() called in app.whenReady()
3. store.get('auth') returns a valid base64 string (JSON is fine)
4. safeStorage.decryptString() throws: "Error while decrypting the ciphertext"
5. Current catch block logs error but SOMETHING still causes a crash
```

The crash occurs because the error is being swallowed in `getAuth()` but there may be an unhandled promise rejection elsewhere, or the `clearAuth()` call in the catch block is somehow failing.

---

## Research Questions & Answers

### 1. Should we use safeStorage OR electron-store encryption, not both?

**Answer: Use ONLY safeStorage (or only electron-store, but NOT both)**

The double encryption creates several problems:
- `clearInvalidConfig` can't detect safeStorage decryption failures
- Two different failure modes with different recovery paths
- Unnecessary complexity for auth tokens that are short-lived anyway

**Recommendation:** Use only `safeStorage` for encryption. Remove `encryptionKey` from electron-store. The safeStorage API provides OS-level security (Windows Credential Vault, macOS Keychain) which is the industry best practice per [Auth0's Electron security guide](https://auth0.com/blog/securing-electron-applications-with-openid-connect-and-oauth-2/).

### 2. Is `clearInvalidConfig: true` working correctly?

**Answer: Yes, but it's irrelevant to this bug**

`clearInvalidConfig` works as documented - it clears the store when JSON parsing fails. But since the safeStorage-encrypted data is stored as a valid base64 string, the JSON parsing succeeds. The failure happens AFTER parsing, during decryption.

### 3. What's the best practice for persisting auth tokens in Electron?

**Answer:** According to [Cameron Nokes' guide](https://cameronnokes.com/blog/how-to-securely-store-sensitive-information-in-electron-with-node-keytar/) and [Auth0's recommendations](https://auth0.com/blog/securing-electron-applications-with-openid-connect-and-oauth-2/):

1. **Use OS-level secure storage** (safeStorage, keytar, or OS keychain APIs)
2. **Store only refresh tokens** persistently; access tokens are short-lived
3. **Handle token operations in the main process only**
4. **Implement graceful degradation** - if token is corrupted, just clear and re-auth
5. **Use PKCE for OAuth flows** (already implemented in PhotoVault)

### 4. How do we ensure the app ALWAYS starts, even with corrupted data?

**Answer: Defense in depth with multiple layers of protection:**

1. **Wrap all store operations in try-catch** with aggressive error recovery
2. **Add a "corruption marker"** to detect incompatible encryption
3. **Validate decrypted data structure** before using it
4. **Fail open, not closed** - if auth is corrupted, clear it and continue to login screen
5. **Never let store errors propagate** to unhandled rejection handlers

---

## Implementation Plan

### Phase 1: Defensive Wrapper (Immediate Fix)

Add bulletproof error handling that prevents ANY store-related crash.

**File: `secure-store.ts`**

```typescript
import { safeStorage, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import logger from './logger'

const StoreModule = require('electron-store')
const Store = StoreModule.default || StoreModule

interface AuthData {
  token: string
  userId: string
  clientId?: string
  galleryId?: string
}

// Version marker to detect incompatible encryption changes
const AUTH_STORE_VERSION = 2

interface StoredData {
  version: number
  encryptedAuth?: string
  plaintextAuth?: AuthData  // Fallback when safeStorage unavailable
}

export class SecureAuthStore {
  private store: InstanceType<typeof Store> | null = null
  private initError: Error | null = null

  constructor() {
    this.initializeStore()
  }

  private initializeStore(): void {
    try {
      this.store = new Store({
        name: 'photovault-auth-v2', // New name to avoid old corrupted files
        // NO encryptionKey - we only use safeStorage for encryption
        clearInvalidConfig: true
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('[SecureStore] Failed to create store - attempting recovery', { error: errorMessage })
      this.attemptRecovery()
    }
  }

  private attemptRecovery(): void {
    try {
      const configPath = path.join(app.getPath('userData'), 'photovault-auth-v2.json')
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath)
        logger.info('[SecureStore] Deleted corrupted auth file')
      }

      // Also clean up old v1 file if it exists
      const oldConfigPath = path.join(app.getPath('userData'), 'photovault-auth.json')
      if (fs.existsSync(oldConfigPath)) {
        fs.unlinkSync(oldConfigPath)
        logger.info('[SecureStore] Deleted old v1 auth file')
      }

      this.store = new Store({
        name: 'photovault-auth-v2',
        clearInvalidConfig: true
      })
    } catch (recoveryError) {
      const errorMessage = recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      logger.error('[SecureStore] Recovery failed, operating without persistence', { error: errorMessage })
      this.initError = recoveryError instanceof Error ? recoveryError : new Error(errorMessage)
      this.store = null
    }
  }

  saveAuth(data: AuthData): void {
    if (!this.store) {
      logger.warn('[SecureStore] Store unavailable, auth will not persist')
      return
    }

    try {
      const storedData: StoredData = { version: AUTH_STORE_VERSION }

      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(JSON.stringify(data))
        storedData.encryptedAuth = encrypted.toString('base64')
      } else {
        // Fallback: store plaintext (still protected by file permissions)
        storedData.plaintextAuth = data
        logger.warn('[SecureStore] safeStorage unavailable, using plaintext storage')
      }

      this.store.set('data', storedData)
      logger.debug('[SecureStore] Auth data saved for user', { userId: data.userId })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('[SecureStore] Failed to save auth', { error: errorMessage })
      // Don't throw - saving failed but app should continue
    }
  }

  getAuth(): AuthData | null {
    if (!this.store) {
      logger.debug('[SecureStore] Store unavailable, returning null')
      return null
    }

    try {
      const storedData = this.store.get('data') as StoredData | undefined

      if (!storedData) {
        return null
      }

      // Version check - clear if incompatible
      if (storedData.version !== AUTH_STORE_VERSION) {
        logger.info('[SecureStore] Version mismatch, clearing old data', {
          stored: storedData.version,
          expected: AUTH_STORE_VERSION
        })
        this.clearAuth()
        return null
      }

      // Try encrypted auth first
      if (storedData.encryptedAuth) {
        return this.decryptAuth(storedData.encryptedAuth)
      }

      // Fall back to plaintext auth
      if (storedData.plaintextAuth) {
        return this.validateAuthData(storedData.plaintextAuth)
      }

      return null
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('[SecureStore] Failed to get auth - clearing corrupted data', { error: errorMessage })
      this.clearAuth()
      return null
    }
  }

  private decryptAuth(encryptedBase64: string): AuthData | null {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        logger.warn('[SecureStore] safeStorage unavailable, cannot decrypt')
        this.clearAuth()
        return null
      }

      const decrypted = safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'))
      const parsed = JSON.parse(decrypted)
      return this.validateAuthData(parsed)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Check for common DPAPI errors
      if (errorMessage.includes('ciphertext') ||
          errorMessage.includes('decrypt') ||
          errorMessage.includes('DPAPI')) {
        logger.warn('[SecureStore] DPAPI decryption failed (expected after rebuild) - clearing', {
          error: errorMessage
        })
      } else {
        logger.error('[SecureStore] Unexpected decryption error - clearing', { error: errorMessage })
      }

      this.clearAuth()
      return null
    }
  }

  private validateAuthData(data: unknown): AuthData | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    const authData = data as Record<string, unknown>

    if (typeof authData.token !== 'string' || typeof authData.userId !== 'string') {
      logger.warn('[SecureStore] Invalid auth data structure - clearing')
      this.clearAuth()
      return null
    }

    return {
      token: authData.token,
      userId: authData.userId,
      clientId: typeof authData.clientId === 'string' ? authData.clientId : undefined,
      galleryId: typeof authData.galleryId === 'string' ? authData.galleryId : undefined
    }
  }

  clearAuth(): void {
    try {
      if (this.store) {
        this.store.delete('data')
        logger.debug('[SecureStore] Auth data cleared')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('[SecureStore] Failed to clear auth', { error: errorMessage })
      // Last resort: try to delete the file directly
      try {
        const configPath = path.join(app.getPath('userData'), 'photovault-auth-v2.json')
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath)
        }
      } catch {
        // Ignore - we tried everything
      }
    }
  }

  hasAuth(): boolean {
    try {
      if (!this.store) return false
      const data = this.store.get('data') as StoredData | undefined
      return !!(data?.encryptedAuth || data?.plaintextAuth)
    } catch {
      return false
    }
  }

  // Expose initialization error for diagnostics
  getInitError(): Error | null {
    return this.initError
  }
}
```

### Phase 2: Update Main.ts Integration

Ensure the authStore is used safely in main.ts:

**File: `main.ts` (modify the auth restoration section)**

```typescript
// In app.whenReady().then(async () => { ... })

// Restore auth from secure storage on startup
try {
  const storedAuth = authStore.getAuth()
  if (storedAuth) {
    logger.info('[Auth] Restored session for user', {
      userId: storedAuth.userId,
      hasGalleryId: !!storedAuth.galleryId,
      galleryId: storedAuth.galleryId
    })
    // Wait a bit for window to be ready, then notify renderer
    setTimeout(() => {
      mainWindow?.webContents.send('auth-complete', {
        userId: storedAuth.userId,
        token: storedAuth.token,
        clientId: storedAuth.clientId,
        galleryId: storedAuth.galleryId
      })
    }, 500)
  } else {
    logger.info('[Auth] No stored session found - user will need to authenticate')
  }
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  logger.error('[Auth] Failed to restore session - continuing without auth', { error: errorMessage })
  // App continues normally - user just needs to log in again
}
```

### Phase 3: Migration Path

For existing users with corrupted v1 stores:

1. New store uses different filename (`photovault-auth-v2.json`)
2. Constructor deletes old `photovault-auth.json` file
3. Users will need to re-authenticate once after update (acceptable)

---

## Testing Plan

### Unit Tests (if test framework exists)

```typescript
describe('SecureAuthStore', () => {
  it('should return null when store is empty', () => {
    const store = new SecureAuthStore()
    expect(store.getAuth()).toBeNull()
  })

  it('should save and retrieve auth data', () => {
    const store = new SecureAuthStore()
    const authData = { token: 'test', userId: 'user1' }
    store.saveAuth(authData)
    expect(store.getAuth()).toEqual(authData)
  })

  it('should handle corrupted encrypted data gracefully', () => {
    // Simulate corrupted data by manually writing invalid base64
    const store = new SecureAuthStore()
    store['store'].set('data', { version: 2, encryptedAuth: 'not-valid-base64!!!' })
    expect(store.getAuth()).toBeNull() // Should clear and return null
  })

  it('should handle version mismatch', () => {
    const store = new SecureAuthStore()
    store['store'].set('data', { version: 1, encryptedAuth: 'old-data' })
    expect(store.getAuth()).toBeNull() // Should clear old version
  })
})
```

### Manual Testing Checklist

1. **Fresh install test:**
   - [ ] Install app fresh
   - [ ] Authenticate via web
   - [ ] Close app
   - [ ] Reopen app - auth should persist

2. **Rebuild corruption test:**
   - [ ] Authenticate and close app
   - [ ] Run `npm run build` to rebuild
   - [ ] Reopen app
   - [ ] Should show login screen (not crash)
   - [ ] Re-authenticate should work

3. **Old store migration test:**
   - [ ] Keep old `photovault-auth.json` in userData
   - [ ] Install new version
   - [ ] App should start without crash
   - [ ] Old file should be deleted
   - [ ] New `photovault-auth-v2.json` should be created after auth

4. **Store unavailable test:**
   - [ ] Make userData folder read-only
   - [ ] Start app
   - [ ] Should start (with warning in logs)
   - [ ] Auth should work in-memory (until app close)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users need to re-authenticate after update | Certain | Low | Acceptable - one-time inconvenience |
| New bugs in refactored code | Medium | High | Comprehensive testing before release |
| safeStorage still fails after fix | Low | Medium | Code has plaintext fallback |
| Performance impact from extra validation | Very Low | Very Low | Validation is simple JSON checks |

---

## Summary

### Key Changes

1. **Remove double encryption** - Use only safeStorage, remove electron-store encryptionKey
2. **Add version marker** - Detect and clear incompatible stored data
3. **Bulletproof error handling** - Every operation wrapped in try-catch, always fail gracefully
4. **New store filename** - Clean slate, auto-delete old corrupted files
5. **Validate data structure** - Don't trust deserialized data, verify before use

### Why This Works

- **DPAPI failures are caught** at the `safeStorage.decryptString()` call, not later
- **All errors result in clearAuth()** followed by normal app flow (show login)
- **Store operations never throw** to calling code
- **Version markers** allow future-proofing for encryption changes

### Implementation Order

1. Implement new `SecureAuthStore` class
2. Update main.ts auth restoration
3. Test locally with rebuild scenario
4. Deploy to beta testers
5. Monitor logs for any remaining issues

---

## References

- [Electron safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage)
- [electron-store GitHub](https://github.com/sindresorhus/electron-store)
- [Auth0 Electron Security Guide](https://auth0.com/blog/securing-electron-applications-with-openid-connect-and-oauth-2/)
- [GitHub Issue #32598 - safeStorage decryption errors](https://github.com/electron/electron/issues/32598)
- [Windows DPAPI Documentation](https://en.wikipedia.org/wiki/Data_Protection_API)
