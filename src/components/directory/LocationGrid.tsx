import { LocationCard } from './LocationCard'
import { LocationGridSkeleton } from './LocationSkeleton'
import type { LocationWithDetails } from '@/types/directory'
import { MapPin } from 'lucide-react'

interface LocationGridProps {
  locations: LocationWithDetails[]
  loading?: boolean
  emptyMessage?: string
}

export function LocationGrid({ locations, loading, emptyMessage = 'No locations found' }: LocationGridProps) {
  if (loading) {
    return <LocationGridSkeleton count={6} />
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="text-center py-16">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map((location) => (
        <LocationCard key={location.id} location={location} />
      ))}
    </div>
  )
}
