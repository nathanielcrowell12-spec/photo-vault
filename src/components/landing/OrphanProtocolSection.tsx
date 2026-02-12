import { ShieldCheck } from 'lucide-react'

export function OrphanProtocolSection() {
  return (
    <section className="py-16 md:py-24 bg-background" aria-label="Orphan Protocol">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-6">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            What happens to photos when a photographer quits?
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            On every other platform, they disappear. Not here.
          </p>

          <div className="mt-8 text-left bg-card rounded-lg border border-border p-6 sm:p-8">
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              PhotoVault&apos;s Orphan Protocol ensures that if a photographer cancels
              their account, retires, or passes away, their clients&apos; photos remain
              safe and accessible.
            </p>
            <p className="mt-4 text-sm sm:text-base font-medium text-foreground">
              No other gallery platform offers this guarantee.
            </p>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Your clients&apos; memories are protected. Period.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
