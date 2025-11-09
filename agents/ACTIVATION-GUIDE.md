# Agent Activation Guide

This guide walks you through activating agents when you're ready to use them.

## Before You Start

Make sure you have:
- [ ] Completed the skeleton setup (done!)
- [ ] Decided which agent to activate first
- [ ] Required API keys and credentials
- [ ] Database access configured
- [ ] Understanding of what the agent will do

## Activation Checklist

### 1. Choose Your First Agent

**Recommended order:**
1. **Support Triage** - Safest to start, clear boundaries
2. **Photographer Acquisition** - More complex, requires email setup
3. **Content Moderation** - Requires careful testing

### 2. Update Agent Status

In `agent-registry.json`, change status from `planned` to `testing`:

```json
{
  "id": "02-support-triage",
  "status": "testing",
  "activatedDate": "2024-11-07"
}
```

### 3. Configure Required Tools

Each agent needs specific integrations. Check `agent-config.json` for the `tools` list.

**For Support Triage:**
- [ ] Email service (SendGrid, Postmark, etc.)
- [ ] Support ticket system
- [ ] Knowledge base integration
- [ ] Database connection

**For Photographer Acquisition:**
- [ ] Web scraping tools
- [ ] Email service
- [ ] CRM or prospect database
- [ ] Calendar integration (for demo booking)

### 4. Set Up Environment Variables

Create `.env` file in agent directory:

```bash
# Example for Support Triage
EMAIL_SERVICE_API_KEY=your_key_here
SUPPORT_DB_CONNECTION=your_connection_string
KB_API_URL=https://help.photovault.com/api
TICKET_WEBHOOK_SECRET=your_webhook_secret
```

### 5. Create Required Databases/Tables

Run the SQL setup scripts if needed:

```sql
-- Example: Support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  urgency TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Test in Sandbox Mode

**Always test first!**

Create `test-config.json`:
```json
{
  "mode": "sandbox",
  "dryRun": true,
  "sendToEmail": "your-test-email@example.com",
  "maxActions": 10
}
```

Run test workflow:
```bash
# Example command (you'll need to build this)
npm run agent:test -- support-triage
```

### 7. Manual Testing

Test each workflow manually:

**Support Triage Testing:**
1. Send test ticket to yourself
2. Verify classification is correct
3. Check auto-response template looks good
4. Confirm escalation routing works
5. Verify logs are being written

**Photographer Acquisition Testing:**
1. Test directory scraping on single page
2. Verify lead qualification logic
3. Send test outreach email to yourself
4. Check email tracking works
5. Verify CRM integration

### 8. Set Limits (Safety!)

In `agent-config.json`, set conservative limits:

```json
{
  "limits": {
    "maxAutoResponses": 10,  // Start small!
    "maxEmailsPerDay": 20,
    "escalationThreshold": 1,
    "requireHumanApproval": true
  }
}
```

### 9. Monitor First 24 Hours

**Critical monitoring:**
- [ ] Check logs every hour
- [ ] Review all actions taken
- [ ] Measure success rates
- [ ] Watch for errors
- [ ] Collect customer feedback

**Create monitoring dashboard:**
- Actions taken / Actions successful
- Response times
- Error rates
- Customer satisfaction (if available)

### 10. Gradual Rollout

**Week 1:** Sandbox mode only
**Week 2:** 10-20 actions per day with human review
**Week 3:** 50 actions per day, spot-check review
**Week 4:** Increase limits if metrics look good

## Safety Guidelines

### Always Include Kill Switch

Create emergency stop procedure:

```json
{
  "status": "paused",
  "reason": "Manual pause for review",
  "pausedAt": "2024-11-07T15:00:00Z"
}
```

### Human-in-the-Loop

For sensitive actions:
- Require approval before sending
- Review queue of pending actions
- Override or modify before execution

### Rollback Plan

If something goes wrong:
1. Pause agent immediately
2. Review last 100 actions
3. Identify issue
4. Send correction emails if needed
5. Fix configuration
6. Resume cautiously

## Common Issues

### Email Deliverability
**Problem:** Emails going to spam
**Solution:**
- Verify domain authentication (SPF, DKIM)
- Warm up email sending slowly
- Monitor bounce rates
- Use reputable email service

### Over-escalation
**Problem:** Too many tickets escalated to humans
**Solution:**
- Expand knowledge base
- Add more auto-response templates
- Tune classification logic
- Review escalation criteria

### Misclassification
**Problem:** Tickets categorized incorrectly
**Solution:**
- Review classification keywords
- Add more training examples
- Implement confidence thresholds
- Allow manual reclassification

## Success Metrics

Track these to know if it's working:

### Support Triage
- ✅ 60%+ auto-resolution rate
- ✅ < 5 min avg response time
- ✅ 90%+ customer satisfaction
- ✅ < 5% escalation mistakes

### Photographer Acquisition
- ✅ 20%+ email open rate
- ✅ 5%+ response rate
- ✅ 2%+ demo booking rate
- ✅ 0 spam complaints

## When to Increase Automation

Increase limits when:
- [ ] 2+ weeks of stable operation
- [ ] Error rate < 2%
- [ ] Customer satisfaction > 85%
- [ ] No major issues encountered
- [ ] Manual review shows high quality

## When to Scale Back

Reduce automation if:
- ❌ Error rate > 5%
- ❌ Customer complaints increase
- ❌ Spam reports received
- ❌ Technical issues frequent
- ❌ Quality degrading

## Getting Help

If you're stuck:
1. Review the agent's `README.md`
2. Check workflow documentation
3. Review shared resources in `agents/shared/`
4. Test with `dryRun: true` mode
5. Ask for code review from Claude

---

## Quick Start Commands

```bash
# Test an agent
npm run agent:test [agent-id]

# Activate an agent
npm run agent:activate [agent-id]

# Pause an agent
npm run agent:pause [agent-id]

# View agent logs
npm run agent:logs [agent-id]

# Generate agent report
npm run agent:report [agent-id]
```

**Note:** These commands will need to be built as part of implementation.

---

**Status:** Ready to use when you activate your first agent
**Last Updated:** 2024-11-07
