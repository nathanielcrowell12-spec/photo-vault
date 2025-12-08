import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LocationSkeleton() {
  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      <Skeleton className="h-48 w-full bg-slate-700" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 bg-slate-700" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-16 bg-slate-700 rounded-full" />
          <Skeleton className="h-5 w-20 bg-slate-700 rounded-full" />
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
