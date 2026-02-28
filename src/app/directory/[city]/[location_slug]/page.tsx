import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PermitBadge } from '@/components/directory/PermitBadge'
import { AttributeBadges } from '@/components/directory/AttributeBadges'
import { QuickStatsBar } from '@/components/directory/QuickStatsBar'
import { PermitCard, RulesCard, SeasonalGrid, InsiderTipsCard } from '@/components/directory/IntelCards'
import { NearbyLocations } from '@/components/directory/NearbyLocations'
import { PhotoVaultCTA } from '@/components/directory/PhotoVaultCTA'
import {
  ChevronLeft,
  MapPin,
} from 'lucide-react'
import type { Metadata } from 'next'
import type { LocationWithDetails } from '@/types/directory'

type LocationPageProps = {
  params: Promise<{
    city: string
    location_slug: string
  }>
}

export async function generateStaticParams() {
  const supabase = createServerSupabaseClient()
  const { data: locations } = await supabase.from('locations').select('city, slug')

  return (
    locations?.map((location) => ({
      city: location.city.toLowerCase().replace(/ /g, '-'),
      location_slug: location.slug,
    })) || []
  )
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { location_slug } = await params
  const supabase = createServerSupabaseClient()
  const { data: location } = await supabase
    .from('locations')
    .select('name, city, description')
    .eq('slug', location_slug)
    .single()

  if (!location) {
    return { title: 'Location Not Found | PhotoVault Directory' }
  }

  const citySlug = location.city.toLowerCase().replace(/ /g, '-')

  return {
    title: `${location.name} - Photography Location in ${location.city} | PhotoVault Directory`,
    description: location.description || `Photography location guide for ${location.name} in ${location.city}. Get permit info, insider tips, and more.`,
    openGraph: {
      type: 'website',
      title: `${location.name} - ${location.city} Photography Location`,
      description: location.description || `Find everything you need to shoot at ${location.name}`,
      url: `https://www.photovault.photo/directory/${citySlug}/${location_slug}`,
      siteName: 'PhotoVault',
    },
    alternates: {
      canonical: `https://www.photovault.photo/directory/${citySlug}/${location_slug}`,
    },
  }
}

async function getLocation(slug: string): Promise<(LocationWithDetails & { _nearbyLocations?: any[] }) | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_attributes (*),
      location_business_intelligence (*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching location:', error)
    return null
  }

  // Fetch nearby locations if slugs exist
  const nearbySlugs = data.location_business_intelligence?.nearby_location_slugs
  let nearbyLocations: any[] = []

  if (nearbySlugs && nearbySlugs.length > 0) {
    const { data: nearby } = await supabase
      .from('locations')
      .select('name, slug, city, state, location_business_intelligence(permit_status)')
      .in('slug', nearbySlugs)

    if (nearby) {
      nearbyLocations = nearby.map((loc: any) => ({
        name: loc.name,
        slug: loc.slug,
        city: loc.city,
        state: loc.state,
        permit_status: loc.location_business_intelligence?.permit_status ?? null,
      }))
    }
  }

  return { ...data, _nearbyLocations: nearbyLocations }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { city, location_slug } = await params
  const location = await getLocation(location_slug)

  if (!location) {
    notFound()
  }

  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const intel = location.location_business_intelligence

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        name: location.name,
        description: location.description || `Photography location in ${location.city}, ${location.state}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: location.city,
          addressRegion: location.state,
          addressCountry: 'US',
        },
        ...(location.cover_image_url ? { image: location.cover_image_url } : {}),
        url: `https://www.photovault.photo/directory/${city}/${location_slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Directory',
            item: 'https://www.photovault.photo/directory',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: cityName,
            item: `https://www.photovault.photo/directory/${city}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: location.name,
            item: `https://www.photovault.photo/directory/${city}/${location_slug}`,
          },
        ],
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/directory" className="hover:text-foreground transition-colors">
            Directory
          </Link>
          <span>/</span>
          <Link href={`/directory/${city}`} className="hover:text-foreground transition-colors">
            {cityName}
          </Link>
          <span>/</span>
          <span className="text-foreground">{location.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              {location.city}, {location.state}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {location.name}
            </h1>
          </div>
          {intel?.permit_status && (
            <PermitBadge status={intel.permit_status} />
          )}
        </div>

        {location.description && (
          <p className="text-foreground text-lg leading-relaxed max-w-3xl mb-4">
            {location.description}
          </p>
        )}

        {location.location_attributes && location.location_attributes.length > 0 && (
          <AttributeBadges attributes={location.location_attributes} maxDisplay={10} highlight />
        )}
      </div>

      {/* Quick Stats Bar */}
      <QuickStatsBar intel={intel} />

      {/* Cover Image */}
      {location.cover_image_url && (
        <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
          <Image
            src={location.cover_image_url}
            alt={location.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* PhotoVault CTA */}
      <PhotoVaultCTA />

      {/* Intel Cards Grid */}
      {intel && (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <PermitCard intel={intel} />
          <RulesCard intel={intel} />
          <SeasonalGrid intel={intel} />
          <InsiderTipsCard intel={intel} />

          {/* Nearby Locations */}
          {location._nearbyLocations && location._nearbyLocations.length > 0 && (
            <NearbyLocations
              locations={location._nearbyLocations}
              citySlug={city}
            />
          )}
        </div>
      )}

      {/* Bottom Section */}
      <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href={`/directory/${city}`}>
          <Button variant="outline" className="border-border text-foreground hover:bg-card">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to {cityName} Locations
          </Button>
        </Link>

        <div className="text-xs text-muted-foreground space-y-1 text-right">
          {intel?.last_verified_at && (
            <p>
              Last verified: {new Date(intel.last_verified_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
          <p>
            See an error?{' '}
            <a
              href="mailto:support@photovault.photo?subject=Directory%20Correction"
              className="text-amber-500 hover:underline"
            >
              Report it
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
