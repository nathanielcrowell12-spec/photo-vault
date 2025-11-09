# Verify Your Supabase API Keys

## Step 1: Get the CORRECT keys from Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/gqmycgopitxpjkxzrnyv/settings/api

2. You'll see two keys:
   - **anon public** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** (for `SUPABASE_SERVICE_ROLE_KEY`)

3. Copy each key **EXACTLY** - make sure there are no extra spaces or line breaks

## Step 2: Update Vercel Environment Variables

1. Go to your Vercel dashboard → Settings → Environment Variables
2. For EACH key:
   - Click the three dots → Edit
   - **DELETE** the entire old value
   - **PASTE** the new value (make sure there are no trailing spaces)
   - Make sure scope is set to: **Production, Preview, Development**
   - Click **Save**

## Step 3: Force Redeploy

After updating the keys:
1. Go to Vercel Dashboard → **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Click **Redeploy**
4. Wait for the deployment to complete (check the build logs for any errors)

## Step 4: Clear Browser Cache

1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Or clear browser cache completely
3. Try logging in again

## Common Issues:

- **Keys have extra spaces** - Make sure when you paste, there are no leading/trailing spaces
- **Keys were rotated** - Supabase keys can be rotated, make sure you're using the CURRENT keys
- **Wrong environment** - Make sure keys are set for Production (not just Preview/Development)
- **Deployment not triggered** - Sometimes you need to manually redeploy after updating env vars


