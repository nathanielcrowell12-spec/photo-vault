# Gallery Share Links - Implementation Plan

**Date:** December 20, 2025
**Feature:** Allow paying clients to share gallery access via time-limited, revocable share links
**Status:** Implementation Ready

---

## Executive Summary

This feature allows paying clients to generate shareable links for their galleries. These links bypass the paywall without requiring recipients to create accounts or subscribe. The feature is designed for clients who want to share photos with family/friends while maintaining the photographer's revenue model.

**Key Difference from Family Sharing:**
- **Family Sharing** (`secondaries` table): Requires invited members to create PhotoVault accounts, persistent access across all shared galleries
- **Share Links** (this feature): Anonymous access via unguessable token, per-gallery, time-limited, no account required

---

## Research Findings

### Current Architecture

**Gallery Access Control (from `/src/app/gallery/[galleryId]/page.tsx`):**
1. **Authenticated users:**
   - Photographers: Access if `photographer_id = auth.uid()`
   - Admins: Always access
   - Clients: Access if they have active subscription (`subscriptions` table)
   - Self-uploaded galleries: Access if `user_id = auth.uid()`
2. **Unauthenticated users:**
   - Self-uploaded galleries (no `photographer_id`): Free access
   - Galleries with no pricing: Free access
   - Galleries with pricing: Paywall shown

**Database Tables:**
- `photo_galleries`: Core gallery table
- `subscriptions`: Tracks client subscriptions (linked to Stripe)
- `user_profiles`: User accounts
- `clients`: Photographer's client records
- `secondaries`: Family sharing (different use case)

**Family Sharing System (DIFFERENT from Share Links):**
- Table: `secondaries` (in `family-accounts-schema.sql`)
- Requires invited family members to create PhotoVault accounts
- Access is account-based, not link-based
- Persistent access to ALL shared galleries on the account
- Tracked via `is_family_shared` column on `photo_galleries`

**RLS Policies (from `photo-galleries-rls-policies.sql`):**
- Photographers: `photographer_id = auth.uid()`
- Clients: `client_id = auth.uid()` (BUT this is FK to `clients.id`, not `user_profiles.id`)
- Photos: Same pattern via gallery join

---

## Design Decisions

### 1. Share Links vs Family Sharing

| Feature | Family Sharing (Existing) | Share Links (This Feature) |
|---------|---------------------------|----------------------------|
| **Auth Required** | Yes (PhotoVault account) | No (just the link) |
| **Scope** | All galleries marked shared | One specific gallery |
| **Duration** | Permanent (until revoked) | Time-limited (default 30 days) |
| **Limit** | 5 secondaries per account | 5 active links per gallery |
| **Use Case** | Multi-generational preservation | Temporary sharing with non-users |
| **Table** | `secondaries` | `gallery_share_links` (new) |

**Rationale:** Share Links are for casual sharing (wedding guests, event attendees), while Family Sharing is for long-term account access (spouse, children).

### 2. Access Control Strategy

**Current Flow (Authenticated):**
```
User authenticated → Check role → Check subscription → Grant/deny access
```

**New Flow (Share Link):**
```
User has token → Validate token (active, not expired, not revoked) → Grant read-only access
```

**Implementation:** Add check BEFORE paywall in `checkAccess()` function. Share link bypasses subscription check.

### 3. Download Restrictions

**Option A:** No downloads (view only)
**Option B:** Limited downloads (5 photos max)
**Option C:** Full downloads (same as subscriber)

**Chosen:** **Option B** - Limited downloads (configurable per link)
**Rationale:** Allows recipients to save a few favorites without full album access. Photographers can set limit when creating link.

### 4. Token Generation

**Method:** UUID v4 (unguessable, 36 characters)
**URL Format:** `https://photovault.photo/gallery/{galleryId}?share={token}`
**Why not separate route?** Keep same gallery viewer page, simpler UX, no duplicate code.

---

## Database Schema

### New Table: `gallery_share_links`

```sql
-- Gallery Share Links
-- Allows paying clients to generate shareable access links for their galleries
-- Different from family sharing (which requires PhotoVault accounts)

CREATE TABLE IF NOT EXISTS gallery_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gallery and creator
  gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Shareable token (unguessable)
  share_token VARCHAR(255) UNIQUE NOT NULL,  -- UUID v4

  -- Expiration
  expires_at TIMESTAMPTZ,  -- NULL = never expires
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Download limits
  download_limit INTEGER DEFAULT 5,  -- NULL = unlimited, 0 = view only
  downloads_used INTEGER DEFAULT 0,

  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  unique_visitor_count INTEGER DEFAULT 0,  -- Approximate via IP tracking

  -- Metadata
  label VARCHAR(255),  -- Optional label like "Wedding Guests", "Grandparents"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent abuse: max 5 active links per gallery
  CONSTRAINT max_active_links_per_gallery CHECK (
    NOT EXISTS (
      SELECT 1 FROM gallery_share_links
      WHERE gallery_id = gallery_share_links.gallery_id
      AND is_revoked = FALSE
      AND (expires_at IS NULL OR expires_at > NOW())
      HAVING COUNT(*) >= 5
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_gallery_id
  ON gallery_share_links(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_share_token
  ON gallery_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_created_by
  ON gallery_share_links(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_active
  ON gallery_share_links(gallery_id, is_revoked, expires_at)
  WHERE is_revoked = FALSE;

-- Comments
COMMENT ON TABLE gallery_share_links IS
  'Shareable links for galleries - allows anonymous access without account/subscription';
COMMENT ON COLUMN gallery_share_links.share_token IS
  'Unguessable UUID token used in share URL';
COMMENT ON COLUMN gallery_share_links.download_limit IS
  'Max downloads via this link (NULL=unlimited, 0=view only)';
```

### New Table: `share_link_downloads`

Track individual downloads to enforce limits:

```sql
-- Share Link Download Tracking
-- Tracks which photos were downloaded via share links (for limit enforcement)

CREATE TABLE IF NOT EXISTS share_link_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  share_link_id UUID NOT NULL REFERENCES gallery_share_links(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,

  -- Visitor tracking (approximate)
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  user_agent TEXT,

  downloaded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate tracking
  CONSTRAINT unique_share_link_photo_download
    UNIQUE (share_link_id, photo_id, ip_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_link_downloads_link
  ON share_link_downloads(share_link_id);
CREATE INDEX IF NOT EXISTS idx_share_link_downloads_photo
  ON share_link_downloads(photo_id);
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE gallery_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_downloads ENABLE ROW LEVEL SECURITY;

-- Gallery Share Links Policies

-- Users can view share links for galleries they have access to
CREATE POLICY "Users can view share links for accessible galleries"
  ON gallery_share_links FOR SELECT
  USING (
    -- Gallery owner (photographer)
    gallery_id IN (
      SELECT id FROM photo_galleries WHERE photographer_id = auth.uid()
    )
    OR
    -- Gallery subscriber (client with active subscription)
    gallery_id IN (
      SELECT gallery_id FROM subscriptions
      WHERE user_id = auth.uid()
      AND status IN ('active', 'trialing', 'past_due')
    )
    OR
    -- Gallery owner (self-uploaded gallery)
    gallery_id IN (
      SELECT id FROM photo_galleries WHERE user_id = auth.uid()
    )
  );

-- Only gallery subscribers can create share links
CREATE POLICY "Subscribers can create share links for their galleries"
  ON gallery_share_links FOR INSERT
  WITH CHECK (
    -- Must have active subscription to the gallery
    gallery_id IN (
      SELECT gallery_id FROM subscriptions
      WHERE user_id = auth.uid()
      AND status IN ('active', 'trialing', 'past_due')
      AND access_suspended = FALSE
    )
    OR
    -- Or be the owner of a self-uploaded gallery
    gallery_id IN (
      SELECT id FROM photo_galleries WHERE user_id = auth.uid()
    )
  );

-- Users can update/revoke their own share links
CREATE POLICY "Users can update own share links"
  ON gallery_share_links FOR UPDATE
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete own share links"
  ON gallery_share_links FOR DELETE
  USING (created_by_user_id = auth.uid());

-- Service role full access (for API routes)
CREATE POLICY "Service role full access on gallery_share_links"
  ON gallery_share_links FOR ALL
  USING (true) WITH CHECK (true);

-- Share Link Downloads Policies

-- Users can view download stats for their share links
CREATE POLICY "Users can view downloads for own share links"
  ON share_link_downloads FOR SELECT
  USING (
    share_link_id IN (
      SELECT id FROM gallery_share_links WHERE created_by_user_id = auth.uid()
    )
  );

-- Service role full access (for API routes)
CREATE POLICY "Service role full access on share_link_downloads"
  ON share_link_downloads FOR ALL
  USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON gallery_share_links TO authenticated;
GRANT ALL ON gallery_share_links TO service_role;
GRANT ALL ON share_link_downloads TO authenticated;
GRANT ALL ON share_link_downloads TO service_role;
```

---

## API Routes

### 1. Create Share Link

**Endpoint:** `POST /api/gallery/[galleryId]/share-links`

**Auth:** Required (must have active subscription to gallery)

**Request Body:**
```typescript
{
  label?: string;              // Optional label
  expiresInDays?: number;      // Default 30, max 365, null = never
  downloadLimit?: number;      // Default 5, null = unlimited, 0 = view only
}
```

**Response:**
```typescript
{
  id: string;
  shareToken: string;
  shareUrl: string;            // Full URL
  expiresAt: string | null;
  downloadLimit: number | null;
  label: string | null;
}
```

**Implementation:**
```typescript
// src/app/api/gallery/[galleryId]/share-links/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { /* cookies config */ }
  )

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { galleryId } = params
  const body = await req.json()
  const { label, expiresInDays = 30, downloadLimit = 5 } = body

  // Check if user has access to this gallery (active subscription)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('gallery_id', galleryId)
    .in('status', ['active', 'trialing', 'past_due'])
    .eq('access_suspended', false)
    .maybeSingle()

  // Also check if user owns the gallery (self-uploaded)
  const { data: gallery } = await supabase
    .from('photo_galleries')
    .select('id, user_id')
    .eq('id', galleryId)
    .single()

  const isOwner = gallery?.user_id === user.id
  const hasSubscription = !!subscription

  if (!isOwner && !hasSubscription) {
    return NextResponse.json(
      { error: 'You must be subscribed to this gallery to create share links' },
      { status: 403 }
    )
  }

  // Check active link count (max 5 per gallery)
  const { count } = await supabase
    .from('gallery_share_links')
    .select('id', { count: 'exact', head: true })
    .eq('gallery_id', galleryId)
    .eq('is_revoked', false)
    .or('expires_at.is.null,expires_at.gt.now()')

  if (count && count >= 5) {
    return NextResponse.json(
      { error: 'Maximum of 5 active share links per gallery. Revoke an existing link first.' },
      { status: 400 }
    )
  }

  // Generate share token
  const shareToken = uuidv4()

  // Calculate expiration
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null

  // Insert share link
  const { data: shareLink, error } = await supabase
    .from('gallery_share_links')
    .insert({
      gallery_id: galleryId,
      created_by_user_id: user.id,
      share_token: shareToken,
      expires_at: expiresAt,
      download_limit: downloadLimit,
      label: label || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }

  // Build share URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const shareUrl = `${siteUrl}/gallery/${galleryId}?share=${shareToken}`

  return NextResponse.json({
    id: shareLink.id,
    shareToken: shareLink.share_token,
    shareUrl,
    expiresAt: shareLink.expires_at,
    downloadLimit: shareLink.download_limit,
    label: shareLink.label,
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { /* cookies config */ }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { galleryId } = params

  // Get all share links for this gallery (if user has access)
  const { data: shareLinks, error } = await supabase
    .from('gallery_share_links')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('created_by_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching share links:', error)
    return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 })
  }

  // Add share URLs
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const linksWithUrls = shareLinks.map(link => ({
    ...link,
    shareUrl: `${siteUrl}/gallery/${galleryId}?share=${link.share_token}`,
    isActive: !link.is_revoked && (!link.expires_at || new Date(link.expires_at) > new Date()),
  }))

  return NextResponse.json({ shareLinks: linksWithUrls })
}
```

### 2. Validate Share Token

**Endpoint:** `POST /api/gallery/[galleryId]/validate-share-token`

**Auth:** None (public)

**Request Body:**
```typescript
{
  shareToken: string;
}
```

**Response:**
```typescript
{
  valid: boolean;
  shareLink?: {
    id: string;
    downloadLimit: number | null;
    downloadsUsed: number;
    expiresAt: string | null;
  };
  error?: string;
}
```

**Implementation:**
```typescript
// src/app/api/gallery/[galleryId]/validate-share-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { galleryId } = params
  const { shareToken } = await req.json()

  if (!shareToken) {
    return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 })
  }

  // Fetch share link
  const { data: shareLink, error } = await supabase
    .from('gallery_share_links')
    .select('id, download_limit, downloads_used, expires_at, is_revoked')
    .eq('gallery_id', galleryId)
    .eq('share_token', shareToken)
    .single()

  if (error || !shareLink) {
    return NextResponse.json({ valid: false, error: 'Invalid share link' }, { status: 404 })
  }

  // Check if revoked
  if (shareLink.is_revoked) {
    return NextResponse.json({ valid: false, error: 'Share link has been revoked' }, { status: 403 })
  }

  // Check if expired
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Share link has expired' }, { status: 403 })
  }

  // Increment view count
  await supabase
    .from('gallery_share_links')
    .update({
      view_count: shareLink.view_count + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', shareLink.id)

  return NextResponse.json({
    valid: true,
    shareLink: {
      id: shareLink.id,
      downloadLimit: shareLink.download_limit,
      downloadsUsed: shareLink.downloads_used,
      expiresAt: shareLink.expires_at,
    },
  })
}
```

### 3. Revoke Share Link

**Endpoint:** `DELETE /api/gallery/[galleryId]/share-links/[linkId]`

**Auth:** Required (must be link creator)

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Implementation:**
```typescript
// src/app/api/gallery/[galleryId]/share-links/[linkId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { galleryId: string; linkId: string } }
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { /* cookies config */ }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { linkId } = params

  // Revoke the link (soft delete)
  const { error } = await supabase
    .from('gallery_share_links')
    .update({
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: user.id,
    })
    .eq('id', linkId)
    .eq('created_by_user_id', user.id)  // Security: only creator can revoke

  if (error) {
    console.error('Error revoking share link:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Share link revoked' })
}
```

### 4. Track Download

**Endpoint:** `POST /api/gallery/[galleryId]/share-links/track-download`

**Auth:** None (uses share token)

**Request Body:**
```typescript
{
  shareToken: string;
  photoId: string;
}
```

**Response:**
```typescript
{
  allowed: boolean;
  downloadsRemaining: number | null;
  error?: string;
}
```

**Implementation:**
```typescript
// src/app/api/gallery/[galleryId]/share-links/track-download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { galleryId } = params
  const { shareToken, photoId } = await req.json()

  // Validate share link
  const { data: shareLink, error } = await supabase
    .from('gallery_share_links')
    .select('id, download_limit, downloads_used, is_revoked, expires_at')
    .eq('gallery_id', galleryId)
    .eq('share_token', shareToken)
    .single()

  if (error || !shareLink) {
    return NextResponse.json({ allowed: false, error: 'Invalid share link' }, { status: 404 })
  }

  // Check revoked/expired
  if (shareLink.is_revoked || (shareLink.expires_at && new Date(shareLink.expires_at) < new Date())) {
    return NextResponse.json({ allowed: false, error: 'Share link is no longer valid' }, { status: 403 })
  }

  // Check download limit
  if (shareLink.download_limit !== null && shareLink.downloads_used >= shareLink.download_limit) {
    return NextResponse.json(
      { allowed: false, downloadsRemaining: 0, error: 'Download limit reached' },
      { status: 403 }
    )
  }

  // Get visitor info
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // Track download (idempotent: same IP + photo won't increment twice)
  const { error: trackError } = await supabase
    .from('share_link_downloads')
    .insert({
      share_link_id: shareLink.id,
      photo_id: photoId,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select()

  // If insert succeeded (not a duplicate), increment counter
  if (!trackError) {
    await supabase
      .from('gallery_share_links')
      .update({ downloads_used: shareLink.downloads_used + 1 })
      .eq('id', shareLink.id)
  }

  const downloadsRemaining = shareLink.download_limit !== null
    ? shareLink.download_limit - shareLink.downloads_used - 1
    : null

  return NextResponse.json({ allowed: true, downloadsRemaining })
}
```

---

## UI Changes

### 1. Gallery Page - Share Link Access

**File:** `src/app/gallery/[galleryId]/page.tsx`

**Changes:**

Add share token check BEFORE paywall in the `checkAccess` function:

```typescript
// At the top of the component
const [shareToken, setShareToken] = useState<string | null>(null)
const [shareAccess, setShareAccess] = useState(false)

// In useEffect, check for share token in URL
useEffect(() => {
  const token = searchParams.get('share')
  if (token) {
    setShareToken(token)
    validateShareToken(token)
  }
}, [searchParams])

const validateShareToken = async (token: string) => {
  try {
    const response = await fetch(`/api/gallery/${galleryId}/validate-share-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareToken: token })
    })

    const data = await response.json()

    if (data.valid) {
      console.log('[Gallery] Valid share token - granting access')
      setShareAccess(true)
      setHasAccess(true)
      setCheckingAccess(false)
    } else {
      console.log('[Gallery] Invalid share token:', data.error)
      // Show error toast
    }
  } catch (error) {
    console.error('[Gallery] Error validating share token:', error)
  }
}

// Modify download function to track share link downloads
const downloadPhoto = async (photoUrl: string, filename: string) => {
  // If accessed via share link, track download
  if (shareToken) {
    const response = await fetch(`/api/gallery/${galleryId}/share-links/track-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareToken, photoId: photo.id })
    })

    const data = await response.json()

    if (!data.allowed) {
      alert(data.error || 'Download limit reached')
      return
    }

    if (data.downloadsRemaining !== null) {
      console.log(`Downloads remaining: ${data.downloadsRemaining}`)
    }
  }

  // Proceed with download
  try {
    const response = await fetch(photoUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading photo:', error)
    alert('Failed to download photo')
  }
}
```

Add UI indicator for share link access:

```typescript
// After payment success banner
{shareAccess && (
  <div className="bg-blue-500 text-white py-3 px-4 text-center">
    <div className="flex items-center justify-center gap-2">
      <LinkIcon className="h-5 w-5" />
      <span className="font-medium">
        You're viewing this gallery via a share link
      </span>
    </div>
  </div>
)}
```

### 2. Client Dashboard - Share Links Management

**File:** `src/app/client/dashboard/page.tsx`

**Add "Share" button to each gallery card:**

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/client/gallery/${gallery.id}/share`)}
>
  <Share2 className="h-4 w-4 mr-2" />
  Share
</Button>
```

### 3. New Page - Manage Share Links

**File:** `src/app/client/gallery/[galleryId]/share/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Plus,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface ShareLink {
  id: string
  share_token: string
  shareUrl: string
  label: string | null
  expires_at: string | null
  download_limit: number | null
  downloads_used: number
  view_count: number
  isActive: boolean
  created_at: string
}

export default function ManageShareLinksPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const galleryId = params.galleryId as string

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [creating, setCreating] = useState(false)

  // Form state
  const [label, setLabel] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [downloadLimit, setDownloadLimit] = useState(5)

  useEffect(() => {
    if (!loading && user) {
      fetchShareLinks()
    }
  }, [loading, user, galleryId])

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links`)
      const data = await response.json()
      setShareLinks(data.shareLinks || [])
    } catch (error) {
      console.error('Error fetching share links:', error)
      toast({
        title: 'Error',
        description: 'Failed to load share links',
        variant: 'destructive',
      })
    } finally {
      setLoadingLinks(false)
    }
  }

  const createShareLink = async () => {
    setCreating(true)
    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || null,
          expiresInDays,
          downloadLimit,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link')
      }

      toast({
        title: 'Share link created!',
        description: 'Your share link is ready to use',
      })

      // Reset form
      setLabel('')
      setExpiresInDays(30)
      setDownloadLimit(5)

      // Refresh list
      fetchShareLinks()
    } catch (error) {
      console.error('Error creating share link:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard',
    })
  }

  const revokeShareLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to revoke this share link? Anyone with the link will lose access.')) {
      return
    }

    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links/${linkId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share link')
      }

      toast({
        title: 'Share link revoked',
        description: 'The link is no longer active',
      })

      fetchShareLinks()
    } catch (error) {
      console.error('Error revoking share link:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke share link',
        variant: 'destructive',
      })
    }
  }

  if (loading || loadingLinks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Manage Share Links</h1>
              <p className="text-sm text-muted-foreground">
                Create shareable links for this gallery
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Create New Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Share Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Wedding Guests, Family"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiresInDays">Expires In (days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>

              <div>
                <Label htmlFor="downloadLimit">Download Limit</Label>
                <Input
                  id="downloadLimit"
                  type="number"
                  value={downloadLimit}
                  onChange={(e) => setDownloadLimit(parseInt(e.target.value))}
                  min={0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = view only, leave high for unlimited
                </p>
              </div>
            </div>

            <Button onClick={createShareLink} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Share Links</h2>

          {shareLinks.filter(link => link.isActive).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active share links yet. Create one above!</p>
              </CardContent>
            </Card>
          ) : (
            shareLinks
              .filter(link => link.isActive)
              .map(link => (
                <Card key={link.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {link.label && (
                            <Badge variant="outline">{link.label}</Badge>
                          )}
                          {link.expires_at && (
                            <Badge variant="secondary">
                              Expires {new Date(link.expires_at).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>

                        <div className="bg-muted rounded-lg p-3 mb-3 flex items-center gap-2">
                          <code className="text-sm flex-1 overflow-hidden text-ellipsis">
                            {link.shareUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.shareUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={link.shareUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Views: {link.view_count}</p>
                          {link.download_limit !== null && (
                            <p>
                              Downloads: {link.downloads_used} / {link.download_limit}
                            </p>
                          )}
                          <p>Created: {new Date(link.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revokeShareLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Revoked Links */}
        {shareLinks.filter(link => !link.isActive).length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">Revoked Links</h2>
            {shareLinks
              .filter(link => !link.isActive)
              .map(link => (
                <Card key={link.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="destructive">Revoked</Badge>
                        {link.label && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {link.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.view_count} views before revocation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

---

## Security Considerations

### 1. Token Unguessability

- **UUID v4:** 122 bits of randomness, astronomically difficult to brute force
- **No sequential IDs:** Using UUIDs prevents enumeration attacks
- **Single-use tokens:** Each link gets a unique token, revocation doesn't affect others

### 2. Rate Limiting

**Recommended (not implemented in this plan):**
- Limit share link creation to 5 per hour per user
- Limit validation requests to 100 per hour per IP
- Implement in middleware or use Vercel rate limiting

### 3. Download Tracking

- **IP-based deduplication:** Same IP downloading same photo doesn't count twice
- **Privacy:** Store minimal data (IP + user agent), no cookies or tracking scripts
- **GDPR compliance:** Add privacy notice on share link page

### 4. Abuse Prevention

- **Max 5 active links per gallery:** Prevents link spam
- **Expiration required:** All links expire (max 365 days)
- **Download limits:** Default 5 downloads per link
- **Revocation:** Owner can revoke at any time

### 5. RLS Policies

- **Creator-only access:** Only the user who created a link can view/revoke it
- **No anonymous writes:** Share links can only be created by authenticated, subscribed users
- **Service role bypass:** API routes use service role for validation (public access)

---

## Migration Path

### Step 1: Database Schema

Run the SQL migrations in Supabase SQL Editor:

1. `gallery_share_links` table
2. `share_link_downloads` table
3. RLS policies
4. Indexes

### Step 2: API Routes

Create routes in order:
1. `validate-share-token` (needed for gallery page)
2. `share-links` (create/list)
3. `share-links/[linkId]` (revoke)
4. `track-download` (download tracking)

### Step 3: UI Changes

1. Update gallery page to check for share token
2. Add "Share" button to client dashboard
3. Create share links management page

### Step 4: Testing

**Test Cases:**
1. Create share link as subscriber → should succeed
2. Create share link as non-subscriber → should fail
3. Access gallery with valid token → should grant access
4. Access gallery with expired token → should show error
5. Access gallery with revoked token → should show error
6. Download photo via share link → should track download
7. Download when limit reached → should deny
8. Create 6th link when 5 active → should fail

### Step 5: Documentation

Add to user-facing docs:
- How to create share links
- Share link best practices
- Privacy implications
- Difference between share links and family sharing

---

## Edge Cases

### 1. User Shares Link Then Cancels Subscription

**Behavior:** Share link remains active until expiration or revocation.

**Rationale:** The link was created while they had access. Photographer still gets value from initial subscription.

**Alternative:** Could invalidate all share links when subscription ends (add cron job).

### 2. Photographer Deletes Gallery

**Behavior:** Share links are CASCADE deleted (foreign key constraint).

**Rationale:** No gallery = no access. Prevents broken links.

### 3. Share Link Accessed by Subscriber

**Behavior:** User sees normal gallery view (no download limits).

**Rationale:** Subscribers should get full experience even if they find a share link.

**Implementation:** In `checkAccess()`, prioritize subscription over share link.

### 4. Download Limit = 0 (View Only)

**Behavior:** Download buttons are hidden for share link users.

**Rationale:** Some users want to share for viewing only (e.g., proofs).

**Implementation:** Check `downloadLimit === 0` in gallery page, disable download buttons.

### 5. Same Photo Downloaded Multiple Times

**Behavior:** Only counts once per IP address.

**Rationale:** Users might accidentally click download twice. We track unique downloads, not total clicks.

**Trade-off:** Different devices on same network share limit. Acceptable for this use case.

---

## Future Enhancements (Not in Scope)

1. **Password-protected links:** Add optional password field to `gallery_share_links`
2. **Analytics dashboard:** Show which photos were viewed/downloaded most
3. **Email sharing:** Send link directly via email from app
4. **QR codes:** Generate QR code for each share link
5. **Watermarking:** Add watermark to photos viewed via share link
6. **Custom branding:** Allow photographers to customize share page
7. **Bulk download limits:** Limit number of photos in "Download All" via share link
8. **Link expiration warnings:** Email creator when link is about to expire

---

## Acceptance Criteria

- [ ] Paying client can create up to 5 share links per gallery
- [ ] Share link grants read-only access without authentication
- [ ] Share link respects expiration date (if set)
- [ ] Share link respects download limit (if set)
- [ ] Share link can be revoked by creator
- [ ] Download tracking prevents duplicate counts from same IP
- [ ] Gallery page shows indicator when accessed via share link
- [ ] Client dashboard has "Share" button on each gallery
- [ ] Share links management page lists all active/revoked links
- [ ] Share links are invalidated when gallery is deleted
- [ ] Non-subscribers cannot create share links
- [ ] Share links work for both authenticated and unauthenticated users

---

## TypeScript Types

**Add to `src/types/database.ts`:**

```typescript
export interface GalleryShareLink {
  id: string
  gallery_id: string
  created_by_user_id: string
  share_token: string
  expires_at: string | null
  is_revoked: boolean
  revoked_at: string | null
  revoked_by_user_id: string | null
  download_limit: number | null
  downloads_used: number
  view_count: number
  last_viewed_at: string | null
  unique_visitor_count: number
  label: string | null
  created_at: string
  updated_at: string
}

export interface ShareLinkDownload {
  id: string
  share_link_id: string
  photo_id: string
  ip_address: string | null
  user_agent: string | null
  downloaded_at: string
}
```

---

## Timeline Estimate

| Phase | Tasks | Estimate |
|-------|-------|----------|
| **Database** | Schema, RLS, indexes | 1 hour |
| **API Routes** | 4 routes (validate, create/list, revoke, track) | 3 hours |
| **Gallery Page** | Token validation, download tracking | 2 hours |
| **Share Management UI** | New page, forms, list view | 4 hours |
| **Testing** | Manual QA, edge cases | 2 hours |
| **Documentation** | User guide, code comments | 1 hour |
| **Total** | | **13 hours** |

---

## Summary

This implementation adds a flexible, secure share link system that complements the existing family sharing feature. Share links are:

- **Anonymous:** No account required
- **Time-limited:** Default 30 days, max 365
- **Download-controlled:** Default 5 downloads, configurable
- **Revocable:** Owner can revoke at any time
- **Trackable:** View and download stats

The system respects PhotoVault's business model by requiring users to have an active subscription before they can create share links. Recipients don't need to subscribe, but the paying client must maintain their subscription.

**Key Files to Create/Modify:**

**New Files (7):**
1. `database/gallery-share-links-schema.sql`
2. `src/app/api/gallery/[galleryId]/share-links/route.ts`
3. `src/app/api/gallery/[galleryId]/share-links/[linkId]/route.ts`
4. `src/app/api/gallery/[galleryId]/validate-share-token/route.ts`
5. `src/app/api/gallery/[galleryId]/share-links/track-download/route.ts`
6. `src/app/client/gallery/[galleryId]/share/page.tsx`
7. `src/types/share-links.ts`

**Modified Files (2):**
1. `src/app/gallery/[galleryId]/page.tsx` (add share token validation)
2. `src/app/client/dashboard/page.tsx` (add "Share" button)

---

**End of Implementation Plan**
