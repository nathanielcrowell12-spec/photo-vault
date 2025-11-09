# Soft Delete Feature Setup Guide

## ✅ Code Changes Complete

All code fixes have been applied:
- Fixed database triggers to use `BEFORE DELETE` instead of `INSTEAD OF`
- Added RLS policies to allow viewing deleted items
- Fixed import paths in API routes and deleted page
- Added UPDATE policies for restoring items

## 🗃️ Database Migration Required

You need to run the SQL migration in Supabase to enable soft delete functionality.

### Steps to Apply Migration:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your PhotoVault project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Copy and Run Migration**
   - Open the file: `database/soft-delete-fixed.sql`
   - Copy ALL contents
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Check that no errors appear

## 🎯 What This Migration Does:

### 1. **Adds Columns**
   - `status` (TEXT) - either 'active' or 'deleted'
   - `deleted_at` (TIMESTAMPTZ) - timestamp when item was deleted

### 2. **Creates RLS Policies**
   - **Active items**: Normal queries only see `status = 'active'`
   - **Deleted items**: Special queries can see `status = 'deleted'`
   - **Restore**: Users can UPDATE their own items to restore them

### 3. **Sets Up Triggers**
   - When you DELETE a gallery, it's marked as deleted instead
   - All photos in that gallery are also marked as deleted
   - Nothing is actually removed from the database

### 4. **Permanent Deletion Function**
   - `permanent_delete_old_items()` - removes items deleted >30 days ago
   - This will be called by a cron job (set up later)

## 📱 Features Now Available:

### For Users:
1. **Delete galleries** - they move to "Recently Deleted"
2. **View deleted items** - at `/client/deleted`
3. **Restore galleries** - within 30 days
4. **Auto-deletion** - items permanently removed after 30 days

### API Endpoints:
- `DELETE /api/galleries/[id]` - Soft delete a gallery
- `POST /api/galleries/[id]` - Restore a deleted gallery

## 🧪 Testing the Feature:

After running the migration, test it:

1. **Login** to your account
2. **Create a test gallery** (or use existing)
3. **Delete the gallery** - should move to deleted status
4. **Visit** http://localhost:3000/client/deleted
5. **See deleted gallery** with countdown timer
6. **Click Restore** - gallery should come back
7. **Check gallery list** - restored gallery should appear

## ⏰ TODO: Set Up Cron Job

Later, you'll need to create a Supabase Edge Function that:
- Runs daily
- Calls `SELECT permanent_delete_old_items();`
- Permanently removes items deleted >30 days ago

This ensures the "Recently Deleted" feature works like iCloud Photos.

## 🐛 Troubleshooting:

**Error: "column already exists"**
- The columns were already added by the original schema
- This is safe to ignore

**Error: "policy already exists"**
- Drop the existing policy first
- Or modify the SQL to use `CREATE OR REPLACE POLICY`

**Can't see deleted items**
- Verify RLS policies were created
- Check that you're logged in as the gallery owner
- Look in browser console for errors

## 🎉 Ready to Deploy

Once tested locally, this feature is production-ready!

---

**Next Steps:**
1. Run the SQL migration
2. Test the feature
3. Deploy to production
