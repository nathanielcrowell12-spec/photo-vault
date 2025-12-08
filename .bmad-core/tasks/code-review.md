# /code-review Task

When this command is used, execute the following task:

<!-- Powered by BMAD™ Core -->

# code-review

Perform a comprehensive code review on files, directories, or git diffs. This is a lightweight, flexible review that doesn't require story context - ideal for PR reviews, quick feedback, or reviewing code changes during development.

## Inputs

```yaml
required:
  - target: One of the following:
      - file path (e.g., "src/services/auth.ts")
      - directory path (e.g., "src/services/")
      - "diff" for staged git changes
      - "diff --unstaged" for unstaged changes
      - "diff HEAD~1" for last commit
      - "pr:{number}" for GitHub PR (requires gh CLI)

optional:
  - focus: Narrow review scope (security | performance | architecture | testing | all)
  - severity_threshold: Minimum severity to report (critical | high | medium | low) - default: low
  - output_format: How to present findings (inline | summary | both) - default: both
```

## Review Dimensions

### 1. Correctness

- Logic errors and edge cases
- Null/undefined handling
- Type safety (TypeScript strict mode compliance)
- Error handling completeness
- Race conditions in async code
- Off-by-one errors, boundary conditions

### 2. Security (OWASP Top 10 + Common Vulnerabilities)

- **Injection**: SQL, NoSQL, command, LDAP injection vectors
- **Broken Auth**: Hardcoded credentials, weak session handling
- **Sensitive Data**: Secrets in code, PII exposure, insecure storage
- **XXE/XSS**: XML parsing, unescaped output, innerHTML usage
- **Access Control**: Missing auth checks, IDOR vulnerabilities
- **Misconfig**: Debug modes, default credentials, verbose errors
- **Input Validation**: Missing sanitization, type coercion issues

### 3. Performance

- N+1 query patterns
- Unnecessary re-renders (React)
- Memory leaks (event listeners, subscriptions, closures)
- Inefficient algorithms (O(n²) when O(n) possible)
- Missing pagination/limits on data fetches
- Blocking operations on main thread
- Unoptimized bundle size (large imports)

### 4. Maintainability

- **Naming**: Clear, descriptive, consistent naming conventions
- **Complexity**: Cyclomatic complexity, nesting depth, function length
- **Single Responsibility**: Functions/classes doing too much
- **DRY**: Code duplication that should be abstracted
- **Comments**: Missing WHY comments, outdated comments
- **Magic Values**: Hardcoded strings/numbers without constants

### 5. Architecture & Patterns

- Adherence to project structure (`docs/unified-project-structure.md` if exists)
- Consistency with existing codebase patterns
- Dependency injection usage
- Separation of concerns (UI/business logic/data)
- Import organization and dependency management
- API contract consistency

### 6. Testing

- Test coverage for new/changed code
- Test quality (meaningful assertions, not just coverage padding)
- Edge cases and error scenarios tested
- Test isolation (no shared state, no flaky tests)
- Appropriate test level (unit vs integration vs e2e)

## Process

### Step 1: Resolve Target

**For file/directory:**
```bash
# Verify target exists
ls -la {target}
```

**For git diff:**
```bash
# Staged changes
git diff --cached --name-only
git diff --cached

# Unstaged changes
git diff --name-only
git diff

# Last commit
git diff HEAD~1 --name-only
git diff HEAD~1
```

**For PR:**
```bash
# Get PR diff
gh pr diff {number}
gh pr view {number} --json files,additions,deletions
```

### Step 2: Gather Context

- Read project coding standards if available (`docs/coding-standards.md`)
- Check for linting configuration (`.eslintrc`, `deno.json`, etc.)
- Identify the tech stack from `package.json` or project files
- Note any relevant patterns from surrounding code

### Step 3: Analyze Code

For each file in scope:

1. **First Pass (Quick Scan)**
   - File structure and organization
   - Import patterns
   - Obvious issues (console.logs, TODOs, commented code)

2. **Second Pass (Deep Analysis)**
   - Line-by-line review against all dimensions
   - Cross-reference with other changed files
   - Check for breaking changes to existing code

3. **Third Pass (Holistic)**
   - Does the change make sense as a whole?
   - Are there missing pieces?
   - Integration concerns?

### Step 4: Prioritize Findings

**Severity Levels:**

| Level | Icon | Meaning | Action Required |
|-------|------|---------|-----------------|
| Critical | 🔴 | Security vulnerability, data loss risk, crash | Must fix before merge |
| High | 🟠 | Bug, logic error, significant issue | Should fix before merge |
| Medium | 🟡 | Code smell, maintainability concern | Recommend fixing |
| Low | 🟢 | Style, minor improvement, nitpick | Optional |

**Categorize each finding:**
- Blocking (must fix) vs Non-blocking (should consider)
- Quick fix vs Requires discussion

## Output Format

### Inline Comments Format

For each finding, provide:

```markdown
**{file}:{line}** 🔴|🟠|🟡|🟢 [{category}]

{description of the issue}

```{language}
// Current code
{problematic code snippet}
```

**Suggestion:**
```{language}
// Recommended change
{improved code snippet}
```

**Why:** {explanation of the risk/benefit}
```

### Summary Format

```markdown
# Code Review: {target}

**Reviewed:** {date}
**Reviewer:** {agent name}
**Scope:** {files reviewed count} file(s), {lines} lines
**Focus:** {focus area or "comprehensive"}

## Overview

{1-2 paragraph summary of the changes and overall quality assessment}

## Metrics

| Metric | Value |
|--------|-------|
| Files Reviewed | {n} |
| Lines Changed | +{added} / -{removed} |
| Critical Issues | {n} |
| High Issues | {n} |
| Medium Issues | {n} |
| Low Issues | {n} |

## Verdict

{APPROVED | APPROVED_WITH_COMMENTS | CHANGES_REQUESTED | BLOCKED}

**Rationale:** {why this verdict}

## Critical Issues (Must Fix)

{list of critical findings with file:line references}

## High Priority Issues (Should Fix)

{list of high findings}

## Medium Priority Issues (Recommended)

{list of medium findings}

## Low Priority / Suggestions

{list of low findings}

## What's Good

{positive observations - important for balanced feedback}

## Questions for Author

{any clarifying questions about intent or approach}
```

## Focus Mode Behaviors

When `focus` parameter is specified, prioritize that dimension:

### `--focus security`
- Deep dive on all security dimensions
- Check for OWASP Top 10
- Audit authentication/authorization flows
- Review data handling and storage
- Skip style/naming nitpicks

### `--focus performance`
- Profile algorithmic complexity
- Check for memory leaks
- Review database query patterns
- Analyze bundle impact
- Skip security unless obvious vulnerability

### `--focus architecture`
- Evaluate design patterns
- Check separation of concerns
- Review dependency management
- Assess scalability implications
- Compare to existing codebase patterns

### `--focus testing`
- Evaluate test coverage
- Review test quality and assertions
- Check for missing edge cases
- Assess test maintainability
- Suggest additional test scenarios

## Special Cases

### Reviewing Generated Code

If code appears to be AI-generated or scaffolded:
- Check for placeholder values
- Verify error handling isn't just `console.log`
- Ensure types aren't all `any`
- Look for copy-paste errors

### Reviewing Migrations

Database migrations require extra scrutiny:
- Reversibility (can it be rolled back?)
- Data safety (will it corrupt existing data?)
- Performance (will it lock tables?)
- Ordering (dependencies on other migrations?)

### Reviewing Config Changes

Configuration files (.env, yaml, json configs):
- No secrets in plain text
- Valid syntax
- Documented new options
- Backward compatibility

## Blocking Conditions

HALT the review and request clarification if:

- Target doesn't exist or can't be resolved
- Files are binary or unreadable
- Diff is too large (>2000 lines) without focus area specified
- Critical security issue found that needs immediate attention

## Integration with Story Workflow

This task is standalone but can be referenced from story workflows:

- **During Development**: Dev runs `*review-code {file}` for self-review before marking tasks complete
- **Pre-QA**: Dev runs `*review-code diff` on all changes before requesting QA review
- **QA Review**: QA can use this for code-level review separate from story validation

## Key Principles

- **Be Helpful, Not Harsh**: Explain WHY something is an issue, not just WHAT
- **Provide Solutions**: Don't just point out problems, suggest fixes
- **Respect Context**: Consider the project's conventions and constraints
- **Prioritize Ruthlessly**: Not every nitpick needs to block a merge
- **Acknowledge Good Work**: Positive feedback encourages good practices
- **Stay Objective**: Review the code, not the coder
