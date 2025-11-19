# Resend Email Setup Guide for PhotoVault

## Current Status
✅ Resend API key configured
✅ Email service code implemented
✅ Email addresses updated to `@photovault.photo`
⚠️ **NEXT STEP: Domain verification required**

## What You Need to Do

### Step 1: Add Your Domain to Resend

1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `photovault.photo`
4. Click **"Add"**

### Step 2: Add DNS Records

Resend will provide you with DNS records to add. You'll need to add these to your domain registrar (wherever you bought photovault.photo).

**Expected DNS Records:**

```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this - looks like: p=MIGfMA0GCS...]
TTL: 3600

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 3600
```

### Step 3: Add DNS Records to Your Domain Registrar

**If your domain is on:**

#### **GoDaddy:**
1. Go to https://dcc.godaddy.com/manage/dns
2. Find `photovault.photo`
3. Click "DNS" → "Add"
4. Add each record Resend provided

#### **Namecheap:**
1. Go to Domain List → Manage
2. Click "Advanced DNS"
3. Click "Add New Record"
4. Add each record

#### **Cloudflare:**
1. Go to your Cloudflare dashboard
2. Select `photovault.photo`
3. Click "DNS"
4. Click "Add record"
5. Add each record

### Step 4: Verify Domain in Resend

1. After adding DNS records, go back to Resend
2. Click **"Verify"** next to your domain
3. Wait 2-5 minutes (DNS propagation)
4. Click "Verify" again if it doesn't auto-verify

**Status should change to: ✅ Verified**

### Step 5: Test Email Sending

Once verified, test the email system:

1. Visit: http://localhost:3000/api/test-email
2. You should see: `{"success":true,"data":{...}}`
3. Check `photovault.business@gmail.com` for the test email

## Email Configuration Summary

### Environment Variables (Already Set)
```bash
RESEND_API_KEY=re_KimsgCzy_H684tZKCdHdyEKRPmnhiYRCu
FROM_EMAIL=PhotoVault <noreply@photovault.photo>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Email Addresses Configured

| Purpose | Email Address |
|---------|---------------|
| Transactional emails | `noreply@photovault.photo` |
| Customer support | `support@photovault.photo` |
| General inquiries | `hello@photovault.photo` (optional) |

### Emails That Will Be Sent

1. **Gallery Ready** - When photographer uploads photos
   - To: Client email
   - From: `noreply@photovault.photo`
   - Subject: "📸 Your photos are ready from [Photographer]!"

2. **Welcome Email** - New user signup
   - To: User email
   - From: `noreply@photovault.photo`
   - Subject: "🎉 Welcome to PhotoVault!"

3. **Password Reset** - User requests password reset
   - To: User email
   - From: `noreply@photovault.photo`
   - Subject: "Reset your PhotoVault password"

4. **Payment Reminder** - Subscription due
   - To: Customer email
   - From: `noreply@photovault.photo`
   - Subject: "Payment reminder - PhotoVault"

## Troubleshooting

### "Domain not verified"
- Wait 5-10 minutes after adding DNS records
- Check DNS propagation: https://dnschecker.org
- Verify you added records to the correct domain

### "Email sending failed"
1. Check domain is verified in Resend
2. Verify API key is correct in `.env.local`
3. Check Resend dashboard for error logs

### "SPF/DKIM errors"
- Make sure you added the TXT record exactly as provided
- Don't modify the value (copy/paste exactly)
- Check for trailing spaces or typos

## Production Deployment

When deploying to production (Vercel), add these environment variables:

```bash
RESEND_API_KEY=re_KimsgCzy_H684tZKCdHdyEKRPmnhiYRCu
FROM_EMAIL=PhotoVault <noreply@photovault.photo>
NEXT_PUBLIC_SITE_URL=https://photovault.photo
```

## Testing Checklist

- [ ] Domain added to Resend
- [ ] DNS records added to domain registrar
- [ ] Domain verified in Resend (green checkmark)
- [ ] Test email sent successfully
- [ ] Test email received in inbox
- [ ] Check spam folder if not in inbox
- [ ] Update SPF/DKIM if emails go to spam

## Next Steps After Email Works

1. Test welcome email flow (sign up new user)
2. Test gallery ready notification (upload photos)
3. Test password reset email
4. Monitor Resend dashboard for delivery rates
5. Set up email analytics/tracking (optional)

## Support

If you have issues:
1. Check Resend dashboard: https://resend.com/emails
2. View email logs for error messages
3. Contact Resend support: support@resend.com
4. Check their docs: https://resend.com/docs

---

**Last Updated:** 2025-11-16
**Status:** Domain verification pending
