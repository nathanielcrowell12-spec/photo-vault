# 🚀 PhotoVault Deployment Guide

## Quick Setup Checklist

### 1. Vercel Deployment (15 minutes)
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables
- [ ] Deploy to preview

### 2. Domain Configuration (20 minutes)
- [ ] Set up DNS records for all 4 domains
- [ ] Configure Vercel domain settings
- [ ] Test SSL certificates

### 3. Production Database (10 minutes)
- [ ] Create Supabase production project
- [ ] Run database migrations
- [ ] Set up Row Level Security

### 4. Stripe Setup (15 minutes)
- [ ] Switch to live mode
- [ ] Update webhook endpoints
- [ ] Test payment flows

---

## 🌐 Domain Setup Strategy

### Primary Domain: `photovault.pro`
- **Purpose**: Main photographer dashboard
- **Vercel Project**: `photovault-main`
- **DNS**: A record → Vercel IP

### Client Domain: `photovault.biz`
- **Purpose**: Client-facing galleries
- **Vercel Project**: `photovault-client` (same codebase, different config)
- **DNS**: A record → Vercel IP

### Gallery Domain: `photovault.site`
- **Purpose**: Individual gallery microsites
- **Vercel Project**: `photovault-galleries` (same codebase)
- **DNS**: A record → Vercel IP

### Blog Domain: `photovault.blog`
- **Purpose**: Content marketing
- **Vercel Project**: `photovault-blog` (separate Next.js app)
- **DNS**: A record → Vercel IP

---

## 🔧 Vercel Configuration

### Environment Variables Per Domain

#### photovault.pro (Main App)
```bash
NEXT_PUBLIC_WEB_URL=https://photovault.pro
NEXT_PUBLIC_APP_TYPE=photographer
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### photovault.biz (Client App)
```bash
NEXT_PUBLIC_WEB_URL=https://photovault.biz
NEXT_PUBLIC_APP_TYPE=client
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### photovault.site (Gallery App)
```bash
NEXT_PUBLIC_WEB_URL=https://photovault.site
NEXT_PUBLIC_APP_TYPE=gallery
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📋 Step-by-Step Deployment

### Step 1: Vercel Setup
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import `photovault-hub` repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `photovault-hub`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 2: Domain Configuration
1. In Vercel dashboard → Settings → Domains
2. Add each domain:
   - `photovault.pro`
   - `photovault.biz`
   - `photovault.site`
   - `photovault.blog`

### Step 3: DNS Configuration
For each domain, add these DNS records:

```
Type: A
Name: @
Value: 76.76.19.19 (Vercel's IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 4: Environment Variables
1. In Vercel → Settings → Environment Variables
2. Add all variables from `env.production.example`
3. Set different `NEXT_PUBLIC_WEB_URL` for each domain

---

## 🔒 Security Checklist

- [ ] SSL certificates enabled (automatic with Vercel)
- [ ] Environment variables secured
- [ ] Supabase RLS policies configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload size limits set

---

## 🧪 Testing Strategy

### Pre-Launch Testing
1. **Local Testing**: `npm run dev` with production env vars
2. **Preview Testing**: Vercel preview deployments
3. **Domain Testing**: Test each domain separately
4. **Payment Testing**: Stripe test mode → live mode

### Beta Testing Plan
1. **Photographer Beta**: 5-10 trusted photographers
2. **Client Beta**: Test with real client galleries
3. **Payment Beta**: Small real transactions
4. **Performance Beta**: Monitor upload speeds, load times

---

## 📊 Monitoring Setup

### Essential Monitoring
- **Uptime**: UptimeRobot or similar
- **Performance**: Vercel Analytics
- **Errors**: Sentry (optional)
- **Payments**: Stripe Dashboard
- **Database**: Supabase Dashboard

### Key Metrics to Track
- Page load times
- Upload success rates
- Payment conversion rates
- User registration rates
- Gallery creation rates

---

## 🚨 Rollback Plan

If issues arise:
1. **Immediate**: Vercel rollback to previous deployment
2. **Database**: Supabase backup restore
3. **DNS**: Point domains to maintenance page
4. **Communications**: Email users about maintenance

---

## 📞 Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

## ⚡ Quick Commands

```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Test locally with production env
vercel env pull .env.local
npm run dev
```

---

**Ready to deploy? Start with Step 1 and let me know when you need help with any specific step!** 🚀

