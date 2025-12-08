import { Badge } from '@/components/ui/badge'

interface PermitBadgeProps {
  status: string | null
}

export function PermitBadge({ status }: PermitBadgeProps) {
  if (!status) return null

  const variants: Record<string, string> = {
    'Yes': 'bg-green-500/20 text-green-400 border-green-500/30',
    'No': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Varies': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  const labels: Record<string, string> = {
    'Yes': 'Permit Free',
    'No': 'Permit Required',
    'Varies': 'Permit Varies',
  }

  return (
    <Badge
      variant="outline"
      className={variants[status] || variants['Varies']}
    >
      {labels[status] || status}
    </Badge>
  )
}
