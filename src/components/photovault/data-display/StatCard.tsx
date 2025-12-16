import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'blue'
}: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-600',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      icon: 'text-purple-600',
      text: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      icon: 'text-orange-600',
      text: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      icon: 'text-red-600',
      text: 'text-red-600'
    }
  }

  const colors = colorClasses[color]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
              {label}
            </p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {value}
            </p>
          </div>
          <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
