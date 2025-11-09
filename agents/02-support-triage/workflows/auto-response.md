# Workflow: Auto-Response

## Purpose
Automatically respond to common support questions using knowledge base articles and templates.

## Trigger
Runs after ticket classification when `autoRespondEligible: true`

## Prerequisites
- Ticket has been classified
- Category matches auto-resolvable list
- No critical/high urgency flags
- Knowledge base article available

## Process Flow

### Step 1: Load Ticket Data
```json
{
  "ticketId": "T-12345",
  "category": "login_issues",
  "urgency": "medium",
  "customerName": "Sarah",
  "customerEmail": "sarah@email.com",
  "subject": "Forgot my password",
  "body": "I can't remember my password to log in"
}
```

### Step 2: Search Knowledge Base

Query KB for relevant articles:
```sql
SELECT
  article_id,
  title,
  category,
  solution_steps,
  relevance_score
FROM knowledge_base
WHERE category = :ticket_category
  AND status = 'published'
ORDER BY relevance_score DESC
LIMIT 3
```

**Matching Criteria:**
- Keyword overlap between ticket and article
- Category match
- Historical success rate for similar tickets

### Step 3: Select Response Template

Load appropriate template based on category:

| Category | Template File |
|----------|---------------|
| `login_issues` + "password" | `password-reset-response.md` |
| `billing_questions` + "invoice" | `invoice-request-response.md` |
| `general_inquiry` + "how to" | `how-to-response.md` |
| `photo_upload_problems` + "format" | `photo-format-response.md` |

### Step 4: Personalize Response

Replace template variables:
- `{{CUSTOMER_NAME}}` → First name from ticket
- `{{SPECIFIC_ISSUE}}` → Extracted from ticket body
- `{{KB_ARTICLE_LINK}}` → Relevant KB article URL
- `{{TICKET_ID}}` → For reference
- `{{SOLUTION_STEPS}}` → From KB article

### Step 5: Generate Response

**Example for Password Reset:**
```
Subject: Re: Forgot my password

Hi Sarah,

I can help you reset your password right away.

I've just sent a password reset link to sarah@email.com. Check your inbox
(and spam folder just in case) for an email from PhotoVault.

The link expires in 1 hour, so use it soon. Once you reset it, you'll be
all set to log back in!

If you don't receive it within 5 minutes, here's what to check:
1. Look in your spam/junk folder
2. Make sure sarah@email.com is the email on your account
3. Try requesting another reset link

Need more help? Just reply to this email!

Best,
PhotoVault Support

---
Ticket ID: T-12345
Helpful article: How to Reset Your Password
```

### Step 6: Quality Check

Before sending, verify:
- [ ] Customer name is correct (not "null" or empty)
- [ ] Email address matches ticket sender
- [ ] Solution steps are specific to their issue
- [ ] KB article link is valid and relevant
- [ ] No placeholder text remains ({{...}})
- [ ] Grammar and spelling are correct

### Step 7: Send Response

```javascript
await sendEmail({
  to: ticket.customerEmail,
  from: 'support@photovault.com',
  replyTo: 'support@photovault.com',
  subject: `Re: ${ticket.subject}`,
  body: personalizedResponse,
  ticketId: ticket.id
});
```

### Step 8: Update Ticket Status

```sql
UPDATE support_tickets
SET
  status = 'waiting_for_customer',
  responded_at = NOW(),
  response_type = 'auto',
  assigned_kb_article = :article_id
WHERE id = :ticket_id
```

### Step 9: Log Activity

```json
{
  "ticketId": "T-12345",
  "action": "auto_response_sent",
  "timestamp": "2024-11-07T14:31:00Z",
  "template": "password-reset-response",
  "kbArticle": "KB-001",
  "responseTime": "45 seconds"
}
```

### Step 10: Schedule Follow-Up

Set reminder to check ticket in 48 hours:
- If customer replies → Route to human support
- If no reply → Send gentle follow-up asking if resolved
- If no reply after 7 days → Auto-close as resolved

## Auto-Resolvable Categories

### Password Resets
- **Trigger**: Subject or body contains "password", "forgot", "reset"
- **Template**: `password-reset-response.md`
- **KB Article**: "How to Reset Your Password"
- **Success Rate**: 95%

### Basic How-To Questions
- **Trigger**: "how do I", "how to", "can I"
- **Template**: `how-to-response.md`
- **KB Article**: Match based on specific feature mentioned
- **Success Rate**: 80%

### Account Information
- **Trigger**: "what is my", "find my", "account"
- **Template**: `account-info-response.md`
- **KB Article**: "Understanding Your Account"
- **Success Rate**: 85%

### Simple Billing Questions
- **Trigger**: "invoice", "receipt", "when charged"
- **Template**: `invoice-request-response.md`
- **KB Article**: "Billing and Invoices"
- **Success Rate**: 75%

## Response Time Targets

- **Password resets**: < 1 minute
- **How-to questions**: < 2 minutes
- **Account info**: < 2 minutes
- **Billing questions**: < 3 minutes

## Quality Metrics

Track for each auto-response:
- Customer satisfaction rating (if provided)
- Did customer reply with "thank you" or "resolved"?
- Did customer reply with more questions?
- Was ticket escalated after auto-response?

**Success = No further replies or positive feedback**

## When NOT to Auto-Respond

Even if category matches, escalate if:
- Angry language detected ("frustrated", "angry", "terrible")
- Urgency is High or Critical
- Customer has 3+ open tickets
- Previous auto-response on same issue didn't resolve
- Ticket mentions competitors
- Legal language present

## Error Handling

**If template not found:**
1. Log error
2. Route to human support
3. Alert maintainer

**If KB article missing:**
1. Use generic response template
2. Mark for KB team to create article
3. Route to human support

**If email send fails:**
1. Retry 3 times (30 sec apart)
2. Log failure
3. Route to human support
4. Alert on-call engineer

## A/B Testing

Randomly assign 10% of auto-responses to variant templates to test:
- Different greeting styles
- Longer vs shorter responses
- With vs without KB links
- Different closing signatures

Track which variants have higher satisfaction.

---

**Status:** TEMPLATE - Requires KB integration and email service
**Last Updated:** 2024-11-07
