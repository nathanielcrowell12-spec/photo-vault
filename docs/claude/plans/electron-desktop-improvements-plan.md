# Electron Desktop App - Comprehensive Improvement Plan

**Created:** December 6, 2025
**Expert:** Electron & Desktop App Expert
**Status:** Ready for Implementation

---

## Summary

This plan addresses critical issues, feature gaps, and technical debt in the PhotoVault Desktop app. Priority focuses on authentication persistence, configuration improvements, better UX, and cross-platform support. Implementation is organized by priority level with specific code examples and file changes.

---

## Current State Analysis

### Architecture Overview

**Tech Stack:**
- Electron 34.0.0
- TypeScript 5.7.3 (strict mode enabled)
- Custom chunked upload (6MB chunks, NOT TUS despite README claim)
- Supabase JS 2.49.2
- electron-updater 6.6.2

**Key Files:**
- `src/main.ts` (449 lines) - Main process, window lifecycle, IPC handlers
- `src/upload-manager.ts` (272 lines) - Multi-file chunked uploads
- `src/preload.ts` (76 lines) - Secure IPC bridge
- `ui/index.html` + `ui/renderer.js` - Upload UI
- `config.json` - Runtime configuration

### Critical Issues Identified

1. **Auth Token Storage (CRITICAL)**
   - Stored in memory only (`authToken`, `userId`, `clientId` variables in main.ts lines 22-24)
   - Lost on app restart
   - User must re-authenticate every time

2. **Port Conflict (HIGH)**
   - Hardcoded port 57123 (line 304 in main.ts)
   - Will fail if port already in use
   - No fallback or dynamic port allocation

3. **Config URL Mismatch (HIGH)**
   - `config.json` points to `http://localhost:3000`
   - Hub actually runs on port 3002 (per hub CLAUDE.md)
   - Desktop auth flow will fail in development

4. **No Upload ETA (MEDIUM)**
   - Progress shows percentage and bytes only
   - No time remaining or speed calculation
   - Poor UX for large uploads

5. **No Offline Queue (MEDIUM)**
   - Failed uploads are lost
   - No retry queue or resume mechanism
   - User must manually restart

6. **Windows Only (LOW)**
   - Mac/Linux builds not configured in electron-builder
   - Platform-specific code in main.ts (Windows protocol handling)

7. **TypeScript Strictness Gaps**
   - Some `any` types (e.g., error handling)
   - Missing return type annotations in some handlers
   - Inconsistent null checking

---

## Official Documentation References

### Electron Security Best Practices
- **Context Isolation:** ✅ Enabled (main.ts line 34)
- **Node Integration:** ✅ Disabled (main.ts line 33)
- **Context Bridge:** ✅ Used (preload.ts line 5)
- **Protocol Handler:** ✅ Registered (main.ts line 140-146)

**Sources:**
- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/api/context-bridge
- https://www.electronjs.org/docs/latest/api/protocol

### Electron Storage Options
- **electron-store:** Simple key-value store with encryption
- **safeStorage:** System keychain integration (macOS Keychain, Windows Credential Manager)
- **File-based:** encrypted JSON (manual implementation)

**Sources:**
- https://www.electronjs.org/docs/latest/api/safe-storage
- https://github.com/sindresorhus/electron-store

### Auto-Updater
- ✅ Already implemented (main.ts lines 11-16)
- Checks hourly for updates
- Uses electron-updater (industry standard)

**Source:** https://www.electronjs.org/docs/latest/api/auto-updater

### Cross-Platform Builds
- electron-builder supports Windows, Mac, Linux
- Current config only has `win.target: portable`
- Need to add `mac` and `linux` targets

**Source:** https://www.electron.build/configuration/configuration

---

## Implementation Plan - Prioritized

### PRIORITY 1: Critical Fixes (Required for Production)

#### 1.1 Auth Token Persistence with Secure Storage

**Problem:** Tokens stored in memory, lost on restart

**Solution:** Use electron-store with encryption

**Implementation:**

1. Install electron-store:
   ```bash
   npm install electron-store
   ```

2. Create new file `src/secure-store.ts`:
   ```typescript
   import Store from 'electron-store'
   import { safeStorage } from 'electron'

   interface AuthData {
     token: string
     userId: string
     clientId?: string
   }

   export class SecureAuthStore {
     private store: Store

     constructor() {
       this.store = new Store({
         name: 'photovault-auth',
         encryptionKey: 'photovault-desktop-v1', // electron-store will encrypt
         clearInvalidConfig: true
       })
     }

     saveAuth(data: AuthData): void {
       // Use system keychain if available (macOS/Windows)
       if (safeStorage.isEncryptionAvailable()) {
         const encrypted = safeStorage.encryptString(JSON.stringify(data))
         this.store.set('auth', encrypted.toString('base64'))
       } else {
         // Fallback to electron-store encryption
         this.store.set('auth', data)
       }
     }

     getAuth(): AuthData | null {
       const stored = this.store.get('auth')
       if (!stored) return null

       try {
         if (safeStorage.isEncryptionAvailable() && typeof stored === 'string') {
           const decrypted = safeStorage.decryptString(Buffer.from(stored, 'base64'))
           return JSON.parse(decrypted)
         } else {
           return stored as AuthData
         }
       } catch (error) {
         console.error('Failed to decrypt auth data:', error)
         return null
       }
     }

     clearAuth(): void {
       this.store.delete('auth')
     }

     hasAuth(): boolean {
       return this.store.has('auth')
     }
   }
   ```

3. Update `src/main.ts`:
   ```typescript
   import { SecureAuthStore } from './secure-store'

   // Replace lines 22-24 with:
   const authStore = new SecureAuthStore()

   // In app.whenReady() callback (after line 313), add:
   const storedAuth = authStore.getAuth()
   if (storedAuth) {
     console.log('[Auth] Restored session for user:', storedAuth.userId)
     mainWindow?.webContents.send('auth-complete', storedAuth)
   }

   // Replace all authToken/userId/clientId assignments with:
   authStore.saveAuth({ token, userId: userIdParam, clientId: clientIdParam })

   // Update authenticate handler (line 405):
   ipcMain.handle('authenticate', async () => {
     const auth = authStore.getAuth()
     if (auth) {
       return { authenticated: true, ...auth }
     }
     return { authenticated: false }
   })

   // Add logout handler:
   ipcMain.handle('logout', async () => {
     authStore.clearAuth()
     mainWindow?.webContents.send('auth-cleared')
     return { success: true }
   })
   ```

4. Update `src/preload.ts` - Add logout method:
   ```typescript
   contextBridge.exposeInMainWorld('electronAPI', {
     // ... existing methods
     logout: () => ipcRenderer.invoke('logout'),
     onAuthCleared: (callback: () => void) => {
       ipcRenderer.on('auth-cleared', () => callback())
     }
   })
   ```

5. Update `ui/renderer.js` - Handle session restore:
   ```javascript
   // Add after line 296 in DOMContentLoaded:
   window.electronAPI.onAuthCleared(() => {
     isAuthenticated = false
     currentUserId = null
     updateUIForUnauthenticatedState()
     hideAlerts()
   })
   ```

**Files Modified:**
- `src/secure-store.ts` - NEW FILE
- `src/main.ts` - Replace auth variables, add restore logic
- `src/preload.ts` - Add logout method
- `ui/renderer.js` - Handle session restore
- `package.json` - Add electron-store dependency

**Testing:**
1. Sign in to desktop app
2. Close app completely
3. Reopen app
4. Verify user is still authenticated
5. Test logout clears session

---

#### 1.2 Dynamic Port Allocation with Fallback

**Problem:** Hardcoded port 57123 will fail if in use

**Solution:** Try port 57123, fall back to random available port, notify hub

**Implementation:**

1. Create `src/dev-server.ts`:
   ```typescript
   import * as http from 'http'
   import { BrowserWindow } from 'electron'

   const PREFERRED_PORT = 57123
   const PORT_RANGE_START = 57124
   const PORT_RANGE_END = 57200

   interface DevServerOptions {
     mainWindow: BrowserWindow | null
     onAuthReceived: (data: { token: string; userId: string; clientId?: string }) => void
   }

   export async function createDevServer(options: DevServerOptions): Promise<http.Server | null> {
     const { mainWindow, onAuthReceived } = options

     const server = http.createServer((req, res) => {
       // CORS headers
       res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3002')
       res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
       res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

       if (req.method === 'OPTIONS') {
         res.writeHead(200)
         res.end()
         return
       }

       if (req.method === 'POST' && req.url === '/auth') {
         let body = ''
         req.on('data', chunk => { body += chunk.toString() })
         req.on('end', () => {
           try {
             const data = JSON.parse(body)
             const { token, userId, clientId } = data

             if (token && userId) {
               console.log('[Desktop API] Received auth credentials')
               onAuthReceived({ token, userId, clientId })

               if (mainWindow) {
                 mainWindow.show()
                 mainWindow.focus()
               }

               res.writeHead(200, { 'Content-Type': 'application/json' })
               res.end(JSON.stringify({ success: true }))
             } else {
               res.writeHead(400, { 'Content-Type': 'application/json' })
               res.end(JSON.stringify({ error: 'Missing required fields' }))
             }
           } catch (error) {
             console.error('[Desktop API] Error parsing request:', error)
             res.writeHead(400, { 'Content-Type': 'application/json' })
             res.end(JSON.stringify({ error: 'Invalid JSON' }))
           }
         })
       } else {
         res.writeHead(404)
         res.end()
       }
     })

     // Try preferred port first, then fall back
     const port = await findAvailablePort(server, PREFERRED_PORT, PORT_RANGE_START, PORT_RANGE_END)

     if (port) {
       console.log(`[Desktop API] Dev server listening on http://localhost:${port}`)
       if (port !== PREFERRED_PORT) {
         console.warn(`[Desktop API] Using fallback port ${port} (preferred ${PREFERRED_PORT} was in use)`)
       }
       return server
     }

     console.error('[Desktop API] Could not find available port')
     return null
   }

   function findAvailablePort(
     server: http.Server,
     preferredPort: number,
     rangeStart: number,
     rangeEnd: number
   ): Promise<number | null> {
     return new Promise((resolve) => {
       // Try preferred port first
       server.listen(preferredPort, 'localhost', () => {
         resolve(preferredPort)
       })

       server.on('error', (err: NodeJS.ErrnoException) => {
         if (err.code === 'EADDRINUSE') {
           // Try ports in range
           let currentPort = rangeStart
           const tryNextPort = () => {
             if (currentPort > rangeEnd) {
               resolve(null)
               return
             }

             server.removeAllListeners('error')
             server.listen(currentPort, 'localhost', () => {
               resolve(currentPort)
             })

             server.on('error', (err: NodeJS.ErrnoException) => {
               if (err.code === 'EADDRINUSE') {
                 currentPort++
                 tryNextPort()
               } else {
                 resolve(null)
               }
             })
           }
           tryNextPort()
         } else {
           resolve(null)
         }
       })
     })
   }
   ```

2. Update `src/main.ts` - Replace createDevServer function (lines 244-309):
   ```typescript
   import { createDevServer } from './dev-server'

   // In app.whenReady() (replace lines 317-320):
   if (process.env.NODE_ENV !== 'production') {
     createDevServer({
       mainWindow,
       onAuthReceived: (data) => {
         authStore.saveAuth(data)
         mainWindow?.webContents.send('auth-complete', data)
       }
     })
   }
   ```

**Files Modified:**
- `src/dev-server.ts` - NEW FILE
- `src/main.ts` - Use new dev server

**Testing:**
1. Start app normally (should use port 57123)
2. Start another process on port 57123
3. Start app again (should fall back to 57124+)
4. Check console for port message

---

#### 1.3 Fix Config URL Mismatch

**Problem:** `config.json` points to localhost:3000, hub runs on 3002

**Solution:** Update config.json and make port configurable via environment

**Implementation:**

1. Update `config.json`:
   ```json
   {
     "supabaseUrl": "https://gqmycgopitxpjkxzrnyv.supabase.co",
     "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDMzNTYsImV4cCI6MjA3NTMxOTM1Nn0.SnVgf6NQ0jMvUz7n6kxB8u2TsJt846KOImGYocpxbjw",
     "photoVaultWebUrl": "http://localhost:3002",
     "environment": "development",
     "autoUpdate": false,
     "appName": "PhotoVault Desktop",
     "version": "1.0.0"
   }
   ```

2. Update `.env.example`:
   ```bash
   SUPABASE_URL=https://gqmycgopitxpjkxzrnyv.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   PHOTOVAULT_WEB_URL=http://localhost:3002
   NODE_ENV=development
   ```

3. Update `src/dev-server.ts` - Dynamic CORS origin:
   ```typescript
   // Replace line with hardcoded origin:
   const webUrl = process.env.PHOTOVAULT_WEB_URL || 'http://localhost:3002'
   res.setHeader('Access-Control-Allow-Origin', webUrl)
   ```

**Files Modified:**
- `config.json` - Change port from 3000 to 3002
- `.env.example` - Update example
- `src/dev-server.ts` - Dynamic CORS origin

---

### PRIORITY 2: Feature Improvements (Better UX)

#### 2.1 Upload ETA and Speed Estimation

**Problem:** No time estimate or speed display

**Solution:** Track upload speed with rolling average, calculate ETA

**Implementation:**

1. Update `src/upload-manager.ts` - Add speed tracking:
   ```typescript
   interface UploadStatus {
     uploadId: string
     fileName: string
     fileSize: number
     bytesUploaded: number
     progress: number
     status: 'preparing' | 'uploading' | 'completed' | 'error' | 'cancelled'
     error?: string
     // NEW FIELDS:
     startTime?: number
     lastUpdateTime?: number
     uploadSpeed?: number // bytes per second
     estimatedTimeRemaining?: number // seconds
   }

   export class TusUploadManager extends EventEmitter {
     private uploadStatuses: Map<string, UploadStatus> = new Map()
     private speedSamples: Map<string, number[]> = new Map() // Rolling window of speeds

     async startUpload(options: UploadOptions): Promise<string> {
       // ... existing code until line 89

       const status: UploadStatus = {
         uploadId,
         fileName: fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`,
         fileSize: totalSize,
         bytesUploaded: 0,
         progress: 0,
         status: 'preparing',
         startTime: Date.now(),
         lastUpdateTime: Date.now(),
         uploadSpeed: 0,
         estimatedTimeRemaining: 0
       }
       this.uploadStatuses.set(uploadId, status)
       this.speedSamples.set(uploadId, [])

       // ... rest of method
     }

     private updateProgress(
       uploadId: string,
       bytesUploaded: number,
       totalSize: number,
       currentFileName: string
     ): void {
       const status = this.uploadStatuses.get(uploadId)
       if (!status) return

       const now = Date.now()
       const timeSinceLastUpdate = (now - (status.lastUpdateTime || now)) / 1000 // seconds
       const bytesSinceLastUpdate = bytesUploaded - status.bytesUploaded

       // Calculate instantaneous speed
       const instantSpeed = timeSinceLastUpdate > 0
         ? bytesSinceLastUpdate / timeSinceLastUpdate
         : 0

       // Maintain rolling window of last 10 speed samples
       const samples = this.speedSamples.get(uploadId) || []
       samples.push(instantSpeed)
       if (samples.length > 10) samples.shift()
       this.speedSamples.set(uploadId, samples)

       // Calculate average speed from samples
       const avgSpeed = samples.reduce((sum, s) => sum + s, 0) / samples.length

       // Calculate ETA
       const bytesRemaining = totalSize - bytesUploaded
       const eta = avgSpeed > 0 ? bytesRemaining / avgSpeed : 0

       // Update status
       status.bytesUploaded = bytesUploaded
       status.progress = (bytesUploaded / totalSize) * 100
       status.lastUpdateTime = now
       status.uploadSpeed = avgSpeed
       status.estimatedTimeRemaining = eta
       status.status = 'uploading'
       this.uploadStatuses.set(uploadId, status)

       this.emit('progress', uploadId, {
         bytesUploaded,
         bytesTotal: totalSize,
         progress: status.progress,
         fileName: currentFileName,
         uploadSpeed: avgSpeed,
         estimatedTimeRemaining: eta
       })
     }

     // Replace existing progress emit (line 200) with call to updateProgress:
     // this.updateProgress(uploadId, totalBytesUploaded, totalSize, `${fileIndex + 1}/${filePaths.length} files`)
   }
   ```

2. Update `ui/renderer.js` - Display speed and ETA:
   ```javascript
   // Replace onUploadProgress handler (lines 241-246):
   window.electronAPI.onUploadProgress((data) => {
     const { progress, bytesUploaded, bytesTotal, uploadSpeed, estimatedTimeRemaining } = data.progress

     progressFill.style.width = `${progress}%`

     // Format speed
     const speedMBps = uploadSpeed ? (uploadSpeed / 1024 / 1024).toFixed(2) : '0.00'

     // Format ETA
     let etaText = ''
     if (estimatedTimeRemaining && estimatedTimeRemaining > 0) {
       const minutes = Math.floor(estimatedTimeRemaining / 60)
       const seconds = Math.floor(estimatedTimeRemaining % 60)
       etaText = minutes > 0
         ? ` • ${minutes}m ${seconds}s remaining`
         : ` • ${seconds}s remaining`
     }

     progressText.textContent = `Uploading... ${progress.toFixed(1)}% (${(bytesUploaded / 1024 / 1024).toFixed(2)} MB / ${(bytesTotal / 1024 / 1024).toFixed(2)} MB) • ${speedMBps} MB/s${etaText}`
   })
   ```

**Files Modified:**
- `src/upload-manager.ts` - Add speed tracking and ETA calculation
- `ui/renderer.js` - Display speed and ETA in progress bar

**Testing:**
1. Start upload
2. Verify speed shows in MB/s
3. Verify ETA counts down
4. Check that ETA is reasonably accurate

---

#### 2.2 Offline Queue for Failed Uploads

**Problem:** Failed uploads are lost, no retry mechanism

**Solution:** Persist failed uploads to electron-store, retry on app start or network restore

**Implementation:**

1. Update `src/upload-manager.ts` - Add queue persistence:
   ```typescript
   import Store from 'electron-store'

   interface QueuedUpload {
     id: string
     options: UploadOptions
     failedAt: number
     retryCount: number
     error?: string
   }

   export class TusUploadManager extends EventEmitter {
     private uploadStatuses: Map<string, UploadStatus> = new Map()
     private speedSamples: Map<string, number[]> = new Map()
     private queueStore: Store<{ uploads: QueuedUpload[] }>

     constructor() {
       super()
       this.queueStore = new Store({
         name: 'photovault-upload-queue',
         defaults: { uploads: [] }
       })
     }

     // Add to failed uploads queue
     private addToQueue(uploadId: string, options: UploadOptions, error: string): void {
       const queue = this.queueStore.get('uploads')
       const existing = queue.find(u => u.id === uploadId)

       if (existing) {
         existing.retryCount++
         existing.failedAt = Date.now()
         existing.error = error
       } else {
         queue.push({
           id: uploadId,
           options,
           failedAt: Date.now(),
           retryCount: 1,
           error
         })
       }

       this.queueStore.set('uploads', queue)
       console.log(`[Queue] Added upload ${uploadId} to retry queue (attempt ${existing?.retryCount || 1})`)
     }

     // Get queued uploads
     getQueuedUploads(): QueuedUpload[] {
       return this.queueStore.get('uploads')
     }

     // Retry queued upload
     async retryQueuedUpload(uploadId: string): Promise<string | null> {
       const queue = this.queueStore.get('uploads')
       const queued = queue.find(u => u.id === uploadId)

       if (!queued) return null

       try {
         console.log(`[Queue] Retrying upload ${uploadId}`)
         const newUploadId = await this.startUpload(queued.options)

         // Remove from queue on success
         this.queueStore.set('uploads', queue.filter(u => u.id !== uploadId))
         return newUploadId
       } catch (error: any) {
         console.error(`[Queue] Retry failed for ${uploadId}:`, error)
         queued.retryCount++
         queued.failedAt = Date.now()
         queued.error = error.message
         this.queueStore.set('uploads', queue)
         return null
       }
     }

     // Clear queue
     clearQueue(): void {
       this.queueStore.set('uploads', [])
     }

     // In startUpload catch block (line 248), replace throw with:
     catch (error: any) {
       console.error('[DESKTOP] Failed to start upload:', error)
       const status = this.uploadStatuses.get(uploadId)
       if (status) {
         status.status = 'error'
         status.error = error.message
         this.uploadStatuses.set(uploadId, status)
       }

       // Add to offline queue
       this.addToQueue(uploadId, options, error.message)

       this.emit('error', uploadId, error.message)
       throw error
     }
   }
   ```

2. Add IPC handlers in `src/main.ts`:
   ```typescript
   ipcMain.handle('get-queued-uploads', async () => {
     if (!uploadManager) return []
     return uploadManager.getQueuedUploads()
   })

   ipcMain.handle('retry-queued-upload', async (event, uploadId: string) => {
     if (!uploadManager) return { success: false, error: 'Upload manager not initialized' }
     try {
       const newUploadId = await uploadManager.retryQueuedUpload(uploadId)
       return { success: true, uploadId: newUploadId }
     } catch (error: any) {
       return { success: false, error: error.message }
     }
   })

   ipcMain.handle('clear-upload-queue', async () => {
     if (!uploadManager) return { success: false }
     uploadManager.clearQueue()
     return { success: true }
   })
   ```

3. Update `src/preload.ts`:
   ```typescript
   contextBridge.exposeInMainWorld('electronAPI', {
     // ... existing methods
     getQueuedUploads: () => ipcRenderer.invoke('get-queued-uploads'),
     retryQueuedUpload: (uploadId: string) => ipcRenderer.invoke('retry-queued-upload', uploadId),
     clearUploadQueue: () => ipcRenderer.invoke('clear-upload-queue')
   })
   ```

4. Add queue UI in `ui/index.html` (after progress container):
   ```html
   <div id="queue-container" class="queue-container" style="display: none;">
     <h3>Failed Uploads</h3>
     <div id="queue-list" class="queue-list"></div>
     <button id="retry-all-btn" class="btn btn-secondary">Retry All</button>
     <button id="clear-queue-btn" class="btn btn-secondary">Clear Queue</button>
   </div>
   ```

5. Update `ui/renderer.js` - Add queue management:
   ```javascript
   // Check for queued uploads on load
   async function checkQueue() {
     const queued = await window.electronAPI.getQueuedUploads()
     if (queued.length > 0) {
       document.getElementById('queue-container').style.display = 'block'
       renderQueue(queued)
     }
   }

   function renderQueue(queued) {
     const queueList = document.getElementById('queue-list')
     queueList.innerHTML = queued.map(item => `
       <div class="queue-item" data-id="${item.id}">
         <div class="queue-info">
           <strong>${item.options.galleryName}</strong>
           <span>${item.options.filePaths.length} file(s)</span>
           <span class="error-text">${item.error}</span>
           <span>Attempt ${item.retryCount}</span>
         </div>
         <button class="retry-btn" data-id="${item.id}">Retry</button>
       </div>
     `).join('')

     // Attach retry handlers
     document.querySelectorAll('.retry-btn').forEach(btn => {
       btn.addEventListener('click', async (e) => {
         const uploadId = e.target.dataset.id
         const result = await window.electronAPI.retryQueuedUpload(uploadId)
         if (result.success) {
           showStatus('Retrying upload...')
           checkQueue() // Refresh queue
         } else {
           showError('Retry failed: ' + result.error)
         }
       })
     })
   }

   document.getElementById('retry-all-btn').addEventListener('click', async () => {
     const queued = await window.electronAPI.getQueuedUploads()
     for (const item of queued) {
       await window.electronAPI.retryQueuedUpload(item.id)
     }
     checkQueue()
   })

   document.getElementById('clear-queue-btn').addEventListener('click', async () => {
     await window.electronAPI.clearUploadQueue()
     document.getElementById('queue-container').style.display = 'none'
   })

   // Call on page load (add to DOMContentLoaded)
   checkQueue()
   ```

**Files Modified:**
- `src/upload-manager.ts` - Add queue persistence
- `src/main.ts` - Add queue IPC handlers
- `src/preload.ts` - Expose queue methods
- `ui/index.html` - Add queue UI
- `ui/renderer.js` - Queue management logic

**Testing:**
1. Start upload, then kill network
2. Upload should fail and appear in queue
3. Restore network, click "Retry"
4. Verify upload resumes

---

#### 2.3 Better Progress UI

**Problem:** Plain text progress bar, no visual polish

**Solution:** Enhanced progress UI with file thumbnails, better animations

**Implementation:**

1. Update `ui/index.html` - Enhanced progress section:
   ```html
   <div id="progress-container" class="progress-container">
     <div class="upload-preview">
       <div id="file-preview" class="file-preview">
         <!-- Icon or thumbnail will go here -->
       </div>
       <div class="upload-details">
         <h4 id="upload-title">Uploading...</h4>
         <p id="upload-stats" class="upload-stats"></p>
       </div>
     </div>

     <div class="progress-bar-wrapper">
       <div class="progress-bar">
         <div id="progress-fill" class="progress-fill"></div>
       </div>
       <span id="progress-text" class="progress-text">0%</span>
     </div>

     <button id="cancel-btn" class="btn btn-danger" disabled>Cancel Upload</button>
   </div>
   ```

2. Add CSS styling (in `ui/index.html` <style> section):
   ```css
   .progress-container {
     margin-top: 20px;
     padding: 20px;
     background: #f8f9fa;
     border-radius: 8px;
     display: none;
   }

   .progress-container.visible {
     display: block;
     animation: slideIn 0.3s ease-out;
   }

   @keyframes slideIn {
     from { opacity: 0; transform: translateY(-10px); }
     to { opacity: 1; transform: translateY(0); }
   }

   .upload-preview {
     display: flex;
     align-items: center;
     margin-bottom: 15px;
   }

   .file-preview {
     width: 60px;
     height: 60px;
     background: #e9ecef;
     border-radius: 8px;
     display: flex;
     align-items: center;
     justify-content: center;
     margin-right: 15px;
     font-size: 24px;
   }

   .upload-details h4 {
     margin: 0 0 5px 0;
     font-size: 16px;
     color: #212529;
   }

   .upload-stats {
     margin: 0;
     font-size: 13px;
     color: #6c757d;
   }

   .progress-bar-wrapper {
     display: flex;
     align-items: center;
     gap: 10px;
     margin-bottom: 15px;
   }

   .progress-bar {
     flex: 1;
     height: 8px;
     background: #e9ecef;
     border-radius: 4px;
     overflow: hidden;
   }

   .progress-fill {
     height: 100%;
     background: linear-gradient(90deg, #0066cc, #0080ff);
     border-radius: 4px;
     transition: width 0.3s ease-out;
     animation: pulse 2s ease-in-out infinite;
   }

   @keyframes pulse {
     0%, 100% { opacity: 1; }
     50% { opacity: 0.8; }
   }

   .progress-text {
     min-width: 45px;
     font-size: 14px;
     font-weight: 600;
     color: #212529;
   }
   ```

3. Update `ui/renderer.js` - Enhanced progress display:
   ```javascript
   window.electronAPI.onUploadProgress((data) => {
     const { progress, bytesUploaded, bytesTotal, uploadSpeed, estimatedTimeRemaining, fileName } = data.progress

     // Update progress bar
     progressFill.style.width = `${progress}%`
     progressText.textContent = `${progress.toFixed(0)}%`

     // Update file icon (use emoji for now, could be image later)
     const filePreview = document.getElementById('file-preview')
     filePreview.innerHTML = selectedFiles.length === 1 ? '📦' : '📁'

     // Update title
     const uploadTitle = document.getElementById('upload-title')
     uploadTitle.textContent = fileName || galleryNameInput.value

     // Update stats
     const uploadStats = document.getElementById('upload-stats')
     const speedMBps = uploadSpeed ? (uploadSpeed / 1024 / 1024).toFixed(2) : '0.00'
     const uploadedMB = (bytesUploaded / 1024 / 1024).toFixed(2)
     const totalMB = (bytesTotal / 1024 / 1024).toFixed(2)

     let etaText = ''
     if (estimatedTimeRemaining && estimatedTimeRemaining > 0) {
       const minutes = Math.floor(estimatedTimeRemaining / 60)
       const seconds = Math.floor(estimatedTimeRemaining % 60)
       etaText = minutes > 0
         ? `${minutes}m ${seconds}s remaining`
         : `${seconds}s remaining`
     }

     uploadStats.textContent = `${uploadedMB} MB / ${totalMB} MB • ${speedMBps} MB/s${etaText ? ' • ' + etaText : ''}`
   })
   ```

**Files Modified:**
- `ui/index.html` - Enhanced progress UI structure and CSS
- `ui/renderer.js` - Update progress display logic

---

### PRIORITY 3: Code Quality & Developer Experience

#### 3.1 TypeScript Strict Mode Improvements

**Current Issues:**
- `any` types in error handling
- Missing return type annotations
- Inconsistent null checking

**Implementation:**

1. Update `src/upload-manager.ts`:
   ```typescript
   // Add explicit error type
   interface UploadError extends Error {
     code?: string
     statusCode?: number
   }

   // Replace `catch (error: any)` with:
   catch (error: unknown) {
     const uploadError = error as UploadError
     console.error('[DESKTOP] Failed to start upload:', uploadError)
     // ... rest
   }

   // Add explicit return types to all methods
   async startUpload(options: UploadOptions): Promise<string> { ... }
   async cancelUpload(uploadId: string): Promise<void> { ... }
   getUploadStatus(uploadId: string): UploadStatus | undefined { ... }
   ```

2. Update `src/main.ts`:
   ```typescript
   // Add return types to IPC handlers
   ipcMain.handle('select-file', async (): Promise<string[] | null> => {
     // ...
   })

   ipcMain.handle('start-upload', async (event, options): Promise<{ success: boolean; uploadId?: string; error?: string }> => {
     // ...
   })

   // Replace error handling
   catch (error: unknown) {
     const err = error as Error
     return { success: false, error: err.message }
   }
   ```

3. Enable additional strict checks in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "strictNullChecks": true,
       "noImplicitAny": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "moduleResolution": "node"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

**Files Modified:**
- `src/upload-manager.ts` - Fix error types, add return types
- `src/main.ts` - Add IPC handler return types
- `tsconfig.json` - Enable additional strict checks

---

#### 3.2 Structured Logging System

**Problem:** Inconsistent console.log statements

**Solution:** Structured logger with levels and file output

**Implementation:**

1. Install winston (production-grade logger):
   ```bash
   npm install winston
   ```

2. Create `src/logger.ts`:
   ```typescript
   import winston from 'winston'
   import * as path from 'path'
   import { app } from 'electron'

   const logDir = app.getPath('logs')

   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       // Write all logs to file
       new winston.transports.File({
         filename: path.join(logDir, 'photovault-desktop.log'),
         maxsize: 5242880, // 5MB
         maxFiles: 5,
       }),
       // Write errors to separate file
       new winston.transports.File({
         filename: path.join(logDir, 'error.log'),
         level: 'error',
         maxsize: 5242880,
         maxFiles: 5,
       }),
     ],
   })

   // Also log to console in development
   if (process.env.NODE_ENV !== 'production') {
     logger.add(new winston.transports.Console({
       format: winston.format.combine(
         winston.format.colorize(),
         winston.format.simple()
       ),
     }))
   }

   export default logger
   ```

3. Replace console.log calls in `src/main.ts`:
   ```typescript
   import logger from './logger'

   // Replace console.log with:
   logger.info('App is ready')
   logger.error('Upload failed', { error: err.message, uploadId })
   logger.debug('Auth token received', { userId })
   ```

4. Add log viewer menu item in tray (src/main.ts):
   ```typescript
   const contextMenu = Menu.buildFromTemplate([
     // ... existing items
     { type: 'separator' },
     {
       label: 'View Logs',
       click: () => {
         shell.openPath(app.getPath('logs'))
       }
     },
     // ... rest
   ])
   ```

**Files Modified:**
- `src/logger.ts` - NEW FILE
- `src/main.ts` - Replace console.log with logger
- `src/upload-manager.ts` - Replace console.log with logger
- `package.json` - Add winston dependency

---

### PRIORITY 4: Cross-Platform Support

#### 4.1 Mac & Linux Build Configuration

**Problem:** Only Windows builds configured

**Solution:** Add Mac and Linux targets to electron-builder

**Implementation:**

1. Update `package.json` build config:
   ```json
   {
     "build": {
       "appId": "com.photovault.desktop",
       "productName": "PhotoVault Desktop",
       "directories": {
         "output": "release"
       },
       "files": [
         "dist/**/*",
         "assets/**/*",
         "ui/**/*",
         "config.json",
         "package.json"
       ],
       "win": {
         "target": ["nsis", "portable"],
         "icon": "assets/icon.ico"
       },
       "mac": {
         "target": ["dmg", "zip"],
         "category": "public.app-category.photography",
         "icon": "assets/icon.icns",
         "hardenedRuntime": true,
         "gatekeeperAssess": false,
         "entitlements": "build/entitlements.mac.plist",
         "entitlementsInherit": "build/entitlements.mac.plist"
       },
       "linux": {
         "target": ["AppImage", "deb"],
         "category": "Photography",
         "icon": "assets/icon.png"
       },
       "dmg": {
         "contents": [
           {
             "x": 130,
             "y": 220
           },
           {
             "x": 410,
             "y": 220,
             "type": "link",
             "path": "/Applications"
           }
         ]
       }
     }
   }
   ```

2. Create Mac entitlements file `build/entitlements.mac.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
       <true/>
       <key>com.apple.security.cs.allow-jit</key>
       <true/>
       <key>com.apple.security.network.client</key>
       <true/>
       <key>com.apple.security.network.server</key>
       <true/>
   </dict>
   </plist>
   ```

3. Create icon assets:
   - Windows: `assets/icon.ico` (256x256)
   - Mac: `assets/icon.icns` (512x512@2x)
   - Linux: `assets/icon.png` (512x512)

4. Update `src/main.ts` for cross-platform protocol handling:
   ```typescript
   // Replace Windows-only protocol handling (lines 140-146) with:
   if (process.platform === 'darwin') {
     // macOS: protocol is registered via Info.plist in build
     app.setAsDefaultProtocolClient('photovault')
   } else if (process.platform === 'win32') {
     // Windows: set protocol in development or production
     if (process.defaultApp) {
       if (process.argv.length >= 2) {
         app.setAsDefaultProtocolClient('photovault', process.execPath, [path.resolve(process.argv[1])])
       }
     } else {
       app.setAsDefaultProtocolClient('photovault')
     }
   } else {
     // Linux: protocol handled via .desktop file in package
     app.setAsDefaultProtocolClient('photovault')
   }
   ```

5. Add build scripts to `package.json`:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "npm run build && electron .",
       "dev": "concurrently \"tsc -w\" \"electron .\"",
       "pack": "electron-builder --dir",
       "dist": "electron-builder",
       "dist:win": "electron-builder --win",
       "dist:mac": "electron-builder --mac",
       "dist:linux": "electron-builder --linux",
       "dist:all": "electron-builder -mwl"
     }
   }
   ```

**Files Created:**
- `build/entitlements.mac.plist` - NEW FILE
- `assets/icon.icns` - NEW FILE (Mac icon)
- `assets/icon.ico` - NEW FILE (Windows icon)

**Files Modified:**
- `package.json` - Add Mac/Linux build targets
- `src/main.ts` - Cross-platform protocol handling

**Building:**
```bash
# Windows (from Windows machine)
npm run dist:win

# Mac (from Mac machine - requires Xcode)
npm run dist:mac

# Linux (from any Unix machine)
npm run dist:linux

# All platforms (requires Mac for macOS build)
npm run dist:all
```

**Notes:**
- Mac builds require macOS and Xcode Command Line Tools
- Code signing for Mac requires Apple Developer account ($99/year)
- Windows code signing requires certificate (~$200/year)
- Linux builds work from any Unix-based OS

---

### PRIORITY 5: Security Enhancements

#### 5.1 Code Signing Preparation

**Problem:** Unsigned apps trigger security warnings

**Solution:** Set up code signing infrastructure

**Implementation:**

1. Create `build/code-signing-setup.md`:
   ```markdown
   # Code Signing Setup

   ## Windows Code Signing

   1. Purchase code signing certificate from:
      - DigiCert ($200-400/year)
      - Sectigo ($200-300/year)
      - SSL.com ($200-300/year)

   2. Add certificate to build config in package.json:
      ```json
      "win": {
        "certificateFile": "certs/windows-cert.pfx",
        "certificatePassword": "${WINDOWS_CERT_PASSWORD}"
      }
      ```

   3. Set environment variable:
      ```bash
      set WINDOWS_CERT_PASSWORD=your_password
      ```

   ## macOS Code Signing

   1. Join Apple Developer Program ($99/year)
   2. Create Developer ID Application certificate in Xcode
   3. Add to build config:
      ```json
      "mac": {
        "identity": "Developer ID Application: Your Name (TEAM_ID)"
      }
      ```

   4. Set up notarization (required for macOS 10.15+):
      ```json
      "afterSign": "scripts/notarize.js"
      ```

   5. Create notarization script (scripts/notarize.js):
      ```javascript
      const { notarize } = require('electron-notarize')

      exports.default = async function notarizing(context) {
        const { electronPlatformName, appOutDir } = context
        if (electronPlatformName !== 'darwin') return

        const appName = context.packager.appInfo.productFilename

        return await notarize({
          appBundleId: 'com.photovault.desktop',
          appPath: `${appOutDir}/${appName}.app`,
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_ID_PASSWORD,
        })
      }
      ```

   6. Set environment variables:
      ```bash
      export APPLE_ID="your-apple-id@example.com"
      export APPLE_ID_PASSWORD="app-specific-password"
      ```

   ## Linux

   No code signing required - package managers handle verification.
   ```

2. Update `.gitignore`:
   ```
   # Code signing certificates (never commit these!)
   certs/
   *.pfx
   *.p12
   *.cer
   *.pem

   # Environment files with signing credentials
   .env.signing
   ```

**Files Created:**
- `build/code-signing-setup.md` - NEW FILE

**Files Modified:**
- `.gitignore` - Exclude certificate files

**Notes:**
- Code signing is optional for beta testing
- Required for production distribution
- Costs ~$300-500/year for both platforms

---

#### 5.2 Environment Variable Security

**Problem:** Supabase keys in config.json (committed to git)

**Solution:** Use .env for secrets, config.json for non-sensitive settings only

**Implementation:**

1. Update `config.json` - Remove secrets:
   ```json
   {
     "environment": "development",
     "autoUpdate": false,
     "appName": "PhotoVault Desktop",
     "version": "1.0.0"
   }
   ```

2. Update `.env.example`:
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://gqmycgopitxpjkxzrnyv.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here

   # Hub URL (change based on environment)
   PHOTOVAULT_WEB_URL=http://localhost:3002

   # Environment
   NODE_ENV=development

   # Logging
   LOG_LEVEL=info
   ```

3. Update `src/upload-manager.ts` to use env vars only:
   ```typescript
   // Replace lines 6-24 with:
   let config = {
     supabaseUrl: process.env.SUPABASE_URL || '',
     supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
     webUrl: process.env.PHOTOVAULT_WEB_URL || 'http://localhost:3002'
   }

   if (!config.supabaseUrl || !config.supabaseAnonKey) {
     throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set')
   }

   const supabase = createClient(
     config.supabaseUrl,
     config.supabaseAnonKey
   )
   ```

4. Update `.gitignore`:
   ```
   # Environment files
   .env
   .env.local
   .env.production

   # Keep config.json but warn in README
   # config.json
   ```

5. Add validation in `src/main.ts`:
   ```typescript
   // After dotenv.config() on line 8:
   const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PHOTOVAULT_WEB_URL']
   const missing = requiredEnvVars.filter(key => !process.env[key])

   if (missing.length > 0) {
     dialog.showErrorBox(
       'Configuration Error',
       `Missing required environment variables:\n\n${missing.join('\n')}\n\nPlease create a .env file based on .env.example`
     )
     app.quit()
   }
   ```

**Files Modified:**
- `config.json` - Remove secrets
- `.env.example` - Complete example
- `src/upload-manager.ts` - Use env vars only
- `src/main.ts` - Validate env vars on startup
- `.gitignore` - Protect .env files

**Migration for Existing Developers:**
1. Copy config.json values to .env
2. Delete config.json secrets
3. Restart app

---

## Testing Plan

### Unit Tests (Future Enhancement)

Create `tests/` directory with:
- `upload-manager.test.ts` - Test chunked upload logic
- `secure-store.test.ts` - Test auth storage
- `dev-server.test.ts` - Test port allocation

**Framework:** Jest + Spectron (Electron testing)

### Manual Testing Checklist

**Authentication:**
- [ ] Sign in persists across app restart
- [ ] Logout clears stored credentials
- [ ] Auth flow works on localhost:3002
- [ ] Protocol handler receives auth callback

**Upload:**
- [ ] Single file upload shows progress
- [ ] Multi-file upload works
- [ ] Upload speed and ETA display correctly
- [ ] Failed uploads added to queue
- [ ] Retry queue works after network restore
- [ ] Cancel upload stops and clears progress

**Port Allocation:**
- [ ] App starts on port 57123 by default
- [ ] Falls back to 57124+ if 57123 in use
- [ ] Console shows port message
- [ ] Hub can communicate on fallback port

**Cross-Platform:**
- [ ] Windows: Builds as .exe installer
- [ ] Mac: Builds as .dmg (if on Mac)
- [ ] Linux: Builds as AppImage (if on Linux)
- [ ] Protocol handler works on each OS

**UI/UX:**
- [ ] Progress bar animates smoothly
- [ ] Queue UI shows failed uploads
- [ ] Tray icon shows on Windows/Mac/Linux
- [ ] Drag-and-drop works
- [ ] File selection works

---

## Deployment Checklist

### Pre-Release

1. **Code Signing**
   - [ ] Obtain Windows code signing certificate
   - [ ] Obtain Apple Developer ID
   - [ ] Set up notarization for macOS
   - [ ] Test signed builds

2. **Environment Configuration**
   - [ ] Create production .env.example
   - [ ] Document environment variable setup
   - [ ] Test with production Supabase URL

3. **Build Testing**
   - [ ] Test Windows installer
   - [ ] Test Mac DMG
   - [ ] Test Linux AppImage
   - [ ] Verify auto-updater works

### Release Process

1. **Version Bump**
   - Update `package.json` version
   - Update `config.json` version
   - Tag release in git

2. **Build All Platforms**
   ```bash
   npm run dist:win  # On Windows
   npm run dist:mac  # On Mac
   npm run dist:linux # On Linux
   ```

3. **Upload to Release Server**
   - Upload builds to S3 or CDN
   - Update electron-updater feed URL
   - Test auto-update on each platform

4. **Documentation**
   - Update README with download links
   - Create release notes
   - Update hub documentation

---

## File Change Summary

### New Files to Create

| Priority | File | Purpose |
|----------|------|---------|
| P1 | `src/secure-store.ts` | Auth token persistence |
| P1 | `src/dev-server.ts` | Dynamic port allocation |
| P2 | `build/entitlements.mac.plist` | Mac code signing |
| P3 | `src/logger.ts` | Structured logging |
| P5 | `build/code-signing-setup.md` | Code signing guide |
| P5 | `tests/upload-manager.test.ts` | Unit tests |

### Files to Modify

| Priority | File | Changes |
|----------|------|---------|
| P1 | `src/main.ts` | Auth persistence, dynamic port, env validation |
| P1 | `src/preload.ts` | Add logout, queue methods |
| P1 | `src/upload-manager.ts` | Speed tracking, ETA, offline queue |
| P1 | `config.json` | Fix URL to 3002, remove secrets |
| P1 | `.env.example` | Complete example |
| P2 | `ui/index.html` | Enhanced progress UI, queue UI |
| P2 | `ui/renderer.js` | Display speed/ETA, queue management |
| P3 | `tsconfig.json` | Enable strict checks |
| P4 | `package.json` | Mac/Linux build targets, new scripts |
| P5 | `.gitignore` | Protect secrets |

---

## Dependencies to Install

```bash
npm install electron-store winston
npm install --save-dev @types/winston
```

**Optional (for testing):**
```bash
npm install --save-dev jest @types/jest spectron
```

---

## Maintenance & Long-Term Considerations

### Regular Updates

1. **Electron:** Update every 3-6 months for security patches
2. **Dependencies:** Run `npm audit` monthly
3. **OS Compatibility:** Test on new OS versions

### Feature Roadmap (Future)

1. **Background Sync:** Upload in background even when window closed
2. **Bandwidth Throttling:** Limit upload speed to not hog connection
3. **Folder Watching:** Auto-upload when files added to watched folder
4. **Batch Upload:** Queue multiple galleries at once
5. **Smart Retry:** Exponential backoff with circuit breaker

### Known Limitations

1. **TUS Protocol:** README claims TUS, but implementation is custom chunked upload
   - Consider migrating to actual TUS client for better reliability
   - TUS client: `tus-js-client` package (already installed but not used)

2. **Memory Usage:** Large file metadata loaded into memory
   - Consider streaming metadata for 10GB+ files

3. **Network Resilience:** Basic retry logic (3 attempts, 2s delay)
   - Could improve with exponential backoff

---

## Gotchas & Warnings

### Electron-Specific

1. **Protocol Handler on Windows:** Requires second-instance handling (already implemented)
2. **System Tray on Linux:** Icon may not show on some desktop environments (Wayland issues)
3. **Mac Notarization:** Requires Xcode Command Line Tools and can take 5-10 minutes
4. **Auto-Updater:** Requires code signing to work (unsigned = blocked by OS)

### PhotoVault-Specific

1. **Hub Port:** Desktop expects hub on 3002, but hub can run on any port
   - Make sure to update config.json or .env when hub port changes
2. **Chunked Upload API:** Hub endpoints expect specific metadata format
   - Don't change upload-manager.ts without coordinating with hub team
3. **Auth Flow:** Desktop auth requires hub's `/auth/desktop-callback` page
   - Hub changes to auth flow may break desktop

---

## Success Metrics

After implementation, verify:

- [ ] Auth persistence: 100% of users stay logged in across restarts
- [ ] Port conflicts: 0% app startup failures due to port in use
- [ ] Upload success rate: >95% uploads complete successfully
- [ ] Queue retry: >90% of failed uploads succeed on retry
- [ ] UX improvement: Upload ETA accuracy within 10% of actual time
- [ ] Cross-platform: Builds work on Windows, Mac, Linux

---

## Next Steps

1. **Implement Priority 1 fixes** (Auth, Port, Config) - CRITICAL for production
2. **Test with real photographers** - Get feedback on UX improvements
3. **Set up CI/CD** - Automate builds for all platforms
4. **Plan code signing** - Budget for certificates, set up infrastructure
5. **Update hub docs** - Ensure hub team knows about desktop changes

---

**End of Plan**

This comprehensive improvement plan addresses all critical issues and feature gaps in the PhotoVault Desktop app. Prioritize P1 fixes first, then work through P2-P5 based on user feedback and production needs.
