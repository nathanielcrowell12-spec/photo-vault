import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getAllPosts } from '@/lib/blog'

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
    {
      url: `${baseUrl}/cancellation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
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

  // Fetch all locations from database
  const { data: locations, error } = await supabase
    .from('locations')
    .select('city, slug, updated_at')
    .order('city')

  if (error) {
    console.error('Sitemap: Failed to fetch locations', error)
    return staticPages
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

  // Blog pages
  const posts = await getAllPosts()
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
  const blogPages: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedDate || post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...resourcePages, ...conversionPages, ...blogIndex, ...blogPages, ...cityPages, ...locationPages]
}
