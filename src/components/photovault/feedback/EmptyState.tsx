import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Icon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground dark:text-foreground mb-6">
            {description}
          </p>
          {actionLabel && (actionHref || onAction) && (
            <Button
              onClick={onAction}
              asChild={!!actionHref}
            >
              {actionHref ? (
                <a href={actionHref}>{actionLabel}</a>
              ) : (
                actionLabel
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
