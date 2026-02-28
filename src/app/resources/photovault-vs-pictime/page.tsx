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
  HardDrive,
  Scale,
  HelpCircle,
  TrendingUp,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "PhotoVault vs Pic-Time 2026 | Honest Comparison for Photographers",
  description:
    "Detailed comparison of PhotoVault and Pic-Time for professional photographers. Compare pricing, business models, features, and which platform fits your photography business.",
  keywords:
    "PhotoVault vs Pic-Time, Pic-Time alternative, Pic-Time vs PhotoVault, photo delivery platform comparison, photographer gallery platform, Pic-Time alternative with passive income",
  openGraph: {
    type: "article",
    title:
      "PhotoVault vs Pic-Time 2026 | Honest Comparison for Photographers",
    description:
      "Compare PhotoVault and Pic-Time side-by-side. Pricing, business models, features, and which platform fits your photography business.",
    url: "https://www.photovault.photo/resources/photovault-vs-pictime",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoVault vs Pic-Time 2026",
    description:
      "Honest comparison for photographers. Different business models, different strengths.",
  },
  alternates: {
    canonical: "https://www.photovault.photo/resources/photovault-vs-pictime",
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
      item: "https://www.photovault.photo",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Resources",
      item: "https://www.photovault.photo/resources",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "PhotoVault vs Pic-Time",
      item: "https://www.photovault.photo/resources/photovault-vs-pictime",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "PhotoVault vs Pic-Time: Which Platform Is Right for Your Photography Business?",
  description:
    "Detailed comparison of PhotoVault and Pic-Time for professional photographers. Compare pricing, business models, and features.",
  author: {
    "@type": "Person",
    name: "Nate Crowell",
    jobTitle: "Founder",
    worksFor: { "@type": "Organization", name: "PhotoVault LLC" },
    url: "https://www.photovault.photo/about",
  },
  publisher: {
    "@type": "Organization",
    name: "PhotoVault",
    logo: {
      "@type": "ImageObject",
      url: "https://www.photovault.photo/images/logos/photovault-logo.png",
    },
  },
  datePublished: "2026-02-27",
  dateModified: "2026-02-27",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.photovault.photo/resources/photovault-vs-pictime",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I use PhotoVault and Pic-Time together?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Many photographers use Pic-Time for proofing, print sales, and marketing automation while using PhotoVault for permanent gallery delivery and passive income. The platforms serve different purposes and complement each other.",
      },
    },
    {
      "@type": "Question",
      name: "Does Pic-Time offer passive income like PhotoVault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pic-Time offers print store markup revenue (you set your prices above lab costs) and a Gallery Backup subscription feature where clients pay to keep galleries online. However, it does not have a commission-based passive income model where photographers automatically earn 50% of client subscription payments like PhotoVault.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to client photos if I cancel Pic-Time?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On Pic-Time, if you cancel or downgrade, galleries exceeding your new storage limit are permanently deleted after 45 days, starting with the oldest. On PhotoVault, the Orphan Protocol keeps client galleries accessible because clients pay for their own storage independently.",
      },
    },
    {
      "@type": "Question",
      name: "Which platform is better for wedding photographers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pic-Time excels at the wedding workflow: proofing, album design, vendor galleries, print sales, and marketing automation. PhotoVault excels at long-term gallery preservation and passive income. Many wedding photographers could benefit from using Pic-Time for the active wedding season workflow and PhotoVault for permanent delivery and recurring revenue.",
      },
    },
    {
      "@type": "Question",
      name: "Is PhotoVault ready for professional use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault is currently in beta. Core functionality (gallery delivery, client access, Stripe payments, desktop uploads) is working. Founding photographers get 12 months free and the $22/month rate locked in forever. The platform is intentionally focused on gallery delivery and passive income rather than competing on proofing, print sales, or marketing tools.",
      },
    },
  ],
};

const tocItems = [
  { id: "tldr", label: "TL;DR" },
  { id: "comparison-table", label: "At-a-Glance Comparison" },
  { id: "business-model", label: "The Business Model Difference" },
  { id: "pricing", label: "Pricing Breakdown" },
  { id: "features", label: "Feature Comparison" },
  { id: "best-for-photovault", label: "Who PhotoVault Is Best For" },
  { id: "best-for-pictime", label: "Who Pic-Time Is Best For" },
  { id: "faq", label: "Common Questions" },
];

export default function PhotoVaultVsPicTimePage() {
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
          <span className="text-foreground">PhotoVault vs Pic-Time</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            PhotoVault vs Pic-Time: Which Platform Is Right for Your
            Photography Business?
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            An honest comparison. Both platforms deliver galleries to clients, but
            they solve fundamentally different problems. Pic-Time is a feature-rich
            gallery platform with proofing, print sales, and marketing automation.
            PhotoVault is a focused delivery platform that turns completed
            photoshoots into passive income.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Published February 2026. We built PhotoVault, so we have a bias.
            We&apos;ll be transparent about where Pic-Time is genuinely stronger.
          </p>
        </header>

        {/* Table of Contents */}
        <nav className="mb-12">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2">
                On This Page
              </p>
              <ul className="space-y-1">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </nav>

        {/* TL;DR */}
        <section id="tldr" className="mb-16">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                TL;DR
              </h2>
              <div className="space-y-3 text-sm text-foreground">
                <p>
                  <strong>Choose Pic-Time</strong> if you want a
                  full-service gallery platform with client proofing, album design,
                  a built-in print store, AI search, and marketing automation. You pay
                  $25&ndash;$50/month (depending on storage needs) and your clients
                  get free access.
                </p>
                <p>
                  <strong>Choose PhotoVault</strong> if you want a
                  simple gallery delivery tool that generates passive income. You pay
                  $22/month (free for 12 months during beta, rate locked forever).
                  Clients pay for their own storage and you earn 50% of every payment.
                </p>
                <p>
                  <strong>Use both</strong> if you want Pic-Time&apos;s workflow tools
                  during the active project phase and PhotoVault for permanent delivery
                  and recurring revenue.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* At-a-Glance Comparison Table */}
        <section id="comparison-table" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            At-a-Glance Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Feature
                  </th>
                  <th className="text-left py-3 px-4 text-primary font-semibold">
                    PhotoVault
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    Pic-Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Business model</td>
                  <td className="py-3 px-4 text-foreground">Client-pays + commission</td>
                  <td className="py-3 px-4 text-foreground">Photographer-pays subscription</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Photographer cost</td>
                  <td className="py-3 px-4 text-foreground">$22/mo flat (free 12mo beta, locked forever)</td>
                  <td className="py-3 px-4 text-foreground">Free &ndash; $50/mo (by storage tier)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Client cost</td>
                  <td className="py-3 px-4 text-foreground">$8/mo or $50&ndash;$100 prepaid</td>
                  <td className="py-3 px-4 text-foreground">Free (photographer absorbs cost)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Storage</td>
                  <td className="py-3 px-4 text-foreground">Unlimited (no tiers)</td>
                  <td className="py-3 px-4 text-foreground">3 GB &ndash; Unlimited (by plan)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Passive income</td>
                  <td className="py-3 px-4 text-foreground">50% of every client payment</td>
                  <td className="py-3 px-4 text-foreground">Print markup + Gallery Backup subscriptions</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Client proofing</td>
                  <td className="py-3 px-4 text-foreground">No</td>
                  <td className="py-3 px-4 text-foreground">Yes (favorites, album proofing)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Print store</td>
                  <td className="py-3 px-4 text-foreground">No</td>
                  <td className="py-3 px-4 text-foreground">Yes (integrated with labs)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">AI features</td>
                  <td className="py-3 px-4 text-foreground">No</td>
                  <td className="py-3 px-4 text-foreground">Face recognition, text search</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Marketing automation</td>
                  <td className="py-3 px-4 text-foreground">Drip email campaigns</td>
                  <td className="py-3 px-4 text-foreground">Abandoned cart, anniversary, holiday campaigns</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Gallery protection</td>
                  <td className="py-3 px-4 text-foreground">Orphan Protocol (survives cancellation)</td>
                  <td className="py-3 px-4 text-foreground">Deleted after 45 days on cancel/downgrade</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Desktop app</td>
                  <td className="py-3 px-4 text-foreground">Yes (large upload support)</td>
                  <td className="py-3 px-4 text-foreground">Yes (uploader + Lightroom plugin)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Website builder</td>
                  <td className="py-3 px-4 text-foreground">No (intentionally)</td>
                  <td className="py-3 px-4 text-foreground">Portfolio pages only (not full sites)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">CRM / contracts</td>
                  <td className="py-3 px-4 text-foreground">No (use HoneyBook, Dubsado, etc.)</td>
                  <td className="py-3 px-4 text-foreground">No (integrates with HoneyBook, Dubsado, etc.)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Family sharing</td>
                  <td className="py-3 px-4 text-foreground">Yes (secondary accounts)</td>
                  <td className="py-3 px-4 text-foreground">Guest access (QR codes, vendor galleries)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Business Model Difference */}
        <section id="business-model" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            The Business Model Difference
          </h2>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is the fundamental difference. It shapes everything else about
              how the two platforms work.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    PhotoVault: Client-Pays Model
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>You pay $22/month for the platform (flat, no tiers)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>Your client pays for their own gallery access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>You earn 50% of every client payment automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>More clients = more income, not higher costs</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    Pic-Time: Photographer-Pays Model
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>You pay $0&ndash;$50/month based on storage needs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Your client views and downloads for free</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Revenue comes from print markup and Gallery Backup subscriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>More clients = more storage = potentially higher tier needed</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Neither model is objectively better.</strong>{" "}
                  The client-pays model works best when clients value permanent access and
                  the photographer wants recurring passive income. The photographer-pays
                  model works best when client access is a deliverable included in
                  the shoot price and the photographer earns primarily through print sales.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Breakdown */}
        <section id="pricing" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Pricing Breakdown
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                PhotoVault Pricing
              </h3>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span className="font-medium text-foreground">$22/month (flat)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Beta offer</span>
                      <span className="font-medium text-primary">12 months free, $22/mo locked forever</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Storage limits</span>
                      <span className="font-medium text-foreground">Unlimited (no tiers)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Commission earned</span>
                      <span className="font-medium text-foreground">50% of every client payment</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Break-even</span>
                      <span className="font-medium text-foreground">6 clients on monthly plans</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Pic-Time Pricing (Gallery Delivery Suite)
              </h3>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Free plan</span>
                      <span className="font-medium text-foreground">$0/mo &mdash; 3 GB storage</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Beginner</span>
                      <span className="font-medium text-foreground">$8/mo &mdash; 10 GB storage</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Professional</span>
                      <span className="font-medium text-foreground">$25/mo &mdash; 100 GB storage</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Advanced</span>
                      <span className="font-medium text-foreground">$50/mo &mdash; Unlimited storage</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Art Store add-on</span>
                      <span className="font-medium text-foreground">~$20/mo additional</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Print commission</span>
                      <span className="font-medium text-foreground">15% on Free/Beginner, 0% on Professional+ (self-collected)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Real cost comparison:</strong>{" "}
                  A photographer with 50+ galleries likely needs Pic-Time&apos;s Professional
                  ($25/mo) or Advanced ($50/mo) plan, plus the Art Store add-on (~$20/mo)
                  for print sales &mdash; totaling $45&ndash;$70/month. On PhotoVault, it&apos;s
                  $22/month flat regardless of gallery count, and with 50 clients you&apos;d
                  be earning $200/month in commissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Comparison */}
        <section id="features" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Feature Comparison
          </h2>

          <div className="space-y-8">
            {/* Where Pic-Time Wins */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Where Pic-Time Is Stronger
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ll be direct: Pic-Time has more features than PhotoVault in several areas.
              </p>
              <div className="space-y-3">
                {[
                  {
                    feature: "Client Proofing & Album Design",
                    detail:
                      "Clients can select favorites and design albums directly in the gallery. PhotoVault focuses on delivery, not proofing.",
                  },
                  {
                    feature: "Integrated Print Store",
                    detail:
                      "Built-in storefront with lab fulfillment, custom markup, and automated marketing. PhotoVault has no print store (use your preferred lab).",
                  },
                  {
                    feature: "AI Gallery Search",
                    detail:
                      "Face recognition and free-text search (\"dancing\", \"cake cutting\") help clients find specific photos. PhotoVault does not have AI search.",
                  },
                  {
                    feature: "Marketing Automation",
                    detail:
                      "Abandoned cart emails, anniversary campaigns, holiday promotions, and sales banners. PhotoVault has drip campaigns but not sales-focused automation.",
                  },
                  {
                    feature: "Vendor Galleries",
                    detail:
                      "AI auto-groups wedding photos by vendor (florist, venue, planner) for easy sharing. PhotoVault does not have vendor-specific features.",
                  },
                  {
                    feature: "Lightroom Integration",
                    detail:
                      "Official Lightroom Classic plugin for publishing directly from your editing workflow. PhotoVault uses a standalone desktop app.",
                  },
                ].map((item) => (
                  <Card key={item.feature} className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {item.feature}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Where PhotoVault Wins */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Where PhotoVault Is Stronger
              </h3>
              <div className="space-y-3">
                {[
                  {
                    feature: "Automatic Passive Income",
                    detail:
                      "50% commission on every client payment, deposited directly via Stripe Connect. No print sales required, no markup management, no lab fulfillment. Just deliver a gallery and earn.",
                  },
                  {
                    feature: "Gallery Protection (Orphan Protocol)",
                    detail:
                      "Client galleries survive even if you leave the platform. On Pic-Time, galleries exceeding your storage limit are permanently deleted 45 days after cancellation or downgrade.",
                  },
                  {
                    feature: "Flat Pricing (No Storage Tiers)",
                    detail:
                      "One price: $22/month for unlimited everything. No calculating which tier you need, no worrying about exceeding 3 GB, 10 GB, or 100 GB limits.",
                  },
                  {
                    feature: "Client-Pays Model",
                    detail:
                      "When clients pay for their own storage, more clients means more income for you. On Pic-Time, more clients means more storage used and potentially a higher plan tier.",
                  },
                  {
                    feature: "Locked-In Beta Pricing",
                    detail:
                      "Founding photographers get 12 months free and the $22/month rate locked in forever. Pic-Time's free plan was reduced from 10 GB to 3 GB in 2024 — plan terms can change.",
                  },
                  {
                    feature: "Family Sharing (Secondary Accounts)",
                    detail:
                      "Clients can add family members as secondary users with full gallery access across all their photographers. Pic-Time offers guest access via QR codes but not dedicated family accounts.",
                  },
                ].map((item) => (
                  <Card key={item.feature} className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {item.feature}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* What Neither Platform Does */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                What Neither Platform Does
              </h3>
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    {[
                      "Full website builder with custom domain (use Squarespace, WordPress, etc.)",
                      "Built-in CRM, contracts, or invoicing (use HoneyBook, Dubsado, etc.)",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Note: Pixieset (a third option) does offer a full website builder and
                    built-in CRM.{" "}
                    <Link
                      href="/resources/photovault-vs-pixieset"
                      className="text-primary hover:underline"
                    >
                      See our PhotoVault vs Pixieset comparison
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Revenue Comparison */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Revenue Model: Print Sales vs Subscription Commission
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  PhotoVault: Subscription Commission
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Automatic &mdash; earn by delivering galleries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Recurring &mdash; $4/month per client, ongoing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>No management &mdash; no inventory, no fulfillment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>No print sales revenue</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Pic-Time: Print Store + Gallery Backup
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Print store with full markup control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Marketing automation drives print sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Gallery Backup subscriptions for recurring revenue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                    <span>15% commission on sales (Free/Beginner plans)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                    <span>Requires active management of store and pricing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Best For Sections */}
        <section id="best-for-photovault" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            PhotoVault Is Best For
          </h2>
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <ul className="space-y-3">
                {[
                  "Photographers who want passive income from completed work without managing a print store",
                  "Photographers who value permanent gallery protection (Orphan Protocol)",
                  "Family, portrait, and milestone photographers whose clients value long-term access",
                  "Photographers who want flat, predictable pricing with no storage tiers",
                  "Photographers already using a CRM (HoneyBook, Dubsado) who want a focused delivery tool",
                  "Photographers who want their cost structure to improve as they grow (more clients = more income)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="best-for-pictime" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Pic-Time Is Best For
          </h2>
          <Card className="border-border">
            <CardContent className="p-6">
              <ul className="space-y-3">
                {[
                  "Wedding photographers who need proofing, album design, and vendor gallery features",
                  "Photographers who earn significant revenue through print sales",
                  "Photographers who want AI-powered gallery search (face recognition, free-text search)",
                  "Photographers who want aggressive marketing automation (abandoned cart, anniversary emails)",
                  "Photographers on a tight budget who can start with the free tier (3 GB)",
                  "Photographers who use Lightroom Classic and want native plugin integration",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Storage & Gallery Protection */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Storage &amp; Gallery Protection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  PhotoVault
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Unlimited storage on all plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Orphan Protocol: galleries survive photographer cancellation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Client pays for their own access, so photos are preserved</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Pic-Time
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                    <span>Storage tied to plan tier (3 GB free, 10 GB, 100 GB, unlimited)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
                    <span>Downgrade/cancel: galleries deleted after 45 days (oldest first)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>Gallery Backup subscriptions can preserve specific galleries</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Common Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Can I use PhotoVault and Pic-Time together?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes. Many photographers use Pic-Time for proofing, print sales, and
                marketing automation while using PhotoVault for permanent gallery
                delivery and passive income. The platforms serve different purposes
                and complement each other.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Does Pic-Time offer passive income like PhotoVault?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pic-Time offers print store markup revenue (you set your prices
                above lab costs) and a Gallery Backup subscription feature where
                clients pay to keep galleries online. However, it does not have a
                commission-based passive income model where photographers
                automatically earn 50% of client subscription payments like
                PhotoVault.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                What happens to client photos if I cancel Pic-Time?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                On Pic-Time, if you cancel or downgrade, galleries exceeding your
                new storage limit are permanently deleted after 45 days, starting
                with the oldest. On PhotoVault, the Orphan Protocol keeps client
                galleries accessible because clients pay for their own storage
                independently.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Which platform is better for wedding photographers?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pic-Time excels at the wedding workflow: proofing, album design,
                vendor galleries, print sales, and marketing automation. PhotoVault
                excels at long-term gallery preservation and passive income. Many
                wedding photographers could benefit from using Pic-Time for the
                active wedding season workflow and PhotoVault for permanent delivery
                and recurring revenue.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Is PhotoVault ready for professional use?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PhotoVault is currently in beta. Core functionality (gallery delivery,
                client access, Stripe payments, desktop uploads) is working. Founding
                photographers get 12 months free and the $22/month rate locked in
                forever. The platform is intentionally focused on gallery delivery and
                passive income rather than competing on proofing, print sales, or
                marketing tools.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Try PhotoVault Free for 12 Months
          </h2>
          <p className="text-muted-foreground mb-2 max-w-xl mx-auto">
            No credit card required. $22/month locked in forever after beta.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Already on Pic-Time? PhotoVault works alongside it &mdash; use Pic-Time
            for proofing and prints, PhotoVault for delivery and passive income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers/signup">
                <Camera className="mr-2 h-5 w-5" />
                Join the Beta Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/resources/photovault-vs-pixieset">
                Compare With Pixieset Instead
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
