# PhotoVault Skill Index

**Purpose:** On-demand lookup table for skills and experts. Claude reads this ONLY when trigger words are detected.

---

## How to Use This Index

1. **Detect trigger words** in user request
2. **Find matching row** in table below
3. **Read the skill file** (knowledge)
4. **Read the discipline file** (process rules)
5. **Spawn expert subagent** with the expert prompt
6. **Expert writes plan** to `docs/claude/plans/`
7. **Present plan to user**, implement after approval

---

## Skill Lookup Table

| Trigger Words | Skill File | Expert File | Discipline |
|---------------|------------|-------------|------------|
| `database`, `supabase`, `RLS`, `query`, `migration`, `schema`, `table`, `policy`, `auth.uid`, `storage bucket` | `supabase-skill.md` | `supabase-expert.md` | TDD or Debugging |
| `payment`, `stripe`, `checkout`, `subscription`, `webhook`, `connect`, `commission`, `payout`, `transfer` | `stripe-skill.md` | `stripe-expert.md` | TDD or Debugging |
| `component`, `UI`, `page`, `modal`, `form`, `button`, `styling`, `tailwind`, `shadcn`, `design`, `card`, `dashboard` | `shadcn-skill.md` + `ui-ux-design.md` | `shadcn-expert.md` | TDD |
| `API route`, `middleware`, `server component`, `client component`, `server action`, `deployment`, `vercel`, `app router` | `nextjs-skill.md` | `nextjs-expert.md` | TDD or Debugging |
| `email`, `template`, `notification`, `resend` | `resend-skill.md` | `resend-expert.md` | TDD |
| `desktop`, `electron`, `upload`, `tus`, `chunked` | `electron-skill.md` | `electron-expert.md` | TDD or Debugging |
| `test`, `e2e`, `playwright`, `vitest`, `QA` | `testing-skill.md` | `testing-expert.md` | TDD |
| `image`, `thumbnail`, `zip`, `EXIF`, `sharp`, `photo processing` | `image-processing-skill.md` | `image-processing-expert.md` | TDD or Debugging |
| `SEO`, `meta`, `schema`, `sitemap` | `seo-skill.md` | `seo-expert.md` | TDD |
| `directory`, `directories`, `listings`, `listing page`, `category pages`, `city pages` | `directory-building-skill.md` | `directory-building-expert.md` | TDD |
| `analytics`, `posthog`, `tracking`, `event`, `funnel`, `conversion`, `metrics` | `posthog-skill.md` | `posthog-expert.md` | TDD |

---

## File Paths

### Skills (Technical Knowledge)
```
C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\skills\
```

### Experts (Research Prompts)
```
C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\
```

### Disciplines (Process Enforcement)
```
C:\Users\natha\Stone-Fence-Brain\INFRASTRUCTURE\claude-skills\
```
- `tdd-discipline-skill.md` - RED-GREEN-REFACTOR cycle
- `systematic-debugging-discipline-skill.md` - 4-phase debugging with HALT
- `verification-discipline-skill.md` - Evidence before completion claims

### UI/UX Skill (Special Location)
```
C:\Users\natha\Stone-Fence-Brain\DEPARTMENTS\Product\skills\ui-ux-design.md
```

### QA Critic (Reviews All Plans)
```
C:\Users\natha\Stone-Fence-Brain\VENTURES\PhotoVault\claude\experts\qa-critic-expert.md
```

### Plan Output
```
docs/claude/plans/[domain]-[task]-plan.md
docs/claude/plans/[domain]-[task]-critique.md
```

---

## Discipline Selection

| Task Type | Discipline to Load |
|-----------|-------------------|
| New feature | `tdd-discipline-skill.md` |
| Bug fix | `systematic-debugging-discipline-skill.md` + `tdd-discipline-skill.md` |
| Refactoring | `tdd-discipline-skill.md` |
| Before claiming done | `verification-discipline-skill.md` |

---

## The Three Iron Laws

1. **NO CODE WITHOUT A FAILING TEST FIRST** (TDD)
2. **NO FIX WITHOUT ROOT CAUSE IDENTIFIED** (Debugging)
3. **NO "IT'S DONE" WITHOUT EVIDENCE** (Verification)

HALT immediately if you cannot comply. Report to user.
