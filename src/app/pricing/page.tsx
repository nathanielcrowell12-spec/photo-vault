import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  CheckCircle,
  DollarSign,
  HelpCircle,
  TrendingUp,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing | PhotoVault — $22/month for Photographers, Free During Beta',
  description:
    'PhotoVault pricing: $22/month for photographers (free 12 months during beta, rate locked forever). Clients pay $8/month or $100/year. Photographers earn 50% of every payment.',
  keywords:
    'PhotoVault pricing, photographer gallery platform cost, photo delivery pricing, passive income photography cost, PhotoVault vs Pixieset pricing',
  openGraph: {
    type: 'website',
    title: 'PhotoVault Pricing — $22/month, Free During Beta',
    description:
      'One flat price. No storage tiers. Photographers earn 50% of every client payment. Free for 12 months during beta.',
    url: 'https://www.photovault.photo/pricing',
    siteName: 'PhotoVault',
  },
  twitter: {
    card: 'summary',
    title: 'PhotoVault Pricing',
    description:
      '$22/month for photographers. Clients pay $8/month. You earn $4/month per client. Free during beta.',
  },
  alternates: {
    canonical: 'https://www.photovault.photo/pricing',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.photovault.photo' },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.photovault.photo/pricing' },
  ],
}

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'PhotoVault for Photographers',
  description:
    'Photo gallery delivery platform with passive income. Photographers pay $22/month and earn 50% of every client payment.',
  brand: { '@type': 'Brand', name: 'PhotoVault' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Photographer Platform Fee',
      price: '22',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      description: 'Monthly platform fee. Free for 12 months during beta. Rate locked forever for founding photographers.',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      name: 'Client Annual Plan',
      price: '100',
      priceCurrency: 'USD',
      description: '12-month gallery access. Photographer earns $50 commission.',
    },
    {
      '@type': 'Offer',
      name: 'Client Monthly Plan',
      price: '8',
      priceCurrency: 'USD',
      description: 'Monthly gallery access. Photographer earns $4/month commission.',
    },
  ],
}

const platformFeatures = [
  'Unlimited gallery uploads',
  'Unlimited clients',
  'Commission tracking and analytics',
  'Stripe Connect direct deposit',
  'Desktop app for large uploads',
  'Automated drip email campaigns',
  'PDF reporting',
  'Professional gallery presentation',
  'Family sharing for clients',
  'Orphan Protocol protection',
]

const pricingFaqs = [
  {
    q: 'What does the $22/month cover?',
    a: 'Everything. Unlimited galleries, unlimited clients, analytics, commission tracking, email campaigns, desktop app access, and professional support. No storage tiers, no per-gallery fees, no add-ons.',
  },
  {
    q: 'How does the beta offer work?',
    a: 'Founding photographers get 12 months free ($264 value) and the $22/month rate locked in forever — immune to any future price increases. No credit card required to start.',
  },
  {
    q: 'Who pays for client storage?',
    a: 'Clients pay for their own storage. This is the key difference from platforms like Pixieset where the photographer absorbs storage costs. On PhotoVault, more clients means more income — not higher costs.',
  },
  {
    q: 'When do I break even?',
    a: 'With 6 clients on the $8/month plan, you earn $24/month in commissions — covering your $22/month fee. Every client after that is profit. Most photographers shoot 30-50 sessions per year.',
  },
  {
    q: 'Are there any hidden fees?',
    a: 'No. PhotoVault covers Stripe processing fees on your commissions. The $22/month is the only cost. There are no per-gallery fees, no storage overage charges, and no percentage taken from your shoot fees.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'You stop paying $22/month and stop earning commissions. Your clients\' galleries remain accessible through the Orphan Protocol — because clients pay for their own storage, their photos are preserved even if you leave.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: pricingFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Pricing</span>
        </nav>

        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple Pricing. No Surprises.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One flat fee for photographers. Clients pay for their own storage. You earn 50% of
            every payment. The more clients you have, the more you earn — not the more you pay.
          </p>
        </header>

        {/* Pricing Cards */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photographer Card */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  FREE during beta
                </span>
              </div>
              <CardContent className="p-6 pt-8">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Your Platform Fee
                </h2>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-foreground line-through decoration-destructive decoration-2">
                    $22
                  </span>
                  <span className="text-muted-foreground line-through decoration-destructive decoration-2">/month</span>
                  <span className="text-3xl font-bold text-primary ml-2">$0</span>
                  <span className="text-sm text-muted-foreground">for 12 months</span>
                </div>
                <p className="text-xs font-medium text-primary mb-6">
                  Beta testers lock in $22/month forever — immune to future price increases.
                </p>

                <ul className="space-y-2 mb-6">
                  {platformFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full">
                  <Link href="/photographers/signup">
                    Join the Beta &mdash; Free for 12 Months
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Client Card */}
            <Card className="border border-border">
              <CardContent className="p-6 pt-8">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  What Your Clients Pay
                </h2>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold text-foreground">$8</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Or prepaid packages:</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-secondary/30 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">$100 upfront</p>
                          <p className="text-xs text-muted-foreground">12 months included</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">You earn $50</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-secondary/30 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">$50 upfront</p>
                          <p className="text-xs text-muted-foreground">6 months included</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">You earn $25</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-secondary/30 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">$8/month ongoing</p>
                          <p className="text-xs text-muted-foreground">After prepaid expires</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">You earn $4/mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Payment options are set by the photographer when delivering the gallery.
                  All payments processed through Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Break-even Math */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            The Math
          </h2>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-muted-foreground">Your cost</p>
                  <p className="font-semibold text-foreground">$22/mo</p>
                  <p className="text-xs text-primary">(free during beta)</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-muted-foreground">Per client</p>
                  <p className="font-semibold text-foreground">$4/month</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-muted-foreground">Break-even</p>
                  <p className="font-semibold text-foreground">6 clients</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-muted-foreground">After that</p>
                  <p className="font-semibold text-primary">It&apos;s profit</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">10 clients &times; $4/month</span>
                  <span className="font-medium text-foreground">$40/month ($480/year)</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">25 clients &times; $4/month</span>
                  <span className="font-medium text-foreground">$100/month ($1,200/year)</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">50 clients &times; $4/month</span>
                  <span className="font-medium text-foreground">$200/month ($2,400/year)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">50 clients &times; $100 upfront</span>
                  <span className="font-medium text-foreground">$2,500 in Year 1 commissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Pricing FAQ
          </h2>
          <div className="space-y-6">
            {pricingFaqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Start Free. Lock In Your Rate Forever.
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            No credit card required. 12 months free during beta. $22/month locked in forever after that.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers/signup">
                <Camera className="mr-2 h-5 w-5" />
                Join the Beta Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/features">See All Features</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
