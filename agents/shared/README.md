# Shared Agent Resources

This folder contains resources that can be used by multiple agents to ensure consistency and reduce duplication.

## Directory Structure

```
shared/
├── templates/        # Reusable email and response templates
├── prompts/          # Common prompt fragments and instructions
├── tools/            # Shared tool definitions and integrations
└── README.md         # This file
```

## Templates

Common templates used across multiple agents. Each template should be generic enough to be reused but specific enough to be useful.

**Examples:**
- Generic greeting/closing
- Escalation notifications
- Follow-up sequences
- Satisfaction surveys

## Prompts

Reusable prompt components that define common behaviors:

**Examples:**
- Brand voice guidelines
- Tone and style rules
- Ethical guidelines
- Quality standards

## Tools

Shared tool configurations and integrations:

**Examples:**
- Email sending configurations
- Database query templates
- API integrations
- Logging utilities

## Usage

To use a shared resource in your agent:

1. **Reference in agent-config.json:**
```json
{
  "sharedResources": [
    "shared/templates/greeting.md",
    "shared/prompts/brand-voice.md"
  ]
}
```

2. **Include in workflows:**
```markdown
Use the template from: `shared/templates/escalation.md`
```

3. **Link in agent prompts:**
```markdown
Follow the brand voice guidelines in shared/prompts/brand-voice.md
```

## Best Practices

1. **Keep it generic** - Shared resources should work for multiple agents
2. **Document variables** - Clearly mark all template variables
3. **Version control** - Update version number when changing templates
4. **Test thoroughly** - Changes affect multiple agents
5. **Communicate updates** - Notify team when shared resources change

## Adding New Resources

1. Identify pattern used by 2+ agents
2. Extract to generic template/prompt
3. Document variables and usage
4. Update this README
5. Update affected agents to use shared resource

---

**Last Updated:** 2024-11-07
