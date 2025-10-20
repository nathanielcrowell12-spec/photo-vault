# Master Build Prompt v4.3 Hash Specification

**Version**: 4.3  
**Last Updated**: 2025-10-19  
**Status**: Production (Hashed + Helm-Linked)  
**Linked Prompt**: /docs/build/MASTER_BUILD_PROMPT_v4.3.txt

## Purpose

This specification defines the governance and hash provenance system for the Master Build Prompt v4.3, ensuring prompt integrity across all Helm ventures including PhotoVault.

## Hash Algorithm & Scope

- **Algorithm**: SHA-256
- **Normalization**: LF line endings, trailing spaces stripped
- **Scope**: Content between `<<<BEGIN PROMPT>>>` and `<<<END PROMPT>>>` markers only

## Current Hash

**Hash**: `fb9f6f44c64476b6c5f94347a6b90c3b8e4b6677a6de91de5698a3ad839fb47d`  
**Verified On**: 2025-10-19  
**Signed By**: Helm AI Steward

## Manifest Structure

```json
{
  "version": "4.3",
  "algo": "sha256",
  "hash": "fb9f6f44c64476b6c5f94347a6b90c3b8e4b6677a6de91de5698a3ad839fb47d",
  "updated": "2025-10-19T17:00:00Z",
  "source": "/docs/build/MASTER_BUILD_PROMPT_v4.3.txt",
  "issuer": "Helm AI Steward"
}
```

## Governance Workflow

### Helm (Central Authority)
1. Updates prompt body between markers
2. Computes SHA-256 hash over normalized content
3. Updates manifest.json with new hash
4. Exports to ventures via sync mechanism

### Ventures (PhotoVault)
1. `prompt:sync` - Pulls latest manifest/prompt from Helm
2. `prompt:verify` - Compares stored vs recomputed hash
3. CI fails on hash mismatch
4. Deploy emits Helm Signals with verified hash

## Quality Gates

- ✅ `verify:prompt` (hash check)
- ✅ `contract:check` (schema validation)
- ✅ `hygiene` (lint + format + type)
- ✅ `bundle:report` (size budget)
- ✅ `lighthouse:ci` (perf ≥ 90 | a11y ≥ 95)

## Fallback Logic

- **File link fails**: Use Git submodule / REST / static CDN
- **Hash lib unavailable**: Use shasum, openssl sha256, or Bun.crypto
- **Helm offline**: Fallback to export.local.json until online

## Signals Integration

All deployments emit Helm Signals with:
```json
{
  "prompt_version": "4.3",
  "prompt_hash": "fb9f6f44c64476b6c5f94347a6b90c3b8e4b6677a6de91de5698a3ad839fb47d",
  "tenant_id": "photovault-hub",
  "timestamp": "2025-10-19T17:00:00Z"
}
```

## Verification Commands

```bash
# Sync latest prompt from Helm
npm run prompt:sync

# Verify hash integrity
npm run prompt:verify

# Rehash and update (Helm only)
npm run prompt:hash
npm run prompt:publish
```

## Philosophy

Prompts are code contracts — immutable once hashed, versioned when amended. Automation propagates contracts through the ecosystem for verifiable lineage.

---

*This specification ensures every repo line traces to a verified prompt.*
