import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { PermitBadge } from './PermitBadge'
import { AttributeBadges } from './AttributeBadges'
import type { LocationWithDetails } from '@/types/directory'

interface LocationCardProps {
  location: LocationWithDetails
}

export function LocationCard({ location }: LocationCardProps) {
  const citySlug = location.city.toLowerCase().replace(/ /g, '-')
  const permitStatus = location.location_business_intelligence?.permit_status

  return (
    <Link href={`/directory/${citySlug}/${location.slug}`}>
      <Card className="bg-card/50 border-border hover:border-border transition-all duration-300 overflow-hidden group cursor-pointer h-full">
        <div className="relative h-48 overflow-hidden">
          {location.cover_image_url ? (
            <Image
              src={location.cover_image_url}
              alt={`Photo of ${location.name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-card flex items-center justify-center">
              <MapPin className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {permitStatus && (
            <div className="absolute top-3 right-3">
              <PermitBadge status={permitStatus} />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-amber-400 transition-colors line-clamp-1">
            {location.name}
          </h3>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {location.city}, {location.state}
          </p>
          {location.description && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {location.description}
            </p>
          )}
          {location.location_attributes && location.location_attributes.length > 0 && (
            <div className="mt-3">
              <AttributeBadges attributes={location.location_attributes} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
