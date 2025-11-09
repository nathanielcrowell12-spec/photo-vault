# Debug: Invalid API Key Issue

## Critical Steps to Fix

### Step 1: Get FRESH keys from Supabase Dashboard

1. **Go directly to:** https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/settings/api

2. **Find the "Project API keys" section**

3. **Copy these EXACT keys:**
   - **anon/public** → This goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → This goes in `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Update Vercel (IMPORTANT)

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **For `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
   - Click the three dots (⋮) → **Delete** (remove the variable completely)
   - Click **"Add New"**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Paste the **anon/public** key from Supabase
   - Scope: Check **Production**, **Preview**, **Development**
   - Click **Save**

3. **For `SUPABASE_SERVICE_ROLE_KEY`:**
   - Click the three dots (⋮) → **Delete** (remove the variable completely)
   - Click **"Add New"**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Paste the **service_role** key from Supabase
   - Scope: Check **Production**, **Preview**, **Development**
   - Click **Save**

### Step 3: FORCE Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **three dots** (⋮) → **Redeploy**
4. Select **"Use existing Build Cache"** = **OFF** (uncheck it)
5. Click **Redeploy**
6. Wait for deployment to complete

### Step 4: Test

1. Clear browser cache completely (or use Incognito/Private mode)
2. Go to your live site
3. Try to log in
4. Check browser console (F12) for any errors

### Common Mistakes:

- ✅ **Copying with extra spaces** - Make sure no leading/trailing spaces
- ✅ **Using old/rotated keys** - Always get fresh keys from Supabase dashboard
- ✅ **Not redeploying** - Vercel needs a redeploy after env var changes
- ✅ **Wrong scope** - Make sure Production is checked
- ✅ **Browser cache** - Hard refresh or use Incognito mode


