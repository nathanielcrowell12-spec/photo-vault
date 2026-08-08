import { describe, it, expect } from 'vitest'
import { GET } from './route'

// Regression test for a real production bug found 2026-08-08.
//
// The template originally lived at public/resources/photography-invoice-template.html.
// Vercel's cleanUrls behaviour 308-redirects EVERY public *.html to its extensionless
// path — verified live against /beta-signup.html, /pricing-page.html and others. That
// stripped path collided with the page route, so the "Open template" button served the
// page it was on and the download silently did nothing.
//
// Serving it from a route handler is immune to that URL rewriting.

describe('GET /resources/photography-invoice-template/download', () => {
  it('returns 200 with HTML content type', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('serves a usable invoice template, not the marketing page', async () => {
    const body = await (await GET()).text()
    expect(body).toContain('<!doctype html>')
    expect(body).toContain('INVOICE')
    // The fillable placeholders are the point of the asset.
    expect(body).toContain('[Your Business Name]')
    expect(body).toContain('[Client Name]')
    expect(body).toContain('Balance due')
    // Must NOT be the marketing page that links to it.
    expect(body).not.toContain('Free Photography Invoice Template | PhotoVault')
  })

  it('carries the not-legal-advice note', async () => {
    const body = await (await GET()).text()
    expect(body).toMatch(/not legal or tax advice/i)
  })

  it('is printable standalone — hides the helper UI when printed', async () => {
    const body = await (await GET()).text()
    expect(body).toContain('@media print')
  })
})
