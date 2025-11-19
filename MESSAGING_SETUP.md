# Client-Photographer Messaging Feature Setup

## Overview
I've built a complete messaging system that allows clients and photographers to communicate directly within Photo Vault. The system includes:

- Real-time messaging with Supabase Realtime
- Message threads/conversations tracking
- Unread message counts
- Message read receipts
- Database-level security with RLS policies

## What's Been Created

### 1. Database Schema (`database/messaging-schema.sql`)
- **messages** table: stores all messages between users
- **message_threads** table: tracks conversations and unread counts
- Automatic triggers to update threads when messages are sent
- Helper function to mark messages as read
- Row-Level Security policies for data protection

### 2. API Endpoints
- `POST /api/messages` - Send a new message
- `GET /api/messages` - Get messages (with optional filtering)
- `GET /api/messages/threads` - Get all conversation threads
- `POST /api/messages/read` - Mark messages as read

### 3. UI Components
- **Messages.tsx** - Full messaging component with two modes:
  - Dashboard preview mode (shows recent 5 conversations)
  - Full interface mode (complete messaging UI)

### 4. Dashboard Integration
- Updated photographer dashboard to show client messages
- Messages card now spans full width
- Real-time updates when new messages arrive

## Setup Instructions

### Step 1: Apply Database Schema

You need to run the SQL schema in your Supabase database. Here's how:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database/messaging-schema.sql`
5. Paste into the query editor
6. Click **Run** to execute the schema

The schema will create:
- `messages` table
- `message_threads` table
- Indexes for performance
- Triggers for auto-updating threads
- RLS policies for security
- Helper function `mark_messages_read()`

### Step 2: Verify Database Setup

After running the schema, verify the tables were created:

```sql
-- Check messages table
SELECT * FROM messages LIMIT 1;

-- Check message_threads table
SELECT * FROM message_threads LIMIT 1;

-- Verify RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('messages', 'message_threads');
```

### Step 3: Test the Feature

1. **As a Photographer:**
   - Log in to http://localhost:3000/photographer/dashboard
   - You should see the "Client Messages" card (no messages yet)

2. **As a Client:**
   - Navigate to your client dashboard
   - (Optional) Add messaging UI to client dashboard following the same pattern

3. **Send Test Message:**
   - Use the API directly or add a "New Message" button
   - Messages will appear in real-time

## How It Works

### Message Flow

1. **Sending a Message:**
   ```
   Client -> POST /api/messages -> Database (messages table)
   -> Trigger updates message_threads
   -> Real-time notification to recipient
   ```

2. **Viewing Messages:**
   ```
   GET /api/messages/threads -> Returns all conversations
   User clicks thread -> GET /api/messages?with={userId}
   -> Messages displayed in UI
   -> Auto-mark as read via POST /api/messages/read
   ```

3. **Real-time Updates:**
   - Supabase Realtime listens for INSERT events on messages table
   - When new message arrives, automatically refreshes threads and current conversation
   - No page refresh needed!

### Security

- **Row-Level Security (RLS):** Users can only see messages they sent or received
- **Authentication Required:** All API endpoints require valid session token
- **Soft Deletes:** Messages can be deleted without removing from database
- **User Validation:** Recipients are verified before sending messages

## Component Usage

### Dashboard Preview (Current Implementation)

```tsx
<Messages limit={5} showFullInterface={false} />
```

Shows the 5 most recent conversations with basic info.

### Full Messaging Interface

```tsx
<Messages limit={50} showFullInterface={true} />
```

Shows complete messaging UI with:
- Thread list on the left
- Message view on the right
- Real-time updates
- Unread badges
- Send message input

## Database Schema Details

### messages table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sender_id | UUID | FK to user_profiles |
| recipient_id | UUID | FK to user_profiles |
| message_text | TEXT | Message content |
| gallery_id | UUID | Optional link to gallery |
| session_id | UUID | Optional link to photo session |
| is_read | BOOLEAN | Read status |
| read_at | TIMESTAMPTZ | When message was read |
| created_at | TIMESTAMPTZ | When message was sent |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

### message_threads table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user1_id | UUID | First participant (lower UUID) |
| user2_id | UUID | Second participant (higher UUID) |
| last_message_id | UUID | FK to messages |
| last_message_at | TIMESTAMPTZ | Last activity time |
| user1_unread_count | INTEGER | Unread count for user1 |
| user2_unread_count | INTEGER | Unread count for user2 |

## Next Steps

### For Clients
To add messaging to the client dashboard, create similar component usage:

```tsx
// In client dashboard page
import Messages from '@/components/Messages'

// In JSX
<Card>
  <CardHeader>
    <CardTitle>Messages with Photographers</CardTitle>
  </CardHeader>
  <CardContent>
    <Messages limit={5} showFullInterface={false} />
  </CardContent>
</Card>
```

### Future Enhancements

1. **Push Notifications:** Email/SMS when new message arrives
2. **File Attachments:** Send photos in messages
3. **Message Search:** Search within conversations
4. **Message Reactions:** Like/react to messages
5. **Typing Indicators:** Show when other person is typing
6. **Message Threading:** Reply to specific messages
7. **Admin Messaging:** Platform admins can message users

## Troubleshooting

### "Could not find table" error
- Make sure you've run the `database/messaging-schema.sql` in Supabase SQL Editor
- Verify tables exist: `SELECT * FROM messages;`

### Messages not appearing in real-time
- Check browser console for errors
- Verify Supabase Realtime is enabled in your project settings
- Check that the subscription channel is properly set up

### 401 Unauthorized errors
- Verify user is logged in
- Check that session token is being passed correctly
- Ensure RLS policies are properly set up

### Messages won't send
- Check recipient_id is valid
- Verify message_text is not empty
- Look at API response for specific error message

## Files Modified/Created

### Created:
- `database/messaging-schema.sql` - Database schema
- `src/app/api/messages/route.ts` - Send and fetch messages API
- `src/app/api/messages/read/route.ts` - Mark messages as read API
- `src/app/api/messages/threads/route.ts` - Get conversation threads API
- `src/components/Messages.tsx` - Messaging UI component
- `MESSAGING_SETUP.md` - This documentation file

### Modified:
- `src/app/photographer/dashboard/page.tsx` - Added Messages component to dashboard

## Summary

The messaging system is now ready to use! Once you apply the database schema in Supabase, photographers and clients will be able to send messages to each other. The system includes:

✅ Complete database schema with security
✅ REST API endpoints
✅ React component with real-time updates
✅ Dashboard integration
✅ Message threading and unread counts
✅ Read receipts

Just apply the database schema and you're good to go!
