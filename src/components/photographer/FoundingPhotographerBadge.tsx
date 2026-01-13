import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FoundingPhotographerBadgeProps {
  isBetaTester: boolean
  className?: string
}

/**
 * Badge component for founding/beta photographers.
 * Only renders if isBetaTester is true.
 */
export function FoundingPhotographerBadge({
  isBetaTester,
  className,
}: FoundingPhotographerBadgeProps) {
  if (!isBetaTester) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-amber-50 text-amber-700 border-amber-300',
        'dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
        className
      )}
    >
      <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
      Founding Photographer
    </Badge>
  )
}
