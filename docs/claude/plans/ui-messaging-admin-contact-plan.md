# Messaging Panel: Admin Contact & Universal "New Chat" - Implementation Plan

**Date:** February 12, 2026
**Components:** `src/components/MessagingPanel.tsx`, new `src/app/api/conversations/contacts/route.ts`
**Issue:** Only clients can start conversations; admin is not available as a contact; no beta feedback prompt

---

## 1. Summary

Currently the MessagingPanel only allows **clients** to initiate new conversations, and only with their photographers. Photographers see a dead-end "No messages yet" screen with no way to start a chat. The database `can_user_message()` RPC already permits anyone to message admin, but the UI never surfaces admin as a contact.

This plan:
1. Creates a new `GET /api/conversations/contacts` endpoint that returns messageable contacts for any user type
2. Refactors MessagingPanel to use that endpoint so **both clients and photographers** see "Start New Chat" with a contacts list
3. Always includes admin as the first contact with a distinct "PhotoVault Support" label and Shield icon
4. Adds a subtle beta feedback banner above the conversation list encouraging users to message support

**No database changes required.** The `can_user_message()` and `get_or_create_conversation()` RPCs already support all needed routing.

---

## 2. Existing Codebase Patterns (What to Reuse)

### API Route Pattern
All conversation API routes follow the same structure (from `src/app/api/conversations/route.ts`):
- Import `NextRequest`, `NextResponse` from `next/server`
- Import `createClient` from `@supabase/supabase-js`
- Import `logger` from `@/lib/logger`
- Use `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars
- Auth via `Authorization: Bearer <token>` header -> `supabase.auth.getUser(token)`
- User profile lookup via `user_profiles` table

### Client Photographers Pattern
`GET /api/client/photographers` (from `src/app/api/client/photographers/route.ts`):
- Queries `clients` table to find `photographer_id` associations
- Queries `photo_galleries` table for additional photographer associations
- Fetches `photographers` table joined with `user_profiles` for names
- Uses `supabase.auth.admin.listUsers()` to get emails

### MessagingPanel State Pattern
- Uses `useAuth()` hook for current user
- Uses `supabaseBrowser.auth.getSession()` to get bearer token for API calls
- Fetch functions wrapped in `useCallback` with `[user, ...]` deps
- Uses shadcn/ui components: `Card`, `Button`, `Input`, `Badge`, `Textarea`
- Uses Lucide icons exclusively
- All colors use semantic tokens (`bg-muted`, `text-primary`, `text-foreground`, etc.)

### UI Styling Tokens
- Subtle section backgrounds: `bg-muted`, `bg-muted/50`
- Primary accent: `text-primary`, `bg-primary`
- Muted text: `text-muted-foreground`
- Interactive hover: `hover:bg-accent`, `hover:bg-accent/50`
- Card surfaces: `bg-card`
- Borders: `border-b`, `divide-y divide-border`

---

## 3. Implementation Steps

### Step 1: Create `GET /api/conversations/contacts` endpoint
- New file: `src/app/api/conversations/contacts/route.ts`
- Returns `{ contacts: Contact[] }` where each contact has `{ id, name, email, user_type, is_admin }`
- For ALL user types: always includes admin user(s) from `user_profiles` where `user_type = 'admin'`
- For clients: also includes their photographers (reuse logic from `/api/client/photographers`)
- For photographers: also includes their clients (query `clients` table -> `user_profiles`)
- Admin contacts always sorted first in the response array

### Step 2: Refactor MessagingPanel state and types
- Rename `Photographer` interface to `Contact` (add `user_type` and `is_admin` fields)
- Rename `photographers` state to `contacts`
- Rename `showPhotographerList` to `showContactList`
- Rename `fetchPhotographers` to `fetchContacts` - calls new `/api/conversations/contacts`
- Rename `startConversationWithPhotographer` to `startConversation` (no logic change, just rename)

### Step 3: Remove `userType === 'client'` guards
- Remove guard on `fetchContacts` (currently `if (!user || userType !== 'client') return`)
- Remove guard on "Start New Chat" button (currently `userType === 'client' && ...`)
- Remove guard on contact list rendering (currently `userType === 'client' && ...`)
- Remove guard on the empty-state fallback (currently checks `userType === 'client'`)

### Step 4: Update contact list UI for admin distinction
- Admin contacts render with `Shield` icon (from Lucide) instead of `User` icon
- Admin contacts show "PhotoVault Support" as name regardless of actual profile name
- Admin contacts show a small `Badge` with "Support" label
- Non-admin contacts continue using `User` icon

### Step 5: Add beta feedback banner
- Insert a subtle callout at the top of the conversation list area (above "Start New Chat" button)
- Uses `Lightbulb` icon from Lucide
- Text: "Beta Feedback? Message PhotoVault Support with feature ideas!"
- Styling: `bg-primary/10 text-primary` for subtle, on-brand appearance
- Shows for all user types

### Step 6: Update conversation list to show admin badge
- In the conversation list, if `conv.other_user.user_type === 'admin'`, show Shield icon + "Support" badge
- Consistent with the contact list treatment

---

## 4. Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/app/api/conversations/contacts/route.ts` | **CREATE** | New endpoint returning messageable contacts per user type |
| `src/components/MessagingPanel.tsx` | **MODIFY** | Rename state/functions, remove client-only guards, add admin UI treatment, add beta banner |

---

## 5. Component Code

### 5A. New file: `src/app/api/conversations/contacts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/conversations/contacts
 * Returns available contacts the authenticated user can message.
 * - Always includes admin users (labeled "PhotoVault Support")
 * - Clients also see their photographers
 * - Photographers also see their clients
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const currentUserType = userProfile.user_type

    // Build email lookup map
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map<string, string>()
    authUsers?.users.forEach((authUser: any) => {
      emailMap.set(authUser.id, authUser.email)
    })

    // --- Always include admin users ---
    const { data: adminProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, business_name, user_type')
      .eq('user_type', 'admin')
      .neq('id', user.id) // Don't show yourself if you're admin

    const adminContacts = (adminProfiles || []).map(profile => ({
      id: profile.id,
      name: 'PhotoVault Support',
      email: emailMap.get(profile.id) || '',
      user_type: 'admin' as const,
      is_admin: true,
    }))

    // --- Role-specific contacts ---
    let roleContacts: Array<{
      id: string
      name: string
      email: string
      user_type: string
      is_admin: boolean
    }> = []

    if (currentUserType === 'client') {
      // Clients see their photographers (reuse /api/client/photographers logic)
      const { data: clientRecords } = await supabase
        .from('clients')
        .select('id, photographer_id')
        .eq('user_id', user.id)

      if (clientRecords && clientRecords.length > 0) {
        const photographerIds = new Set<string>()
        clientRecords.forEach(client => {
          if (client.photographer_id) {
            photographerIds.add(client.photographer_id)
          }
        })

        // Also check galleries for additional photographer associations
        const clientIds = clientRecords.map(c => c.id)
        const { data: galleries } = await supabase
          .from('photo_galleries')
          .select('photographer_id')
          .in('client_id', clientIds)

        galleries?.forEach(gallery => {
          if (gallery.photographer_id) {
            photographerIds.add(gallery.photographer_id)
          }
        })

        if (photographerIds.size > 0) {
          const { data: photographers } = await supabase
            .from('photographers')
            .select(`
              id,
              user_profiles (
                id,
                full_name,
                business_name
              )
            `)
            .in('id', Array.from(photographerIds))

          roleContacts = (photographers || []).map((photographer: any) => ({
            id: photographer.id,
            name: photographer.user_profiles?.full_name
              || photographer.user_profiles?.business_name
              || emailMap.get(photographer.id)
              || 'Unknown Photographer',
            email: emailMap.get(photographer.id) || '',
            user_type: 'photographer',
            is_admin: false,
          }))
        }
      }
    } else if (currentUserType === 'photographer') {
      // Photographers see their clients
      // Find clients associated with this photographer
      const { data: clientRecords } = await supabase
        .from('clients')
        .select('user_id')
        .eq('photographer_id', user.id)
        .not('user_id', 'is', null) // Only clients with linked user accounts

      if (clientRecords && clientRecords.length > 0) {
        const clientUserIds = [...new Set(clientRecords.map(c => c.user_id).filter(Boolean))]

        if (clientUserIds.length > 0) {
          const { data: clientProfiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, business_name, user_type')
            .in('id', clientUserIds)

          roleContacts = (clientProfiles || []).map(profile => ({
            id: profile.id,
            name: profile.full_name || profile.business_name || emailMap.get(profile.id) || 'Unknown Client',
            email: emailMap.get(profile.id) || '',
            user_type: profile.user_type || 'client',
            is_admin: false,
          }))
        }
      }
    }
    // Admin users only see other admins (already handled above) - no role-specific contacts

    // Combine: admin first, then role contacts
    const contacts = [...adminContacts, ...roleContacts]

    logger.info('[Contacts] Returning contacts', {
      userId: user.id,
      userType: currentUserType,
      adminCount: adminContacts.length,
      roleContactCount: roleContacts.length,
    })

    return NextResponse.json({ contacts })
  } catch (error: any) {
    logger.error('[Contacts] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### 5B. Modifications to `src/components/MessagingPanel.tsx`

#### 5B-1. Update imports (line ~10)

Add `Shield` and `Lightbulb` to the Lucide imports:

```tsx
// BEFORE (lines 9-20):
import {
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Archive,
  Flag,
  X,
  Loader2,
  ChevronLeft,
} from 'lucide-react'

// AFTER:
import {
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Archive,
  Flag,
  X,
  Loader2,
  ChevronLeft,
  Shield,
  Lightbulb,
} from 'lucide-react'
```

#### 5B-2. Rename `Photographer` interface to `Contact` (lines 49-55)

```tsx
// BEFORE:
interface Photographer {
  id: string
  name: string
  email: string
  business_name?: string
  profile_image_url?: string
}

// AFTER:
interface Contact {
  id: string
  name: string
  email: string
  user_type: string
  is_admin: boolean
}
```

#### 5B-3. Rename state variables (lines 73-75)

```tsx
// BEFORE:
const [photographers, setPhotographers] = useState<Photographer[]>([])
const [userType, setUserType] = useState<string>('')
const [showPhotographerList, setShowPhotographerList] = useState(false)

// AFTER:
const [contacts, setContacts] = useState<Contact[]>([])
const [userType, setUserType] = useState<string>('')
const [showContactList, setShowContactList] = useState(false)
```

#### 5B-4. Replace `fetchPhotographers` with `fetchContacts` (lines 100-122)

```tsx
// BEFORE:
const fetchPhotographers = useCallback(async () => {
  if (!user || userType !== 'client') return
  try {
    const session = await supabaseBrowser.auth.getSession()
    const token = session.data.session?.access_token
    if (!token) return
    const response = await fetch('/api/client/photographers', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch photographers')
    const data = await response.json()
    setPhotographers(data.photographers || [])
  } catch (error) {
    console.error('Error fetching photographers:', error)
  }
}, [user, userType])

// AFTER:
const fetchContacts = useCallback(async () => {
  if (!user || !userType) return
  try {
    const session = await supabaseBrowser.auth.getSession()
    const token = session.data.session?.access_token
    if (!token) return
    const response = await fetch('/api/conversations/contacts', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to fetch contacts')
    const data = await response.json()
    setContacts(data.contacts || [])
  } catch (error) {
    console.error('Error fetching contacts:', error)
  }
}, [user, userType])
```

#### 5B-5. Rename `startConversationWithPhotographer` to `startConversation` (line 182)

```tsx
// BEFORE:
const startConversationWithPhotographer = async (photographerId: string) => {
  // ... body unchanged ...
  alert('Failed to start conversation with photographer')

// AFTER:
const startConversation = async (contactId: string) => {
  // ... body identical except parameter name change ...
  // Line 197: body: JSON.stringify({ other_user_id: contactId }),
  alert('Failed to start conversation')
```

The function body stays the same - just rename the parameter from `photographerId` to `contactId` and update the `JSON.stringify` call and error message.

#### 5B-6. Update useEffect that fetches contacts (lines 334-340)

```tsx
// BEFORE:
useEffect(() => {
  if (userType) {
    fetchConversations()
    if (userType === 'client') {
      fetchPhotographers()
    }
  }
  // ... rest of realtime subscription ...
}, [fetchConversations, fetchPhotographers, selectedConversation, fetchMessages, userType])

// AFTER:
useEffect(() => {
  if (userType) {
    fetchConversations()
    fetchContacts()
  }
  // ... rest of realtime subscription unchanged ...
}, [fetchConversations, fetchContacts, selectedConversation, fetchMessages, userType])
```

#### 5B-7. Replace "Start New Chat" button and contact list (lines 398-460)

Replace the entire conversation list sidebar content (inside `<div className={`w-full md:w-80 ...`}>`) with:

```tsx
{/* Beta Feedback Banner */}
{contacts.length > 0 && !showContactList && (
  <div className="px-4 pt-3 pb-1">
    <div className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <p className="text-xs text-primary">
        Beta Feedback? Message <span className="font-semibold">PhotoVault Support</span> with feature ideas!
      </p>
    </div>
  </div>
)}

{/* Start New Chat Button - show for ALL user types */}
{contacts.length > 0 && conversations.length > 0 && !showContactList && (
  <div className="p-4 border-b bg-muted/50">
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => setShowContactList(true)}
    >
      <User className="h-4 w-4 mr-2" />
      Start New Chat
    </Button>
  </div>
)}

{/* Show contacts for user to message */}
{contacts.length > 0 && (conversations.length === 0 || showContactList) && (
  <div className="p-4 border-b bg-muted">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-foreground">
        {conversations.length === 0 ? 'Your Contacts' : 'Start New Chat'}
      </h3>
      {conversations.length > 0 && (
        <button
          onClick={() => setShowContactList(false)}
          className="text-primary hover:text-primary/80 text-xs"
        >
          Cancel
        </button>
      )}
    </div>
    {/* Beta banner inside contact list when no conversations exist */}
    {conversations.length === 0 && (
      <div className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2 mb-3">
        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-primary">
          Beta Feedback? Message <span className="font-semibold">PhotoVault Support</span> with feature ideas!
        </p>
      </div>
    )}
    <div className="space-y-2">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => {
            startConversation(contact.id)
            setShowContactList(false)
          }}
          className="w-full p-3 bg-card rounded-lg hover:bg-accent transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              contact.is_admin ? 'bg-primary/20' : 'bg-muted'
            }`}>
              {contact.is_admin ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                {contact.is_admin && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Support
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {contact.is_admin ? 'Feature requests & help' : contact.email}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
)}
```

#### 5B-8. Update empty state fallback (lines 455-460)

```tsx
// BEFORE:
{conversations.length === 0 && !(userType === 'client' && photographers.length > 0) ? (

// AFTER:
{conversations.length === 0 && contacts.length === 0 ? (
```

This ensures the "No messages yet" dead-end only shows when there are truly no contacts available (edge case: no admin in system and no associated users).

#### 5B-9. Update conversation list to show admin treatment (lines 462-498)

In the conversation list items, update the avatar area to detect admin:

```tsx
{/* Inside the conversations.map callback, replace the avatar div */}
{/* BEFORE: */}
<div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
  <User className="h-5 w-5 text-primary" />
</div>

{/* AFTER: */}
<div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
  conv.other_user.user_type === 'admin' ? 'bg-primary/20' : 'bg-muted'
}`}>
  {conv.other_user.user_type === 'admin' ? (
    <Shield className="h-5 w-5 text-primary" />
  ) : (
    <User className="h-5 w-5 text-primary" />
  )}
</div>
```

And update the name display to show "Support" badge for admin:

```tsx
{/* Inside the name area, replace: */}
{/* BEFORE: */}
<h4 className="font-medium text-sm truncate">
  {conv.other_user.name}
</h4>

{/* AFTER: */}
<div className="flex items-center gap-2 min-w-0">
  <h4 className="font-medium text-sm truncate">
    {conv.other_user.user_type === 'admin' ? 'PhotoVault Support' : conv.other_user.name}
  </h4>
  {conv.other_user.user_type === 'admin' && (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
      Support
    </Badge>
  )}
</div>
```

#### 5B-10. Update chat header for admin conversations (lines 516-521)

```tsx
{/* BEFORE: */}
<div>
  <h3 className="font-semibold">{selectedConversation.other_user.name}</h3>
  <p className="text-xs text-muted-foreground capitalize">
    {selectedConversation.other_user.user_type}
  </p>
</div>

{/* AFTER: */}
<div>
  <h3 className="font-semibold">
    {selectedConversation.other_user.user_type === 'admin'
      ? 'PhotoVault Support'
      : selectedConversation.other_user.name}
  </h3>
  <p className="text-xs text-muted-foreground capitalize">
    {selectedConversation.other_user.user_type === 'admin'
      ? 'Support'
      : selectedConversation.other_user.user_type}
  </p>
</div>
```

Also update the CardTitle in the header (line 386):

```tsx
{/* BEFORE: */}
{selectedConversation ? selectedConversation.other_user.name : 'Messages'}

{/* AFTER: */}
{selectedConversation
  ? (selectedConversation.other_user.user_type === 'admin'
      ? 'PhotoVault Support'
      : selectedConversation.other_user.name)
  : 'Messages'}
```

---

## 6. Accessibility Considerations

| Concern | Approach |
|---------|----------|
| **Color contrast** | `bg-primary/10` banner background with `text-primary` text meets WCAG AA on both dark and light themes. The `/10` opacity is decorative; text color carries the contrast. |
| **Icon-only elements** | Shield and Lightbulb icons are always paired with text labels ("Support" badge, banner text). Not icon-only. |
| **Keyboard navigation** | Contact list uses `<button>` elements (already focusable). "Start New Chat" uses shadcn `<Button>`. No custom keyboard handling needed. |
| **Screen readers** | Badge text "Support" provides role context. Admin contacts have descriptive name "PhotoVault Support" rather than relying on icon alone. |
| **Focus order** | Banner -> Start New Chat button -> Contact list items -> Conversation list items. Logical top-to-bottom flow. |
| **Touch targets** | Contact buttons use `p-3` padding (48px+ height). Meets 44x44px minimum touch target. |

---

## 7. Testing Steps

### Functional Testing

#### As a Client:
1. Open messaging panel
2. Verify "Start New Chat" button appears (even with 0 existing conversations)
3. Click "Start New Chat" - verify contacts list shows:
   - PhotoVault Support (admin) at the top with Shield icon and "Support" badge
   - Associated photographers below with User icon
4. Click on PhotoVault Support - verify conversation is created and selected
5. Send a message to admin - verify it appears in the chat
6. Close and reopen messaging panel - verify admin conversation appears in list with Shield icon

#### As a Photographer:
1. Open messaging panel
2. Verify "Start New Chat" button appears (previously it did NOT for photographers)
3. Click "Start New Chat" - verify contacts list shows:
   - PhotoVault Support (admin) at the top with Shield icon and "Support" badge
   - Associated clients below with User icon
4. Click on PhotoVault Support - verify conversation is created
5. Click on a client - verify conversation is created

#### As Admin:
1. Open messaging panel
2. Verify admin does NOT see themselves in the contact list
3. Verify existing conversations with other users still work

### Beta Banner Testing
1. As client: verify Lightbulb banner appears above conversation list
2. As photographer: verify Lightbulb banner appears above conversation list
3. Verify banner text reads "Beta Feedback? Message PhotoVault Support with feature ideas!"
4. Verify banner uses subtle `bg-primary/10` styling (not overwhelming)
5. When contact list is open (no conversations), verify banner appears inside it

### Visual Testing
1. **Dark mode (default):** All text readable, Shield icon visible, badge visible, banner readable
2. **Light mode:** Same checks - semantic tokens should adapt automatically
3. **Mobile viewport:** Conversation list takes full width, contact list renders properly, banner wraps text gracefully
4. **Desktop viewport:** Side-by-side layout with 80px sidebar, banner fits within sidebar width

### Regression Testing
1. Existing client-to-photographer conversations still display correctly
2. Real-time message subscription still works
3. Archive conversation still works
4. Report message still works
5. Initial conversation ID auto-select still works
6. `POST /api/conversations` still validates with `can_user_message()` (no bypass)

---

## Notes

- **Priority:** MEDIUM - Beta feature request / UX improvement
- **Risk:** LOW - No database changes. API endpoint is additive. MessagingPanel changes are UI-only refactoring with one new fetch target.
- **Regression concern:** The `POST /api/conversations` endpoint is unchanged and still calls `can_user_message()` for permission validation. The new contacts endpoint just surfaces who is available; actual permission is still enforced server-side on conversation creation.
- **Future enhancement:** The beta feedback banner could be made dismissible with localStorage persistence if users find it noisy. For now, keeping it static and small is sufficient.

---

*Plan created by Shadcn/UI & Tailwind CSS Expert following existing codebase patterns*
