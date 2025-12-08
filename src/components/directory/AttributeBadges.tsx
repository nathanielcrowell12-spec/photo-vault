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
          className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs"
        >
          {attr.value}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge
          variant="secondary"
          className="bg-slate-700/50 text-slate-400 border-slate-600 text-xs"
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  )
}
