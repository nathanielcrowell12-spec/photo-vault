import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { RESOURCES, buildResourceBreadcrumb, SITE_URL } from '@/lib/resource-schema'

const RESOURCES_DIR = path.join(process.cwd(), 'src', 'app', 'resources')

describe('buildResourceBreadcrumb', () => {
  it('is a drop-in for the literal the 9 existing pages already emit', () => {
    // Copied from src/app/resources/gallery-fatigue/page.tsx. If the helper does not
    // produce this exactly, retrofitting the existing pages later would silently change
    // their structured data.
    const expected = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.photovault.photo',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Resources',
          item: 'https://www.photovault.photo/resources',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Gallery Fatigue',
          item: 'https://www.photovault.photo/resources/gallery-fatigue',
        },
      ],
    }
    expect(buildResourceBreadcrumb('gallery-fatigue', 'Gallery Fatigue')).toEqual(expected)
  })

  it('serialises to valid JSON-LD', () => {
    const json = JSON.stringify(buildResourceBreadcrumb('photo-storage-guide', 'Photo Storage'))
    expect(() => JSON.parse(json)).not.toThrow()
    expect(JSON.parse(json)['@type']).toBe('BreadcrumbList')
  })

  it('uses the www canonical host, matching every existing page', () => {
    const crumb = buildResourceBreadcrumb('x', 'X')
    for (const item of crumb.itemListElement) {
      expect(item.item.startsWith('https://www.photovault.photo')).toBe(true)
    }
    expect(SITE_URL).toBe('https://www.photovault.photo')
  })
})

describe('RESOURCES registry', () => {
  it('every entry has a non-empty slug, name, description and group', () => {
    expect(RESOURCES.length).toBeGreaterThan(0)
    for (const r of RESOURCES) {
      expect(r.slug, `slug for ${JSON.stringify(r)}`).toBeTruthy()
      expect(r.name, `name for ${r.slug}`).toBeTruthy()
      expect(r.description, `description for ${r.slug}`).toBeTruthy()
      expect(r.group, `group for ${r.slug}`).toBeTruthy()
    }
  })

  it('has no duplicate slugs', () => {
    const slugs = RESOURCES.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('uses url-safe slugs', () => {
    for (const r of RESOURCES) {
      expect(r.slug, `slug ${r.slug}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })

  // --- Registry <-> filesystem consistency (RISK 5) -------------------------
  // Catches both directions of drift: a registered page that does not exist, and a
  // page on disk nobody registered (so it is missing from the hub AND the sitemap).

  it('every registered slug has a real page on disk', () => {
    for (const r of RESOURCES) {
      const pagePath = path.join(RESOURCES_DIR, r.slug, 'page.tsx')
      expect(fs.existsSync(pagePath), `missing page for registered slug: ${r.slug}`).toBe(true)
    }
  })

  it('every resource page on disk is registered', () => {
    const onDisk = fs
      .readdirSync(RESOURCES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .filter((d) => fs.existsSync(path.join(RESOURCES_DIR, d.name, 'page.tsx')))
      .map((d) => d.name)

    const registered = new Set(RESOURCES.map((r) => r.slug))
    const unregistered = onDisk.filter((slug) => !registered.has(slug))
    expect(unregistered, `resource pages missing from RESOURCES: ${unregistered.join(', ')}`).toEqual(
      []
    )
  })
})
