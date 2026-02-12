import { XCircle, CheckCircle } from 'lucide-react'

const oldWay = [
  'You pay $20-$60/month for hosting',
  'Galleries expire when you cancel',
  'More clients = higher bill',
  'Income ends after delivery',
  'You are tech support for your clients',
]

const photovaultWay = [
  'Clients pay for their own storage',
  'Galleries stay forever (even if you leave)',
  'More clients = more income for you',
  'Passive revenue from past work',
  'We handle billing, support, and access',
]

export function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 bg-background" aria-label="Comparison">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            You&apos;re paying for storage. Your clients should be.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Most gallery platforms charge you more as you grow. We flipped the model.
          </p>
        </div>

        {/* Comparison Card */}
        <div className="mt-10 md:mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
            {/* Old Way */}
            <div className="bg-card rounded-lg md:rounded-r-none border border-border p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                The Old Way
              </h3>
              <ul className="space-y-3" role="list">
                {oldWay.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PhotoVault Way */}
            <div className="bg-primary/5 rounded-lg md:rounded-l-none border border-primary/20 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                The PhotoVault Way
              </h3>
              <ul className="space-y-3" role="list">
                {photovaultWay.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
