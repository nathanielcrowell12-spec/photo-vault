# 🚀 **MASTER BUILD SYSTEM SPEC – v4.3**

### Unified Operations Platform Development Framework

*(Helm-Linked, Hashed, and Self-Maintaining)*

---

## 📘 **Purpose & Intent**

This document serves as both the **master coding prompt** and the **operational governance blueprint** for all ecosystem builds (PhotoVault, Website Builder, Pumpkin business, etc.).

It defines:

* How the AI writes and maintains code.
* How Helm and all ventures synchronize a single source of truth for build standards.
* How prompt provenance is tracked and verified using cryptographic hashing.
* How CI/CD pipelines enforce hygiene, performance, and accessibility gates.

If any structure described here is technically infeasible, the **intent** is that:

* **Helm acts as the canonical prompt registry.**
* **All ventures (e.g., PhotoVault)** fetch that prompt and verify its integrity.
* **Hash mismatches block deployments** until synchronized.
* **Future automation** replaces manual sync steps.

---

## 🧭 **SECTION A – MASTER BUILD PROMPT v4.3**

### **📋 Core Principles**

1. **Production-First Architecture**

   * Build for production from day one; no shortcuts.
   * Secrets externalized via environment variables.
   * Zero local storage — all data cloud-based (Supabase).
   * Security headers mandatory.
   * Proper CORS configuration for all APIs.

2. **Systematic Error Resolution**

   * Fix errors in dependency → configuration → logic order.
   * No skipping unresolved errors.
   * Document each fix.
   * Test after every fix.

3. **Technology Stack Alignment**

   * Next.js 15 (Turbopack)
   * TypeScript 5+
   * Tailwind CSS 4
   * Radix UI + shadcn/ui
   * Supabase (database + auth)
   * Vercel (deployment)

4. **API-First Development**

   * RESTful endpoints with proper status codes.
   * CORS and health-check endpoints required.
   * Compatibility checks between ventures.

---

### **🧹 Self-Maintenance & Code Hygiene Protocol (Mandatory)**

**Purpose:** Enforce self-review and cleanup at defined checkpoints so every repo stays production-ready.

**Triggers**

* After each milestone or major change.
* Before any deployment or documentation generation.
* After long debugging (>30 min).

**Tasks**

1. **Automated:** `npm run hygiene` → runs format + lint + type + a11y checks.
2. **Prune Waste:** remove unused imports, dead code, stale comments, console logs, unused deps.
3. **Refactor:** eliminate magic values, simplify conditionals, break large components, enforce SRP, reduce duplication.
4. **Consistency:** apply naming rules (PascalCase components, camelCase vars, kebab-case files).
5. **Type Safety:** enforce proper typing, Zod validation, minimize `any`.
6. **Security:** no hardcoded URLs or exposed secrets; safe links and error boundaries required.
7. **Performance:** check bundles, lazy-load, memoize, optimize images.
8. **Accessibility:** verify ARIA labels, keyboard nav, color contrast, focus management.
9. **Data Flow:** colocate state, prevent stale closures, use feature flags for commented code.
10. **Network Resilience:** ensure timeouts, error states, deduped requests.

**Refactor Report Output**

* ✅ Clean | ⚠️ Warnings | 🚫 Blockers
* Files touched, lines removed, issues resolved.
* Tech debt prioritized (P0-P3).
* Hygiene is **blocking**; P0 issues must be fixed before progress.

---

### **🏗 Project Structure**

```
project-root/
├── package.json                 # Dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration
├── env.example                 # Environment variable template
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   └── api/                # API routes
│   │       ├── health/         # Health check endpoint
│   │       ├── system-status/  # System monitoring
│   │       └── ventures/       # Venture integration
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── utils.ts            # Utility functions
│   │   ├── supabase.ts         # Database client
│   │   ├── cors.ts             # CORS utilities
│   │   └── compatibility-checker.ts # Integration testing
│   └── services/
│       └── personas/           # AI persona definitions
├── docs/
│   ├── build/                  # Build documentation
│   └── DEPLOYMENT_GUIDE.md     # Deployment instructions
└── README.md                   # Project overview
```

---

### **⚙️ Package.json Template**

```json
{
  "name": "project-name",
  "version": "1.0.0",
  "description": "Project description",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build --turbopack",
    "start": "next start --port 3001",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next out dist",
    "deploy:preview": "vercel --target preview",
    "deploy:prod": "vercel --target production",
    "hygiene": "npm run format && npm run lint && npm run type-check && npm run a11y",
    "format": "prettier --write .",
    "a11y": "lighthouse-ci --assert --config .lighthouserc.js",
    "prompt:hash": "node prompt-registry/tools/compute-hash.mjs",
    "prompt:publish": "node prompt-registry/tools/publish-local.mjs"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.74.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dotenv": "^17.2.3",
    "lucide-react": "^0.544.0",
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwind-merge": "^3.3.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "prettier": "^3.1.0",
    "@lhci/cli": "^0.12.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

### **🔧 Next.js Configuration**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Enable ISR for better performance
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

---

### **🗄️ Supabase Client Template**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table types
export interface ETLLog {
  id: string
  timestamp: string
  source: string
  status: 'success' | 'error' | 'warning'
  details: any
  created_at: string
}

export interface SystemHealth {
  id: string
  service: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  last_check: string
  response_time?: number
  error_message?: string
  created_at: string
}

export interface VentureMetrics {
  id: string
  venture_name: string
  metrics_data: any
  timestamp: string
  created_at: string
}

export interface AutonomyMetrics {
  id: string
  process_name: string
  current_phase: 1 | 2 | 3
  composite_confidence_score: number
  human_intervention_rate: number
  last_assessment: string
  created_at: string
}

// AI Persona Types
export type PersonaType = 'coo' | 'marketing-genius' | 'strategist' | 'financial-architect' | 'product-designer' | 'analyst' | 'risk-assessor' | 'proactive-engine' | 'cultural-storyteller' | 'directory-builder'

export interface PersonaState {
  type: PersonaType
  active: boolean
  current_task?: string
  confidence_level: number
  last_activity: string
}
```

---

### **🌐 CORS Utility Template**

```typescript
import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS utility for API endpoints
 * Ensures cross-origin requests work properly
 */

export function addCorsHeaders(response: NextResponse): NextResponse {
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

export function handleCorsPreflight(): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response)
}

export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight()
    }

    try {
      const response = await handler(request)
      return addCorsHeaders(response)
    } catch (error) {
      console.error('API Error:', error)
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
      return addCorsHeaders(errorResponse)
    }
  }
}
```

---

### **🏥 Health Check Endpoint Template**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/cors'

/**
 * Health check endpoint
 * Used by other services to verify availability
 */
export const GET = withCors(async (request: NextRequest) => {
  try {
    return NextResponse.json({
      status: 'healthy',
      service: 'your-service-name',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
})

export const OPTIONS = withCors(async () => {
  return new NextResponse(null, { status: 204 })
})
```

---

### **🧪 Quality Gates & CI**

1. `verify:prompt` (hash provenance)
2. `hygiene` (lint + format + type)
3. `contract:check` (data schemas)
4. `bundle:report` (budget ≤220 KB route, 300 KB vendor)
5. `lighthouse:ci` (Perf ≥90, A11y ≥95)
6. Tests → Build → Preview Deploy

---

### **🔐 Security Requirements**

* Rate limit ≥60 req/min/route.
* Row-level security in Supabase.
* Tenant isolation (`tenant_id` on every row and JWT).
* PII classification (LOW/MED/HIGH); never log HIGH.
* `/api/user/data` and `/api/user/delete` endpoints for export/deletion.

---

### **📡 Helm Signals**

Emit standardized events:

```
Build.Hygiene.Started
Build.Hygiene.Completed
Prompt.Verify.Passed
Prompt.Verify.Failed
Deploy.Preview.Created
Deploy.Prod.Released
```

Each payload includes `{ prompt_version, prompt_hash, tenant_id }`.

---

### **🎯 Success Criteria**

* Zero build errors, type-safe, performant, accessible, secure.
* All ventures align to same version + hash.
* Any repo failing provenance or hygiene gates is blocked.

---

## 🧩 **SECTION B – PROMPT HASHING & PROVENANCE SYSTEM**

### **Intent**

Provide cryptographic certainty that:

* Every code change traces to a known prompt version.
* Helm is the single source of truth.
* Each venture verifies before deploy.

If direct file access is impossible, fallback = REST endpoint serving the same manifest.

---

### **Helm (Authoritative Registry)**

**Files**

```
helm/
  prompt-registry/
    PROMPT.md             # full v4.3 text (this file)
    manifest.json          # {version,hash,updated_at,source}
    export.local.json      # portable bundle for local sync
    tools/
      compute-hash.mjs
      publish-local.mjs
```

**compute-hash.mjs**

```js
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
const text = readFileSync(new URL('../PROMPT.md', import.meta.url), 'utf8')
const hash = createHash('sha256').update(text).digest('hex')
writeFileSync(new URL('../manifest.json', import.meta.url),
  JSON.stringify({ version:'4.3', hash, updated_at:new Date().toISOString(), source:'helm' },null,2))
console.log('Prompt hash:', hash)
```

**publish-local.mjs**

```js
import { readFileSync, writeFileSync } from 'fs'
const prompt = readFileSync(new URL('../PROMPT.md', import.meta.url),'utf8')
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url),'utf8'))
writeFileSync(new URL('../export.local.json', import.meta.url),
  JSON.stringify({ ...manifest, prompt }, null, 2))
console.log('Local prompt export written.')
```

**Helm Scripts**

```json
"scripts": {
  "prompt:hash": "node prompt-registry/tools/compute-hash.mjs",
  "prompt:publish": "node prompt-registry/tools/publish-local.mjs"
}
```

**Workflow**

1. Paste updated prompt into `PROMPT.md`.
2. Run `npm run prompt:hash` → generates hash.
3. Run `npm run prompt:publish` → outputs `export.local.json`.
4. Commit both files.

Later, Helm will expose:

```
GET /api/prompt → { version, hash, prompt }
```

---

### **PhotoVault (or Other Ventures) – Consumer**

**Files**

```
photovault/
  src/prompt/PROMPT.md
  src/prompt/manifest.json
  scripts/
    sync-prompt.mjs
    verify-prompt.mjs
```

**.env.example**

```
PROMPT_VERSION=4.3
PROMPT_HASH=<auto>
HELM_PROMPT_PATH=../helm/prompt-registry/export.local.json
```

**sync-prompt.mjs**

```js
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const source = process.env.HELM_PROMPT_PATH || '../helm/prompt-registry/export.local.json'
const data = JSON.parse(readFileSync(resolve(source), 'utf8'))

writeFileSync(resolve('src/prompt/PROMPT.md'), data.prompt)
writeFileSync(resolve('src/prompt/manifest.json'), JSON.stringify(data, null, 2))

let env = ''
try { env = readFileSync('.env.local','utf8') } catch {}
if (!env.includes('PROMPT_VERSION')) env += `\nPROMPT_VERSION=${data.version}\n`
if (!env.includes('PROMPT_HASH')) env += `PROMPT_HASH=${data.hash}\n`
writeFileSync('.env.local', env)
console.log('Prompt sync complete:', data.version, data.hash)
```

**verify-prompt.mjs**

```js
import { readFileSync } from 'fs'
import { createHash } from 'crypto'
import { resolve } from 'path'

const expected = process.env.PROMPT_HASH
const prompt = readFileSync(resolve('src/prompt/PROMPT.md'),'utf8')
const actual = createHash('sha256').update(prompt).digest('hex')

if (actual !== expected) {
  console.error('❌ Prompt hash mismatch'); process.exit(2)
}
console.log('✅ Prompt verified', expected)
```

**PhotoVault Scripts**

```json
"scripts": {
  "prompt:sync": "node scripts/sync-prompt.mjs",
  "prompt:verify": "node scripts/verify-prompt.mjs",
  "ci:gate": "npm run hygiene && npm run prompt:verify && npm run type-check"
}
```

**CI Behavior**

* `prompt:sync` before build → pulls latest from Helm.
* `prompt:verify` runs in CI → fails on mismatch.

---

### **Future State (Automated Helm API)**

When Helm launches:

* Replace local path with `HELM_PROMPT_URL`.
* `sync-prompt.mjs` fetches JSON from `/api/prompt`.
* CI gates remain identical.

---

### **Provenance Flow**

| Action        | System      | Output                                        |
| :------------ | :---------- | :-------------------------------------------- |
| Update Prompt | Helm        | PROMPT.md + manifest.json + export.local.json |
| Sync          | PhotoVault  | copies prompt + updates `.env.local`          |
| Verify        | CI          | compares hash; fails on mismatch              |
| Deploy        | Any venture | includes prompt version/hash in Helm Signals  |

---

## 🧱 **SECTION C – Governance & Fallback Logic**

**If direct file linking fails:**
Use any accessible transport (Git submodule, REST endpoint, or static CDN file).
The manifest structure must stay:

```json
{ "version":"x.x", "hash":"<sha256>", "prompt":"<text>" }
```

**If hash libraries unavailable:**
Use any equivalent checksum (`shasum`, `openssl sha256`, or Bun crypto).
The enforcement logic (compare hash, block on mismatch) must remain.

**If Helm not yet online:**
Use `export.local.json` as the handshake bridge.
When online, switch the `.env` key to `HELM_PROMPT_URL`.

---

## 🧩 **System Function Summary**

1. **Helm** = central authority.

   * Holds `PROMPT.md`, computes hash, exports manifest.
   * Later exposes `/api/prompt`.
2. **Ventures (e.g., PhotoVault)** = consumers.

   * Sync from Helm, verify hash, enforce in CI.
3. **Hash mismatch** = deployment block.
4. **Helm Signals** log version/hash in analytics.
5. **Goal:** every line of code in every repo traces to a verified prompt.

---

## 🪄 **Philosophy**

This structure turns your **prompts into code contracts.**
They behave like legal documents in software form — immutable once hashed, versioned when amended.
When Helm's automation matures, these contracts propagate automatically through the ecosystem, creating verifiable lineage for every codebase.

---

**Last Updated:** October 2025
**Version:** 4.3
**Status:** Production-Ready (Hashed + Helm-Linked)
