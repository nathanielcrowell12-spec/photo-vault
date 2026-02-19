import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  DollarSign,
  ArrowRight,
  Shield,
  Users,
  HardDrive,
  Layers,
  Scale,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "PhotoVault vs Pixieset 2026 | Honest Comparison for Photographers",
  description:
    "Detailed comparison of PhotoVault and Pixieset for professional photographers. Compare pricing, business models, features, and which platform fits your photography business.",
  keywords:
    "PhotoVault vs Pixieset, Pixieset alternative, Pixieset vs PhotoVault, photo delivery platform comparison, photographer gallery platform, Pixieset alternative with passive income",
  openGraph: {
    type: "article",
    title:
      "PhotoVault vs Pixieset 2026 | Honest Comparison for Photographers",
    description:
      "Compare PhotoVault and Pixieset side-by-side. Pricing, business models, features, and which platform fits your photography business.",
    url: "https://photovault.photo/resources/photovault-vs-pixieset",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoVault vs Pixieset 2026",
    description:
      "Honest comparison for photographers. Different business models, different strengths.",
  },
  alternates: {
    canonical: "https://photovault.photo/resources/photovault-vs-pixieset",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://photovault.photo",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Resources",
      item: "https://photovault.photo/resources",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "PhotoVault vs Pixieset",
      item: "https://photovault.photo/resources/photovault-vs-pixieset",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "PhotoVault vs Pixieset: Which Platform Is Right for Your Photography Business?",
  description:
    "Detailed comparison of PhotoVault and Pixieset for professional photographers. Compare pricing, business models, and features.",
  author: {
    "@type": "Organization",
    name: "PhotoVault",
    url: "https://photovault.photo",
  },
  publisher: {
    "@type": "Organization",
    name: "PhotoVault",
    logo: {
      "@type": "ImageObject",
      url: "https://photovault.photo/images/logos/photovault-logo.png",
    },
  },
  datePublished: "2026-02-16",
  dateModified: "2026-02-16",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://photovault.photo/resources/photovault-vs-pixieset",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I use PhotoVault and Pixieset together?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many photographers use Pixieset for CRM, contracts, and invoicing while using PhotoVault for gallery delivery and passive income. The platforms serve different purposes and complement each other well.",
      },
    },
    {
      "@type": "Question",
      name: "What does passive income mean for photographers on PhotoVault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When you deliver a gallery through PhotoVault, your client pays for their own storage ($8/month or a prepaid package). You earn 50% of whatever they pay — $4/month on recurring plans, or $50 on a $100 annual package. This income continues for as long as the client keeps their gallery, with no additional work from you.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to client photos if I stop using PhotoVault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault's Orphan Protocol keeps client galleries accessible even if the photographer leaves the platform. Clients who are paying for storage keep their photos. This is a key difference from platforms where galleries disappear when the photographer cancels.",
      },
    },
    {
      "@type": "Question",
      name: "Does Pixieset offer any revenue sharing with photographers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pixieset does not share subscription revenue with photographers. Photographers can earn income through Pixieset's print store by marking up lab prices, but there is no commission or revenue share on the platform subscription itself. The photographer pays Pixieset; the client pays nothing for gallery access.",
      },
    },
    {
      "@type": "Question",
      name: "Is PhotoVault ready for professional use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault is currently in beta. Core functionality (gallery delivery, client access, Stripe payments, desktop uploads) is working. Founding photographers get free access during the beta period. The platform is newer than Pixieset and has a more focused feature set — it does not include a website builder, CRM, or print store.",
      },
    },
  ],
};

const tocItems = [
  { id: "tldr", label: "TL;DR" },
  { id: "comparison-table", label: "At-a-Glance Comparison" },
  { id: "business-model", label: "The Business Model Difference" },
  { id: "features", label: "Feature Comparison" },
  { id: "best-for-photovault", label: "Who PhotoVault Is Best For" },
  { id: "best-for-pixieset", label: "Who Pixieset Is Best For" },
  { id: "faq", label: "Common Questions" },
];

export default function PhotoVaultVsPixiesetPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/resources/photo-storage-guide" className="hover:text-foreground">
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">PhotoVault vs Pixieset</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            PhotoVault vs Pixieset: Which Platform Is Right for Your
            Photography Business?
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Both platforms deliver photo galleries to clients. But they run
            on fundamentally different business models — and that changes
            everything about how they work for your photography business.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Published February 16, 2026</span>
            <span>~8 min read</span>
          </div>
        </header>

        {/* TL;DR */}
        <section id="tldr" className="mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                TL;DR
              </h2>
              <p className="text-foreground mb-3">
                <strong>Pixieset</strong> is an all-in-one platform — galleries,
                website builder, CRM, contracts, and print store. The
                photographer pays for everything; clients access galleries for
                free. It&apos;s mature, feature-rich, and trusted by thousands
                of photographers.
              </p>
              <p className="text-foreground mb-3">
                <strong>PhotoVault</strong> is a focused delivery + archival
                platform with a different business model. Clients pay for their
                own storage, and photographers earn 50% of every payment as
                passive income. Fewer features, but your past work generates
                recurring revenue.
              </p>
              <p className="text-sm text-muted-foreground">
                PhotoVault is currently in beta — founding photographers get
                free platform access during the beta period. The comparison
                below uses standard pricing for both platforms.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Table of Contents */}
        <section className="mb-12">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-3">
                In This Comparison
              </h2>
              <ul className="space-y-2">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <ArrowRight className="h-3 w-3" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* At-a-Glance Comparison Table */}
        <section id="comparison-table" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            At-a-Glance Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    PhotoVault
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    Pixieset
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Business model
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Client-pays, photographer earns commission
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Photographer-pays subscription
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Photographer cost
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    $22/month flat*
                    <span className="block text-xs text-primary mt-1">
                      *Free during beta
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Free &ndash; $65/month
                    <span className="block text-xs text-muted-foreground mt-1">
                      Scales with storage and features
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Client cost
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    $8/month or $100/year prepaid
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Free (photographer covers it)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Revenue for photographer
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    $50 upfront + $4/month per client
                    <span className="block text-xs text-muted-foreground mt-1">
                      50% of whatever client pays
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Print store markup only
                    <span className="block text-xs text-muted-foreground mt-1">
                      No platform revenue share
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Storage</td>
                  <td className="py-3 px-4 text-foreground">
                    Included in client plan
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    3GB free, then 10GB&ndash;unlimited by tier
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Gallery delivery
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Website builder
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    CRM / Contracts / Invoicing
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Print store
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Client proofing / Favorites
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Desktop upload app
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Large file support
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <AlertTriangle className="h-4 w-4 text-amber-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Lightroom plugin only
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Orphan protection
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Photos survive if photographer leaves
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Platform maturity
                  </td>
                  <td className="py-3 px-4">
                    <AlertTriangle className="h-4 w-4 text-amber-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Beta (launched 2026)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Established (thousands of photographers)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* The Business Model Difference */}
        <section id="business-model" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            The Business Model Difference
          </h2>

          <p className="text-muted-foreground mb-6">
            This is the most important difference between these two platforms,
            and it affects everything else — pricing, incentives, and what
            happens to your business as you grow.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-amber-500">Pixieset&apos;s Model</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You pay Pixieset a monthly subscription. Your clients get
                  gallery access for free. As your business grows and you need
                  more storage, your costs go up. You can earn from print
                  sales through their store, but Pixieset doesn&apos;t share
                  any subscription revenue with you.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground">
                    More clients = more storage = higher subscription tier
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-primary">
                    PhotoVault&apos;s Model
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You pay a flat $22/month platform fee. Your clients pay for
                  their own storage — either $8/month or a $100 annual package.
                  You earn 50% of whatever your client pays: $4/month on
                  recurring plans, or $50 on a $100 annual package.
                </p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground">
                    More clients = more recurring income for you
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Math Example */}
          <Card className="bg-card/50 border-border mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                What the Numbers Look Like
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Say you photograph 50 sessions this year and each client stays
                on a monthly plan:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-amber-500 mb-2">
                    On Pixieset (Pro tier)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Platform cost: ~$30/month</li>
                    <li>Revenue from platform: $0</li>
                    <li>
                      Print store revenue: varies (you set markup)
                    </li>
                    <li className="font-medium text-foreground pt-2">
                      Net from platform: -$30/month
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-2">
                    On PhotoVault
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Platform cost: $22/month</li>
                    <li>
                      Upfront commissions: $50 per client ($2,500 total over
                      the year)
                    </li>
                    <li>
                      Recurring revenue: $4/month &times; 50 clients =
                      $200/month
                    </li>
                    <li className="font-medium text-foreground pt-2">
                      Net from platform: +$178/month recurring, plus $2,500 in
                      upfront commissions
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-foreground">
                  <strong>The key insight:</strong> On Pixieset, your 50th
                  client costs you more storage. On PhotoVault, your 50th
                  client earns you another $4/month forever — for work
                  you&apos;ve already completed.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            These numbers assume clients on the $8/month recurring plan. Clients
            who choose the $100 annual package pay upfront instead — you earn
            $50 immediately with no monthly recurring for that client. The
            actual mix will depend on what your clients prefer.
          </p>
        </section>

        {/* Feature Comparison */}
        <section id="features" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-500" />
            Feature Comparison
          </h2>

          {/* Gallery Delivery */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Gallery Delivery &amp; Client Experience
            </h3>
            <p className="text-muted-foreground mb-4">
              Both platforms deliver professional photo galleries to clients.
              Pixieset has been refining their gallery experience for years and
              it shows — they offer client favoriting, proofing with comments,
              custom download PINs, and password protection. Galleries are clean
              and clients intuitively understand how to navigate them.
            </p>
            <p className="text-muted-foreground mb-4">
              PhotoVault&apos;s galleries focus on long-term access and family
              sharing. The client experience is built around permanent archival
              rather than the initial proofing workflow. If your delivery
              process relies heavily on client proofing and selecting favorites,
              Pixieset is stronger here today.
            </p>
            <div className="bg-card/50 border border-border rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Bottom line:</strong> Pixieset has a more mature gallery
                experience with proofing workflows. PhotoVault focuses on
                permanent access and passive income from delivery.
              </p>
            </div>
          </div>

          {/* Pricing & Cost */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Pricing &amp; Cost Structure
            </h3>
            <p className="text-muted-foreground mb-4">
              Pixieset offers individual product subscriptions or a bundled
              Suite. The Client Gallery alone ranges from free (3GB) to ~$40/month
              (unlimited storage). The full Suite — galleries, website, CRM,
              and store — runs $28&ndash;$55/month on annual billing. There&apos;s
              a 15% commission on store sales for free-tier users, plus standard
              payment processing fees (2.9% + $0.30) on all plans.
            </p>
            <p className="text-muted-foreground mb-4">
              PhotoVault has one photographer price: $22/month (currently free
              during beta). No tiers, no storage limits that increase your cost.
              The client pays separately — $8/month, $100/year, or a $50
              six-month trial. Payment processing fees apply to client
              transactions through Stripe Connect.
            </p>
            <div className="bg-card/50 border border-border rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Bottom line:</strong> Pixieset&apos;s cost scales with
                your storage needs and feature usage. PhotoVault&apos;s cost is
                flat — growth is offset by client revenue.
              </p>
            </div>
          </div>

          {/* All-in-One vs Focused */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              All-in-One vs Focused Tool
            </h3>
            <p className="text-muted-foreground mb-4">
              Pixieset is genuinely all-in-one. The Suite includes a website
              builder with 30+ templates, Studio Manager for contracts and
              invoices, a booking site, a print store with lab fulfillment
              (WHCC, ProDPI, Miller&apos;s), and a mobile gallery app for
              clients. If you want one login for your entire photography
              business, Pixieset delivers.
            </p>
            <p className="text-muted-foreground mb-4">
              PhotoVault does one thing: gallery delivery with passive income.
              No website builder, no CRM, no print store, no contracts. If you
              already have a website on Squarespace or WordPress and use
              HoneyBook or Dubsado for CRM, PhotoVault slots in alongside
              your existing tools instead of replacing them.
            </p>
            <div className="bg-card/50 border border-border rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Bottom line:</strong> Need everything in one place?
                Pixieset. Already have a website and CRM? PhotoVault adds
                passive income without replacing your stack.
              </p>
            </div>
          </div>

          {/* Data Portability */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Data Portability
            </h3>
            <p className="text-muted-foreground mb-4">
              A common frustration with Pixieset is the lack of a bulk
              download or export tool. Photographers with thousands of
              images report feeling locked in — you can only download galleries
              the same way clients do, which is slow and impractical for large
              libraries.
            </p>
            <p className="text-muted-foreground mb-4">
              PhotoVault uses a dedicated desktop app for uploads (handling
              large files via chunked uploads) and standard download for
              exports. The platform is newer, so there&apos;s less legacy
              lock-in concern, but it&apos;s worth noting that any platform
              holding your images creates some dependency.
            </p>
          </div>

          {/* What Happens When You Leave */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              What Happens When You Leave
            </h3>
            <p className="text-muted-foreground mb-4">
              On Pixieset, when you cancel your subscription, your client
              galleries go dark. Clients lose access to their photos. This is
              standard for photographer-pays platforms — if the photographer
              stops paying, the service stops.
            </p>
            <p className="text-muted-foreground mb-4">
              PhotoVault has an Orphan Protocol. Because clients pay for their
              own storage, their galleries remain accessible even if the
              photographer leaves the platform. The photographer stops earning
              commissions, but the client&apos;s photos are preserved. This
              matters for wedding and portrait photographers whose clients
              expect to access their photos for decades.
            </p>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Why this matters:</strong> If you retire, change
                careers, or just switch platforms — your clients&apos; memories
                don&apos;t disappear with your subscription.
              </p>
            </div>
          </div>
        </section>

        {/* Who PhotoVault Is Best For */}
        <section id="best-for-photovault" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Who PhotoVault Is Best For
          </h2>

          <div className="space-y-4">
            {[
              {
                title: "Photographers who want passive recurring revenue",
                desc: "If you've been photographing for years and have a back catalog of past clients, PhotoVault lets you turn completed work into monthly income.",
              },
              {
                title:
                  "Photographers tired of platform costs scaling with success",
                desc: "One flat fee regardless of how many galleries you deliver or how much storage your clients use.",
              },
              {
                title: "Wedding and portrait photographers with large back catalogs",
                desc: "The passive income model is most powerful when you have dozens or hundreds of past clients who value their photos.",
              },
              {
                title: "Photographers who already have a website and CRM",
                desc: "If you're happy with Squarespace + HoneyBook (or similar), PhotoVault adds income without replacing your existing tools.",
              },
              {
                title: "Photographers who value client photo permanence",
                desc: "The Orphan Protocol means your clients' photos outlast your subscription. That matters for wedding and family photographers.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border">
                <CardContent className="p-4 flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Who Pixieset Is Best For */}
        <section id="best-for-pixieset" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Camera className="h-8 w-8 text-amber-500" />
            Who Pixieset Is Best For
          </h2>

          <div className="space-y-4">
            {[
              {
                title:
                  "Photographers who want an all-in-one platform",
                desc: "If you want gallery delivery, a website, CRM, contracts, invoicing, and a print store under one roof, Pixieset's Suite is hard to beat.",
              },
              {
                title: "Photographers just starting out",
                desc: "Pixieset's free tier (3GB, unlimited galleries) is a genuine entry point. You can deliver galleries professionally without any upfront cost.",
              },
              {
                title: "Photographers who rely on print sales",
                desc: "The integrated print store with automatic lab fulfillment (WHCC, ProDPI, Miller's) lets you sell prints without handling production or shipping.",
              },
              {
                title: "Photographers who need proofing workflows",
                desc: "Client favoriting, comments on individual photos, and custom download permissions make Pixieset strong for the proofing stage of delivery.",
              },
              {
                title: "Lightroom-centric photographers",
                desc: "The Lightroom plugin for direct gallery upload saves real time if Lightroom is central to your editing workflow.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border">
                <CardContent className="p-4 flex gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-purple-500" />
            Common Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Can I use PhotoVault and Pixieset together?
              </h3>
              <p className="text-muted-foreground">
                Yes. Many photographers use Pixieset for CRM, contracts, and
                invoicing while using PhotoVault for gallery delivery and
                passive income. The platforms serve different purposes and
                complement each other well. You don&apos;t have to choose one
                or the other.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What does passive income mean for photographers on PhotoVault?
              </h3>
              <p className="text-muted-foreground">
                When you deliver a gallery through PhotoVault, your client pays
                for their own storage — $8/month or a $100 annual package. You
                earn 50% of whatever they pay: $4/month on recurring plans, or
                $50 on a $100 annual package. This income continues for as long
                as the client keeps their gallery, with no additional work from
                you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What happens to client photos if I stop using PhotoVault?
              </h3>
              <p className="text-muted-foreground">
                PhotoVault&apos;s Orphan Protocol keeps client galleries
                accessible even if you leave the platform. Clients who are
                paying for storage keep their photos. You stop earning
                commissions, but your clients&apos; memories are preserved.
                This is a key difference from platforms where galleries
                disappear when the photographer cancels.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Does Pixieset offer any revenue sharing with photographers?
              </h3>
              <p className="text-muted-foreground">
                Pixieset does not share subscription revenue with
                photographers. You can earn income through their print store by
                marking up lab prices, but there is no commission or revenue
                share on the platform subscription itself. The photographer
                pays Pixieset; the client pays nothing for gallery access.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Is PhotoVault ready for professional use?
              </h3>
              <p className="text-muted-foreground">
                PhotoVault is currently in beta. Core functionality — gallery
                delivery, client access, Stripe payments, and desktop uploads
                for large files — is working. Founding photographers get free
                access during the beta period. The platform is newer than
                Pixieset and has a more focused feature set. It does not
                include a website builder, CRM, or print store.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Earn From Every Photoshoot?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            PhotoVault is free during beta. Join as a founding photographer and
            start turning past work into passive income — no credit card
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers">
                <Camera className="mr-2 h-5 w-5" />
                Join as a Founding Photographer
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/photographers#pricing">See Pricing Details</Link>
            </Button>
          </div>
        </section>

        {/* Related Resources */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Related Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/resources/photo-storage-comparison"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    Photo Storage Comparison 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compare PhotoVault, Google Photos, iCloud, Amazon Photos,
                    and Dropbox side-by-side.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/resources/google-photos-alternatives"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    Google Photos Alternatives 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The best alternatives after Google ended unlimited storage.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/resources/photo-storage-guide"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    The State of Photo Storage in 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Why your photos aren&apos;t as safe as you think, and what
                    to do about it.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
