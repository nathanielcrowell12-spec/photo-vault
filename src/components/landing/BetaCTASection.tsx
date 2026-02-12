import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const betaBenefits = [
  '12 months free ($22/month waived)',
  'Direct access to the founder for feedback',
  'Priority feature requests',
  'Founding Photographer badge on your profile',
  'No credit card required to start',
]

interface BetaCTASectionProps {
  betaEmail: string
}

export function BetaCTASection({ betaEmail }: BetaCTASectionProps) {
  return (
    <section
      id="beta-program"
      className="py-16 md:py-24 bg-background"
      aria-label="Beta program"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Join the founding photographers.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            The beta is open to a small group of professional photographers.
            12 months free. Shape the product. Lock in your spot.
          </p>

          {/* Beta Benefits */}
          <ul className="mt-8 space-y-3 text-left inline-block" role="list">
            {betaBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm sm:text-base text-foreground">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-8">
            <Button asChild size="lg" className="min-h-[48px] text-base sm:text-lg px-8">
              <Link href="/auth/signup">Apply for the Beta</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Questions? Email{' '}
            <a
              href={`mailto:${betaEmail}`}
              className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {betaEmail}
            </a>{' '}
            directly.
          </p>
        </div>
      </div>
    </section>
  )
}
