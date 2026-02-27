import { Badge } from '@/components/ui/badge'
import type { LocationAttribute } from '@/types/directory'

interface AttributeBadgesProps {
  attributes: LocationAttribute[]
  maxDisplay?: number
  highlight?: boolean
}

export function AttributeBadges({ attributes, maxDisplay = 3, highlight = false }: AttributeBadgesProps) {
  if (!attributes || attributes.length === 0) return null

  const displayed = attributes.slice(0, maxDisplay)
  const remaining = attributes.length - maxDisplay

  const badgeClass = highlight
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs'
    : 'bg-secondary/50 text-foreground border-border text-xs'

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((attr) => (
        <Badge
          key={attr.id}
          variant="secondary"
          className={badgeClass}
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
