# Standard Logging Format

All agents should use this consistent logging format for tracking activities.

## Log Entry Structure

```json
{
  "timestamp": "2024-11-07T14:30:00Z",
  "agentId": "01-photographer-acquisition",
  "action": "email_sent",
  "status": "success",
  "context": {
    "targetEmail": "photographer@example.com",
    "template": "outreach-email-v1",
    "campaignId": "campaign-001"
  },
  "metadata": {
    "processingTime": "1.2s",
    "retryCount": 0
  },
  "error": null
}
```

## Required Fields

Every log entry MUST include:

- **timestamp** - ISO 8601 format in UTC
- **agentId** - Which agent created this log
- **action** - What action was performed
- **status** - `success`, `failed`, `pending`, `skipped`

## Optional Fields

- **context** - Relevant details about the action
- **metadata** - Performance metrics, retry counts, etc.
- **error** - Error message if status is `failed`
- **userId** - If action involves a specific user
- **ticketId** - If action involves a support ticket

## Standard Actions

### Photographer Acquisition
- `lead_discovered`
- `lead_qualified`
- `email_sent`
- `email_opened`
- `email_clicked`
- `demo_scheduled`
- `lead_converted`

### Support Triage
- `ticket_received`
- `ticket_classified`
- `auto_response_sent`
- `escalation_created`
- `ticket_resolved`
- `customer_satisfied`

### Content Moderation
- `content_scanned`
- `violation_detected`
- `content_flagged`
- `content_removed`
- `user_notified`

## Status Values

- **success** - Action completed as expected
- **failed** - Action failed with error
- **pending** - Action in progress
- **skipped** - Action intentionally skipped (with reason)

## File Naming

Logs should be organized by date:

```
logs/
├── 2024-11-07/
│   ├── photographer-acquisition.log
│   ├── support-triage.log
│   └── content-moderation.log
├── 2024-11-08/
│   └── ...
```

## Log Levels

Use standard log levels:

- **ERROR** - Something failed that needs attention
- **WARN** - Something unusual happened but was handled
- **INFO** - Normal operation, important events
- **DEBUG** - Detailed information for troubleshooting

**Example:**
```
[INFO] 2024-11-07T14:30:00Z - Email sent successfully to photographer@example.com
[WARN] 2024-11-07T14:31:00Z - Email open not tracked (tracking pixel blocked)
[ERROR] 2024-11-07T14:32:00Z - Failed to send email: SMTP connection timeout
```

## Daily Summary Format

At end of each day, generate summary:

```json
{
  "date": "2024-11-07",
  "agentId": "02-support-triage",
  "summary": {
    "ticketsReceived": 47,
    "autoResponded": 32,
    "escalated": 15,
    "avgResponseTime": "2.3 minutes",
    "customerSatisfaction": "92%"
  },
  "breakdown": {
    "byCategory": {
      "login_issues": 12,
      "photo_upload": 8,
      "billing": 5,
      "general": 22
    },
    "byUrgency": {
      "critical": 0,
      "high": 5,
      "medium": 28,
      "low": 14
    }
  }
}
```

## Error Logging

When logging errors, include:

```json
{
  "timestamp": "2024-11-07T14:30:00Z",
  "agentId": "01-photographer-acquisition",
  "action": "email_sent",
  "status": "failed",
  "error": {
    "type": "SMTPError",
    "message": "Connection timeout after 30s",
    "code": "ETIMEDOUT",
    "stack": "Error: Connection timeout...",
    "retryable": true
  },
  "context": {
    "targetEmail": "photographer@example.com",
    "attemptNumber": 2
  }
}
```

## Retention Policy

- **Detailed logs**: Keep for 90 days
- **Daily summaries**: Keep for 1 year
- **Error logs**: Keep for 6 months
- **Sensitive data**: Never log passwords, tokens, or PII

## Privacy Considerations

**Never log:**
- Passwords or credentials
- Full email addresses (use masked: p***@example.com)
- Credit card numbers
- Personal identifying information

**Safe to log:**
- Action types
- Timestamps
- Success/failure status
- Non-sensitive metadata
- Anonymized user IDs

---

**Version:** 1.0
**Last Updated:** 2024-11-07
