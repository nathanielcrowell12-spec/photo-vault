import { Badge } from '@/components/ui/badge'

type StatusType = 'active' | 'inactive' | 'pending' | 'expired' | 'paid' | 'unpaid'

interface StatusBadgeProps {
  status: StatusType
  label?: string
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig: Record<StatusType, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200'
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-muted text-foreground dark:bg-card dark:text-foreground'
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
    },
    expired: {
      label: 'Expired',
      className: 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
    },
    paid: {
      label: 'Paid',
      className: 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200'
    },
    unpaid: {
      label: 'Unpaid',
      className: 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={config.className}>
      {label || config.label}
    </Badge>
  )
}
