/**
 * Single source of truth for the /resources cluster.
 *
 * Why this exists: the 2026-08-07 on-page crawl found that all 9 resource pages emit
 * `BreadcrumbList` JSON-LD whose middle item points at https://www.photovault.photo/resources,
 * which returned 404. Those comparison pages are the site's best-ranking asset, so they were
 * shipping broken structured data and a dead user-facing breadcrumb link.
 *
 * The registry drives the /resources hub AND the sitemap, so a page can only go missing from
 * both at once — and `resource-schema.test.ts` asserts the registry matches the filesystem in
 * both directions, so that cannot happen silently either.
 *
 * NOTE: the 9 pre-existing pages still inline their own breadcrumb literal. They are
 * deliberately not retrofitted (regression risk on the only pages that rank). The
 * drop-in test in resource-schema.test.ts keeps that retrofit mechanical whenever it happens.
 */

export const SITE_URL = 'https://www.photovault.photo'

export type ResourceGroup =
  | 'Compare Platforms'
  | 'Photo Storage'
  | 'For Photographers'
  | 'Guides'

export interface ResourceEntry {
  slug: string
  /** Short label for the hub card and the breadcrumb trail. Not the page's <title>. */
  name: string
  description: string
  group: ResourceGroup
}

export const RESOURCES: ResourceEntry[] = [
  {
    slug: 'photovault-vs-pixieset',
    name: 'PhotoVault vs Pixieset',
    description:
      'An honest comparison for photographers weighing Pixieset against PhotoVault — pricing, gallery expiry, and what each does better.',
    group: 'Compare Platforms',
  },
  {
    slug: 'photovault-vs-pictime',
    name: 'PhotoVault vs Pic-Time',
    description:
      'How PhotoVault and Pic-Time differ on client delivery, storage duration, and photographer earnings.',
    group: 'Compare Platforms',
  },
  {
    slug: 'photovault-vs-shootproof',
    name: 'PhotoVault vs ShootProof',
    description:
      'A side-by-side look at ShootProof and PhotoVault for photographers who deliver client galleries.',
    group: 'Compare Platforms',
  },
  {
    slug: 'google-photos-alternatives',
    name: 'Google Photos Alternatives',
    description:
      'The best Google Photos alternatives for people who want their professional photos kept permanently.',
    group: 'Photo Storage',
  },
  {
    slug: 'photo-storage-comparison',
    name: 'Photo Storage Comparison',
    description:
      'PhotoVault, Google Photos, iCloud and the rest compared on cost, capacity, and how long your photos actually survive.',
    group: 'Photo Storage',
  },
  {
    slug: 'photo-storage-guide',
    name: 'The State of Photo Storage',
    description:
      'A complete guide to where professional photos live in 2026, and why so many of them quietly disappear.',
    group: 'Photo Storage',
  },
  {
    slug: 'photographer-recurring-revenue',
    name: 'Recurring Revenue for Photographers',
    description:
      'How photographers build recurring income from galleries they have already delivered.',
    group: 'For Photographers',
  },
  {
    slug: 'wedding-guest-photo-sharing',
    name: 'Wedding Guest Photo Sharing',
    description:
      'How to collect photos from your wedding guests and share yours back — QR-code apps, shared albums, and galleries, with the trade-offs of each.',
    group: 'Guides',
  },
  {
    slug: 'photography-invoice-template',
    name: 'Photography Invoice Template',
    description:
      'A free, print-ready invoice template for photographers, plus what belongs on every line so you get paid on time.',
    group: 'For Photographers',
  },
  {
    slug: 'how-to-start-a-photography-business',
    name: 'How to Start a Photography Business',
    description:
      'Pricing, paperwork, first clients, and the running costs nobody warns you about.',
    group: 'For Photographers',
  },
  {
    slug: 'gallery-fatigue',
    name: 'Gallery Fatigue',
    description:
      'Five photographers, five platforms, five passwords. Why family photos end up scattered — and how to consolidate them.',
    group: 'Guides',
  },
  {
    slug: 'madison-photography-guide',
    name: 'Madison Photography Guide',
    description:
      '30 of the best photography locations in Madison, WI, with permit requirements and seasonal tips.',
    group: 'Guides',
  },
]

/** Order the hub renders groups in. */
export const RESOURCE_GROUP_ORDER: ResourceGroup[] = [
  'For Photographers',
  'Compare Platforms',
  'Photo Storage',
  'Guides',
]

export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbSchema {
  '@context': string
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

/**
 * Home > Resources > {name}
 *
 * Byte-compatible with the literal the 9 existing pages inline, so it is a provable
 * drop-in replacement for them (asserted in resource-schema.test.ts).
 */
export function buildResourceBreadcrumb(slug: string, name: string): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE_URL}/resources` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_URL}/resources/${slug}` },
    ],
  }
}

export function resourcesByGroup(): { group: ResourceGroup; items: ResourceEntry[] }[] {
  return RESOURCE_GROUP_ORDER.map((group) => ({
    group,
    items: RESOURCES.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0)
}
