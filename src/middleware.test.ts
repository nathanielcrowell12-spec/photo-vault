import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// vi.mock factories are hoisted above imports, so anything they close over must be
// created with vi.hoisted. (The repo's stripe webhook test fails for exactly this
// reason — do not repeat that pattern here.)
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  }),
}))

vi.mock('./lib/rate-limit', () => ({ getRateLimiter: () => null }))

import { middleware } from './middleware'

const anonymous = () => mocks.getUser.mockResolvedValue({ data: { user: null } })
const get = (path: string) => new NextRequest(`https://www.photovault.photo${path}`)

beforeEach(() => {
  vi.clearAllMocks()
  anonymous()
})

describe('middleware — protected routes still redirect anonymous users', () => {
  // This is the most important block in this file. The point of the change is to stop
  // redirecting UNKNOWN routes; it must not weaken protection of real ones.
  const PROTECTED = [
    '/photographer/dashboard',
    '/photographer/galleries',
    '/photographers/analytics',
    '/photographers/settings',
    '/client/dashboard',
    '/client/billing',
    '/admin/dashboard',
    '/admin/analytics',
    '/dashboard',
    '/family/galleries',
    '/family/takeover',
  ]

  it.each(PROTECTED)('%s redirects anonymous users to /login', async (path) => {
    const res = await middleware(get(path))
    expect(res.status).toBe(307)
    const location = res.headers.get('location') || ''
    expect(location).toContain('/login')
    expect(location).toContain(`redirectTo=${encodeURIComponent(path)}`)
  })

  it('protected API routes return 401, not a redirect', async () => {
    const res = await middleware(get('/api/photographer/galleries'))
    expect(res.status).toBe(401)
  })
})

describe('middleware — public content must not redirect', () => {
  // /cancellation is a public policy page with its own canonical and metadata, but was
  // missing from publicRoutes, so it 302'd to /login. Google logged it under
  // "Page with redirect", and the resulting /login?redirectTo=/cancellation under
  // "Duplicate without user-selected canonical".
  const PUBLIC = [
    '/',
    '/cancellation',
    '/signout',
    '/pricing',
    '/features',
    '/faq',
    '/about',
    '/privacy',
    '/terms',
    '/photographers',
    '/photographers/signup',
    '/photographers/commission-details',
    '/resources',
    '/resources/photovault-vs-pixieset',
    '/directory',
    '/directory/madison/tenney-park',
    '/blog',
    '/blog/your-photos-arent-forever',
    '/gallery/abc123',
  ]

  it.each(PUBLIC)('%s is served without redirecting', async (path) => {
    const res = await middleware(get(path))
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(308)
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('middleware — unknown routes 404 instead of redirecting to /login', () => {
  // Googlebot is always anonymous. Before this change any URL Google discovered that did
  // not exist became a 302 to /login?redirectTo=<path>, producing BOTH a "Page with
  // redirect" entry and a duplicate /login?redirectTo= URL. /month is the real example
  // found in Search Console on 2026-08-08; no such route exists in the codebase.
  const UNKNOWN = ['/month', '/nonexistent', '/wp-admin', '/some/deep/garbage/path']

  it.each(UNKNOWN)('%s returns 404', async (path) => {
    const res = await middleware(get(path))
    expect(res.status).toBe(404)
    expect(res.headers.get('location')).toBeNull()
  })

  it('the pre-existing ghost page handler still 404s', async () => {
    const res = await middleware(get('/landing-page'))
    expect(res.status).toBe(404)
  })

  it('does not 404 a real protected route (it must still reach the auth check)', async () => {
    const res = await middleware(get('/photographer/dashboard'))
    expect(res.status).not.toBe(404)
  })
})

describe('middleware — desktop app and integration surfaces are untouched', () => {
  // CLAUDE.md: verify the desktop flow before changing auth/middleware.
  it('/auth/desktop-callback stays public', async () => {
    const res = await middleware(get('/auth/desktop-callback'))
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(404)
  })

  it('/api/v1/upload is not redirected', async () => {
    const res = await middleware(get('/api/v1/upload/prepare'))
    expect(res.headers.get('location')).toBeNull()
    expect(res.status).not.toBe(404)
  })

  it('/op/health is not turned into a 404', async () => {
    // Monitoring endpoint. Whether it should be publicly readable is a separate
    // question (raised with the user); it must at least not become a 404 here.
    const res = await middleware(get('/op/health'))
    expect(res.status).not.toBe(404)
  })

  it('/sitemap.xml and /robots.txt stay public', async () => {
    for (const p of ['/sitemap.xml', '/robots.txt']) {
      const res = await middleware(get(p))
      expect(res.status).not.toBe(307)
      expect(res.status).not.toBe(404)
    }
  })
})
