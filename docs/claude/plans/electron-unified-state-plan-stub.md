# Electron Desktop - Unified State & Retry System (Plan B - STUB)

**Created:** 2026-02-02
**Expert:** Electron & Desktop App Expert
**Status:** Stub - Detailed plan to be written after Plan A is complete
**Estimated Effort:** TBD (requires investigation)

---

## Purpose

This is a stub document outlining work that was intentionally deferred from Plan A ("Add Photos to Existing Gallery") to reduce scope and risk.

---

## Deferred Work Items

### 1. State Storage Unification

**Current State:**
- `queueStore` (electron-store): Stores failed uploads for retry (`photovault-upload-queue`)
- `upload-state` (electron-store): Stores in-progress uploads for resume (`photovault-upload-state`)

**Problem:**
- Two overlapping storage systems with similar purposes
- Unclear when to use which
- Potential for inconsistency

**Proposed Investigation:**
- Analyze all code paths that write to each store
- Document the lifecycle of an upload through both systems
- Determine if they can be unified or if separation is intentional
- Design migration strategy if unification is warranted

### 2. Per-File Tracking

**Current State:**
- `upload-state` tracks `completedFiles` as a count
- Resume picks up from `currentFileIndex`
- No tracking of which specific files completed vs failed

**Problem:**
- If file 5 of 10 fails, resume starts from file 5
- If file 3 succeeded but file 5 failed, no way to skip file 3
- Complex partial failure scenarios not well handled

**Proposed Enhancement:**
- Track per-file status: `pending`, `uploading`, `completed`, `failed`
- Allow retry of specific failed files without re-uploading successful ones
- Store file-level errors for debugging

### 3. Retry Button Root Cause Investigation

**Current State:**
- Users report "Retry" button sometimes doesn't work
- No clear reproduction steps documented
- Unknown if issue is in queueStore, UI, or IPC

**Proposed Investigation:**
- Add detailed logging around retry flow
- Document exact steps to reproduce
- Trace through: UI click -> IPC -> upload-manager -> API
- Identify where the failure occurs
- Fix root cause (not symptoms)

### 4. State Migration

**Current State:**
- If storage schema changes, existing data may be incompatible
- No version tracking in stored data
- No migration logic

**Proposed Enhancement:**
- Add schema version to stored data
- Write migration functions for version upgrades
- Test upgrade path from old to new format

---

## Why This Was Deferred

1. **Risk Reduction:** Plan A's scope is focused on a new feature. Mixing in infrastructure changes increases risk of regressions.

2. **Independent Value:** "Add Photos" feature delivers user value without state unification. Users can have the feature sooner.

3. **Investigation Needed:** Retry issues need investigation before solutioning. Premature fixes may miss the root cause.

4. **Complexity:** State migration requires careful handling of existing user data. Better done as a focused effort.

---

## Prerequisites for Plan B

Before starting Plan B detailed planning:

1. Plan A must be complete and deployed
2. User feedback on Plan A collected
3. Retry issue reproduction steps documented
4. Decision made on whether to unify stores or keep separate

---

## Timeline

- **Plan A:** Now (focused scope)
- **Investigation:** After Plan A ships (1-2 weeks)
- **Plan B Detailed Plan:** After investigation
- **Plan B Implementation:** TBD based on findings

---

## Notes

This stub will be expanded into a full implementation plan after:
1. Plan A is successfully deployed
2. Investigation into retry issues is complete
3. Architecture decision on state unification is made

Do not start work on these items until this stub is expanded into a full plan.
