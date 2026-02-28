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
  ParallaxSection,
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
    url: 'https://www.photovault.photo',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://www.photovault.photo/images/og-landing.webp',
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
    images: ['https://www.photovault.photo/images/og-landing.webp'],
  },
  alternates: {
    canonical: 'https://www.photovault.photo',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['WebSite', 'Service'],
  name: 'PhotoVault',
  url: 'https://www.photovault.photo/',
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

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PhotoVault',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Windows, macOS',
  description:
    'Gallery delivery platform for professional photographers that generates recurring passive income from client photo storage subscriptions.',
  url: 'https://www.photovault.photo',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free for 12 months during beta. Then $22/month.',
  },
  provider: {
    '@type': 'Organization',
    name: 'PhotoVault LLC',
  },
  featureList: [
    'Gallery delivery with client subscriptions',
    '50% commission on every client payment',
    'Stripe Connect direct deposit',
    'Desktop app for large uploads',
    'Orphan Protocol — galleries survive photographer cancellation',
    'Family sharing for clients',
    'Analytics and revenue tracking',
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        <LandingHeader />
        <main>
          <ParallaxSection
            imageSrc="/images/hero/waterfront-city-sunset.jpg"
            imageAlt="Professional photographer shooting in natural light"
          >
            <HeroSection />
          </ParallaxSection>
          <HowItWorksSection />
          <ComparisonSection />
          <PricingSection />
          <ParallaxSection
            imageSrc="/images/hero/landscape-cloudy-sky.jpg"
            imageAlt="Family photo album on a wooden shelf"
          >
            <OrphanProtocolSection />
          </ParallaxSection>
          <FounderStorySection betaEmail={BETA_EMAIL} />
          <ParallaxSection
            imageSrc="/images/hero/city-dawn-aerial.jpg"
            imageAlt="Camera gear on a photographer's desk"
          >
            <BetaCTASection betaEmail={BETA_EMAIL} />
          </ParallaxSection>
        </main>
        <LandingFooter betaEmail={BETA_EMAIL} />
      </div>
    </>
  )
}
