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
    "PhotoVault vs ShootProof 2026 | Honest Comparison for Photographers",
  description:
    "Detailed comparison of PhotoVault and ShootProof for professional photographers. Compare pricing, business models, passive income, and which platform fits your photography business.",
  keywords:
    "PhotoVault vs ShootProof, ShootProof alternative, photographer gallery platform comparison, passive income photography",
  openGraph: {
    type: "article",
    title:
      "PhotoVault vs ShootProof 2026 | Honest Comparison for Photographers",
    description:
      "Compare PhotoVault and ShootProof side-by-side. Pricing, business models, features, and which platform fits your photography business.",
    url: "https://www.photovault.photo/resources/photovault-vs-shootproof",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoVault vs ShootProof 2026",
    description:
      "Honest comparison for photographers. Different business models, different strengths.",
  },
  alternates: {
    canonical: "https://www.photovault.photo/resources/photovault-vs-shootproof",
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
      name: "PhotoVault vs ShootProof",
      item: "https://www.photovault.photo/resources/photovault-vs-shootproof",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "PhotoVault vs ShootProof: The Comparison No One Else Is Having",
  description:
    "Detailed comparison of PhotoVault and ShootProof for professional photographers. Compare pricing, business models, and features.",
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
  datePublished: "2026-03-07",
  dateModified: "2026-03-07",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.photovault.photo/resources/photovault-vs-shootproof",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does ShootProof offer any passive income or revenue sharing for photographers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. ShootProof does not share any subscription revenue with photographers. Photographers pay ShootProof a monthly fee based on photo count, and clients access galleries for free. There is no scenario where your existing client base generates recurring income for you on ShootProof.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to client galleries when I cancel ShootProof?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When you cancel ShootProof, your client galleries go offline and clients lose access to their photos. PhotoVault's Orphan Protocol keeps client galleries accessible even if the photographer leaves — clients who are paying for storage keep their photos permanently.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use PhotoVault and ShootProof together?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You could use ShootProof for contracts, invoicing, and booking while using PhotoVault for gallery delivery and passive income. The platforms serve different purposes. Alternatively, you could pair PhotoVault with HoneyBook or Dubsado for studio management.",
      },
    },
    {
      "@type": "Question",
      name: "How does ShootProof's storage pricing compare to PhotoVault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ShootProof charges based on photo count: free for 100 photos, up to $50/month for unlimited. Because plans are capped, photographers are incentivized to delete old galleries to stay within their tier. PhotoVault charges a flat $22/month with no storage overages — old galleries aren't a cost problem because clients pay for their own storage.",
      },
    },
    {
      "@type": "Question",
      name: "How many clients do I need on PhotoVault to break even?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You break even at 6 active clients on PhotoVault. At $4/month per client in commissions, 6 clients generate $24/month — covering the $22/month platform fee. Every client after that is pure passive income. At 100 active clients, you're earning $400/month in commissions.",
      },
    },
  ],
};

const tocItems = [
  { id: "tldr", label: "TL;DR" },
  { id: "comparison-table", label: "Side-by-Side Summary" },
  { id: "business-model", label: "Who Pays, and Who Earns" },
  { id: "pricing", label: "Pricing: What You Actually Pay" },
  { id: "expiry-logic", label: "The Expiry Logic Problem" },
  { id: "revenue-share", label: "Revenue Share Comparison" },
  { id: "studio-management", label: "Studio Management" },
  { id: "what-happens", label: "What Happens When You Stop" },
  { id: "best-for-photovault", label: "Who Should Use PhotoVault" },
  { id: "best-for-shootproof", label: "Who Should Use ShootProof" },
  { id: "faq", label: "Common Questions" },
];

export default function PhotoVaultVsShootProofPage() {
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
          <span className="text-foreground">PhotoVault vs ShootProof</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            PhotoVault vs ShootProof: The Comparison No One Else Is Having
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            ShootProof is a solid platform. Clean galleries, contracts,
            invoicing — it does what it says on the box. But if you&apos;ve
            ever done the math on what you&apos;re actually getting back for
            everything you&apos;re putting in, this comparison is worth reading.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Published March 7, 2026</span>
            <span>~7 min read</span>
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
                <strong>ShootProof</strong> is an all-in-one studio management
                platform — galleries, contracts, invoices, and booking forms.
                You pay ShootProof every month based on photo count. Your
                clients generate zero recurring revenue for you.
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
                12 months free and the $22/month rate locked in forever. The
                comparison below uses standard pricing for both platforms.
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

        {/* Side-by-Side Summary Table */}
        <section id="comparison-table" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            Side-by-Side Summary
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Feature
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    PhotoVault
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    ShootProof
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Monthly cost
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    $22/month flat*
                    <span className="block text-xs text-primary mt-1">
                      *Free during beta, rate locked forever
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    $8.33&ndash;$50/month
                    <span className="block text-xs text-muted-foreground mt-1">
                      Scales with photo count
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Passive income from clients
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="ml-2 text-foreground">
                      $4/month per active client
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="ml-2 text-foreground">$0</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Storage model
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Unlimited, no overages
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Photo count caps; encourages deletion
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Gallery expiry
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Photos stored permanently
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <AlertTriangle className="h-4 w-4 text-amber-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Galleries expire unless maintained
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Studio management
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Not included
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Built-in (contracts, invoices, booking)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Orphan Protocol
                  </td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Clients keep access permanently
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="text-xs text-muted-foreground ml-2">
                      Galleries go offline when you do
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Revenue share
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    50/50 split
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Photographer pays; platform keeps all
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">
                    Break-even
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    6 active clients
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    Never (it&apos;s a cost)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* The Core Difference: Who Pays, and Who Earns */}
        <section id="business-model" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            The Core Difference: Who Pays, and Who Earns
          </h2>

          <p className="text-muted-foreground mb-6">
            ShootProof&apos;s business model is simple: you pay them. Every
            month, regardless of how many clients you have or how many
            galleries you&apos;ve delivered over your career, you pay ShootProof
            and they keep it. There is no scenario in ShootProof&apos;s model
            where your existing client base generates recurring income for you.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-amber-500">ShootProof&apos;s Model</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You pay ShootProof a monthly fee based on how many photos
                  you store. Your clients access galleries for free. As your
                  archive grows, you either pay more or delete old galleries
                  to stay within your tier. ShootProof keeps 100% of your
                  subscription.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground">
                    More photos = higher tier = higher monthly cost
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
                  their own storage — $8/month or a $100 annual package.
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
        </section>

        {/* Pricing: What You Actually Pay */}
        <section id="pricing" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-500" />
            Pricing: What You Actually Pay
          </h2>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              ShootProof&apos;s Pricing (Photo Count Tiers)
            </h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Monthly (annual)
                    </th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                      Storage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 text-foreground">Free</td>
                    <td className="py-3 px-4 text-foreground">$0</td>
                    <td className="py-3 px-4 text-foreground">100 photos</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">1,500 plan</td>
                    <td className="py-3 px-4 text-foreground">$8.33/mo</td>
                    <td className="py-3 px-4 text-foreground">1,500 photos (~75 GB)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">5,000 plan</td>
                    <td className="py-3 px-4 text-foreground">$16.67/mo</td>
                    <td className="py-3 px-4 text-foreground">5,000 photos (~250 GB)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">25,000 plan</td>
                    <td className="py-3 px-4 text-foreground">$26.67/mo</td>
                    <td className="py-3 px-4 text-foreground">25,000 photos (~1,250 GB)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-foreground">Unlimited</td>
                    <td className="py-3 px-4 text-foreground">$50/mo</td>
                    <td className="py-3 px-4 text-foreground">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              PhotoVault&apos;s Pricing
            </h3>
            <p className="text-muted-foreground mb-4">
              $22/month flat. No storage overages. No photo count caps. At
              100 active clients you&apos;re earning $400/month in commissions.
              You&apos;re net positive.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>The key difference:</strong> ShootProof&apos;s cost
              scales with your photo count. PhotoVault&apos;s cost is flat —
              and offset by client revenue that grows with every gallery you
              deliver.
            </p>
          </div>
        </section>

        {/* The Expiry Logic Problem */}
        <section id="expiry-logic" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-amber-500" />
            The Expiry Logic Problem
          </h2>

          <p className="text-muted-foreground mb-4">
            Because ShootProof&apos;s plans are capped by photo count,
            photographers are incentivized to delete old galleries to stay
            within their tier. For the client, this means their photos are gone.
          </p>

          <p className="text-muted-foreground mb-6">
            PhotoVault was built on the opposite philosophy. Old galleries
            aren&apos;t a cost problem. A client from 2021 is still paying
            $8/month in 2026, and you&apos;re still earning $4 of it. Your
            back catalog is an asset, not a storage liability.
          </p>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Why this matters:</strong> On ShootProof, your archive
              is a cost you manage. On PhotoVault, your archive is income that
              compounds.
            </p>
          </div>
        </section>

        {/* Revenue Share Comparison */}
        <section id="revenue-share" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Revenue Share Comparison
          </h2>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Platform
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    What Photographer Pays
                  </th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    What Photographer Earns from Client Subscriptions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 text-foreground">ShootProof</td>
                  <td className="py-3 px-4 text-foreground">$8.33&ndash;$50/month</td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="ml-2 text-foreground">$0</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-foreground">Pixieset</td>
                  <td className="py-3 px-4 text-foreground">$8&ndash;$50/month</td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="ml-2 text-foreground">$0</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-foreground">Pic-Time</td>
                  <td className="py-3 px-4 text-foreground">Varies</td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="ml-2 text-foreground">$0</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-foreground">SmugMug</td>
                  <td className="py-3 px-4 text-foreground">$13&ndash;$55/month</td>
                  <td className="py-3 px-4">
                    <XCircle className="h-4 w-4 text-red-500 inline" />
                    <span className="ml-2 text-foreground">$0</span>
                  </td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="py-3 px-4 font-semibold text-foreground">PhotoVault</td>
                  <td className="py-3 px-4 font-semibold text-foreground">$22/month flat</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                    <span className="ml-2 font-semibold text-foreground">$4/month per active client</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Studio Management */}
        <section id="studio-management" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Studio Management: ShootProof&apos;s Strongest Area
          </h2>

          <p className="text-muted-foreground mb-4">
            ShootProof has built-in studio management: contracts, invoices,
            booking forms, payment processing. This is where ShootProof
            genuinely shines — it&apos;s an all-in-one toolkit for running
            a photography studio.
          </p>

          <p className="text-muted-foreground mb-6">
            PhotoVault is gallery delivery and archival only. If you need
            contracts, invoices, and booking, you&apos;d pair PhotoVault with
            HoneyBook or Dubsado.
          </p>

          <div className="bg-card/50 border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Bottom line:</strong> If you need an all-in-one studio
              management tool, ShootProof has it built in. If you already
              use separate tools for studio management, PhotoVault adds
              passive income without replacing your stack.
            </p>
          </div>
        </section>

        {/* What Happens When You Stop */}
        <section id="what-happens" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            What Happens to Your Clients When You Stop
          </h2>

          <p className="text-muted-foreground mb-4">
            With ShootProof, when you cancel, galleries go offline. Clients
            lose access.
          </p>

          <p className="text-muted-foreground mb-6">
            PhotoVault has the Orphan Protocol. When a photographer leaves,
            clients continue paying $8/month and galleries stay accessible.
            Photos don&apos;t disappear because you stopped working.
          </p>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Why this matters:</strong> If you retire, change
              careers, or just switch platforms — your clients&apos; memories
              don&apos;t disappear with your subscription.
            </p>
          </div>
        </section>

        {/* Who Should Use PhotoVault */}
        <section id="best-for-photovault" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Who Should Use PhotoVault
          </h2>

          <div className="space-y-4">
            {[
              {
                title: "You want to build passive income from work you've already done",
                desc: "If you have a growing archive and past clients who value their photos, PhotoVault turns completed work into monthly income.",
              },
              {
                title: "You have a growing archive and don't want storage costs",
                desc: "One flat fee regardless of how many galleries you deliver or how much storage your clients use. Your back catalog is an asset, not a liability.",
              },
              {
                title: "You care about permanent client access to photos",
                desc: "The Orphan Protocol means your clients' photos outlast your subscription. That matters for wedding and family photographers.",
              },
              {
                title: "You want recurring revenue, not just one-time bookings",
                desc: "Every gallery you deliver generates $4/month in passive income. At 100 clients, that's $4,800/year — from work already completed.",
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

        {/* Who Should Use ShootProof */}
        <section id="best-for-shootproof" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Camera className="h-8 w-8 text-amber-500" />
            Who Should Use ShootProof
          </h2>

          <div className="space-y-4">
            {[
              {
                title: "You want contracts, invoices, and galleries all in one login",
                desc: "ShootProof's studio management tools are built in. If you want one platform for your entire business workflow, ShootProof delivers.",
              },
              {
                title: "You're early in your career and need an all-in-one toolkit",
                desc: "ShootProof's free tier (100 photos) and affordable lower tiers let you start without a big upfront commitment.",
              },
              {
                title: "Your clients don't stay subscribed long-term",
                desc: "If your clients typically download their photos and move on, the passive income model matters less. ShootProof's one-time delivery approach fits that workflow.",
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

        {/* The Math, One More Time */}
        <section className="mb-16">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                The Math, One More Time
              </h2>
              <p className="text-muted-foreground mb-4">
                A photographer with 100 active clients on PhotoVault earns
                $4,800/year in passive income — from work already completed,
                without booking a single new session.
              </p>
              <p className="text-muted-foreground">
                On ShootProof, those same 100 clients generate $0 in passive
                income. You&apos;re paying $50/month for storage and building
                nothing that compounds.
              </p>
            </CardContent>
          </Card>
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
                Does ShootProof offer any passive income or revenue sharing?
              </h3>
              <p className="text-muted-foreground">
                No. ShootProof does not share any subscription revenue with
                photographers. Photographers pay ShootProof a monthly fee
                based on photo count, and clients access galleries for free.
                There is no scenario where your existing client base generates
                recurring income for you on ShootProof.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What happens to client galleries when I cancel ShootProof?
              </h3>
              <p className="text-muted-foreground">
                When you cancel ShootProof, your client galleries go offline
                and clients lose access to their photos. PhotoVault&apos;s
                Orphan Protocol keeps client galleries accessible even if the
                photographer leaves — clients who are paying for storage keep
                their photos permanently.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Can I use PhotoVault and ShootProof together?
              </h3>
              <p className="text-muted-foreground">
                Yes. You could use ShootProof for contracts, invoicing, and
                booking while using PhotoVault for gallery delivery and
                passive income. The platforms serve different purposes.
                Alternatively, you could pair PhotoVault with HoneyBook or
                Dubsado for studio management.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How does ShootProof&apos;s storage pricing compare to PhotoVault?
              </h3>
              <p className="text-muted-foreground">
                ShootProof charges based on photo count: free for 100 photos,
                up to $50/month for unlimited. Because plans are capped,
                photographers are incentivized to delete old galleries to stay
                within their tier. PhotoVault charges a flat $22/month with no
                storage overages — old galleries aren&apos;t a cost problem
                because clients pay for their own storage.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How many clients do I need on PhotoVault to break even?
              </h3>
              <p className="text-muted-foreground">
                You break even at 6 active clients. At $4/month per client in
                commissions, 6 clients generate $24/month — covering the
                $22/month platform fee. Every client after that is pure
                passive income. At 100 active clients, you&apos;re earning
                $400/month in commissions.
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
            PhotoVault is free for 12 months during beta, and your $22/month
            rate is locked in forever. Join as a founding photographer and
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
              href="/resources/photographer-recurring-revenue"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    How to Create Recurring Revenue as a Photographer
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Turn completed work into monthly passive income with
                    client-funded gallery storage.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/resources/gallery-fatigue"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    Gallery Fatigue: Why Families Have Five Logins
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The problem with scattered photo galleries and how
                    permanent archival solves it.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/resources/photovault-vs-pixieset"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    PhotoVault vs Pixieset 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Side-by-side comparison of PhotoVault and Pixieset for
                    professional photographers.
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
