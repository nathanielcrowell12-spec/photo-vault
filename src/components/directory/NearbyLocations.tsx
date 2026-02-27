import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowRight } from 'lucide-react'
import { PermitBadge } from './PermitBadge'

interface NearbyLocationItem {
  name: string
  slug: string
  city: string
  state: string
  permit_status?: string | null
}

interface NearbyLocationsProps {
  locations: NearbyLocationItem[]
  citySlug: string
}

export function NearbyLocations({ locations, citySlug }: NearbyLocationsProps) {
  if (!locations || locations.length === 0) return null

  return (
    <Card className="border-border bg-card md:col-span-2">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-500" />
          Nearby Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <Link
              key={loc.slug}
              href={`/directory/${citySlug}/${loc.slug}`}
              className="group rounded-lg border border-border bg-background p-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-500 transition-colors">
                  {loc.name}
                </h3>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {loc.city}, {loc.state}
                </p>
                {loc.permit_status && (
                  <PermitBadge status={loc.permit_status} />
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
