import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getAllPosts } from '@/lib/blog'
import { logger } from '@/lib/logger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.photovault.photo'
  const supabase = createServiceRoleClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/photographers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/directory/photographers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // NOTE: /cancellation is deliberately NOT listed. It is auth-gated and 302s to
    // /login?redirectTo=%2Fcancellation. A sitemap must not advertise auth-gated URLs.
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Resource pages (GEO content for AI search)
  const resourcePages: MetadataRoute.Sitemap = [
    {
      // The hub. Every resource page's BreadcrumbList points here.
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photo-storage-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photo-storage-comparison`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/google-photos-alternatives`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photovault-vs-pixieset`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photovault-vs-pictime`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photovault-vs-shootproof`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/gallery-fatigue`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photographer-recurring-revenue`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/madison-photography-guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/wedding-guest-photo-sharing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/photography-invoice-template`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/how-to-start-a-photography-business`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Conversion pages
  const conversionPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/photographers/signup`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Fetch all locations from database.
  //
  // This block degrades to an empty array on failure rather than returning early. The
  // previous `return staticPages` silently dropped EVERY resource, conversion and blog
  // URL — all of them hand-written pages that do not depend on this query at all — the
  // moment Supabase hiccuped. Each DB-dependent block now fails independently.
  let locations: { city: string; slug: string; updated_at: string | null }[] = []
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('city, slug, updated_at')
      .order('city')

    if (error) throw error
    locations = data || []
  } catch (err) {
    logger.error('Sitemap: failed to fetch locations; omitting directory URLs', { error: err })
    locations = []
  }

  // Build unique city pages
  const citySlugs = new Set<string>()
  const cityPages: MetadataRoute.Sitemap = []

  locations?.forEach(loc => {
    const citySlug = loc.city.toLowerCase().replace(/ /g, '-')
    if (!citySlugs.has(citySlug)) {
      citySlugs.add(citySlug)
      cityPages.push({
        url: `${baseUrl}/directory/${citySlug}`,
        lastModified: new Date(loc.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  })

  // Build individual location pages (highest priority for long-tail SEO)
  const locationPages: MetadataRoute.Sitemap = locations?.map(loc => ({
    url: `${baseUrl}/directory/${loc.city.toLowerCase().replace(/ /g, '-')}/${loc.slug}`,
    lastModified: new Date(loc.updated_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.8, // High priority - these are our long-tail SEO targets
  })) || []

  // Blog pages. Also DB-backed, so it gets its own guard — an outage here must not take
  // the hand-written pages down with it.
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await getAllPosts()
    blogPages = posts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedDate || post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    logger.error('Sitemap: failed to fetch blog posts; omitting blog post URLs', { error: err })
    blogPages = []
  }

  return [...staticPages, ...resourcePages, ...conversionPages, ...blogIndex, ...blogPages, ...cityPages, ...locationPages]
}
