import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Download, FileText } from 'lucide-react'
import { buildResourceBreadcrumb, SITE_URL } from '@/lib/resource-schema'
import { FaqAccordion, buildFaqSchema, type FaqItem } from '@/components/resources/FaqAccordion'

const SLUG = 'photography-invoice-template'
// Route handler, not a public/*.html file — Vercel cleanUrls 308-redirects every
// public *.html to its extensionless path, which here is this very page.
const ASSET = '/resources/photography-invoice-template/download'

export const metadata: Metadata = {
  title: 'Free Photography Invoice Template | PhotoVault',
  description:
    'A free, print-ready photography invoice template, plus what to put on every line — rates, retainers, travel, tax, and payment terms that get you paid on time.',
  alternates: { canonical: `${SITE_URL}/resources/${SLUG}` },
  openGraph: {
    type: 'article',
    title: 'Free Photography Invoice Template',
    description:
      'A print-ready invoice template for photographers, and what to put on every line so you get paid on time.',
    url: `${SITE_URL}/resources/${SLUG}`,
    siteName: 'PhotoVault',
  },
}

const breadcrumbSchema = buildResourceBreadcrumb(SLUG, 'Photography Invoice Template')

const FAQS: FaqItem[] = [
  {
    question: 'What should a photography invoice include?',
    answer:
      'At minimum: your business name and contact details, the client name and address, a unique invoice number, the issue date and due date, an itemised list of what you photographed and what each part cost, any retainer already paid, the balance due, and how to pay. Anything missing from that list is a reason for someone in an accounts department to put your invoice aside.',
  },
  {
    question: 'How soon should photographers invoice after a shoot?',
    answer:
      'Send the final invoice the same week as the session while the work is fresh in the client mind. For weddings and larger commercial jobs, invoice the retainer at booking and the balance either before delivery or on delivery, whichever your agreement specifies. The longer the gap between the work and the invoice, the longer the gap before payment.',
  },
  {
    question: 'What payment terms should I use?',
    answer:
      'Net 14 is a reasonable default for consumer work and gets you paid roughly twice as fast as Net 30. Corporate and agency clients often impose their own terms regardless of what you write, so ask before the shoot rather than discovering it afterwards. Whatever you choose, put the actual calendar due date on the invoice, not just the number of days.',
  },
  {
    question: 'Should I charge a late fee?',
    answer:
      'Stating a late fee on the invoice — commonly 1.5% per month — makes a difference even when you never enforce it, because it signals the due date is real. Check what your jurisdiction allows before setting a rate, and make sure the same terms appear in your signed agreement, not only on the invoice.',
  },
  {
    question: 'Do I need to charge sales tax on photography?',
    answer:
      'It depends entirely on where you work and on what you are selling. Many places treat digital images, prints, and services differently, and some tax the whole session when any physical product is included. This is the one line on an invoice worth asking a local accountant about once, and then applying consistently.',
  },
  {
    question: 'Is an invoice the same as a contract?',
    answer:
      'No, and this trips people up. An invoice is a request for payment for work covered by an agreement you already have. It is not the agreement. Terms you want to be enforceable — cancellation, usage rights, delivery timelines — belong in a signed contract before the shoot; the invoice should reference them, not introduce them.',
  },
]

const faqSchema = buildFaqSchema(FAQS)

const LINE_ITEMS = [
  {
    label: 'Coverage',
    detail:
      'The actual shooting time, named the way the client thinks about it — "wedding photography, full day coverage" beats "photography services". Include hours and location.',
  },
  {
    label: 'Additional shooters',
    detail:
      'A separate line, with their hours. Clients query a single large number far more often than they query four smaller ones that add up to it.',
  },
  {
    label: 'Editing and delivery',
    detail:
      'Post-production is the majority of the work and invisible to the client unless you itemise it. Naming it also makes your rate defensible.',
  },
  {
    label: 'Travel',
    detail:
      'Mileage at a stated rate, or a flat fee agreed in advance. Never bury travel inside the session fee — it looks like a price rise if you ever charge it separately.',
  },
  {
    label: 'Retainer already paid',
    detail:
      'Show it as a deduction, not by quietly reducing the total. The client should see the full value of the work and then see what they have already paid.',
  },
]

export default function PhotographyInvoiceTemplatePage() {
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
          <span className="text-foreground">Photography Invoice Template</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Free Photography Invoice Template
        </h1>

        <p className="text-xl text-muted-foreground mb-8">
          A print-ready invoice you can fill in and send today, plus an explanation of what
          belongs on every line. Most late payments are not caused by difficult clients. They are
          caused by invoices that are missing something, so the payment sits in someone&apos;s
          pile until they get round to asking.
        </p>

        <Card className="mb-12 border-primary/40">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <FileText className="h-10 w-10 text-primary shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-semibold text-lg mb-1">The template</h2>
              <p className="text-muted-foreground text-sm">
                Opens in your browser. Replace the bracketed placeholders, then print to PDF
                (Ctrl/Cmd&nbsp;+&nbsp;P → Save as PDF). No signup, no email required.
              </p>
            </div>
            <Button asChild>
              <a href={ASSET} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Open template
              </a>
            </Button>
          </CardContent>
        </Card>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">What goes on every photography invoice</h2>
          <p className="text-muted-foreground mb-4">
            An invoice has one job: to be so easy to approve that nobody needs to ask you a
            question first. Every question your invoice provokes adds days. The following are the
            fields that, when missing, reliably cause someone to set your invoice aside.
          </p>
          <ul className="space-y-3 text-muted-foreground list-disc pl-5 mb-4">
            <li>
              <strong className="text-foreground">A unique invoice number.</strong> Sequential is
              fine. Without one, neither you nor your client can reference a specific invoice in
              an email, and reconciliation at tax time becomes guesswork.
            </li>
            <li>
              <strong className="text-foreground">Both addresses.</strong> Yours and the
              client&apos;s. Business clients often cannot process an invoice that does not carry
              their own billing address exactly as they gave it.
            </li>
            <li>
              <strong className="text-foreground">An actual due date.</strong> Write the calendar
              date, not only &quot;Net 14&quot;. It removes the arithmetic, and the excuse.
            </li>
            <li>
              <strong className="text-foreground">The session date.</strong> Separate from the
              invoice date. It ties the bill to the work, which matters when a client books you
              several times a year.
            </li>
            <li>
              <strong className="text-foreground">How to pay.</strong> Bank details or a payment
              link, on the invoice itself. Not in the covering email, which gets forwarded without
              the message body.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">How to itemise the work</h2>
          <p className="text-muted-foreground mb-6">
            Itemising is not bureaucracy — it is how you make your price legible. A single line
            reading &quot;Photography — $3,380&quot; invites a negotiation. The same total split
            across five lines invites approval, because the client can see what they are paying
            for.
          </p>
          <div className="space-y-4">
            {LINE_ITEMS.map((i) => (
              <Card key={i.label}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-1">{i.label}</h3>
                  <p className="text-muted-foreground text-sm">{i.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Getting paid faster</h2>
          <p className="text-muted-foreground mb-4">
            The single biggest lever is shortening your terms. Net 14 rather than Net 30 roughly
            halves the wait, and almost no consumer client objects, because most of them intend to
            pay immediately anyway. The second lever is invoicing sooner — the same week as the
            shoot rather than at the end of the month.
          </p>
          <p className="text-muted-foreground mb-4">
            Take a retainer at booking. It is standard in this industry, clients expect it, and it
            means a cancellation does not leave you with nothing for a date you turned other work
            away for. Show it on the final invoice as a deduction so the client sees the full
            value of what you did.
          </p>
          <p className="text-muted-foreground">
            Finally, decouple delivery from payment chasing. If your galleries expire, a client
            who pays late also loses access, and you end up doing admin to restore it. Galleries
            that simply stay available remove an entire category of awkward conversation.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">An invoice is not a contract</h2>
          <p className="text-muted-foreground mb-4">
            Worth stating plainly, because it is the most common mistake photographers make with
            paperwork. Your invoice requests payment for work already covered by an agreement. It
            does not create that agreement. Cancellation policy, image usage rights, delivery
            timelines, and what happens if the client wants a reshoot all belong in a signed
            contract before the shoot.
          </p>
          <p className="text-muted-foreground">
            If those terms appear for the first time on your invoice, you are relying on the
            client&apos;s goodwill rather than on anything you could point to. The invoice should
            reference the agreement, not substitute for it.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common questions</h2>
          <FaqAccordion items={FAQS} />
        </section>

        <p className="text-sm text-muted-foreground mb-10 border-l-2 border-muted pl-4">
          This template and guide cover billing practice, not legal or tax advice. Sales tax
          treatment, permitted late fees, and invoicing requirements vary by jurisdiction — check
          what applies where you work.
        </p>

        <Card className="bg-muted/40">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">Get paid after the invoice, too</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              PhotoVault pays photographers 50% of what their clients spend keeping galleries
              alive — recurring income from work you have already delivered and already invoiced.
            </p>
            <Button asChild size="lg">
              <Link href="/photographers">
                How it works
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </article>
    </>
  )
}
