# PhotoVault Messaging System - MVP

## Complete System Overview

A simple, secure text-based messaging system for Photo Vault users with role-based permissions.

---

## ✅ What's Been Built

### **1. Database Schema** (`database/messaging-mvp-schema.sql`)

**Tables:**
- `conversations` - 1:1 conversation threads between users
- `conversation_messages` - Individual messages

**Key Features:**
- Automatic conversation creation/retrieval
- Unread message counters (per user)
- Archive functionality (per user)
- Message reporting system
- Real-time triggers
- Permission checking functions

**Functions:**
- `get_or_create_conversation()` - Smart conversation management
- `can_user_message()` - Permission checking
- `mark_conversation_messages_read()` - Mark as read
- Auto-update conversation on new message (trigger)

### **2. API Endpoints**

#### Conversations
- `GET /api/conversations` - Get all conversations for user
- `POST /api/conversations` - Create/get conversation with another user

#### Messages
- `GET /api/conversations/[id]/messages` - Get all messages in conversation
- `POST /api/conversations/[id]/messages` - Send new message

#### Actions
- `POST /api/conversations/[id]/archive` - Archive/unarchive conversation
- `POST /api/conversations/messages/[id]/report` - Report a message

### **3. UI Component** (`src/components/MessagingPanel.tsx`)

**Features:**
- Conversation list with unread badges
- Real-time message updates (Supabase Realtime)
- Chat interface with message history
- Send messages (text only, max 5000 chars)
- Archive conversations
- Report messages
- Mobile-responsive (conversation list collapses on mobile)
- Auto-scroll to latest message
- Typing in textarea, Enter to send

---

## 🔐 Permission System

### **Admin:**
- ✅ Can message ANYONE on the platform
- ✅ Can view ALL conversations
- ✅ All users can message admin

### **Photographers:**
- ✅ Can message THEIR clients (clients they added)
- ✅ Can message OTHER photographers
- ✅ Can message Admin
- ❌ Cannot message other photographers' clients
- ❌ Cannot message random customers

### **Clients (added by photographer):**
- ✅ Can message ANY photographer who created a gallery for them
- ✅ Can message Admin
- ❌ Cannot message other clients
- ❌ Cannot message photographers without galleries

### **Customers (no photographer yet):**
- ✅ Can message Admin only
- ❌ Cannot message photographers or other customers

---

## 🚀 Setup Instructions

### Step 1: Apply Database Schema

1. Go to Supabase → SQL Editor
2. Create new query
3. Copy contents of `database/messaging-mvp-schema.sql`
4. Run the query

This creates:
- `conversations` table
- `conversation_messages` table
- Permission functions
- RLS policies
- Triggers and indexes

### Step 2: Verify Schema

```sql
-- Check tables exist
SELECT * FROM conversations LIMIT 1;
SELECT * FROM conversation_messages LIMIT 1;

-- Check function exists
SELECT can_user_message('user-id-1', 'user-id-2');
```

### Step 3: Add Messaging to UI

You can add the MessagingPanel component anywhere:

```tsx
import MessagingPanel from '@/components/MessagingPanel'

// In your component
<MessagingPanel onClose={() => setShowMessages(false)} />
```

**Common Places:**
- Help icon in header (modal/drawer)
- Dedicated `/messages` page
- Dashboard widget
- Client/photographer profiles

---

## 📱 Using the Messaging System

### For Photographers

**Start a conversation:**
```typescript
// Create conversation with client
const response = await fetch('/api/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    other_user_id: 'client-user-id'
  })
})

const { conversation_id } = await response.json()
// Now use MessagingPanel with initialConversationId
```

**Message a client:**
- Open MessagingPanel
- Click on client conversation
- Type and send messages

**Message another photographer:**
- Same process as above

### For Clients

**Message their photographer:**
- Open MessagingPanel
- See list of photographers they've worked with
- Click and start chatting

### For Admin

**Message anyone:**
- Open MessagingPanel
- Manually create conversation via API with any user_id
- OR have a user selector in admin panel

**View reported messages:**
```sql
SELECT * FROM conversation_messages WHERE is_reported = TRUE ORDER BY reported_at DESC;
```

---

## 🎨 UI/UX Features

### Conversation List
- Shows all conversations sorted by latest message
- Unread badge (count of unread messages)
- Last message preview (first 100 chars)
- Time ago ("2h ago", "3d ago")
- Archive button

### Chat Interface
- Message bubbles (sender = blue, recipient = gray)
- Auto-scroll to bottom on new message
- Timestamp on each message
- Report button on received messages
- Archive conversation button
- Mobile-responsive (back button appears on mobile)

### Real-Time Updates
- Uses Supabase Realtime
- New messages appear instantly
- Conversation list updates on new messages
- Unread counts update automatically

---

## 🔧 Technical Details

### Message Storage
- Messages stored indefinitely (soft delete only)
- Max message length: 5000 characters
- Text only (no attachments in MVP)

### Unread Tracking
- Automatic unread counter per user
- Auto-marks as read when viewing conversation
- Resets unread count via database function

### Archive System
- Per-user archive status
- Archived conversations hidden from list
- Unarchives automatically when new message received
- Records never deleted (archive = hide only)

### Permission Enforcement
- Database-level RLS policies
- Function-based permission checking
- API-level verification
- Cannot bypass via direct database access

### Performance
- Indexed queries for fast lookup
- Conversation list pagination possible
- Message pagination built-in (50 per page)
- Real-time subscriptions per conversation

---

## 📊 Analytics & Moderation

### For Admin

**View all reported messages:**
```sql
SELECT
  cm.*,
  reporter.full_name as reporter_name,
  sender.full_name as sender_name
FROM conversation_messages cm
LEFT JOIN user_profiles reporter ON cm.reported_by = reporter.id
LEFT JOIN user_profiles sender ON cm.sender_id = sender.id
WHERE cm.is_reported = TRUE
AND cm.is_reviewed = FALSE
ORDER BY cm.reported_at DESC;
```

**Mark message as reviewed:**
```sql
UPDATE conversation_messages
SET is_reviewed = TRUE,
    reviewed_by = 'your-admin-user-id',
    reviewed_at = NOW()
WHERE id = 'message-id';
```

**Get messaging stats:**
```sql
-- Total conversations
SELECT COUNT(*) FROM conversations;

-- Total messages
SELECT COUNT(*) FROM conversation_messages;

-- Messages per day (last 7 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as message_count
FROM conversation_messages
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most active users
SELECT
  sender_id,
  COUNT(*) as messages_sent
FROM conversation_messages
GROUP BY sender_id
ORDER BY messages_sent DESC
LIMIT 10;
```

---

## 🚫 What's NOT in MVP

- ❌ Email notifications
- ❌ Message templates
- ❌ Photo attachments
- ❌ Gallery link sharing
- ❌ Status indicators (online/offline)
- ❌ Typing indicators
- ❌ Read receipts (visible to sender)
- ❌ Message editing/deletion
- ❌ Group conversations
- ❌ Voice messages
- ❌ File attachments

These can be added later based on user feedback!

---

## 🐛 Troubleshooting

### Messages not appearing
- Check RLS policies are enabled
- Verify user has permission to view conversation
- Check Supabase Realtime is enabled in project settings

### Cannot send messages
- Verify `can_user_message()` returns TRUE
- Check user relationship (client-photographer link)
- Verify galleries exist for client-photographer relationship

### Unread counts wrong
- Check trigger is firing on new messages
- Verify `mark_conversation_messages_read()` function exists
- Re-run database schema if needed

### Real-time not working
- Enable Supabase Realtime in project settings
- Check browser console for connection errors
- Verify Supabase URL is correct

---

## 📝 Future Enhancements

**Phase 2 (User Feedback):**
- Email notifications for new messages
- Message search
- Message reactions (like, heart)
- Attach photos from galleries

**Phase 3 (Advanced):**
- Typing indicators
- Read receipts
- Auto-responses (out of office)
- Message templates
- Voice messages
- Group conversations

---

## Files Created

### Database:
- `database/messaging-mvp-schema.sql` - Complete database schema

### API:
- `src/app/api/conversations/route.ts` - Get/create conversations
- `src/app/api/conversations/[conversationId]/messages/route.ts` - Send/get messages
- `src/app/api/conversations/[conversationId]/archive/route.ts` - Archive conversations
- `src/app/api/conversations/messages/[messageId]/report/route.ts` - Report messages

### UI:
- `src/components/MessagingPanel.tsx` - Complete messaging interface

### Docs:
- `MESSAGING-SYSTEM-MVP.md` - This documentation

---

## Summary

The PhotoVault Messaging System MVP is **production-ready** with:

✅ Secure, role-based messaging
✅ Real-time updates
✅ Clean, mobile-responsive UI
✅ Archive and report functionality
✅ Performance-optimized queries
✅ Database-level permission enforcement

**Next Step:** Apply the database schema and start messaging! 🚀
