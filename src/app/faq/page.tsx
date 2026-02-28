import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Camera, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ | PhotoVault — Common Questions About the Platform',
  description:
    'Answers to common questions about PhotoVault: pricing, how photographers earn passive income, how clients access galleries, the beta program, and more.',
  keywords:
    'PhotoVault FAQ, photographer gallery platform questions, photo storage FAQ, PhotoVault pricing, passive income photography',
  openGraph: {
    type: 'website',
    title: 'PhotoVault FAQ — Common Questions',
    description:
      'Everything you need to know about PhotoVault: pricing, passive income for photographers, client gallery access, and the founding photographer beta program.',
    url: 'https://www.photovault.photo/faq',
    siteName: 'PhotoVault',
    images: [
      {
        url: 'https://www.photovault.photo/images/og-landing.webp',
        width: 1200,
        height: 630,
        alt: 'PhotoVault FAQ — Common Questions About the Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.photovault.photo/images/og-landing.webp'],
    title: 'PhotoVault FAQ',
    description:
      'Common questions about PhotoVault — the gallery delivery platform that pays photographers passive income.',
  },
  alternates: {
    canonical: 'https://www.photovault.photo/faq',
  },
}

const faqs = [
  {
    category: 'About PhotoVault',
    questions: [
      {
        q: 'What is PhotoVault?',
        a: 'PhotoVault is a photo gallery delivery platform for professional photographers. Photographers upload client galleries, clients pay for permanent access, and photographers earn 50% of every payment as passive income. It turns completed photoshoots into recurring monthly revenue.',
      },
      {
        q: 'How is PhotoVault different from Pixieset or ShootProof?',
        a: 'On Pixieset and ShootProof, the photographer pays a monthly subscription and clients get free gallery access. On PhotoVault, clients pay for their own storage ($8/month or $100/year), and the photographer earns 50% of whatever the client pays. More clients means more income for you, not higher costs.',
      },
      {
        q: 'Who built PhotoVault?',
        a: 'PhotoVault was built by Nate Crowell in Brooklyn, Wisconsin. He built it after watching his own family photos scatter across dead hard drives, expired cloud links, and forgotten USB sticks — and realized photographers and their clients were experiencing the same problem.',
      },
    ],
  },
  {
    category: 'For Photographers',
    questions: [
      {
        q: 'How do photographers earn money on PhotoVault?',
        a: 'You earn 50% of whatever your client pays. If a client pays $100 upfront for a 12-month plan, you earn $50 immediately. If a client pays $8/month, you earn $4/month for as long as they keep their gallery. This is passive income from work you already completed.',
      },
      {
        q: 'What does PhotoVault cost for photographers?',
        a: 'The platform fee is $22/month. During the beta period, founding photographers get 12 months free and the $22/month rate is locked in forever — immune to any future price increases.',
      },
      {
        q: 'When does the $22/month fee get covered by earnings?',
        a: 'At $4/month per client, you break even with just 6 active clients paying monthly. Every client beyond that is profit. Most photographers shoot 30-50 sessions per year, so the math works quickly.',
      },
      {
        q: 'Do I keep ownership of my photos?',
        a: 'Yes. Photographers retain full copyright and control over their work. Clients can only access galleries you have delivered to them. Your work stays yours.',
      },
      {
        q: 'How do I get paid?',
        a: 'Payments are processed through Stripe Connect and deposited directly to your bank account. PhotoVault handles all billing, invoicing, and payment processing. You never chase a client for payment.',
      },
      {
        q: 'Can I use PhotoVault alongside Pixieset or other tools?',
        a: 'Yes. Many photographers use Pixieset for CRM, contracts, and invoicing while using PhotoVault for gallery delivery and passive income. PhotoVault is a focused delivery tool — it does not replace your website builder or CRM.',
      },
    ],
  },
  {
    category: 'For Clients (Families)',
    questions: [
      {
        q: 'What does PhotoVault cost for clients?',
        a: 'Clients pay $8/month for ongoing gallery access, or they can choose a prepaid plan: $100 for 12 months or $50 for 6 months. Payment options are set by the photographer when delivering the gallery.',
      },
      {
        q: 'Can I download my photos?',
        a: 'Yes. You can download any photo at full resolution directly to your camera roll with one tap. No zip files to unpack, no quality loss.',
      },
      {
        q: 'Can I share my gallery with family members?',
        a: 'Yes. You can add family members to your account so they can access the full gallery. You can also share individual photos directly.',
      },
      {
        q: 'What happens to my photos if my photographer leaves PhotoVault?',
        a: "Your photos are safe. PhotoVault's Orphan Protocol keeps client galleries accessible even if the photographer leaves the platform. As long as your subscription is active, your photos remain protected and accessible.",
      },
    ],
  },
  {
    category: 'Beta Program',
    questions: [
      {
        q: 'What is the founding photographer beta program?',
        a: 'The beta program gives early-adopter photographers 12 months of free platform access ($264 value) and locks in the $22/month rate forever — immune to any future price increases. Founding photographers also get a profile badge, direct access to the founder, and priority feature requests.',
      },
      {
        q: 'Is a credit card required to join the beta?',
        a: 'No. You can sign up and start using PhotoVault immediately with no credit card required.',
      },
      {
        q: 'What happens after the 12-month free period?',
        a: 'Your account continues at $22/month — the rate you locked in when you joined. This rate never increases, regardless of what the platform charges future photographers.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'Is there a desktop app for large uploads?',
        a: 'Yes. PhotoVault has a dedicated desktop app for uploading large galleries (500+ photos or RAW files). It handles chunked uploads with no browser file size limits, and you can keep working while it uploads in the background.',
      },
      {
        q: 'What devices can clients use to access their galleries?',
        a: 'Clients can access their galleries from any device — phone, tablet, or laptop — by logging in at photovault.photo. Photos are always full resolution.',
      },
    ],
  },
]

// Build FAQ schema for all questions
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.flatMap((category) =>
    category.questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))
  ),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.photovault.photo' },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://www.photovault.photo/faq' },
  ],
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">FAQ</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
            <HelpCircle className="h-9 w-9 text-primary" />
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about PhotoVault — for photographers and families.
          </p>
        </header>

        {/* FAQ Sections */}
        {faqs.map((category) => (
          <section key={category.category} className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">
              {category.category}
            </h2>
            <div className="space-y-6">
              {category.questions.map((item) => (
                <div key={item.q}>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {item.q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            Email us directly or join the beta and see for yourself — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers/signup">
                <Camera className="mr-2 h-5 w-5" />
                Join the Beta Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="mailto:support@photovault.photo">
                Email support@photovault.photo
              </a>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
