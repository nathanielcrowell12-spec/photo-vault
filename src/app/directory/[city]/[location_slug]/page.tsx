import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PermitBadge } from '@/components/directory/PermitBadge'
import { AttributeBadges } from '@/components/directory/AttributeBadges'
import {
  ChevronLeft,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Calendar,
  FileText,
  ExternalLink,
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

  return {
    title: `${location.name} - Photography Location in ${location.city} | PhotoVault Directory`,
    description: location.description || `Photography location guide for ${location.name} in ${location.city}. Get permit info, insider tips, and more.`,
    openGraph: {
      title: `${location.name} - ${location.city} Photography Location`,
      description: location.description || `Find everything you need to shoot at ${location.name}`,
    },
  }
}

async function getLocation(slug: string): Promise<LocationWithDetails | null> {
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

  return data
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { city, location_slug } = await params
  const location = await getLocation(location_slug)

  if (!location) {
    notFound()
  }

  const cityName = city.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const intel = location.location_business_intelligence

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/directory" className="hover:text-white transition-colors">
            Directory
          </Link>
          <span>/</span>
          <Link href={`/directory/${city}`} className="hover:text-white transition-colors">
            {cityName}
          </Link>
          <span>/</span>
          <span className="text-white">{location.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {location.name}
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {location.city}, {location.state}
            </p>
          </div>
          {intel?.permit_status && (
            <PermitBadge status={intel.permit_status} />
          )}
        </div>

        {location.description && (
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
            {location.description}
          </p>
        )}

        {location.location_attributes && location.location_attributes.length > 0 && (
          <div className="mt-4">
            <AttributeBadges attributes={location.location_attributes} maxDisplay={10} />
          </div>
        )}
      </div>

      {/* Cover Image */}
      {location.cover_image_url && (
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-10">
          <Image
            src={location.cover_image_url}
            alt={location.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Business Intelligence Cards */}
      {intel && (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Permit Information */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Permit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Badge variant="outline" className="text-xs">Status</Badge>
                </div>
                <p className="text-white">
                  {intel.permit_status === 'Yes' && 'No permit required for small sessions'}
                  {intel.permit_status === 'No' && 'Permit required'}
                  {intel.permit_status === 'Varies' && 'Permit requirements vary - see details'}
                </p>
              </div>

              {intel.permit_cost && (
                <div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Cost
                  </div>
                  <p className="text-white">{intel.permit_cost}</p>
                </div>
              )}

              {intel.permit_details && (
                <div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Details
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{intel.permit_details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules & Restrictions */}
          {intel.rules_and_restrictions && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Rules & Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{intel.rules_and_restrictions}</p>
              </CardContent>
            </Card>
          )}

          {/* Seasonal Availability */}
          {intel.seasonal_availability && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Best Times to Shoot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{intel.seasonal_availability}</p>
              </CardContent>
            </Card>
          )}

          {/* Insider Tips */}
          {intel.insider_tips && (
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Insider Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-200 leading-relaxed">{intel.insider_tips}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-10">
        <Link href={`/directory/${city}`}>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to {cityName} Locations
          </Button>
        </Link>
      </div>
    </div>
  )
}
