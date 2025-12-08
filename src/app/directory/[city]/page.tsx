import { createServerSupabaseClient } from '@/lib/supabase'
import { LocationFiltersAndGrid } from '@/components/directory/LocationFilters'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { LocationWithDetails } from '@/types/directory'

type CityPageProps = {
  params: Promise<{
    city: string
  }>
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return {
    title: `Photography Locations in ${cityName} | PhotoVault Directory`,
    description: `Discover ${cityName}'s best photography locations with permit info, insider tips, seasonal guides, and more. Find the perfect spot for your next shoot.`,
    openGraph: {
      title: `${cityName} Photography Locations`,
      description: `Find the perfect spot for your next shoot in ${cityName}`,
    },
  }
}

async function getLocationsByCity(citySlug: string): Promise<LocationWithDetails[]> {
  const supabase = createServerSupabaseClient()

  // Convert slug back to city name (e.g., "madison" -> "Madison")
  const cityName = citySlug.replace(/-/g, ' ')

  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_attributes (*),
      location_business_intelligence (*)
    `)
    .ilike('city', cityName)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data || []
}

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params
  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const locations = await getLocationsByCity(city)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/directory">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Directory
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Photography Locations in <span className="text-amber-400">{cityName}</span>
        </h1>
        <p className="text-slate-400 text-lg">
          {locations.length} curated locations with insider tips and permit information
        </p>
      </div>

      {/* Filters and Grid */}
      <LocationFiltersAndGrid locations={locations} city={cityName} />
    </div>
  )
}
