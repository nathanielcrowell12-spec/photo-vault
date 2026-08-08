import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Camera, HardDrive, Scale } from 'lucide-react'
import {
  RESOURCES,
  SITE_URL,
  resourcesByGroup,
  type ResourceGroup,
} from '@/lib/resource-schema'

export const metadata: Metadata = {
  title: 'Photography Resources & Guides | PhotoVault',
  description:
    'Guides and comparisons for photographers and families: platform comparisons, photo storage options, recurring revenue, and location guides.',
  alternates: {
    canonical: `${SITE_URL}/resources`,
  },
  openGraph: {
    type: 'website',
    title: 'Photography Resources & Guides | PhotoVault',
    description:
      'Guides and comparisons for photographers and families — platform comparisons, photo storage, and more.',
    url: `${SITE_URL}/resources`,
    siteName: 'PhotoVault',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE_URL}/resources` },
  ],
}

const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'PhotoVault Resources',
  url: `${SITE_URL}/resources`,
  description:
    'Guides and comparisons for photographers and families on photo delivery, storage, and platform choice.',
  hasPart: RESOURCES.map((r) => ({
    '@type': 'Article',
    headline: r.name,
    description: r.description,
    url: `${SITE_URL}/resources/${r.slug}`,
  })),
}

const GROUP_ICONS: Record<ResourceGroup, typeof Camera> = {
  'For Photographers': Camera,
  'Compare Platforms': Scale,
  'Photo Storage': HardDrive,
  Guides: BookOpen,
}

const GROUP_BLURBS: Record<ResourceGroup, string> = {
  'For Photographers':
    'How to earn more from galleries you have already delivered.',
  'Compare Platforms':
    'Honest comparisons against the platforms photographers actually use. We name what they do better.',
  'Photo Storage':
    'Where professional photos live, what it costs, and how long they survive.',
  Guides: 'Practical guides for photographers and the families they shoot for.',
}

export default function ResourcesPage() {
  const groups = resourcesByGroup()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Resources</span>
        </nav>

        <header className="mb-14 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            Photography Resources &amp; Guides
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything we have written about delivering photos, storing them properly, and
            choosing between the platforms that do it. Written for photographers running a
            business, and for the families whose photos are scattered across five of them.
          </p>
        </header>

        {groups.map(({ group, items }) => {
          const Icon = GROUP_ICONS[group]
          return (
            <section key={group} className="mb-14">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="text-2xl font-semibold">{group}</h2>
              </div>
              <p className="text-muted-foreground mb-6 max-w-2xl">{GROUP_BLURBS[group]}</p>

              <div className="grid gap-5 md:grid-cols-2">
                {items.map((r) => (
                  <Card key={r.slug} className="h-full transition-colors hover:border-primary">
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="text-lg font-semibold mb-2">
                        <Link
                          href={`/resources/${r.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {r.name}
                        </Link>
                      </h3>
                      <p className="text-muted-foreground text-sm flex-1 mb-4">
                        {r.description}
                      </p>
                      <Link
                        href={`/resources/${r.slug}`}
                        className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Read more
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}

        <Card className="bg-muted/40">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">
              Galleries that do not expire
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              PhotoVault keeps every gallery you deliver available permanently, and pays you
              50% of what your clients spend keeping them.
            </p>
            <Button asChild size="lg">
              <Link href="/photographers">
                See how it works
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
