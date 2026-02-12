import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IncomeCalculator } from './IncomeCalculator'

export function HeroSection() {
  return (
    <section id="main-content" className="py-12 sm:py-16 md:py-24 bg-background" aria-label="Hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left Column - Value Prop */}
          <div className="lg:py-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              Your past work should still be paying you.
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl">
              PhotoVault turns your completed photoshoots into monthly recurring revenue.
              Clients pay $8/month to keep their galleries. You earn $4/month per client,
              for as long as they subscribe.
            </p>
            <p className="mt-2 sm:mt-3 text-sm text-muted-foreground">
              No more one-and-done transactions. No more paying for storage that earns you nothing.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start gap-3">
              <Button asChild size="lg" className="min-h-[44px] text-base">
                <Link href="/auth/signup">
                  Join the Beta &mdash; It&apos;s Free for 12 Months
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Currently accepting founding photographers. No credit card required.
            </p>
          </div>

          {/* Right Column - Income Calculator */}
          <div className="lg:py-4">
            <IncomeCalculator />
          </div>
        </div>
      </div>
    </section>
  )
}
