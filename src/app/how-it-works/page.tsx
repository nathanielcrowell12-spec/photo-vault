import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  Upload,
  Send,
  DollarSign,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Shield,
  CheckCircle,
  Users,
  Smartphone,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How PhotoVault Works | Step-by-Step Guide for Photographers',
  description:
    'See exactly how PhotoVault turns completed photoshoots into passive income. Upload galleries, deliver to clients, earn 50% of every payment automatically via Stripe.',
  keywords:
    'how PhotoVault works, photographer gallery delivery, passive income photography, photo gallery platform, recurring revenue photographers',
  openGraph: {
    type: 'website',
    title: 'How PhotoVault Works — Step-by-Step',
    description:
      'Upload galleries. Deliver to clients. Earn 50% of every payment. See the full photographer and client experience.',
    url: 'https://www.photovault.photo/how-it-works',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://www.photovault.photo/images/og-landing.webp',
        width: 1200,
        height: 630,
        alt: 'How PhotoVault Works — Step-by-Step Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.photovault.photo/images/og-landing.webp'],
    title: 'How PhotoVault Works',
    description:
      'Step-by-step guide: upload galleries, deliver to clients, earn passive income.',
  },
  alternates: {
    canonical: 'https://www.photovault.photo/how-it-works',
  },
}

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Earn Passive Income as a Photographer with PhotoVault',
  description:
    'A step-by-step guide for photographers to turn completed photoshoots into recurring monthly revenue using PhotoVault.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Create your account',
      text: 'Sign up for a free PhotoVault account. No credit card required during the beta period. Connect your Stripe account to receive payments.',
    },
    {
      '@type': 'HowToStep',
      name: 'Upload a gallery',
      text: 'Upload your edited photos through the web dashboard or the desktop app for large galleries (500+ photos). Set the client payment option.',
    },
    {
      '@type': 'HowToStep',
      name: 'Deliver to your client',
      text: 'Send a delivery email to your client. They receive a link, create their PhotoVault account, and pay for gallery access. Their profile is created automatically.',
    },
    {
      '@type': 'HowToStep',
      name: 'Earn passive income',
      text: 'You earn 50% of every payment your client makes — $50 on a $100 annual plan, or $4/month on recurring plans. Income continues for as long as the client keeps their gallery.',
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.photovault.photo' },
    { '@type': 'ListItem', position: 2, name: 'How It Works', item: 'https://www.photovault.photo/how-it-works' },
  ],
}

const photographerSteps = [
  {
    icon: Camera,
    step: 1,
    title: 'Create your account and connect Stripe',
    description:
      'Sign up free — no credit card required during beta. Then connect your Stripe account (takes about 5 minutes) so you can receive payments directly to your bank.',
  },
  {
    icon: Upload,
    step: 2,
    title: 'Upload a gallery',
    description:
      'Upload your edited photos through the web dashboard, or use the desktop app for large galleries (500+ photos or RAW files). No browser file size limits with the desktop app.',
  },
  {
    icon: Send,
    step: 3,
    title: 'Deliver to your client',
    description:
      'Send a delivery email with one click. Your client receives a link, creates their account, and chooses a payment plan. Their profile is created automatically — no manual setup.',
  },
  {
    icon: DollarSign,
    step: 4,
    title: 'Earn passive income',
    description:
      'You earn 50% of every payment. $50 on a $100 annual plan, $25 on a $50 six-month plan, or $4/month on recurring. Stripe deposits directly to your bank. No invoicing, no chasing payments.',
  },
]

const clientSteps = [
  {
    icon: Send,
    step: 1,
    title: 'Receive your gallery link',
    description:
      'Your photographer sends you an email with a link to your protected gallery on PhotoVault.',
  },
  {
    icon: CheckCircle,
    step: 2,
    title: 'Create your account and pay',
    description:
      'Create a free account and choose a payment plan: $100/year, $50/6 months, or $8/month. Your photos are immediately accessible.',
  },
  {
    icon: Smartphone,
    step: 3,
    title: 'Access from any device',
    description:
      'View, download, and share your photos from phone, tablet, or laptop. One-tap full-resolution downloads to your camera roll. No zip files.',
  },
  {
    icon: Users,
    step: 4,
    title: 'Share with family',
    description:
      'Add family members to your account so they can access the full gallery too. Every gallery from every photographer lives in one place.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
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
          <span className="text-foreground">How It Works</span>
        </nav>

        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How PhotoVault Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload galleries. Deliver to clients. Earn 50% of every payment, automatically.
            Nothing changes about your photography workflow — PhotoVault adds income on top.
          </p>
        </header>

        {/* Photographer Flow */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            For Photographers
          </h2>
          <p className="text-muted-foreground mb-8">
            Four steps from signup to passive income.
          </p>

          <div className="space-y-6">
            {photographerSteps.map((item, index) => (
              <div key={item.step}>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6 flex gap-5">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-6 w-6" />
                      </div>
                      {index < photographerSteps.length - 1 && (
                        <ArrowDown className="h-5 w-5 text-muted-foreground mt-3" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                        Step {item.step}
                      </p>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Money Flow */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            How the Money Flows
          </h2>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base">
                <span className="font-medium text-foreground whitespace-nowrap">Client pays</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <span className="text-muted-foreground sm:hidden">&darr;</span>
                <span className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-md whitespace-nowrap">
                  PhotoVault
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <span className="text-muted-foreground sm:hidden">&darr;</span>
                <span className="font-medium text-foreground whitespace-nowrap">50% to you via Stripe</span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-semibold text-foreground">$100/year plan</p>
                  <p className="text-muted-foreground">You earn <span className="text-primary font-semibold">$50</span> upfront</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-semibold text-foreground">$8/month plan</p>
                  <p className="text-muted-foreground">You earn <span className="text-primary font-semibold">$4/month</span> ongoing</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-semibold text-foreground">Your platform cost</p>
                  <p className="text-muted-foreground">$22/month <span className="text-primary font-semibold">(free during beta)</span></p>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Break-even: 6 clients on monthly plans. Every client after that is profit.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Client Flow */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            For Clients (Families)
          </h2>
          <p className="text-muted-foreground mb-8">
            Your clients get permanent access to their photos. Here is their experience.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {clientSteps.map((item) => (
              <Card key={item.step} className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-foreground mb-3">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Step {item.step}
                  </p>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Orphan Protocol */}
        <section className="mb-20">
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-6 flex gap-4">
              <Shield className="h-8 w-8 text-green-500 shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  What happens if a photographer leaves?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PhotoVault has an Orphan Protocol. Because clients pay for their own storage,
                  galleries remain accessible even if the photographer leaves the platform. The
                  photographer stops earning commissions, but the client&apos;s photos are preserved.
                  Wedding photos, newborn sessions, family portraits — they don&apos;t disappear
                  with a cancelled subscription.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Compound Math */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center flex items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" />
            The Compounding Effect
          </h2>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-muted-foreground">Year 1 — 50 clients at $100 upfront</span>
                  <span className="font-semibold text-foreground">$2,500 in commissions</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-muted-foreground">Year 2 — Those clients convert to $8/month</span>
                  <span className="font-semibold text-foreground">$200/month passive income</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-muted-foreground">Year 3 — 100 total monthly clients</span>
                  <span className="font-semibold text-foreground">$400/month ($4,800/year)</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Every gallery you deliver is a seed for future recurring revenue. The only variable
                  is how many clients you run through the platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Ready to start earning?
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
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
