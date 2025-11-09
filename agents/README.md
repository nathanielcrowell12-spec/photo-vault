# PhotoVault Agent System

## Overview

This directory contains the agent infrastructure for PhotoVault. Each agent has its own folder with standardized structure for easy management and scaling.

## Directory Structure

```
agents/
├── README.md                           # This file
├── agent-registry.json                 # Active agents and configurations
├── 01-photographer-acquisition/        # Agent for finding new photographers
├── 02-support-triage/                  # Agent for customer support
└── shared/                             # Shared resources for all agents
    ├── templates/                      # Reusable templates
    ├── prompts/                        # Common prompt fragments
    └── tools/                          # Shared utility scripts
```

## Agent Folder Structure

Each agent follows this standard structure:

```
agent-name/
├── agent-config.json       # Agent identity, tools, permissions
├── prompt.md              # Core agent instructions
├── workflows/             # Task-specific workflows
├── templates/             # Agent-specific templates
├── logs/                  # Daily activity logs
└── reports/               # Weekly/monthly summaries
```

## How to Use This System

### When You're Ready to Create an Agent:

1. **Copy the agent template** from `shared/templates/agent-template/`
2. **Fill in agent-config.json** with the agent's purpose and permissions
3. **Write prompt.md** with detailed instructions for the agent
4. **Create workflows** for specific tasks the agent should handle
5. **Test the agent** with the `/use-agent` command

### Agent Registry

The `agent-registry.json` file tracks all active agents. Update it when you:
- Create a new agent
- Activate/deactivate an agent
- Change agent permissions
- Update agent version

## Agent Naming Convention

- Use numbers for priority/execution order: `01-`, `02-`, etc.
- Use descriptive kebab-case names: `photographer-acquisition`
- Keep names under 30 characters

## Best Practices

1. **Document everything** - Future you will thank current you
2. **Version control** - Git commit after each agent change
3. **Log activities** - Keep daily logs for debugging
4. **Test thoroughly** - Test agents before giving them real tasks
5. **Review regularly** - Check reports weekly to improve agents

## Security Notes

- Agents should NEVER have access to:
  - User passwords or auth tokens
  - Payment processing directly
  - Production database write access (without approval)

- All agent actions should be:
  - Logged
  - Reversible when possible
  - Subject to human review for critical operations

## Future Expansion

As PhotoVault grows, add agents for:
- Content moderation
- Performance monitoring
- Analytics reporting
- User onboarding
- Quality assurance testing

---

**Last Updated:** November 7, 2024
**Maintained By:** PhotoVault Development Team
