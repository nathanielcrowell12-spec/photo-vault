import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  Upload,
  DollarSign,
  Shield,
  Users,
  Smartphone,
  BarChart3,
  Mail,
  Monitor,
  RefreshCw,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features | PhotoVault — Gallery Delivery + Passive Income for Photographers',
  description:
    'PhotoVault features: gallery delivery, client subscriptions, 50% commission, desktop uploads, Stripe payouts, analytics, family sharing, and the Orphan Protocol. Everything photographers need to earn from past work.',
  keywords:
    'PhotoVault features, photographer gallery delivery, passive income photography, photo gallery platform features, client subscription gallery, Stripe photographer payouts',
  openGraph: {
    type: 'website',
    title: 'PhotoVault Features — Gallery Delivery + Passive Income',
    description:
      'Gallery delivery, client subscriptions, 50% commission, desktop uploads, analytics, and more. See every feature.',
    url: 'https://www.photovault.photo/features',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://www.photovault.photo/images/og-landing.webp',
        width: 1200,
        height: 630,
        alt: 'PhotoVault Features — Gallery Delivery + Passive Income',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.photovault.photo/images/og-landing.webp'],
    title: 'PhotoVault Features',
    description:
      'Gallery delivery, passive income, desktop uploads, analytics. Everything photographers need.',
  },
  alternates: {
    canonical: 'https://www.photovault.photo/features',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.photovault.photo' },
    { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://www.photovault.photo/features' },
  ],
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PhotoVault',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Windows, macOS',
  description:
    'Photo gallery delivery platform that turns completed photoshoots into passive income for photographers. Clients pay for permanent access, photographers earn 50% commission.',
  offers: {
    '@type': 'Offer',
    price: '22',
    priceCurrency: 'USD',
    priceValidUntil: '2027-12-31',
    description: 'Monthly platform fee. Free for 12 months during beta.',
  },
  featureList: [
    'Unlimited gallery uploads',
    'Client subscription management',
    '50% commission on all client payments',
    'Stripe Connect direct deposit',
    'Desktop app for large uploads',
    'Family sharing and secondary accounts',
    'Commission analytics and reporting',
    'Automated drip email campaigns',
    'Orphan Protocol photo protection',
  ],
}

const photographerFeatures = [
  {
    icon: Upload,
    title: 'Gallery Upload and Delivery',
    description:
      'Upload edited photos through the web dashboard or the desktop app. Send a delivery email with one click. Your client receives a link, creates their account, and pays — their profile is created automatically.',
  },
  {
    icon: DollarSign,
    title: '50% Commission on Every Payment',
    description:
      'You earn half of whatever your client pays. $50 on a $100 annual plan. $25 on a $50 six-month plan. $4/month on recurring. Stripe deposits directly to your bank — no invoicing, no chasing payments.',
  },
  {
    icon: Monitor,
    title: 'Desktop App for Large Uploads',
    description:
      'The PhotoVault desktop app handles galleries with 500+ photos or RAW files. Chunked uploads with no browser file size limits. Keep working while it uploads in the background.',
  },
  {
    icon: BarChart3,
    title: 'Commission Analytics and Reporting',
    description:
      'Track your earnings in real time. See which clients are active, which payments are coming, and how your passive income is growing month over month. Export PDF reports.',
  },
  {
    icon: Mail,
    title: 'Automated Email Campaigns',
    description:
      'Post-signup drip emails nurture your clients automatically — Stripe connection reminders, gallery upload nudges, passive income math, and founder check-ins. You stay top-of-mind without extra work.',
  },
  {
    icon: RefreshCw,
    title: 'Automatic Billing and Renewals',
    description:
      'When prepaid plans expire, monthly billing starts automatically. Clients pay $8/month and you earn $4/month — passive income from work you already completed. No manual follow-up.',
  },
]

const clientFeatures = [
  {
    icon: Smartphone,
    title: 'Access From Any Device',
    description:
      'View, download, and share photos from phone, tablet, or laptop. One-tap full-resolution downloads to camera roll. No zip files, no quality loss.',
  },
  {
    icon: Users,
    title: 'Family Sharing',
    description:
      'Add family members as secondary users so grandparents, partners, and siblings can access the full gallery. Every photographer, every gallery — all in one account.',
  },
  {
    icon: Shield,
    title: 'Orphan Protocol Protection',
    description:
      'Client galleries survive even if the photographer leaves the platform. Because clients pay for their own storage, photos are preserved regardless. Wedding photos don\'t disappear with a cancelled subscription.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Features</span>
        </nav>

        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need to Earn From Past Work
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PhotoVault is a focused gallery delivery platform. No website builder, no CRM, no print
            store — just the tools that turn completed photoshoots into recurring income.
          </p>
        </header>

        {/* Photographer Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            For Photographers
          </h2>
          <p className="text-muted-foreground mb-8">
            Deliver galleries, earn commissions, track everything.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photographerFeatures.map((feature) => (
              <Card key={feature.title} className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Client Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            For Clients (Families)
          </h2>
          <p className="text-muted-foreground mb-8">
            Permanent access, easy sharing, real protection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientFeatures.map((feature) => (
              <Card key={feature.title} className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-foreground mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What We Don't Do */}
        <section className="mb-20">
          <Card className="bg-secondary/30 border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">
                What PhotoVault Doesn&apos;t Do (On Purpose)
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                PhotoVault is intentionally focused. If you already have a website and CRM, we
                slot in alongside your existing tools instead of replacing them.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  'No website builder — use Squarespace, WordPress, etc.',
                  'No CRM or contracts — use HoneyBook, Dubsado, etc.',
                  'No print store — use your preferred lab',
                  'No client proofing/favorites — we focus on delivery and archival',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-muted-foreground">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Platform Summary */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Platform at a Glance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Platform fee', value: '$22/mo', note: 'Free during beta' },
              { label: 'Your commission', value: '50%', note: 'Of every client payment' },
              { label: 'Break-even', value: '6 clients', note: 'On monthly plans' },
              { label: 'Gallery limits', value: 'Unlimited', note: 'No caps, no tiers' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            See It In Action
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join the beta free for 12 months. Lock in $22/month forever. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers/signup">
                <Camera className="mr-2 h-5 w-5" />
                Start Your Free Beta
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
