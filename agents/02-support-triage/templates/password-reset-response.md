# Template: Password Reset Response

## Template Variables

- `{{CUSTOMER_NAME}}` - First name
- `{{CUSTOMER_EMAIL}}` - Their email address
- `{{TICKET_ID}}` - Reference number

---

## Email Template

**Subject:** Re: Password Reset

---

Hi {{CUSTOMER_NAME}},

I can help you reset your password right away.

I've just sent a password reset link to **{{CUSTOMER_EMAIL}}**. Check your inbox (and spam folder just in case) for an email from PhotoVault.

**The link expires in 1 hour**, so use it soon. Once you reset it, you'll be all set to log back in!

### If you don't receive it within 5 minutes:

1. **Check your spam/junk folder** - Sometimes our emails end up there
2. **Verify your email** - Make sure {{CUSTOMER_EMAIL}} is the email on your account
3. **Request another link** - Visit photovault.com/reset-password to try again

### Still having trouble?

Just reply to this email and I'll help you sort it out!

Best,
PhotoVault Support

---

**Helpful article:** [How to Reset Your Password](https://help.photovault.com/reset-password)
**Ticket ID:** {{TICKET_ID}}

---

## When to Use

- Subject or body contains: "password", "forgot", "can't log in", "reset"
- No indication of account security breach
- Standard password reset request

## When NOT to Use

- Customer mentions suspicious activity
- Multiple failed reset attempts
- Account may be compromised
- Customer is locked out due to security issue

→ Escalate these to human support

---

## Success Metrics

- **Auto-resolution rate:** 95%+
- **Customer satisfaction:** 90%+
- **Average response time:** < 1 minute
- **Follow-up rate:** < 5%

---

**Version:** 1.0
**Last Updated:** 2024-11-07
**Status:** TEMPLATE
