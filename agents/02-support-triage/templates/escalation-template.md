# Template: Escalation Notification to Customer

## Template Variables

- `{{CUSTOMER_NAME}}` - First name
- `{{ISSUE_SUMMARY}}` - Brief description of their problem
- `{{ASSIGNED_TEAM}}` - Which team is handling it (Engineering, Billing, etc.)
- `{{TICKET_ID}}` - Reference number
- `{{EXPECTED_RESPONSE}}` - Time frame for response
- `{{WORKAROUND}}` - Optional temporary solution

---

## Email Template

**Subject:** Re: {{ISSUE_SUMMARY}}

---

Hi {{CUSTOMER_NAME}},

Thank you for contacting PhotoVault support. I've received your message about {{ISSUE_SUMMARY}}.

I understand this is important to you, and I've escalated your ticket to our **{{ASSIGNED_TEAM}}** team for specialized attention.

### What happens next:

- Our {{ASSIGNED_TEAM}} team will investigate within **{{EXPECTED_RESPONSE}}**
- They'll reach out to you with a solution or update
- Your ticket number is **{{TICKET_ID}}** for reference

{{#if WORKAROUND}}
### In the meantime:

{{WORKAROUND}}

This should help while we work on a permanent solution.
{{/if}}

We're on it and will get this resolved as quickly as possible!

Best,
PhotoVault Support Team

---

**Escalated to:** {{ASSIGNED_TEAM}}
**Ticket ID:** {{TICKET_ID}}
**Expected response:** {{EXPECTED_RESPONSE}}

---

## Variations by Team

### Engineering Team
```
I've escalated your ticket to our **engineering team** for immediate investigation.

They'll:
- Review the technical logs
- Identify the root cause
- Implement a fix or workaround
```

### Billing Team
```
I've escalated your ticket to our **billing team** for review.

They'll:
- Review your account and transaction history
- Verify the charges or issue
- Provide a resolution or explanation
```

### Customer Success Team
```
I've escalated your ticket to our **customer success team**.

They'll:
- Understand your specific workflow needs
- Provide personalized guidance
- Help optimize your PhotoVault setup
```

## When to Use

Use this template when:
- Ticket is too complex for auto-response
- Human expertise required
- Technical investigation needed
- Policy decision required

## Personalization Tips

**For urgent issues:**
Add: "I understand the urgency and have marked this as high priority."

**For frustrated customers:**
Add: "I'm sorry for the inconvenience this has caused. We're treating this with priority."

**For premium customers:**
Add: "As a valued premium member, your ticket has been prioritized."

**For time-sensitive issues:**
Add specific deadline: "Given your timeline, we'll ensure this is resolved before [date]."

## Common Workarounds

### Photo Upload Issues:
"In the meantime, if you have photos under 50MB, those should upload fine as a temporary workaround."

### Gallery Access Issues:
"While we investigate, you can access your photos directly at: photovault.com/galleries/[id]"

### Billing Issues:
"Your account access will remain active while we sort this out - you won't lose any functionality."

### Performance Issues:
"Try using a different browser (we recommend Chrome) while we investigate the performance issue."

---

## Success Metrics

- **Customer satisfaction:** 85%+
- **Response accuracy:** 100% (correct team assigned)
- **On-time resolution:** 90%+
- **Escalation quality:** > 95%

---

**Version:** 1.0
**Last Updated:** 2024-11-07
**Status:** TEMPLATE
