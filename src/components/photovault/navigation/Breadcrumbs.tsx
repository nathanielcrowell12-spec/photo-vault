import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {showHome && (
        <>
          <Link
            href="/dashboard"
            className="text-muted-foreground dark:text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground dark:text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground dark:text-muted-foreground'
                }
              >
                {item.label}
              </span>
            )}

            {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        )
      })}
    </nav>
  )
}
