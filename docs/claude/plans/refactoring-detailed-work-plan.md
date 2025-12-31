# PhotoVault Refactoring - Detailed Work Plan (REVISED)

**Created:** December 29, 2024
**Revised:** December 29, 2024 (incorporated QA Critic feedback)
**Verdict on v1:** NEEDS REVISION → This is v2
**Source:** `codebase-refactoring-audit.md`, `refactoring-detailed-work-plan-critique.md`

---

## Prerequisites (MUST COMPLETE BEFORE ANY TASK)

### Blocker 1: Identify Active Webhook Endpoint
```
ACTION: Check Stripe Dashboard > Developers > Webhooks
RECORD: Which URL is configured: /api/webhooks/stripe OR /api/stripe/webhook
RECORD: List ALL events subscribed to
```

### Blocker 2: Map Webhook Event Handlers
```
ACTION: For BOTH webhook files, list every event type handled
OUTPUT: Side-by-side comparison showing:
  - Events unique to /api/webhooks/stripe
  - Events unique to /api/stripe/webhook
  - Events handled by both (potential conflict)
```

### Blocker 3: Verify Upload Modal Dependencies
```
ACTION: Run `npx tsc --noEmit` to check current build status
ACTION: Temporarily delete FastZipUploadModal.tsx and ZipUploadModal.tsx
ACTION: Run `npx tsc --noEmit` again
RECORD: Any import errors? If yes, these are NOT deletable without migration
RESTORE: Files after test
```

### Blocker 4: Document Photographer Route Differences
```
ACTION: Compare /photographer/clients and /photographers/clients
RECORD: Which Supabase client? Which auth hooks? Which features?
DECISION: Which is authoritative? What features need merging?
```

---

## Priority Tiers

| Tier | Timeline | Risk Level |
|------|----------|------------|
| P0 - CRITICAL | Before Beta | Security/Data Loss |
| P1 - HIGH | Before Public Launch | User-Facing Bugs |
| P2 - MEDIUM | Post-Launch Sprint | Tech Debt |
| P3 - LOW | Future Backlog | Nice to Have |

---

## P0 - CRITICAL (Before Beta)

### Task 1: Remove Console.log from API Routes (SAFEST - DO FIRST)

**Problem:** 217 console.log statements in API routes expose sensitive data

**Why First:** This task is lowest risk and builds momentum. No functional changes.

**Priority Files:**
| File | Count | Risk |
|------|-------|------|
| `api/webhooks/stripe/route.ts` | 66 | Payment data exposure |
| `api/family/secondaries/accept/route.ts` | 14 | Auth data |
| `api/cron/grace-period-notifications/route.ts` | 13 | User data |

**Phase 1: Create Production-Ready Logger**
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'api_key',
  'card', 'cvv', 'ssn', 'authorization', 'credit_card',
  'stripe_customer_id', 'payment_method'
];

function sanitize(data?: object): object | undefined {
  if (!data) return undefined;
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      (sanitized as Record<string, unknown>)[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

const shouldLog = (level: LogLevel): boolean => {
  const envLevel = process.env.LOG_LEVEL || 'info';
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(envLevel as LogLevel);
};

export const logger = {
  debug: (msg: string, data?: object) => {
    if (shouldLog('debug')) {
      console.log(JSON.stringify({
        level: 'debug', msg, ...sanitize(data), ts: new Date().toISOString()
      }));
    }
  },
  info: (msg: string, data?: object) => {
    if (shouldLog('info')) {
      console.log(JSON.stringify({
        level: 'info', msg, ...sanitize(data), ts: new Date().toISOString()
      }));
    }
  },
  warn: (msg: string, data?: object) => {
    console.warn(JSON.stringify({
      level: 'warn', msg, ...sanitize(data), ts: new Date().toISOString()
    }));
  },
  error: (msg: string, data?: object) => {
    console.error(JSON.stringify({
      level: 'error', msg, ...sanitize(data), ts: new Date().toISOString()
    }));
  },
};
```

**Phase 2: Replace Console.logs (File by File)**
```
For each file with console.log:
1. Open file
2. Review each console.log:
   - Is it debugging? → logger.debug()
   - Is it informational? → logger.info()
   - Is it an error condition? → logger.error()
3. Replace with appropriate logger call
4. Test file still works
5. Commit
```

**Phase 3: Add ESLint Rule (AFTER all replacements)**
```json
// .eslintrc.json - ONLY add after Phase 2 complete
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

**Acceptance Criteria:**
- [ ] logger.ts utility created with sanitization
- [ ] All console.log replaced (zero remaining in API routes)
- [ ] Build passes: `npm run build`
- [ ] ESLint rule enabled and passing
- [ ] No sensitive data appears in logs (manual review)

**Rollback Plan:**
- Git revert to commit before changes
- Console.logs are not breaking, just leaky

**Estimated Time:** 3-4 hours

---

### Task 2: Resolve Webhook Routes (REQUIRES INVESTIGATION FIRST)

**Problem:** Two webhook handlers exist - but they may handle DIFFERENT events

**CRITICAL: Complete Prerequisites #1 and #2 before this task**

**Phase 1: Investigation (DO NOT SKIP)**
```
1. Check Stripe Dashboard configured endpoint
2. Map events in /api/webhooks/stripe/route.ts:
   - List every case in the switch statement
   - Note any unique features (idempotency, analytics, etc.)

3. Map events in /api/stripe/webhook/route.ts:
   - List every case in the switch statement
   - Note any unique features (Connect handling, etc.)

4. Create comparison table:
   | Event Type | Handler 1 | Handler 2 | Notes |
   |------------|-----------|-----------|-------|
   | checkout.session.completed | ✓ | ✓ | Compare logic |
   | account.updated | ? | ✓ | Connect-specific |
   | ... | ... | ... | ... |
```

**Phase 2: Decision Matrix**
```
IF both handlers have unique events:
  → Consolidate into ONE handler that handles ALL events
  → Keep the more complete one, migrate unique handlers

IF one handler is strictly a subset:
  → Keep the superset, delete the subset
  → Update Stripe Dashboard if needed

IF handlers have conflicting logic for same events:
  → Analyze which logic is correct
  → May need to keep both temporarily with different endpoints
```

**Phase 3: Implementation**
```
1. Create backup: git stash or git commit -m "pre-webhook-consolidation"
2. If migrating handlers:
   - Copy unique handlers to target file
   - Add tests for migrated handlers
   - Test with Stripe CLI: stripe trigger <event>
3. Update Stripe Dashboard if changing endpoints
4. Delete redundant file only after production verification
```

**Acceptance Criteria:**
- [ ] Investigation document created showing event mapping
- [ ] Decision recorded with rationale
- [ ] All Stripe events have exactly one handler
- [ ] Stripe CLI tests pass for: checkout.session.completed, invoice.paid, invoice.payment_failed
- [ ] Production webhook logs show events processing correctly

**Rollback Plan:**
```
1. Git hash before changes: ________________
2. To restore: git revert <hash>
3. Stripe Dashboard webhook URL: ________________
4. Can switch back within 2 minutes via Dashboard
```

**Estimated Time:** 4-6 hours (including investigation)

---

### Task 3: Consolidate Upload Modals (REQUIRES DEPENDENCY ANALYSIS)

**Problem:** 5 upload modals exist, need to verify which are truly unused

**CRITICAL: Complete Prerequisite #3 before this task**

**Phase 1: Dependency Analysis**
```
1. Run: grep -r "ZipUploadModal" src/ --include="*.tsx" --include="*.ts"
2. Run: grep -r "FastZipUploadModal" src/ --include="*.tsx" --include="*.ts"
3. Run: grep -r "ChunkedZipUploadModal" src/ --include="*.tsx" --include="*.ts"
4. Run: grep -r "EnhancedZipUploadModal" src/ --include="*.tsx" --include="*.ts"
5. Run: grep -r "TusZipUploadModal" src/ --include="*.tsx" --include="*.ts"

Record for each:
- Direct imports (import X from)
- Type references
- JSX usage (<Component />)
```

**Phase 2: Feature Comparison**
```
| Feature | Tus | Enhanced | Chunked | Fast | Basic |
|---------|-----|----------|---------|------|-------|
| Resumable | ✓ | ? | ? | ? | ? |
| Progress | ? | ? | ? | ? | ? |
| Retry | ? | ? | ? | ? | ? |
| Cancel | ? | ? | ? | ? | ? |
| Error handling | ? | ? | ? | ? | ? |

Fill in table by reading each modal's code
```

**Phase 3: Safe Deletion**
```
For VERIFIED unused modals only:
1. Delete file
2. Run: npx tsc --noEmit
3. If errors → restore and investigate
4. If clean → commit

For modals being consolidated:
1. List features from Enhanced/Chunked not in Tus
2. Add missing features to TusZipUploadModal
3. Update UnifiedPlatformModal to use only Tus
4. Test all upload paths in browser
```

**Acceptance Criteria:**
- [ ] Dependency analysis documented
- [ ] Feature comparison table complete
- [ ] Unused modals deleted (verified by TypeScript)
- [ ] Upload flow works: small file, large file, cancelled upload, failed upload
- [ ] Desktop app upload unaffected (uses different endpoints)

**Rollback Plan:**
- Files in git history, can restore with git checkout

**Estimated Time:** 2-3 hours

---

## P1 - HIGH (Before Public Launch)

### Task 4: Consolidate Photographer Routes (REQUIRES FEATURE MAPPING)

**Problem:** Two folders with different implementations of same features

**CRITICAL: Complete Prerequisite #4 before this task**

**Phase 1: Feature Audit**
```
For each page in /photographer/:
1. Document what it does
2. Document which components it uses
3. Document which API routes it calls

For each page in /photographers/:
1. Same documentation
2. Note differences from /photographer/ equivalent if exists
```

**Phase 2: Merge Strategy**
```
For duplicate pages (e.g., clients):
1. Identify authoritative version (more features, more recent, better code)
2. List features from non-authoritative that need migration
3. Merge features into authoritative version
4. Test thoroughly

For unique pages:
1. Move directly to /photographer/
2. Update imports
3. Test
```

**Phase 3: Redirect Setup**
```typescript
// next.config.js
async redirects() {
  return [
    {
      source: '/photographers/:path*',
      destination: '/photographer/:path*',
      permanent: true,
    },
  ];
}
```

**Phase 4: Internal Link Updates**
```
1. Search for all /photographers/ links in codebase
2. Update to /photographer/
3. Verify no broken links
```

**Acceptance Criteria:**
- [ ] Single /photographer/ folder
- [ ] All functionality from both folders preserved
- [ ] Feature audit document created
- [ ] Redirects working for old URLs
- [ ] No 404s in application
- [ ] User can complete full photographer workflow

**Rollback Plan:**
- Keep /photographers/ folder in git for 1 sprint
- Redirects can be removed if needed

**Estimated Time:** Full day (8 hours)

---

### Task 5: Refactor Webhook Handler (AFTER Task 2)

**Prerequisite:** Task 2 must be complete (single webhook handler exists)

**Problem:** 1348-line webhook file is unmaintainable

**Target Structure:**
```
src/lib/stripe/webhooks/
├── index.ts              (~100 lines - router)
├── checkout.ts           (checkout.session.* handlers)
├── subscription.ts       (customer.subscription.* handlers)
├── invoice.ts            (invoice.* handlers)
├── dispute.ts            (charge.dispute.* handlers)
├── transfer.ts           (transfer.* handlers)
├── account.ts            (account.* handlers - Connect)
└── helpers.ts            (shared utilities, idempotency)
```

**Phase 1: Test Coverage (BEFORE refactoring)**
```
1. Create webhook test file
2. Write tests for each event type using Stripe CLI payloads
3. Ensure all tests pass BEFORE any extraction
```

**Phase 2: Extract One Handler at a Time**
```
For each event category:
1. Create new file (e.g., checkout.ts)
2. Move handler function to new file
3. Export from new file
4. Import in route.ts
5. Run tests - must still pass
6. Commit
```

**Phase 3: Create Router**
```
// src/lib/stripe/webhooks/index.ts
import { handleCheckout } from './checkout';
import { handleSubscription } from './subscription';
// ...

export const webhookHandlers: Record<string, Function> = {
  'checkout.session.completed': handleCheckout,
  'checkout.session.expired': handleCheckout,
  'customer.subscription.created': handleSubscription,
  // ...
};

export async function routeWebhookEvent(event: Stripe.Event, supabase: SupabaseClient) {
  const handler = webhookHandlers[event.type];
  if (!handler) {
    logger.warn('Unhandled webhook event type', { type: event.type });
    return;
  }
  return handler(event, supabase);
}
```

**Acceptance Criteria:**
- [ ] Tests written and passing before refactor
- [ ] No file over 300 lines
- [ ] All events handled (compare to pre-refactor list)
- [ ] Stripe CLI tests: `stripe trigger checkout.session.completed`
- [ ] Production webhook logs show success

**Rollback Plan:**
- Single commit per handler extraction
- Can revert individual extractions

**Estimated Time:** Full day (8 hours)

---

## P2 - MEDIUM (Post-Launch Sprint)

### Task 6: Refactor Gallery Page (1297 lines)
### Task 7: Refactor Admin Analytics Page (1041 lines)
### Task 8: Clean Up Email Templates (4373 lines)

(Details same as v1 - defer until P0/P1 complete)

---

## P3 - LOW (Future Backlog)

### Task 9: Complete TODO Comments
### Task 10: Add Proper Logging Infrastructure (Winston/Pino)

---

## Revised Implementation Order

```
Day 0: Prerequisites
├── Complete Blocker 1 (Stripe Dashboard)
├── Complete Blocker 2 (Event mapping)
├── Complete Blocker 3 (Upload dependencies)
└── Complete Blocker 4 (Route differences)

Week 1: P0 Critical
├── Day 1-2: Task 1 (Console.log - safest, do first)
├── Day 3-4: Task 2 (Webhook routes - after investigation)
└── Day 5: Task 3 (Upload modals - after analysis)

Week 2-3: P1 High
├── Days 1-4: Task 4 (Photographer routes - complex)
└── Days 5-8: Task 5 (Webhook refactor - after Task 2)

Week 4+: P2/P3
├── Task 6 (Gallery page)
├── Task 7 (Admin analytics)
└── Task 8+ (Email, TODOs, etc.)
```

---

## Blocking Questions (Answer Before Starting)

| Question | Answer | Answered By |
|----------|--------|-------------|
| Which webhook endpoint is in Stripe Dashboard? | __________ | Check Dashboard |
| Events in /api/webhooks/stripe? | __________ | Code analysis |
| Events in /api/stripe/webhook? | __________ | Code analysis |
| Desktop upload endpoints affected? | __________ | Code search |
| External links to /photographers/? | __________ | Analytics/Search |
| Which clients page is authoritative? | __________ | Feature comparison |

---

## Session Notes

When implementing, record:
- [ ] Prerequisites completed on: __________
- [ ] Task 1 completed on: __________
- [ ] Task 2 completed on: __________
- [ ] Task 3 completed on: __________
- [ ] Any issues encountered: __________

---

*Revised per QA Critic feedback. This plan now includes investigation phases, rollback plans, and addresses the dangerous assumptions in v1.*
