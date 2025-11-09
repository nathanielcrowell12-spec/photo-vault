# Workflow: Ticket Classification

## Purpose
Automatically classify incoming support tickets by urgency, category, and determine appropriate response path.

## Trigger
Runs immediately when new ticket arrives in support inbox.

## Process Flow

### Step 1: Extract Ticket Data
```json
{
  "ticketId": "T-12345",
  "from": "customer@email.com",
  "subject": "Can't upload photos",
  "body": "I keep getting error when trying to upload...",
  "timestamp": "2024-11-07T14:30:00Z",
  "userId": "user_abc123",
  "accountStatus": "active"
}
```

### Step 2: Identify Category
Scan ticket content for keywords and patterns:

**Login Issues** (`login_issues`)
- Keywords: "can't log in", "password", "forgot", "locked out"
- Pattern: Authentication/access problems

**Photo Upload Problems** (`photo_upload_problems`)
- Keywords: "upload", "stuck", "error uploading", "won't upload"
- Pattern: Technical issues with photo transfers

**Billing Questions** (`billing_questions`)
- Keywords: "charge", "billing", "payment", "refund", "invoice"
- Pattern: Payment or subscription inquiries

**Feature Requests** (`feature_requests`)
- Keywords: "wish", "could you add", "feature", "suggestion"
- Pattern: Product enhancement ideas

**Bug Reports** (`bug_reports`)
- Keywords: "bug", "broken", "not working", "error", "crash"
- Pattern: Technical problems or malfunctions

**General Inquiry** (`general_inquiry`)
- Default category if none match

### Step 3: Assess Urgency

**Critical** - Immediate escalation required
- Site completely down
- Data loss reported
- Security breach suspected
- Payment processing completely broken
- Mass user impact (10+ reports of same issue)

**High** - Respond within 30 minutes
- Single user can't access account
- Photos not visible after upload
- Upload completely failing
- Billing error affecting single user
- Account compromised (suspected)

**Medium** - Respond within 2 hours
- Feature not working as expected
- Slow performance
- Minor UI bugs
- "How do I..." questions
- Feature availability questions

**Low** - Respond within 24 hours
- Feature requests
- General feedback
- Documentation questions
- Enhancement suggestions

### Step 4: Check User Context

Query user database for:
```sql
SELECT
  account_status,
  subscription_tier,
  created_at,
  total_galleries,
  total_photos,
  last_login
FROM users
WHERE id = :user_id
```

**Context Factors:**
- **New users** (< 7 days): Higher priority, may need onboarding help
- **Premium users**: Higher priority for billing issues
- **Long-time users** (> 1 year): May have complex questions
- **Inactive users** (> 30 days): May be re-engagement opportunity

### Step 5: Check Ticket History

Query previous tickets:
```sql
SELECT
  category,
  status,
  created_at,
  resolution_time
FROM support_tickets
WHERE user_id = :user_id
ORDER BY created_at DESC
LIMIT 5
```

**History Patterns:**
- **Repeat issues**: May indicate systemic problem, escalate
- **First-time requester**: Use friendlier, more detailed responses
- **Frequent requesters** (3+ in 30 days): May need deeper investigation

### Step 6: Determine Response Path

**Can Auto-Respond?**

✅ YES if:
- Category is `login_issues` AND subject contains "password"
- Category is `general_inquiry` AND KB article exists
- Category is `billing_questions` AND simple info request
- User has no open critical tickets
- Issue matches known KB article

❌ NO if:
- Urgency is Critical or High
- User mentions data loss
- Angry/threatening language detected
- Legal terms mentioned (lawsuit, lawyer, etc.)
- Previous ticket on same issue unresolved
- No matching KB article

### Step 7: Log Classification

Save to database:
```json
{
  "ticketId": "T-12345",
  "classifiedAt": "2024-11-07T14:30:15Z",
  "category": "photo_upload_problems",
  "urgency": "high",
  "autoRespondEligible": false,
  "escalationReason": "High urgency, technical issue",
  "userContext": {
    "accountAge": "14 days",
    "isPremium": false,
    "previousTickets": 1
  }
}
```

### Step 8: Route to Next Workflow

**If auto-respond eligible:**
→ Trigger `auto-response.md` workflow

**If escalation needed:**
→ Trigger `escalation.md` workflow

## Success Criteria

- 100% of tickets classified within 30 seconds
- < 5% misclassification rate
- Zero critical tickets auto-responded
- All classifications logged

## Error Handling

**If classification fails:**
1. Log error with ticket ID
2. Default to Medium urgency
3. Route to human support
4. Alert maintainer if repeated failures

---

**Status:** TEMPLATE - Configure KB integration before use
**Last Updated:** 2024-11-07
