import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LocationSkeleton() {
  return (
    <Card className="bg-card/50 border-border overflow-hidden">
      <Skeleton className="h-48 w-full bg-secondary" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-secondary" />
        <Skeleton className="h-4 w-1/2 bg-secondary" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-16 bg-secondary rounded-full" />
          <Skeleton className="h-5 w-20 bg-secondary rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function LocationGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LocationSkeleton key={i} />
      ))}
    </div>
  )
}
