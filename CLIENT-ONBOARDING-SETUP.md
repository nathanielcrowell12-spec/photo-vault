# Client Onboarding & Email System Setup

## Overview

This document outlines the complete client acquisition flow for Photo Vault, including email notifications and automatic account linking.

## Customer Acquisition Flows

### Flow 1: Photographer-Initiated (Primary)
1. ✅ Photographer does photoshoot with client
2. ✅ Photographer creates client profile in system
3. ✅ Photographer creates gallery & uploads photos
4. ✅ **System sends "Gallery Ready" email to client**
5. ✅ **Client clicks link → creates account**
6. ✅ **Auto-link: Client record linked to user account**
7. ⏳ Client pays $100 upfront → Photographer gets $50 commission (Stripe integration needed)

### Flow 2: Self-Service Customer
1. Customer finds Photo Vault independently
2. Customer creates account at `/signup`
3. Customer has access but no galleries yet
4. Customer can import photos or wait for photographer invitation

---

## What's Been Built

### 1. Email Service (`src/lib/email/`)

#### Files Created:
- **`templates.ts`** - Beautiful HTML email templates
  - Gallery Ready email (when photos are uploaded)
  - Welcome email (after account creation)
  - Password reset email

- **`email-service.ts`** - Unified email service using Resend
  - `sendGalleryReadyEmail()` - Notify client that gallery is ready
  - `sendWelcomeEmail()` - Welcome new customers
  - `sendPasswordResetEmail()` - Password resets
  - `sendPaymentReminderEmail()` - Payment reminders
  - `sendTestEmail()` - For testing

#### Email Features:
- Professional HTML templates with inline CSS
- Plain text fallbacks
- Mobile-responsive design
- Branded with PhotoVault colors (pink/orange gradient)
- Clear call-to-action buttons
- Step-by-step instructions for clients

### 2. Gallery Ready Notification API

**Endpoint:** `POST /api/send-gallery-ready-email`

**What it does:**
1. Photographer calls this endpoint after uploading photos
2. Generates unique invitation token (32 characters)
3. Creates/updates invitation record in database
4. Sends beautiful email to client with invitation link
5. Invitation expires in 30 days

**Request Body:**
```json
{
  "galleryId": "uuid-of-gallery",
  "clientId": "uuid-of-client-record"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gallery ready email sent successfully",
  "invitationToken": "abc123..."
}
```

### 3. Client Invitation Page

**Route:** `/invite/[token]`

**Features:**
- Validates invitation token
- Shows gallery preview (name, photo count, photographer)
- Pre-fills client email from invitation
- Account creation form
- Password strength validation
- Beautiful, mobile-responsive UI

**What happens:**
1. Client lands on page from email link
2. System validates token and loads invitation data
3. Client sees gallery details and photographer info
4. Client creates account with pre-filled email
5. System creates Supabase auth account
6. Auto-linking trigger fires (see below)
7. Client redirected to `/client/dashboard`

### 4. Auto-Link System

**Database Trigger:** `trigger_link_client_to_user`

**What it does:**
When a new `user_profile` is created with `user_type = 'client'`:
1. Finds matching `clients` record by email
2. Updates `clients.user_id` to link to new user account
3. Updates all `galleries` for that client with `user_id`
4. Marks invitation as `accepted`
5. Logs the linking operation

**Result:** Client automatically sees all their galleries on first login!

---

## Database Schema

### Tables Added/Modified:

#### `client_invitations`
Stores invitation tokens and tracks invitation status.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| photographer_id | UUID | FK to user_profiles |
| client_id | UUID | FK to clients |
| gallery_id | UUID | FK to galleries |
| client_email | VARCHAR | Client's email |
| client_name | VARCHAR | Client's name |
| invitation_token | VARCHAR | Unique 32-char token |
| status | VARCHAR | 'pending', 'accepted', 'expired' |
| created_at | TIMESTAMPTZ | When invitation was created |
| accepted_at | TIMESTAMPTZ | When client accepted |
| expires_at | TIMESTAMPTZ | Expiration date (30 days) |

#### `clients` (modified)
Added `user_id` column to link client records to user accounts.

```sql
ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES user_profiles(id);
```

#### `galleries` (modified)
Added `user_id` column to link galleries to user accounts.

```sql
ALTER TABLE galleries ADD COLUMN user_id UUID REFERENCES user_profiles(id);
```

---

## Setup Instructions

### Step 1: Apply Database Schema

Run the SQL schema in Supabase:

1. Go to Supabase project → **SQL Editor**
2. Open new query
3. Copy contents of `database/client-onboarding-schema.sql`
4. Click **Run**

This creates:
- `client_invitations` table
- Auto-linking trigger function
- Indexes for performance
- RLS policies for security

### Step 2: Verify Email Configuration

Check that Resend is configured in `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** The Resend API key is already configured in your project.

### Step 3: Test the Email System

Test endpoint: `POST /api/test-email`

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your@email.com"}'
```

### Step 4: Add "Send Invitation" Button to Photographer UI

When photographer uploads photos to a gallery, trigger the email:

```typescript
// After successful photo upload
const response = await fetch('/api/send-gallery-ready-email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    galleryId: 'uuid-of-gallery',
    clientId: 'uuid-of-client',
  }),
})
```

---

## How It Works (End-to-End)

### Photographer Side:

1. **Creates Client Profile**
   ```
   /photographer/clients → "Add Client" → Enter name, email, phone
   ```

2. **Creates Gallery**
   ```
   /photographer/galleries → "Create Gallery" → Select client, upload photos
   ```

3. **Sends Invitation**
   ```
   System: POST /api/send-gallery-ready-email
   → Generates invitation token
   → Sends beautiful email to client
   ```

### Client Side:

1. **Receives Email**
   ```
   Subject: "📸 Your photos are ready from [Photographer]!"
   → Beautiful HTML email with gallery preview
   → Big "View My Photos" button
   ```

2. **Clicks Invitation Link**
   ```
   https://photovault.com/invite/abc123xyz...
   → Lands on invitation page
   → Sees gallery details
   → Account creation form pre-filled
   ```

3. **Creates Account**
   ```
   Client enters:
   - Name (pre-filled)
   - Email (pre-filled, disabled)
   - Password
   - Confirm password

   → Click "Create Account & View Photos"
   ```

4. **Auto-Linking Magic**
   ```
   Database trigger fires:
   1. Finds client record by email
   2. Links client.user_id = new user ID
   3. Links all galleries to user account
   4. Marks invitation as accepted
   ```

5. **Redirected to Dashboard**
   ```
   /client/dashboard?welcome=true
   → Client immediately sees their gallery!
   → Can view, download, share photos
   ```

---

## Testing the Complete Flow

### 1. Create Test Client

```sql
-- In Supabase SQL Editor
INSERT INTO clients (photographer_id, name, email, phone, status)
VALUES (
  'your-photographer-user-id',
  'Test Client',
  'testclient@example.com',
  '555-1234',
  'active'
);
```

### 2. Create Test Gallery

```sql
INSERT INTO galleries (
  photographer_id,
  client_id,
  gallery_name,
  gallery_description,
  photo_count,
  platform
)
VALUES (
  'your-photographer-user-id',
  'client-id-from-step-1',
  'Family Photos - Summer 2025',
  'Beautiful summer family portraits',
  25,
  'PhotoVault'
);
```

### 3. Send Invitation Email

```bash
curl -X POST http://localhost:3000/api/send-gallery-ready-email \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "galleryId": "gallery-id-from-step-2",
    "clientId": "client-id-from-step-1"
  }'
```

### 4. Check Email

- Check inbox for `testclient@example.com`
- Verify email looks professional
- Click "View My Photos" button

### 5. Create Account

- Fill out form on invitation page
- Create account
- Verify redirect to dashboard

### 6. Verify Auto-Linking

```sql
-- Check that client record is linked
SELECT * FROM clients WHERE email = 'testclient@example.com';
-- user_id should now be populated!

-- Check that galleries are linked
SELECT * FROM galleries WHERE client_id = 'client-id-from-step-1';
-- user_id should now be populated!

-- Check invitation status
SELECT * FROM client_invitations WHERE client_email = 'testclient@example.com';
-- status should be 'accepted'
```

---

## Email Templates Preview

### Gallery Ready Email

**Subject:** 📸 Your photos are ready from [Photographer Name]!

**Preview:**
- Pink/orange gradient header
- "Your Photos Are Ready!" heading
- Gallery name and photo count
- 3-step process (Click → Set up account → Access gallery)
- Big call-to-action button
- Photographer info box
- "What is PhotoVault?" section

### Welcome Email

**Subject:** 🎉 Welcome to PhotoVault!

**Preview:**
- Blue/purple gradient header
- Welcome message
- "Go to Dashboard" button
- Support contact info

---

## Security Features

### Invitation Tokens
- 32 characters (nanoid)
- Cryptographically random
- One-time use
- Expires in 30 days
- Stored hashed in database

### Auto-Linking Protection
- Only links if email matches exactly
- Only links if `user_id` is NULL (not already linked)
- Only processes for `user_type = 'client'`
- Logs all linking operations

### Row-Level Security
- Photographers can only see their own invitations
- Service role has full access for API operations
- Clients can't see invitation records (prevents enumeration)

---

## Next Steps (Stripe Integration)

After Stripe is integrated:

1. **Payment Processing**
   - Client clicks "Access Gallery" after signup
   - Stripe Checkout for $100 upfront payment
   - Webhook processes payment
   - Updates `client_payments` table
   - Calculates photographer commission ($50)

2. **Commission Tracking**
   - Create `commission_payments` record
   - Link to `client_payments`
   - Update photographer's `total_commission_earned`
   - Send commission email to photographer

3. **Gallery Access Control**
   - Check payment status before showing gallery
   - Grace period handling (6 months)
   - Reactivation flow

---

## Files Created/Modified

### Created:
- `src/lib/email/templates.ts` - Email HTML templates
- `src/lib/email/email-service.ts` - Unified email service
- `src/app/api/send-gallery-ready-email/route.ts` - Gallery ready notification API
- `src/app/invite/[token]/page.tsx` - Client invitation acceptance page
- `database/client-onboarding-schema.sql` - Database schema for onboarding
- `CLIENT-ONBOARDING-SETUP.md` - This documentation

### Modified:
- None (all new functionality)

---

## Environment Variables Needed

```bash
# Resend (already configured)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Troubleshooting

### Email not sending
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for delivery status
- Verify `FROM_EMAIL` is approved in Resend

### Client can't create account
- Check invitation token is valid
- Verify invitation hasn't expired
- Check Supabase Auth is enabled
- Verify email domain isn't blocked

### Auto-linking not working
- Check trigger function is created in database
- Verify `user_profiles` trigger is enabled
- Check logs in Supabase for errors
- Verify email matches exactly between invitation and signup

### Galleries not showing after signup
- Check `clients.user_id` is populated
- Check `galleries.user_id` is populated
- Verify client has active galleries
- Check RLS policies on galleries table

---

## Success Metrics

Once implemented, you should see:

✅ Photographers can send invitations with one click
✅ Clients receive professional-looking emails
✅ Client signup conversion rate increases
✅ Automatic account linking works 100% of the time
✅ Clients see galleries immediately after signup
✅ Zero manual intervention needed

---

## Support

Questions? Issues?
- Check Supabase logs for errors
- Check browser console for client-side errors
- Check server logs for API errors
- Email support@photovault.com

---

© 2025 PhotoVault - Complete Client Onboarding System
