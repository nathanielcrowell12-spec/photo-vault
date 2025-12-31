# PhotoVault Codebase Refactoring Audit

**Created:** December 29, 2024
**Status:** Initial Analysis Complete - Needs Detailed Planning

---

## Summary Metrics

| Metric | Count |
|--------|-------|
| Total TypeScript files | 377 |
| Total pages | 86 |
| Console.log statements | **480** |
| TODO/FIXME comments | 15+ |
| Files over 500 lines | 40+ |
| Files over 1000 lines | 3 |

---

## CRITICAL: Fix Before Beta

### 1. Duplicate Webhook Routes

**Files:**
- `src/app/api/webhooks/stripe/route.ts` → 1348 lines (52KB)
- `src/app/api/stripe/webhook/route.ts` → 815 lines (28KB)

**Risk:** Payment failures if wrong endpoint is configured
**Action:** Verify which is active in Stripe Dashboard, delete the other

---

### 2. Duplicate Photographer Routes

**Folders:**
- `src/app/photographer/` → clients, dashboard, galleries, upload
- `src/app/photographers/` → clients, analytics, revenue, settings

**Risk:** User confusion, duplicated code, maintenance burden
**Action:** Consolidate into single folder structure

---

### 3. Five Upload Modal Variants

**Files:**
- `components/ZipUploadModal.tsx`
- `components/ChunkedZipUploadModal.tsx` → 602 lines
- `components/EnhancedZipUploadModal.tsx` → 638 lines
- `components/FastZipUploadModal.tsx` → 535 lines
- `components/TusZipUploadModal.tsx` → 454 lines

**Risk:** Which one is actually used? Confusing maintenance
**Action:** Audit usage, keep TusZipUploadModal (TUS is best approach), delete others

---

### 4. 480 Console.log Statements

**Risk:** Security exposure, performance impact, unprofessional
**Action:**
- Add eslint rule: `"no-console": "error"`
- Remove all console.log before production

---

## MAJOR: Fix Soon After Beta

### Giant Files (1000+ lines)

| File | Lines | Refactoring Approach |
|------|-------|---------------------|
| `api/webhooks/stripe/route.ts` | 1348 | Split into handler functions by event type |
| `gallery/[galleryId]/page.tsx` | 1297 | Extract GalleryViewer, PhotoGrid, SharePanel components |
| `admin/business-analytics/page.tsx` | 1041 | Extract chart components |

### Large Page Components (500-900 lines)

| File | Lines |
|------|-------|
| `photographer/galleries/create/page.tsx` | 858 |
| `photographers/settings/page.tsx` | 782 |
| `client/billing/page.tsx` | 756 |
| `client/upload/page.tsx` | 696 |
| `photographer/upload/page.tsx` | 655 |
| `client/settings/family/page.tsx` | 620 |
| `photographers/revenue/page.tsx` | 607 |

### Email Templates (4373 lines total)

```
lib/email/
├── email-service.ts      → 739 lines
├── revenue-templates.ts  → 731 lines
├── critical-templates.ts → 711 lines
├── templates.ts          → 606 lines
├── engagement-templates.ts → 568 lines
├── family-templates.ts   → 529 lines
```

**Consider:** React Email, separate HTML files

---

## TODO Comments (Incomplete Features)

| File | Issue |
|------|-------|
| `cron/suspend-photographers/route.ts:59` | Suspension emails not implemented |
| `photographer/clients/page.tsx:257` | Invitation emails not wired up |
| `photographers/clients/page.tsx:184` | Same - invitation emails |
| `lib/services/photo-import-service.ts:156` | Thumbnail generation TODO |
| `lib/services/unified-import-service.ts:169` | Thumbnail TODO |
| `lib/services/unified-import-service.ts:319` | ZIP extraction TODO |
| `lib/services/zip-stream-service.ts:139` | Thumbnail TODO |
| `signup/payment/page.tsx:68` | Stripe checkout TODO |

---

## Pre-Beta Priority Checklist

### Must Fix
- [ ] Verify correct webhook route (check Stripe Dashboard)
- [ ] Remove or reduce console.logs (at minimum in API routes)
- [ ] Test upload flow end-to-end

### Should Fix
- [ ] Consolidate photographer/photographers routes
- [ ] Delete unused upload modals
- [ ] Wire up invitation emails

### Tech Debt (Post-Beta)
- [ ] Refactor 1000+ line files
- [ ] Clean up email templates
- [ ] Resolve all TODO comments
- [ ] Add proper logging (Winston/Pino instead of console.log)

---

## Next Steps

When returning to this plan:

1. **Investigate webhook routes** - Check Stripe Dashboard for configured endpoint
2. **Audit upload modals** - Grep for imports to see which are used
3. **Map photographer routes** - Document which pages are in which folder
4. **Create detailed refactoring tickets** - One per major issue

---

*This is an initial audit. Each section needs detailed investigation before implementation.*
