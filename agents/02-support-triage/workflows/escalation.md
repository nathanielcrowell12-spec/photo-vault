# Workflow: Escalation

## Purpose
Route complex or sensitive support tickets to human support team with proper context and prioritization.

## Trigger
- Ticket classified as Critical or High urgency
- Auto-response not eligible
- Customer dissatisfaction detected
- Technical issue beyond KB scope
- Legal/compliance concerns

## Process Flow

### Step 1: Prepare Escalation Package

Gather all relevant context:

```json
{
  "ticket": {
    "id": "T-12345",
    "subject": "Photos disappeared after upload",
    "category": "photo_upload_problems",
    "urgency": "high",
    "createdAt": "2024-11-07T14:30:00Z",
    "customerEmail": "mike@email.com",
    "customerName": "Mike"
  },
  "customer": {
    "userId": "user_abc123",
    "accountStatus": "premium",
    "accountAge": "6 months",
    "totalGalleries": 15,
    "totalPhotos": 2500,
    "lastLogin": "2024-11-07T10:00:00Z"
  },
  "history": {
    "previousTickets": 2,
    "lastTicketDate": "2024-10-15",
    "lastTicketResolution": "Resolved - password reset",
    "averageResolutionTime": "2 hours"
  },
  "technicalContext": {
    "lastUploadAttempt": "2024-11-07T14:25:00Z",
    "uploadStatus": "failed",
    "errorCode": "ERR_UPLOAD_TIMEOUT",
    "browserInfo": "Chrome 119, Windows 11",
    "fileSize": "150MB",
    "fileCount": 87
  }
}
```

### Step 2: Determine Escalation Path

**Route to Engineering Team** if:
- Bug report with technical details
- Data loss or corruption
- System performance issues
- Feature broken after deployment
- Security vulnerability

**Route to Billing Team** if:
- Payment disputes
- Refund requests
- Subscription changes
- Invoice errors
- Charge failures

**Route to Customer Success** if:
- Account cancellation requests
- Feature requests from premium users
- Onboarding issues (new users)
- Complex workflow questions
- Partnership inquiries

**Route to Legal/Compliance** if:
- GDPR/privacy requests
- Subpoena or legal demands
- Copyright disputes
- Terms of service violations
- Threatening language

### Step 3: Set Priority Level

**P0 - Critical** (Immediate response)
- Site completely down
- Widespread data loss (multiple users)
- Security breach
- Payment processing broken
- Legal emergency

**P1 - High** (Response within 1 hour)
- Single user data loss
- Account access blocked
- Premium user issue
- Payment failure (single user)
- Angry customer with valid complaint

**P2 - Medium** (Response within 4 hours)
- Feature not working as expected
- Complex technical question
- Billing inquiry requiring investigation
- Bug with workaround available

**P3 - Low** (Response within 24 hours)
- Feature requests requiring discussion
- Complex how-to questions
- Enhancement suggestions

### Step 4: Write Escalation Summary

Create clear, concise summary for human agent:

**Template:**
```markdown
# Ticket T-12345 - Escalation Summary

## Issue
Customer reports photos disappeared after upload. Upload appeared successful but photos
not visible in gallery.

## Impact
- User: Premium customer (6 months)
- Affected: 87 wedding photos (150MB)
- Last successful upload: 2 days ago
- Customer sentiment: Frustrated but polite

## Technical Details
- Error: ERR_UPLOAD_TIMEOUT
- Browser: Chrome 119, Windows 11
- File size: 150MB total
- Upload attempt: 2024-11-07 14:25 UTC

## Customer Context
- Account age: 6 months
- Previous tickets: 2 (both resolved quickly)
- Account status: Premium
- Total galleries: 15
- Total photos: 2500

## Suggested Actions
1. Check server logs for upload T-12345 around 14:25 UTC
2. Verify files uploaded to storage bucket
3. Check database for orphaned upload records
4. If files exist, manually link to gallery
5. If files lost, apologize and offer credit

## Urgency Justification
High priority because:
- Premium customer
- Wedding photos (high emotional value)
- Data potentially lost
- No clear workaround

## Agent Notes
Customer was polite in initial message but mentioned "really need these photos for anniversary
this weekend" - time sensitive.
```

### Step 5: Notify Customer

Send acknowledgment email:

```
Subject: Re: Photos disappeared after upload

Hi Mike,

Thank you for contacting PhotoVault support. I've received your message about the missing
photos from your recent upload.

I understand how important these wedding photos are, especially with your anniversary
this weekend. I've escalated your ticket to our technical team for immediate investigation.

Here's what happens next:
- Our engineering team will review the upload logs within 1 hour
- They'll check if your photos are recoverable
- You'll hear back from a specialist within 2 hours

Your ticket number is T-12345 for reference.

We're on it and will get this resolved as quickly as possible!

Best,
PhotoVault Support Team

---
Escalated to: Engineering Team
Priority: High (P1)
Expected response: Within 2 hours
```

### Step 6: Create Assignment

```sql
INSERT INTO support_assignments (
  ticket_id,
  assigned_to_team,
  priority,
  escalated_at,
  escalation_reason,
  expected_response_time
) VALUES (
  'T-12345',
  'engineering',
  'P1',
  NOW(),
  'Data loss - high value photos',
  '2 hours'
);
```

### Step 7: Log Escalation

```json
{
  "ticketId": "T-12345",
  "action": "escalated",
  "timestamp": "2024-11-07T14:31:30Z",
  "escalatedTo": "engineering",
  "priority": "P1",
  "reason": "Data loss - premium customer - time sensitive",
  "agentTriageTime": "90 seconds",
  "customerNotified": true
}
```

### Step 8: Set Monitoring

**For Critical/High Priority:**
- Alert if no human response in 1 hour
- Alert if customer replies while waiting
- Alert if customer satisfaction drops
- Escalate to manager if not resolved in 4 hours

**For Medium/Low Priority:**
- Check status daily
- Alert if exceeds SLA
- Follow up if no progress in 48 hours

### Step 9: Update Dashboard

Add to human agent's queue with visual indicators:
- 🔴 P0/P1 tickets (red)
- 🟡 P2 tickets (yellow)
- 🟢 P3 tickets (green)
- ⭐ Premium customers
- 🔥 Time-sensitive issues

## Escalation Decision Matrix

| Scenario | Team | Priority | Response Time |
|----------|------|----------|---------------|
| Site down | Engineering | P0 | Immediate |
| Data loss (single user) | Engineering | P1 | 1 hour |
| Payment dispute | Billing | P1 | 2 hours |
| Feature broken | Engineering | P2 | 4 hours |
| Complex how-to | Customer Success | P2 | 4 hours |
| Feature request | Product Team | P3 | 24 hours |
| Legal request | Legal | P1 | 2 hours |

## Quality Checks

Before escalating, verify:
- [ ] All context gathered
- [ ] Customer sentiment assessed
- [ ] Previous tickets reviewed
- [ ] Technical details included
- [ ] Suggested actions provided
- [ ] Customer notified
- [ ] Priority correctly set
- [ ] Correct team assigned

## Common Escalation Mistakes

❌ **Don't:**
- Escalate without context
- Use vague descriptions ("user has issue")
- Forget to notify customer
- Set wrong priority
- Skip technical details
- Assume human knows customer history

✅ **Do:**
- Provide complete summary
- Include specific error messages
- Explain urgency reasoning
- Suggest potential solutions
- Note customer sentiment
- Reference previous tickets

## Escalation Metrics

Track:
- Escalation rate (% of tickets)
- Average time to escalate
- Escalation accuracy (was it necessary?)
- Customer satisfaction after escalation
- Resolution time after escalation

**Target Metrics:**
- < 15% escalation rate
- < 2 minutes to escalate
- > 90% escalation accuracy
- > 85% customer satisfaction

## De-escalation

If human agent resolves quickly:
1. Update ticket status
2. Log resolution
3. Learn from solution
4. Update KB if new pattern
5. Consider adding to auto-response list

---

**Status:** TEMPLATE - Configure team routing before use
**Last Updated:** 2024-11-07
