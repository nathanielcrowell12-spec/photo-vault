import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { buildResourceBreadcrumb, SITE_URL } from '@/lib/resource-schema'
import { FaqAccordion, buildFaqSchema, type FaqItem } from '@/components/resources/FaqAccordion'

const SLUG = 'how-to-start-a-photography-business'

export const metadata: Metadata = {
  title: 'How to Start a Photography Business | PhotoVault',
  description:
    'A practical guide to starting a photography business: pricing, the paperwork that matters, first clients, and the running costs nobody warns you about.',
  alternates: { canonical: `${SITE_URL}/resources/${SLUG}` },
  openGraph: {
    type: 'article',
    title: 'How to Start a Photography Business',
    description:
      'Pricing, paperwork, first clients, and the running costs nobody warns you about.',
    url: `${SITE_URL}/resources/${SLUG}`,
    siteName: 'PhotoVault',
  },
}

const breadcrumbSchema = buildResourceBreadcrumb(SLUG, 'How to Start a Photography Business')

const FAQS: FaqItem[] = [
  {
    question: 'How much money do you need to start a photography business?',
    answer:
      'Less than most people assume, if you already own a capable camera. The unavoidable costs are business registration, liability insurance, and a way to deliver galleries — realistically a few hundred dollars to begin. The larger expense is usually a second camera body, because shooting a paid event with no backup is a risk you only take once.',
  },
  {
    question: 'Do I need to register a business to charge for photography?',
    answer:
      'In most places, yes, once you are charging regularly rather than occasionally. Requirements vary by country and state, and the answer affects your taxes and your liability. This is worth one conversation with a local accountant early rather than a correction later.',
  },
  {
    question: 'How do photographers find their first clients?',
    answer:
      'Almost always through people who already know them, then through referrals from those first clients. Second shooting for an established photographer is the fastest way to build both a portfolio and a referral source. Cold outreach and paid advertising rarely work before you have work to show.',
  },
  {
    question: 'How much should I charge when I am starting out?',
    answer:
      'Work out what you need to earn per year, divide by the number of sessions you can realistically shoot and edit, and add your costs. That number is usually higher than beginners expect, because editing time and unpaid admin get forgotten. Charging too little is harder to recover from than charging too much, because raising prices on existing clients is uncomfortable.',
  },
  {
    question: 'What insurance does a photographer need?',
    answer:
      'General liability at minimum — many venues will not let you shoot without proof of it, so it can gate work regardless of your own risk appetite. Equipment insurance is separate and worth it once your kit is worth more than you could replace out of savings.',
  },
  {
    question: 'How long does it take to make photography a full-time job?',
    answer:
      'Commonly two to three years of running it alongside other income. The constraint is rarely skill; it is the number of clients who know you exist, which grows through referrals and therefore compounds slowly at first. Treating the first year as portfolio and reputation building sets more realistic expectations than treating it as a launch.',
  },
]

const faqSchema = buildFaqSchema(FAQS)

const STEPS = [
  {
    n: '01',
    title: 'Decide what you actually shoot',
    body: 'Narrowing early feels like turning down work, and it is the fastest way to get booked. "Wedding photographer in Madison" is something a person can refer to a friend. "Photographer" is not. You can widen later; you cannot build a reputation in five genres at once.',
  },
  {
    n: '02',
    title: 'Do the boring paperwork first',
    body: 'Register the business, sort out liability insurance, and open a separate bank account. The bank account matters more than it sounds — mixing personal and business money makes your first tax return significantly worse, and it hides whether you are actually profitable.',
  },
  {
    n: '03',
    title: 'Work out your real hourly rate',
    body: 'Take the annual income you need, add your costs, and divide by the sessions you can genuinely deliver. Count editing, which is usually two to three times the shooting time, plus travel and admin. Most beginners price off what other people charge and discover the gap a year later.',
  },
  {
    n: '04',
    title: 'Get a contract before you need one',
    body: 'A signed agreement covering cancellation, usage rights, delivery timeline, and payment schedule. Have it in place before your first paid booking. This is the one area worth paying a professional to review rather than assembling from templates found online.',
  },
  {
    n: '05',
    title: 'Second shoot for someone established',
    body: 'It builds a portfolio, teaches you how a full day actually runs, and gives you a referral source who sends you the work they cannot take. It is the single highest-return activity available in the first year, and it pays while you do it.',
  },
  {
    n: '06',
    title: 'Sort out delivery before your first booking',
    body: 'How clients receive their photos shapes what they say about you. Decide before the first job, not the night before the first delivery — and check how long the galleries stay available, because that is where most complaints eventually come from.',
  },
]

export default function HowToStartAPhotographyBusinessPage() {
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
          <span className="text-foreground">Starting a Photography Business</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          How to Start a Photography Business
        </h1>

        <p className="text-xl text-muted-foreground mb-10">
          The photography part is the part you already know. What separates people who make a
          living from people who stay very good hobbyists is pricing, paperwork, and repeat
          clients — none of which anyone teaches you. This covers the decisions that actually
          determine whether the business works.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Six things to do, roughly in order</h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <Card key={s.n}>
                <CardContent className="p-6 flex gap-5">
                  <span className="text-2xl font-bold text-primary/40 shrink-0">{s.n}</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                    <p className="text-muted-foreground">{s.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Pricing is the decision that compounds</h2>
          <p className="text-muted-foreground mb-4">
            Nearly every photographer who has been working for five years will tell you they
            started too cheap. The reason it matters is not the money you lose on early jobs — it
            is that your price sets the clients you attract, and those clients refer people like
            themselves. Underpricing does not just cost you income now; it builds an audience that
            expects that price.
          </p>
          <p className="text-muted-foreground mb-4">
            Work from the number you need rather than from what everyone else charges. Decide your
            target annual income, add every real cost — insurance, gear replacement, software,
            delivery, travel, taxes — and divide by the number of sessions you can genuinely
            shoot, edit, and deliver without burning out. For most people that is far fewer
            sessions than they imagine, because editing dominates the calendar.
          </p>
          <p className="text-muted-foreground">
            Raise prices between clients rather than during a relationship. It is much easier to
            quote a new client a higher figure than to explain an increase to someone who booked
            you last year.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            The costs nobody warns you about
          </h2>
          <p className="text-muted-foreground mb-4">
            The camera is the expense people plan for. The ones that catch beginners are the
            recurring ones: editing software subscriptions, cloud storage that grows every single
            year and never shrinks, gallery delivery, a website, insurance, and the second body
            you will eventually need so that a failure mid-wedding is an inconvenience rather than
            a catastrophe.
          </p>
          <p className="text-muted-foreground mb-4">
            Storage deserves particular attention because it is the one cost that only ever
            increases. Every wedding you shoot adds permanently to what you are carrying, and
            unlike gear, you cannot sell last year&apos;s. Photographers who ignore this spend
            year three doing an unpleasant archive audit and deleting client work they would
            rather have kept.
          </p>
          <p className="text-muted-foreground">
            Budget for it as a line item from the beginning, the same way you budget for
            insurance, rather than discovering it as a surprise.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your first clients come from people</h2>
          <p className="text-muted-foreground mb-4">
            Not from advertising, and not from social media follower counts. They come from people
            who already know you, and then from the people those clients talk to. This is slow at
            the start and then accelerates, which is exactly why the first year feels like
            evidence that it is not working when it is working normally.
          </p>
          <p className="text-muted-foreground mb-4">
            Second shooting is the shortcut. You get paid, you build a portfolio with real
            clients, you learn how a wedding day actually unfolds, and you gain a relationship
            with someone who will pass on the bookings they cannot take. Approach photographers
            whose work you genuinely admire, be specific about what you can do, and be reliable.
          </p>
          <p className="text-muted-foreground">
            After that, the highest-return thing you can do is stay findable to former clients.
            Families rebook — newborn, then first birthday, then school photos, then a wedding.
            The photographer they can still reach is the one who gets the next session.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Delivery is part of the product</h2>
          <p className="text-muted-foreground mb-4">
            Clients judge you on two things they can actually assess: how the day felt, and how
            they received the photos. They cannot reliably evaluate your lighting. They can
            absolutely tell whether the gallery worked on their mother&apos;s phone.
          </p>
          <p className="text-muted-foreground mb-4">
            The most common complaint about photo delivery is not quality — it is galleries
            expiring. A client goes looking for their photos three years later, finds a dead link,
            and emails you. You then either re-upload from an archive or explain that the files
            are gone. Neither generates a referral.
          </p>
          <p className="text-muted-foreground">
            Choosing delivery that stays available removes that problem permanently, and turns the
            gallery into a reason clients come back rather than a support ticket. If you want the
            longer version, our guide to{' '}
            <Link href="/resources/photographer-recurring-revenue" className="text-primary hover:underline">
              recurring revenue for photographers
            </Link>{' '}
            covers how delivered galleries keep earning.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common questions</h2>
          <FaqAccordion items={FAQS} />
        </section>

        <p className="text-sm text-muted-foreground mb-10 border-l-2 border-muted pl-4">
          This guide covers general business practice, not legal, tax, or financial advice.
          Registration, insurance, and tax requirements vary by jurisdiction — check what applies
          where you work.
        </p>

        <Card className="bg-muted/40">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">Delivery that pays you back</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              PhotoVault keeps every gallery you deliver permanently available, and pays you 50%
              of what your clients spend keeping them.
            </p>
            <Button asChild size="lg">
              <Link href="/photographers">
                See how it works
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </article>
    </>
  )
}
