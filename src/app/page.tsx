import { Metadata } from 'next'
import {
  LandingHeader,
  LandingFooter,
  HeroSection,
  HowItWorksSection,
  ComparisonSection,
  PricingSection,
  OrphanProtocolSection,
  FounderStorySection,
  BetaCTASection,
} from '@/components/landing'

const BETA_EMAIL = 'support@photovault.photo'

export const metadata: Metadata = {
  title: 'PhotoVault - Turn Your Photography Into Recurring Revenue',
  description:
    'PhotoVault helps professional photographers earn passive income from completed work. Clients pay $8/month for photo storage. You earn $4/month per client. Join the beta free for 12 months.',
  keywords:
    'photographer passive income, photo gallery platform, photography business, recurring revenue photographers, photo delivery platform',
  openGraph: {
    type: 'website',
    title: 'PhotoVault - Turn Your Photography Into Recurring Revenue',
    description:
      'Professional photographers earn $4/month per client in passive income. Clients pay for storage. You earn from work already done. Beta is free for 12 months.',
    url: 'https://photovault.photo',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://photovault.photo/images/og-landing.webp',
        width: 1200,
        height: 630,
        alt: 'PhotoVault - Recurring Revenue for Photographers',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhotoVault - Turn Your Photography Into Recurring Revenue',
    description: 'Earn $4/month per client in passive income. Beta is free for 12 months.',
    images: ['https://photovault.photo/images/og-landing.webp'],
  },
  alternates: {
    canonical: 'https://photovault.photo',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['WebSite', 'Service'],
  name: 'PhotoVault',
  url: 'https://photovault.photo/',
  description:
    'PhotoVault helps professional photographers turn completed work into recurring passive income through client photo storage subscriptions.',
  serviceType: 'Photography business platform',
  provider: {
    '@type': 'Organization',
    name: 'PhotoVault LLC',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3639 Old Stage Road',
      addressLocality: 'Brooklyn',
      addressRegion: 'WI',
      postalCode: '53521',
      addressCountry: 'US',
    },
    telephone: '+1-608-571-7532',
    email: 'support@photovault.photo',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: '0',
    priceValidUntil: '2027-02-28',
    description: 'Beta program: 12 months free ($22/month platform fee waived)',
  },
  areaServed: 'United States',
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        <LandingHeader />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <ComparisonSection />
          <PricingSection />
          <OrphanProtocolSection />
          <FounderStorySection betaEmail={BETA_EMAIL} />
          <BetaCTASection betaEmail={BETA_EMAIL} />
        </main>
        <LandingFooter betaEmail={BETA_EMAIL} />
      </div>
    </>
  )
}
