# Vercel Environment Variables Setup

## Required Environment Variables for PhotoVault Deployment

To fix the build error `Error: supabaseUrl is required.`, you need to configure these environment variables in your Vercel project dashboard.

### 🔧 How to Set Environment Variables in Vercel

1. **Go to your Vercel Dashboard**
   - Navigate to your PhotoVault project
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

2. **Add the following variables:**

### 📋 Required Environment Variables

#### **Supabase Configuration (CRITICAL)**
```
NEXT_PUBLIC_SUPABASE_URL=https://gqmycgopitxpjkxzrnyv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDMzNTYsImV4cCI6MjA3NTMxOTM1Nn0.SnVgf6NQ0jMvUz7n6kxB8u2TsJt846KOImGYocpxbjw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0MzM1NiwiZXhwIjoyMDc1MzE5MzU2fQ.vD2Hhc0PBs3B2--q7XoY79n2oBFnBoTtm_6dY2E_X8s
```

#### **Site URLs**
```
NEXT_PUBLIC_WEB_URL=https://your-domain.vercel.app
NEXT_PUBLIC_CLIENT_URL=https://your-domain.vercel.app
NEXT_PUBLIC_GALLERY_URL=https://your-domain.vercel.app
SITE_URL=https://your-domain.vercel.app
```

#### **Stripe Configuration**
```
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### **Email Service**
```
RESEND_API_KEY=re_your_resend_api_key_here
```

#### **Security**
```
NEXTAUTH_SECRET=your-super-secret-nextauth-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### **Upload Configuration**
```
MAX_FILE_SIZE=104857600
CHUNK_SIZE=6291456
UPLOAD_TIMEOUT=300000
```

#### **PostHog Analytics (Story 6.1)**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=phc_your_project_key_here
```
Get these from: https://app.posthog.com/project/settings

### 🚀 After Setting Environment Variables

1. **Save all environment variables** in Vercel
2. **Redeploy** your project
3. The build should now complete successfully!

### ✅ Expected Result

After setting these environment variables, your deployment should show:
```
✓ Compiled successfully in ~20s
✓ Linting and checking validity of types ... (with warnings only)
✓ Build completed successfully
✓ Deployed to production! 🎉
```

### 🔍 Current Status

- ✅ **All TypeScript errors fixed**
- ✅ **All dependencies installed**
- ✅ **Build process working**
- ⚠️ **Environment variables needed in Vercel**

The codebase is ready for production - we just need to configure the environment variables in Vercel!
