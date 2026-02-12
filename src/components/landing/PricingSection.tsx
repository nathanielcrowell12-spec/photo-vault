import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const platformFeatures = [
  'Unlimited gallery uploads',
  'Client portal and access management',
  'Automated billing and subscriptions',
  'Stripe direct deposit to your bank',
  'Desktop app for large uploads',
]

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-16 md:py-24 bg-secondary"
      aria-label="Pricing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Transparent pricing. No surprises.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Know exactly what you pay, what your clients pay, and what you earn.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-10 md:mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Your Platform Fee */}
          <div className="bg-card rounded-lg border-2 border-primary p-6 sm:p-8 relative">
            <div className="absolute -top-3 left-6">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                FREE during beta
              </span>
            </div>

            <h3 className="text-lg font-semibold text-foreground mt-2">
              Your Platform Fee
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-foreground line-through decoration-destructive decoration-2">
                $22
              </span>
              <span className="text-muted-foreground line-through decoration-destructive decoration-2">/month</span>
              <span className="text-xl sm:text-2xl font-bold text-primary ml-2">$0</span>
              <span className="text-sm text-muted-foreground">for 12 months</span>
            </div>

            <ul className="mt-6 space-y-3" role="list">
              {platformFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="mt-6 w-full min-h-[44px]">
              <Link href="/auth/signup">
                Join the Beta &mdash; Free for 12 Months
              </Link>
            </Button>
          </div>

          {/* Card 2: What Your Clients Pay */}
          <div className="bg-card rounded-lg border border-border p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">
              What Your Clients Pay
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-foreground">$8</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Or upfront packages:</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground" role="list">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground font-medium">$100 upfront</span>
                    <span>= 12 months included (you earn $50)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground font-medium">$50 upfront</span>
                    <span>= 6 months included (you earn $25)</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                After the included period, clients pay $8/month. You earn $4/month per client,
                deposited directly via Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Break-even Math */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Your cost</p>
                <p className="font-semibold text-foreground">$22/mo <span className="text-primary text-xs">(free during beta)</span></p>
              </div>
              <div>
                <p className="text-muted-foreground">Your earnings</p>
                <p className="font-semibold text-foreground">$4/client/month</p>
              </div>
              <div>
                <p className="text-muted-foreground">Break-even</p>
                <p className="font-semibold text-foreground">6 paying clients</p>
              </div>
              <div>
                <p className="text-muted-foreground">After that</p>
                <p className="font-semibold text-primary">It&apos;s profit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
