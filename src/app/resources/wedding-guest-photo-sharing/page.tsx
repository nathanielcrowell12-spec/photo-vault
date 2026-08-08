import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, X } from 'lucide-react'
import { buildResourceBreadcrumb, SITE_URL } from '@/lib/resource-schema'
import { FaqAccordion, buildFaqSchema, type FaqItem } from '@/components/resources/FaqAccordion'

const SLUG = 'wedding-guest-photo-sharing'

export const metadata: Metadata = {
  title: 'How to Share Wedding Photos With Guests | PhotoVault',
  description:
    'Every way to collect and share wedding photos with your guests — QR-code apps, shared albums, and galleries — with the honest trade-offs of each.',
  alternates: { canonical: `${SITE_URL}/resources/${SLUG}` },
  openGraph: {
    type: 'article',
    title: 'How to Share Wedding Photos With Guests',
    description:
      'QR-code apps, shared albums, or a gallery link? The honest trade-offs of each way to collect and share wedding photos.',
    url: `${SITE_URL}/resources/${SLUG}`,
    siteName: 'PhotoVault',
  },
}

const breadcrumbSchema = buildResourceBreadcrumb(SLUG, 'Wedding Guest Photo Sharing')

const FAQS: FaqItem[] = [
  {
    question: 'Do guests have to download an app to share wedding photos?',
    answer:
      'They should not have to, and most couples say this is their single biggest requirement. Dedicated wedding photo apps like GuestPix, Guestcam and WedUploader use a QR code that opens a web page in the phone browser, so guests upload without installing anything. Avoid any option that requires every guest to create an account first — that is where participation collapses.',
  },
  {
    question: 'What is the easiest way for guests to upload photos at a wedding?',
    answer:
      'A QR code on the table cards, pointing at an upload page that works in a phone browser. Guests scan, pick photos, and upload. No app, no login, no typing a URL. Print the same QR on the order of service so people who miss the table card still see it.',
  },
  {
    question: 'Can we use a shared Google Photos or iCloud album instead?',
    answer:
      'Yes, and it is free, which is why many couples start there. The trade-offs: Google Photos shared albums work best when guests have Google accounts, iCloud albums are awkward for Android guests, and both compress images. They are a reasonable choice if your guest list is technically comfortable and you mainly want casual snapshots.',
  },
  {
    question: 'How long do wedding photo sharing apps keep the photos?',
    answer:
      'This is the detail most couples miss. Many single-purpose wedding apps are built around the event and keep uploads for a limited window — often 30 days to a year — after which the gallery expires or moves to a paid tier. Check the retention policy before the wedding, not after, and download a full-resolution archive as soon as uploads slow down.',
  },
  {
    question: 'Should guest photos and the professional photos live in the same place?',
    answer:
      'It is much easier if they do. Most couples end up with the photographer gallery in one place and a few hundred guest phone photos in another, and the two drift apart over the years. Keeping both in one permanent gallery means one link to find later, and one archive to hand to family.',
  },
  {
    question: 'How do we get guests to actually upload their photos?',
    answer:
      'Ask twice, and make the second ask after the wedding. Put the QR code where people are already sitting, then send one follow-up message with the same link a few days later, when guests are going through their camera rolls. A single reminder typically collects more photos than everything you do on the day.',
  },
]

const faqSchema = buildFaqSchema(FAQS)

const OPTIONS = [
  {
    name: 'QR-code wedding apps',
    examples: 'GuestPix, Guestcam, WedUploader',
    good: ['No app install for guests', 'Built exactly for this job', 'Live slideshow options'],
    bad: ['Often expires after the event', 'Separate from your photographer gallery'],
  },
  {
    name: 'Shared cloud albums',
    examples: 'Google Photos, iCloud, Dropbox',
    good: ['Free', 'Familiar to most guests', 'No time limit'],
    bad: ['Account friction across iPhone/Android', 'Images get compressed', 'Easy to lose track of the link'],
  },
  {
    name: 'A permanent gallery',
    examples: 'PhotoVault and similar',
    good: ['Guest photos live beside the professional ones', 'One link that keeps working', 'Full resolution kept'],
    bad: ['Usually paid', 'Needs setting up before the day'],
  },
]

export default function WeddingGuestPhotoSharingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/resources" className="hover:text-primary transition-colors">
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Wedding Guest Photo Sharing</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          How to Share Wedding Photos With Your Guests
        </h1>

        <p className="text-xl text-muted-foreground mb-10">
          Your photographer will hand over a few hundred beautiful photographs. Your guests are
          holding several hundred more — the ones taken from the tables, on the dance floor, and
          in the car on the way home. This is a practical guide to collecting those, sharing
          yours back, and making sure the whole lot still exists in ten years.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Start with the one rule that matters</h2>
          <p className="text-muted-foreground mb-4">
            Whatever you choose, guests should not have to install anything or create an account.
            This is the point where guest photo sharing succeeds or fails, and it is the most
            common complaint couples make after the fact. People are dressed up, holding a drink,
            and half a glass of wine into the evening. If sharing a photo takes more than about
            fifteen seconds, most of them will mean to do it later and then never will.
          </p>
          <p className="text-muted-foreground mb-4">
            In practice that means a QR code that opens a normal web page in the phone browser.
            Scan, choose photos, upload, done. Every option below should be judged against that
            standard first, and against features second.
          </p>
          <p className="text-muted-foreground">
            The same rule applies in reverse when you share the professional photos back. A
            gallery that makes your aunt sign up for an account before she can see the pictures
            is a gallery your aunt will not look at.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">The three real options</h2>
          <div className="space-y-5">
            {OPTIONS.map((o) => (
              <Card key={o.name}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{o.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{o.examples}</p>
                  <ul className="space-y-1.5 mb-3">
                    {o.good.map((g) => (
                      <li key={g} className="flex gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {o.bad.map((b) => (
                      <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                        <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            The dedicated wedding apps are genuinely good at the day
          </h2>
          <p className="text-muted-foreground mb-4">
            GuestPix, Guestcam and WedUploader exist to do exactly one thing, and they do it well.
            You get a QR code, guests scan it, photos appear. Several offer a live slideshow you
            can put on a screen during the reception, which is a real and underrated pleasure —
            guests take more photos when they can see them appearing.
          </p>
          <p className="text-muted-foreground mb-4">
            If your only goal is collecting guest photos on the night, one of these is probably
            the right answer, and you should not overthink it. We would rather say that plainly
            than pretend otherwise.
          </p>
          <p className="text-muted-foreground">
            The catch is what happens afterwards. These tools are priced and built around an
            event, so retention is usually measured in weeks or months. Read the retention policy
            before you book, and download a full-resolution archive while the gallery is still
            live. A surprising number of couples discover the limit at the first anniversary,
            which is precisely when they went looking.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Shared albums are free, and free is a real feature
          </h2>
          <p className="text-muted-foreground mb-4">
            A shared Google Photos album costs nothing, has no expiry date, and most of your
            guests already have the app on their phone. For a lot of weddings that is genuinely
            enough, and anyone who tells you otherwise is selling something.
          </p>
          <p className="text-muted-foreground mb-4">
            Where it gets awkward is the mixed-device problem. Google Photos shared albums are
            smoothest when contributors have Google accounts; iCloud Shared Albums are smooth for
            iPhone guests and clumsy for everyone else. At a wedding you have both, plus a
            handful of people who will not want to sign into anything. You also get compression:
            these services resize images, which matters if you ever want to print one.
          </p>
          <p className="text-muted-foreground">
            The quieter risk is simply losing the link. A shared album URL sent in a group chat in
            June is very hard to find in December.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Keeping both halves in one place</h2>
          <p className="text-muted-foreground mb-4">
            The problem nobody warns you about is not collecting the photos. It is that a year
            later they live in three places: the photographer&apos;s gallery link in an email, the
            guest uploads in an app you have stopped thinking about, and a few favourites saved to
            your phone. Each of those has a different expiry date, and at least one of them has
            already passed.
          </p>
          <p className="text-muted-foreground mb-4">
            This is the case for putting the guest photos and the professional photos in the same
            permanent gallery. One link to find, one archive to hand your parents, one place that
            still works when you want to print something for a tenth anniversary. It usually costs
            money, and it needs setting up before the wedding rather than after — those are real
            trade-offs, not fine print.
          </p>
          <p className="text-muted-foreground">
            If you are working with a photographer who delivers through{' '}
            <Link href="/photographers" className="text-primary hover:underline">
              PhotoVault
            </Link>
            , your gallery is already permanent, and guest uploads can sit alongside the
            professional images rather than in a separate app.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">A practical checklist</h2>
          <ol className="space-y-3 text-muted-foreground list-decimal pl-5">
            <li>
              Decide before the invitations go out, so the QR code can go on printed material
              rather than being improvised on the day.
            </li>
            <li>
              Test the QR code yourself on both an iPhone and an Android phone, on mobile data
              rather than the venue wifi.
            </li>
            <li>
              Put the code somewhere people are sitting — table cards and the order of service
              beat a single poster by the door.
            </li>
            <li>
              Tell one person in the wedding party that reminding guests is their job. It works
              far better than a sign.
            </li>
            <li>
              Send one follow-up message a few days later with the same link. This reliably
              collects more photos than anything you do on the day itself.
            </li>
            <li>
              Download a full-resolution archive of everything within the first month, whatever
              platform you used, and put a copy somewhere you control.
            </li>
            <li>
              Check the retention policy of every service holding your photos, and diarise any
              expiry date.
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common questions</h2>
          <FaqAccordion items={FAQS} />
        </section>

        <Card className="bg-muted/40">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">Photos that outlive the platform</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              PhotoVault keeps wedding galleries permanently — professional photos and guest
              uploads in one place, with a link that still works in ten years.
            </p>
            <Button asChild size="lg">
              <Link href="/pricing">
                See pricing
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </article>
    </>
  )
}
