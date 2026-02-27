import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react'

export function PhotoVaultCTA() {
  return (
    <div className="rounded-xl bg-foreground/5 border border-border p-6 md:p-8 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <div className="rounded-full bg-amber-500/20 p-3 shrink-0">
          <Camera className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Earn passive income from every shoot here
          </h3>
          <p className="text-sm text-muted-foreground">
            PhotoVault photographers earn $4/month per client gallery — every client you deliver to becomes recurring revenue.
          </p>
        </div>
        <Link href="/photographers/signup">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
            Start Free
          </Button>
        </Link>
      </div>
    </div>
  )
}
