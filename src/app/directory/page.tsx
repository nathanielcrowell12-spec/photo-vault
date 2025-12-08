import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { LocationGrid } from '@/components/directory/LocationGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Camera, ChevronRight, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import type { LocationWithDetails } from '@/types/directory'

export const metadata: Metadata = {
  title: 'Photo Location Directory | PhotoVault',
  description: 'Discover the best photography locations with insider tips, permit information, and seasonal guides. Find your perfect shoot location.',
}

async function getFeaturedLocations(): Promise<LocationWithDetails[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_attributes (*),
      location_business_intelligence (*)
    `)
    .limit(6)

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data || []
}

async function getCities(): Promise<{ city: string; state: string; count: number }[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('locations')
    .select('city, state')

  if (error) {
    console.error('Error fetching cities:', error)
    return []
  }

  // Group by city and count
  const cityMap = new Map<string, { city: string; state: string; count: number }>()
  data?.forEach((loc) => {
    const key = `${loc.city}-${loc.state}`
    if (cityMap.has(key)) {
      cityMap.get(key)!.count++
    } else {
      cityMap.set(key, { city: loc.city, state: loc.state, count: 1 })
    }
  })

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count)
}

export default async function DirectoryPage() {
  const [featuredLocations, cities] = await Promise.all([
    getFeaturedLocations(),
    getCities(),
  ])

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Wisconsin&apos;s Premier Photo Location Guide
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Find Your Perfect <span className="text-amber-400">Shoot Location</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Curated photography locations with insider tips, permit information, seasonal guides, and everything you need to plan the perfect shoot.
        </p>
      </div>

      {/* Cities Grid */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Browse by City</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map((cityData) => (
            <Link
              key={`${cityData.city}-${cityData.state}`}
              href={`/directory/${cityData.city.toLowerCase().replace(/ /g, '-')}`}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium group-hover:text-amber-400 transition-colors">
                      {cityData.city}
                    </h3>
                    <p className="text-slate-500 text-sm">{cityData.count} locations</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Locations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Featured Locations</h2>
          <Link href="/directory/madison">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <LocationGrid locations={featuredLocations} />
      </section>

      {/* CTA Section */}
      <section className="mt-20 text-center">
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="py-12">
            <Camera className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Are you a photographer?</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Join PhotoVault to connect with clients and grow your business.
            </p>
            <Link href="/photographers/signup">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Join as a Photographer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
