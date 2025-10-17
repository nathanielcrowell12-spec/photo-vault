# Supabase Setup Guide for PhotoVault

## Step 1: Create Supabase Project

1. **Go to:** https://supabase.com
2. **Sign up or Log in**
3. **Click:** "New Project"
4. **Fill in:**
   - **Name:** `photovault-production` (or your preference)
   - **Database Password:** (Create a strong password, save it securely!)
   - **Region:** Choose closest to your target users (e.g., `us-east-1` for East Coast)
5. **Click:** "Create new project"
6. **Wait:** 2-3 minutes for project to initialize

---

## Step 2: Get Your API Credentials

Once your project is created:

1. **Go to:** Settings → API (in left sidebar)
2. **Copy these 3 values:**

   ### **Project URL**
   ```
   Example: https://abcdefghijklmnop.supabase.co
   ```

   ### **Anon/Public Key** (starts with `eyJ...`)
   ```
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ### **Service Role Key** (starts with `eyJ...`)
   ```
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **IMPORTANT:** Keep the Service Role Key secret! Never commit it to Git.

---

## Step 3: Configure Environment Variables

I'll create a `.env.local` file with your credentials. Just provide me with:
- Project URL
- Anon/Public Key  
- Service Role Key

---

## Step 4: Run Database Schema

Once environment variables are set, I'll:

1. Go to Supabase SQL Editor
2. Run the schema from `database/schema.sql`
3. Create all tables, indexes, and policies

---

## Step 5: Set Up Storage Buckets

I'll configure Supabase Storage for photos:

1. Create `galleries` bucket (for photographer uploads)
2. Create `profile-images` bucket (for user avatars)
3. Set proper security policies
4. Configure public access rules

---

## Step 6: Test Connection

I'll verify everything works by:

1. Testing authentication (signup/login)
2. Creating a test photographer account
3. Creating a test client
4. Uploading a test photo
5. Verifying database records

---

## What You Need to Do:

**Right now:**
1. Create Supabase project (steps above)
2. Copy the 3 API credentials
3. Paste them here in chat

**I'll handle:**
- Creating `.env.local` file
- Running database schema
- Setting up storage buckets
- Connecting all features
- Testing everything

---

## Ready?

Create your Supabase project and share the 3 credentials when ready! 🚀

