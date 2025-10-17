# Gallery Setup Guide

## Issue Identified
Your Pixieset gallery connection was **simulated in the frontend only** and was never saved to the database. The `galleries` table doesn't exist yet in Supabase.

## Solution: 3 Steps

### Step 1: Create the Galleries Table in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your PhotoVault project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the **entire contents** of `database/galleries-table.sql`
6. Click "Run" to execute the SQL

This will create:
- ✅ `galleries` table - stores connected photo galleries
- ✅ `gallery_photos` table - stores individual photos from galleries
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Indexes for better performance
- ✅ Triggers for automatic timestamps

### Step 2: Add Your Pixieset Gallery to the Database

After the table is created, run this script to add your gallery:

```bash
node scripts/add-pixieset-gallery.js
```

This will:
- Find your user account (nathaniel.crowell12@gmail.com)
- Insert the "Crowell Country Living" gallery
- Store the gallery URL and password
- Set it up for future photo import

### Step 3: Verify the Gallery

Check that the gallery was added successfully:

```bash
node scripts/check-gallery.js
```

You should see:
```
✅ User found: nathaniel.crowell12@gmail.com
📊 Found 1 galleries for this user:

Gallery 1:
   - Name: Crowell Country Living
   - Platform: Pixieset
   - URL: https://meadowlanemedia.pixieset.com/...
   - Photo Count: 150
```

### Step 4: View Your Gallery

1. Log in to PhotoVault as nathaniel.crowell12@gmail.com
2. Go to the dashboard
3. You should now see your "Crowell Country Living" gallery at the top!

## What Changed

### ✅ GalleryGrid Component
- Now fetches galleries from the **real Supabase database**
- No more mock data
- Displays actual connected galleries

### ✅ Platform Connection
- When you connect a new gallery, it now **saves to the database**
- Gallery URL and password are stored
- Page refreshes to show the new gallery immediately

### ✅ Database Schema
- New `galleries` table with all necessary fields
- New `gallery_photos` table for future photo storage
- RLS policies ensure data security

## Future: Connecting More Galleries

From now on, when you click on a platform logo and enter the gallery URL + password:

1. ✅ Gallery is saved to database
2. ✅ Appears immediately in your dashboard
3. ✅ Persists across sessions
4. ✅ Ready for photo import (future feature)

## Troubleshooting

### If you get "table not found" error:
- Make sure you ran Step 1 (create tables) in Supabase SQL Editor
- Verify the SQL executed without errors

### If the gallery doesn't show up:
- Run `node scripts/check-gallery.js` to verify it's in the database
- Check browser console for errors
- Try refreshing the page

### If you see permission errors:
- Check that RLS policies were created correctly
- Verify your user ID matches the one in the database

## Your Gallery Info

- **Gallery Name**: Crowell Country Living
- **Platform**: Pixieset
- **URL**: https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/?return=%2Fcrowellcountryliving%2F
- **Password**: crowell
- **Photographer**: Meadow Lane Media
- **Your Email**: nathaniel.crowell12@gmail.com

