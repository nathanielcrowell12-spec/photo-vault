import { Metadata } from 'next'
import {
  LandingHeader,
  LandingFooter,
  HeroSection,
  HowItWorksSection,
  CommunitySection,
  PricingSection,
} from '@/components/landing'

export const metadata: Metadata = {
  title: 'PhotoVault - Memory Insurance for Your Most Precious Photos',
  description:
    'Professional-grade photo protection for families. Photographers earn passive income while families never lose another memory. $8/month.',
  keywords:
    'photo storage, memory insurance, photographer income, photo backup, professional photos, family photos',
  openGraph: {
    type: 'website',
    title: 'PhotoVault - Memory Insurance for Your Most Precious Photos',
    description:
      'Professional-grade photo protection. Photographers earn passive income. Families never lose another memory.',
    url: 'https://photovault.photo',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://photovault.photo/images/og-landing.webp',
        width: 1200,
        height: 630,
        alt: 'PhotoVault - Memory Insurance for Your Photos',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhotoVault - Memory Insurance for Your Most Precious Photos',
    description: 'Professional-grade photo protection. Photographers earn passive income.',
    images: ['https://photovault.photo/images/og-landing.webp'],
  },
  alternates: {
    canonical: 'https://photovault.photo',
  },
}

// Structured data for rich search results
const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['WebSite', 'Service'],
  name: 'PhotoVault',
  url: 'https://photovault.photo/',
  description:
    'PhotoVault helps families find, organize, and keep every professional photo in one secure dashboard.',
  serviceType: 'Photo storage and protection platform',
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
    price: '8',
    priceValidUntil: '2026-12-31',
    description: 'Memory Insurance - protect your photos for $8/month',
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
      <div className="flex flex-col min-h-screen bg-white text-gray-700 antialiased">
        <LandingHeader />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <CommunitySection />
          <PricingSection />
        </main>
        <LandingFooter />
      </div>
    </>
  )
}
