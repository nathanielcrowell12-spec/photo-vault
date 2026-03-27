# Electron Desktop - Add Photos to Existing Gallery (Plan A v2)

**Created:** 2026-02-02
**Expert:** Electron & Desktop App Expert
**Status:** Revised based on QA Critic feedback
**Estimated Effort:** 10-12 hours

---

## Scope Statement

### What This Plan DOES:
- Add ability to upload additional photos to an existing gallery from Desktop app
- Detect duplicate filenames using exact string matching (`filename === filename`)
- Show duplicate warnings to users before upload
- Add "Add More Photos" button on Hub gallery page that launches Desktop

### What This Plan Does NOT Include (Deferred to Plan B):
- Unifying `queueStore` and `upload-state` storage systems
- Per-file tracking within uploads
- Investigating actual retry button root cause
- State migration between storage systems
- Any changes to the existing queue/resume behavior

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PhotoVault Hub                              │
├─────────────────────────────────────────────────────────────────────┤
│  GET /api/galleries/[id]/filenames                                  │
│  - Auth: Bearer token (same pattern as existing gallery routes)     │
│  - Returns: { filenames: string[] }                                 │
│  - Authorization: photographer_id OR user_id must match user.id     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Request
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Desktop App                                    │
├─────────────────────────────────────────────────────────────────────┤
│  IPC Handler: 'get-gallery-filenames'                               │
│  - Input validation: galleryId format, authToken presence           │
│  - Makes fetch to Hub API                                           │
│  - Returns filenames OR shows error dialog                          │
├─────────────────────────────────────────────────────────────────────┤
│  Renderer: Duplicate Detection                                       │
│  - Exact filename matching (filename === filename)                  │
│  - For ZIPs: Skip duplicate check (extract first is complex)        │
│  - Shows warning dialog with list of duplicates                     │
│  - User can proceed or cancel                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Hub API Endpoint (2-3 hours)

**File:** `src/app/api/galleries/[id]/filenames/route.ts`

```typescript
// GET /api/galleries/[id]/filenames
// Returns list of existing photo filenames for duplicate detection

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();

  // Check auth - same pattern as existing gallery routes
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: galleryId } = await params;

  // Input validation: UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(galleryId)) {
    return NextResponse.json({ error: 'Invalid gallery ID format' }, { status: 400 });
  }

  // Verify user owns gallery (same authorization pattern as DELETE route)
  const { data: gallery, error: fetchError } = await supabase
    .from('photo_galleries')
    .select('id, photographer_id, user_id')
    .eq('id', galleryId)
    .single();

  if (fetchError || !gallery) {
    logger.warn('[Filenames] Gallery not found', { galleryId, userId: user.id });
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Authorization check - same as existing gallery routes
  const isPhotographer = gallery.photographer_id === user.id;
  const isOwner = gallery.user_id === user.id;

  if (!isPhotographer && !isOwner) {
    logger.warn('[Filenames] Unauthorized access attempt', {
      galleryId,
      userId: user.id,
      photographerId: gallery.photographer_id,
      ownerId: gallery.user_id
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all filenames from gallery_photos
  const { data: photos, error: photosError } = await supabase
    .from('gallery_photos')
    .select('filename')
    .eq('gallery_id', galleryId)
    .eq('status', 'active');  // Only active photos

  if (photosError) {
    logger.error('[Filenames] Failed to fetch photos', { galleryId, error: photosError });
    return NextResponse.json({ error: 'Failed to fetch filenames' }, { status: 500 });
  }

  // Extract filenames (filter out nulls)
  const filenames = photos
    .map(p => p.filename)
    .filter((f): f is string => f !== null && f !== undefined);

  logger.info('[Filenames] Returned filenames for gallery', {
    galleryId,
    count: filenames.length
  });

  return NextResponse.json({ filenames });
}
```

**Testing:**
- Unit test: Valid gallery ID returns filenames
- Unit test: Invalid gallery ID returns 400
- Unit test: Non-existent gallery returns 404
- Unit test: Unauthorized user returns 403
- Unit test: Unauthenticated request returns 401

---

### Phase 2: Desktop IPC Handler with Input Validation (2-3 hours)

**File:** `src/main.ts` - Add new IPC handler

```typescript
// Input validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

interface GetGalleryFilenamesResult {
  success: boolean;
  filenames?: string[];
  error?: string;
  errorCode?: 'INVALID_INPUT' | 'AUTH_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'NETWORK_ERROR' | 'SERVER_ERROR';
}

ipcMain.handle('get-gallery-filenames', async (
  _event,
  galleryId: string
): Promise<GetGalleryFilenamesResult> => {
  // Input validation
  if (!galleryId || typeof galleryId !== 'string') {
    logger.warn('[IPC] get-gallery-filenames: Missing galleryId');
    return {
      success: false,
      error: 'Gallery ID is required',
      errorCode: 'INVALID_INPUT'
    };
  }

  if (!isValidUUID(galleryId)) {
    logger.warn('[IPC] get-gallery-filenames: Invalid galleryId format', { galleryId });
    return {
      success: false,
      error: 'Invalid gallery ID format',
      errorCode: 'INVALID_INPUT'
    };
  }

  // Get auth token
  const auth = authStore.getAuth();
  if (!auth?.token) {
    logger.warn('[IPC] get-gallery-filenames: No auth token');
    return {
      success: false,
      error: 'Authentication required. Please log in again.',
      errorCode: 'AUTH_REQUIRED'
    };
  }

  try {
    const response = await fetch(`${config.webUrl}/api/galleries/${galleryId}/filenames`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return {
        success: false,
        error: 'Authentication expired. Please log in again.',
        errorCode: 'AUTH_REQUIRED'
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'You do not have permission to access this gallery.',
        errorCode: 'FORBIDDEN'
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Gallery not found.',
        errorCode: 'NOT_FOUND'
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[IPC] get-gallery-filenames: Server error', {
        status: response.status,
        error: errorText
      });
      return {
        success: false,
        error: `Server error: ${response.status}`,
        errorCode: 'SERVER_ERROR'
      };
    }

    const data = await response.json() as { filenames: string[] };

    logger.info('[IPC] get-gallery-filenames: Success', {
      galleryId,
      count: data.filenames.length
    });

    return {
      success: true,
      filenames: data.filenames
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[IPC] get-gallery-filenames: Network error', {
      galleryId,
      error: errorMessage
    });
    return {
      success: false,
      error: 'Network error. Please check your connection.',
      errorCode: 'NETWORK_ERROR'
    };
  }
});
```

**File:** `src/preload.ts` - Expose to renderer

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods
  getGalleryFilenames: (galleryId: string) =>
    ipcRenderer.invoke('get-gallery-filenames', galleryId),
});
```

---

### Phase 3: Duplicate Detection Logic (2 hours)

**File:** `ui/renderer.js` - Add duplicate detection

```javascript
/**
 * Detect duplicates using EXACT filename matching.
 * No normalization - "Photo.jpg" !== "photo.jpg"
 *
 * @param {string[]} selectedFilenames - Filenames user wants to upload
 * @param {string[]} existingFilenames - Filenames already in gallery
 * @returns {{ duplicates: string[], unique: string[] }}
 */
function detectDuplicates(selectedFilenames, existingFilenames) {
  // Create Set for O(1) lookup
  const existingSet = new Set(existingFilenames);

  const duplicates = [];
  const unique = [];

  for (const filename of selectedFilenames) {
    // EXACT match - no normalization
    if (existingSet.has(filename)) {
      duplicates.push(filename);
    } else {
      unique.push(filename);
    }
  }

  return { duplicates, unique };
}

/**
 * Check for duplicates before starting upload.
 * For ZIPs: Skip duplicate check (would need to extract first).
 *
 * @param {string} galleryId - Target gallery ID
 * @param {string[]} filePaths - Selected file paths
 * @returns {Promise<{ proceed: boolean, duplicates?: string[] }>}
 */
async function checkForDuplicates(galleryId, filePaths) {
  // Check if any file is a ZIP
  const hasZip = filePaths.some(p => p.toLowerCase().endsWith('.zip'));

  if (hasZip) {
    // Skip duplicate check for ZIPs - too complex to extract first
    // Could show info message: "Duplicate check skipped for ZIP files"
    console.log('[Duplicates] Skipping check - ZIP file detected');
    return { proceed: true };
  }

  // Get existing filenames from gallery
  const result = await window.electronAPI.getGalleryFilenames(galleryId);

  if (!result.success) {
    // Show error dialog - don't silently proceed
    const errorMessage = result.error || 'Unknown error';
    const shouldProceed = await showErrorDialog(
      'Could Not Check for Duplicates',
      `Failed to check for duplicate files: ${errorMessage}\n\n` +
      'Do you want to proceed anyway? Duplicate files may be uploaded.',
      ['Proceed Anyway', 'Cancel']
    );
    return { proceed: shouldProceed === 'Proceed Anyway' };
  }

  // Get filenames from selected paths
  const selectedFilenames = filePaths.map(p => {
    const parts = p.split(/[/\\]/);
    return parts[parts.length - 1];
  });

  // Check for duplicates
  const { duplicates, unique } = detectDuplicates(selectedFilenames, result.filenames);

  if (duplicates.length === 0) {
    // No duplicates, proceed
    return { proceed: true };
  }

  // Show warning dialog
  const truncatedList = duplicates.slice(0, 10);
  const moreCount = duplicates.length - truncatedList.length;

  let message = `The following ${duplicates.length} file(s) already exist in this gallery:\n\n`;
  message += truncatedList.map(f => `  - ${f}`).join('\n');
  if (moreCount > 0) {
    message += `\n  ... and ${moreCount} more`;
  }
  message += '\n\nUploading will create duplicate entries. Proceed?';

  const choice = await showConfirmDialog(
    'Duplicate Files Detected',
    message,
    ['Upload Anyway', 'Cancel']
  );

  return {
    proceed: choice === 'Upload Anyway',
    duplicates
  };
}

// Helper functions for dialogs
async function showErrorDialog(title, message, buttons) {
  // Use Electron dialog or custom modal
  return new Promise(resolve => {
    // Implementation depends on UI framework
    // For now, use confirm() as placeholder
    const proceed = confirm(`${title}\n\n${message}`);
    resolve(proceed ? buttons[0] : buttons[1]);
  });
}

async function showConfirmDialog(title, message, buttons) {
  return showErrorDialog(title, message, buttons);
}
```

---

### Phase 4: UI Mode Selection (1-2 hours)

**File:** `ui/renderer.js` - Update upload flow

```javascript
// State: uploadMode can be 'new' or 'add'
let uploadMode = 'new';
let targetGalleryId = null;
let targetGalleryName = null;

// Check on auth-complete if we have a galleryId (add mode)
window.electronAPI.onAuthComplete((data) => {
  isAuthenticated = true;
  currentUserId = data.userId;

  if (data.galleryId) {
    // Launched from "Add More Photos" - pre-set add mode
    uploadMode = 'add';
    targetGalleryId = data.galleryId;
    updateUIForAddMode();

    // Optionally fetch gallery name for display
    // (Would need another IPC handler)
  } else {
    // Normal launch - new gallery mode
    uploadMode = 'new';
    targetGalleryId = null;
    updateUIForNewMode();
  }

  updateUIForAuthenticatedState();
});

function updateUIForAddMode() {
  // Update UI to show "Add Photos to Existing Gallery"
  const heading = document.getElementById('upload-heading');
  if (heading) {
    heading.textContent = 'Add Photos to Gallery';
  }

  // Hide gallery name input (using existing gallery)
  const galleryNameContainer = document.getElementById('gallery-name-container');
  if (galleryNameContainer) {
    galleryNameContainer.style.display = 'none';
  }

  // Show "Adding to: [Gallery Name]" if we have it
  // ...
}

function updateUIForNewMode() {
  const heading = document.getElementById('upload-heading');
  if (heading) {
    heading.textContent = 'Upload New Gallery';
  }

  const galleryNameContainer = document.getElementById('gallery-name-container');
  if (galleryNameContainer) {
    galleryNameContainer.style.display = 'block';
  }
}

// Update upload handler to check for duplicates in add mode
async function handleUpload() {
  if (uploadMode === 'add' && targetGalleryId) {
    // Check for duplicates before proceeding
    const { proceed } = await checkForDuplicates(targetGalleryId, selectedFiles);
    if (!proceed) {
      return; // User cancelled
    }

    // Start upload to existing gallery
    startUpload({
      filePaths: selectedFiles,
      userId: currentUserId,
      galleryName: targetGalleryName || 'Untitled',
      platform: 'desktop',
      galleryId: targetGalleryId  // Existing gallery
    });
  } else {
    // New gallery upload (existing behavior)
    const galleryName = galleryNameInput.value.trim() || 'Untitled Gallery';
    startUpload({
      filePaths: selectedFiles,
      userId: currentUserId,
      galleryName,
      platform: 'desktop'
      // No galleryId - creates new gallery
    });
  }
}
```

---

### Phase 5: Hub "Add More Photos" Button (2-3 hours)

**File:** `src/app/photographer/galleries/[id]/upload/page.tsx` (or appropriate page)

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AddPhotosButtonProps {
  galleryId: string;
  galleryName: string;
}

export function AddPhotosButton({ galleryId, galleryName }: AddPhotosButtonProps) {
  const { user, session } = useAuth();
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPhotos = async () => {
    if (!user || !session) {
      setError('Please log in to add photos');
      return;
    }

    setIsLaunching(true);
    setError(null);

    try {
      // Try to launch desktop app via custom protocol
      const authParams = new URLSearchParams({
        token: session.access_token,
        userId: user.id,
        galleryId: galleryId
      });

      // Attempt to open desktop app with gallery context
      const desktopUrl = `photovault://add-photos?${authParams.toString()}`;

      // Open protocol URL
      window.location.href = desktopUrl;

      // After a delay, check if app opened (fallback message)
      setTimeout(() => {
        setIsLaunching(false);
        // Could show "Desktop app not installed?" message
      }, 3000);

    } catch (err) {
      setIsLaunching(false);
      setError('Failed to launch desktop app');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAddPhotos}
        disabled={isLaunching}
        variant="outline"
      >
        {isLaunching ? 'Launching Desktop App...' : 'Add More Photos (Desktop)'}
      </Button>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
```

**Note:** May also need to update the desktop protocol handler to recognize `photovault://add-photos?...` in addition to the existing auth flow.

---

## Error Handling Summary

| Scenario | Desktop Behavior |
|----------|------------------|
| API returns 401 | Show "Please log in again" dialog, clear auth |
| API returns 403 | Show "No permission" dialog |
| API returns 404 | Show "Gallery not found" dialog |
| API returns 500 | Show "Server error" dialog with retry option |
| Network error | Show "Network error" dialog with retry option |
| Invalid galleryId | Show "Invalid gallery" dialog (input validation) |
| ZIP file selected | Skip duplicate check, show info message |
| Duplicates found | Show warning dialog with file list, user chooses |

---

## Test Specifications

### Hub API Tests (`__tests__/api/galleries/[id]/filenames.test.ts`)

```typescript
describe('GET /api/galleries/[id]/filenames', () => {
  describe('Authentication', () => {
    it('returns 401 when no auth token provided', async () => {});
    it('returns 401 when auth token is invalid', async () => {});
    it('returns 401 when auth token is expired', async () => {});
  });

  describe('Authorization', () => {
    it('returns 403 when user is not photographer or owner', async () => {});
    it('returns filenames when user is photographer', async () => {});
    it('returns filenames when user is owner (user_id)', async () => {});
  });

  describe('Input Validation', () => {
    it('returns 400 when galleryId is not a valid UUID', async () => {});
    it('returns 400 when galleryId is missing', async () => {});
    it('returns 404 when gallery does not exist', async () => {});
  });

  describe('Response Format', () => {
    it('returns empty array when gallery has no photos', async () => {});
    it('returns array of filenames for active photos', async () => {});
    it('excludes filenames of deleted photos', async () => {});
    it('handles null filenames gracefully', async () => {});
  });
});
```

### Desktop IPC Tests (`__tests__/ipc/get-gallery-filenames.test.ts`)

```typescript
describe('IPC: get-gallery-filenames', () => {
  describe('Input Validation', () => {
    it('returns INVALID_INPUT when galleryId is missing', async () => {});
    it('returns INVALID_INPUT when galleryId is not a string', async () => {});
    it('returns INVALID_INPUT when galleryId is not a valid UUID', async () => {});
  });

  describe('Auth Handling', () => {
    it('returns AUTH_REQUIRED when no auth token stored', async () => {});
    it('returns AUTH_REQUIRED when API returns 401', async () => {});
  });

  describe('Error Handling', () => {
    it('returns FORBIDDEN when API returns 403', async () => {});
    it('returns NOT_FOUND when API returns 404', async () => {});
    it('returns SERVER_ERROR when API returns 500', async () => {});
    it('returns NETWORK_ERROR when fetch fails', async () => {});
  });

  describe('Success', () => {
    it('returns filenames array on success', async () => {});
  });
});
```

### Duplicate Detection Tests (`__tests__/renderer/duplicates.test.ts`)

```typescript
describe('detectDuplicates', () => {
  it('returns no duplicates for disjoint sets', () => {
    const result = detectDuplicates(
      ['new1.jpg', 'new2.jpg'],
      ['existing1.jpg', 'existing2.jpg']
    );
    expect(result.duplicates).toHaveLength(0);
    expect(result.unique).toEqual(['new1.jpg', 'new2.jpg']);
  });

  it('uses exact string matching (case sensitive)', () => {
    const result = detectDuplicates(
      ['Photo.jpg', 'photo.jpg', 'PHOTO.JPG'],
      ['photo.jpg']
    );
    expect(result.duplicates).toEqual(['photo.jpg']);
    expect(result.unique).toEqual(['Photo.jpg', 'PHOTO.JPG']);
  });

  it('handles empty existing array', () => {
    const result = detectDuplicates(['a.jpg', 'b.jpg'], []);
    expect(result.duplicates).toHaveLength(0);
    expect(result.unique).toEqual(['a.jpg', 'b.jpg']);
  });

  it('handles empty selected array', () => {
    const result = detectDuplicates([], ['a.jpg', 'b.jpg']);
    expect(result.duplicates).toHaveLength(0);
    expect(result.unique).toHaveLength(0);
  });

  it('identifies all duplicates when all match', () => {
    const result = detectDuplicates(
      ['a.jpg', 'b.jpg'],
      ['a.jpg', 'b.jpg', 'c.jpg']
    );
    expect(result.duplicates).toEqual(['a.jpg', 'b.jpg']);
    expect(result.unique).toHaveLength(0);
  });
});

describe('checkForDuplicates', () => {
  it('skips check when ZIP file is in selection', async () => {});
  it('shows error dialog when API call fails', async () => {});
  it('proceeds with no dialog when no duplicates', async () => {});
  it('shows warning dialog when duplicates found', async () => {});
});
```

---

## Files Changed Summary

### New Files
- `src/app/api/galleries/[id]/filenames/route.ts` - Hub API endpoint

### Modified Files - Hub
- `src/app/photographer/galleries/[id]/upload/page.tsx` - Add "Add More Photos" button

### Modified Files - Desktop
- `src/main.ts` - Add `get-gallery-filenames` IPC handler
- `src/preload.ts` - Expose `getGalleryFilenames` to renderer
- `ui/renderer.js` - Duplicate detection, add mode UI

---

## Rollout Plan

1. **Phase 1-2:** Deploy Hub API endpoint first (no user-facing changes)
2. **Phase 3-4:** Deploy Desktop app update with duplicate detection
3. **Phase 5:** Deploy Hub UI with "Add More Photos" button

This allows safe incremental deployment - the API exists before Desktop needs it.

---

## Success Criteria

- [ ] User can click "Add More Photos" on Hub gallery page
- [ ] Desktop app launches with gallery context pre-filled
- [ ] Duplicate files are detected and user is warned
- [ ] User can choose to proceed or cancel when duplicates found
- [ ] ZIP files upload without duplicate check (with info message)
- [ ] All error cases show user-friendly dialogs (no silent failures)
- [ ] Authorization is properly enforced (can't add to others' galleries)
