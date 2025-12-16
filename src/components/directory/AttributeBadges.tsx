import { Badge } from '@/components/ui/badge'
import type { LocationAttribute } from '@/types/directory'

interface AttributeBadgesProps {
  attributes: LocationAttribute[]
  maxDisplay?: number
}

export function AttributeBadges({ attributes, maxDisplay = 3 }: AttributeBadgesProps) {
  if (!attributes || attributes.length === 0) return null

  const displayed = attributes.slice(0, maxDisplay)
  const remaining = attributes.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((attr) => (
        <Badge
          key={attr.id}
          variant="secondary"
          className="bg-secondary/50 text-foreground border-border text-xs"
        >
          {attr.value}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge
          variant="secondary"
          className="bg-secondary/50 text-muted-foreground border-border text-xs"
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  )
}
