import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HardDrive,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Camera,
} from "lucide-react";

export const metadata: Metadata = {
  title: "The State of Photo Storage in 2026 | Complete Guide",
  description:
    "Learn how to store photos long-term without losing them. Compare cloud storage, local drives, and managed services. Find the best photo storage solution for your family.",
  keywords:
    "how to store photos long term, best way to preserve family photos, photo storage options 2026, permanent photo storage, cloud photo storage comparison, family photo backup",
  openGraph: {
    type: "article",
    title: "The State of Photo Storage in 2026 | Complete Guide",
    description:
      "Why cloud storage isn't permanent and what families should know about protecting their photos forever.",
    url: "https://photovault.photo/resources/photo-storage-guide",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://photovault.photo/images/og-photo-storage-guide.jpg",
        width: 1200,
        height: 630,
        alt: "Photo Storage Guide 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The State of Photo Storage in 2026",
    description:
      "Why cloud storage isn't permanent and what families should know.",
    images: ["https://photovault.photo/images/og-photo-storage-guide.jpg"],
  },
  alternates: {
    canonical: "https://photovault.photo/resources/photo-storage-guide",
  },
};

// Structured data for BreadcrumbList schema
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
      name: "Photo Storage Guide",
      item: "https://photovault.photo/resources/photo-storage-guide",
    },
  ],
};

// Structured data for Article schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The State of Photo Storage in 2026: A Complete Guide",
  description:
    "Learn how to store photos long-term without losing them. Compare cloud storage, local drives, and managed services.",
  image: "https://photovault.photo/images/og-photo-storage-guide.jpg",
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
  datePublished: "2026-01-02",
  dateModified: "2026-01-02",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://photovault.photo/resources/photo-storage-guide",
  },
};

export default function PhotoStorageGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/resources" className="hover:text-primary">
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Photo Storage Guide</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            The State of Photo Storage in 2026
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your photos aren&apos;t as safe as you think. Here&apos;s what every
            family needs to know about storing photos for the long term—and how
            to actually keep them forever.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span>Updated January 2026</span>
            <span>•</span>
            <span>12 min read</span>
          </div>
        </header>

        {/* Table of Contents */}
        <Card className="mb-12 bg-card/50">
          <CardContent className="p-6">
            <h2 className="font-semibold text-foreground mb-4">
              In This Guide
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#the-problem" className="hover:text-primary">
                  1. The Problem: Why Your Photos Are at Risk
                </a>
              </li>
              <li>
                <a href="#the-statistics" className="hover:text-primary">
                  2. The Statistics: How Many Photos Are Lost Each Year
                </a>
              </li>
              <li>
                <a href="#storage-options" className="hover:text-primary">
                  3. Your Options: Local, Cloud, Hybrid, and Managed
                </a>
              </li>
              <li>
                <a href="#decision-framework" className="hover:text-primary">
                  4. Decision Framework: What to Consider
                </a>
              </li>
              <li>
                <a href="#memory-insurance" className="hover:text-primary">
                  5. The Memory Insurance Model
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 1: The Problem */}
        <section id="the-problem" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            The Problem: Why Your Photos Are at Risk
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Most families believe their photos are safe. They&apos;re on
              Google Photos, iCloud, or a hard drive in the closet.
              Here&apos;s the uncomfortable truth:{" "}
              <strong className="text-foreground">
                none of these solutions are permanent.
              </strong>
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              Cloud Storage Isn&apos;t Forever
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Google Photos</strong> ended unlimited free storage in
                  2021. Inactive accounts can be deleted after 2 years.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>iCloud</strong> requires ongoing subscription. Stop
                  paying, lose access to photos over 5GB.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Amazon Photos</strong> is free with Prime—but what
                  happens when you cancel Prime?
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              Local Storage Fails
            </h3>
            <p>
              Hard drives have a 100% failure rate. Not if—when. The average
              hard drive lasts 3-5 years. That wedding album from 2019? It&apos;s
              already on borrowed time.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mt-6">
              <p className="text-foreground font-medium">
                &quot;The question isn&apos;t whether your hard drive will
                fail. It&apos;s whether you&apos;ll have a backup when it
                does.&quot;
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Statistics */}
        <section id="the-statistics" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            The Statistics: Photo Loss by the Numbers
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">1.4T</div>
                <p className="text-muted-foreground">
                  Photos taken globally each year
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-red-500 mb-2">20%</div>
                <p className="text-muted-foreground">
                  Of people have lost photos to hardware failure
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-amber-500 mb-2">
                  $1,500
                </div>
                <p className="text-muted-foreground">
                  Average cost of professional data recovery
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              The average American family has over 2,000 photos. Wedding photos,
              baby&apos;s first steps, graduations, holidays with grandparents
              who are no longer with us. These aren&apos;t just files—they&apos;re
              irreplaceable moments.
            </p>
            <p>
              Yet most families have no real backup strategy. They trust that
              &quot;the cloud&quot; will handle it. Until it doesn&apos;t.
            </p>
          </div>
        </section>

        {/* Section 3: Storage Options */}
        <section id="storage-options" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-purple-500" />
            Your Options: Comparing Photo Storage Solutions
          </h2>

          <div className="space-y-6">
            {/* Local Storage */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Local Storage (External Drives, NAS)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Pros
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• One-time cost</li>
                      <li>• Full control over your data</li>
                      <li>• No subscription fees</li>
                      <li>• Fast local access</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Cons
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Hardware fails (3-5 year lifespan)</li>
                      <li>• Vulnerable to theft, fire, flood</li>
                      <li>• Requires manual backup discipline</li>
                      <li>• No remote access without setup</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Best for:</strong> Tech-savvy users willing to manage
                  their own backup rotation.
                </p>
              </CardContent>
            </Card>

            {/* Cloud Storage */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Cloud Storage (Google Photos, iCloud, Dropbox)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Pros
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automatic backup from phone</li>
                      <li>• Access from anywhere</li>
                      <li>• Easy sharing with family</li>
                      <li>• Search and organization features</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Cons
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ongoing subscription cost</li>
                      <li>• Policies change (Google 2021)</li>
                      <li>• Account deletion risks</li>
                      <li>• Privacy concerns</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Best for:</strong> Casual users who want convenience
                  and don&apos;t mind subscriptions.
                </p>
              </CardContent>
            </Card>

            {/* Hybrid */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Hybrid (Local + Cloud)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Pros
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Redundancy protects against single failure</li>
                      <li>• Fast local + remote access</li>
                      <li>• Best of both worlds</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Cons
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• More expensive (hardware + subscription)</li>
                      <li>• More complex to manage</li>
                      <li>• Requires discipline to maintain</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Best for:</strong> Users who value security and are
                  willing to invest time and money.
                </p>
              </CardContent>
            </Card>

            {/* Managed Services */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Managed Services (PhotoVault, Forever, etc.)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Pros
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Professional-grade protection</li>
                      <li>• No technical management required</li>
                      <li>• Designed specifically for photos</li>
                      <li>• Family sharing built-in</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Cons
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Monthly/annual cost</li>
                      <li>• Reliant on service staying in business</li>
                      <li>• Less control than self-managed</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Best for:</strong> Families who want peace of mind
                  without the technical overhead.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Decision Framework */}
        <section id="decision-framework" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Decision Framework: Choosing the Right Solution
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>Ask yourself these questions:</p>

            <div className="space-y-6 mt-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    1. How technical are you?
                  </h4>
                  <p className="text-sm">
                    If you&apos;re comfortable managing RAID arrays and backup
                    schedules, local/hybrid works. If you want &quot;set it and
                    forget it,&quot; choose cloud or managed services.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    2. What&apos;s your budget?
                  </h4>
                  <p className="text-sm">
                    One-time $200 for a drive vs. $10/month ongoing. Over 5
                    years: $200 vs $600. But the drive might fail in year 3.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    3. How irreplaceable are these photos?
                  </h4>
                  <p className="text-sm">
                    Random phone screenshots? Cloud is fine. Wedding photos,
                    deceased relatives, once-in-a-lifetime moments? You need
                    redundancy.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-2">
                    4. Who needs access?
                  </h4>
                  <p className="text-sm">
                    Just you? Local works. Extended family across the country?
                    You need cloud-based sharing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 5: Memory Insurance */}
        <section id="memory-insurance" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            The Memory Insurance Model
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              There&apos;s a newer approach gaining traction:{" "}
              <strong className="text-foreground">Memory Insurance</strong>.
            </p>
            <p>
              The concept is simple: instead of managing storage yourself, you
              pay a small monthly fee for professional-grade protection of your
              most important photos. Think of it like insurance for your
              memories.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              How It Works
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  Professional photographers upload your photos to a secure,
                  managed platform
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  You get permanent access—not a 1-year expiring gallery link
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  One-tap download to your phone&apos;s camera roll (no zip
                  files)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  Share with family without technical headaches
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              Who It&apos;s For
            </h3>
            <p>
              Memory Insurance makes the most sense for families who have
              invested in professional photography—weddings, newborns, family
              portraits. These photos cost hundreds or thousands of dollars to
              create. Protecting them for $8/month is a reasonable trade-off.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mt-6">
              <p className="text-foreground">
                <strong>PhotoVault</strong> is one example of the Memory
                Insurance model. Photographers deliver galleries through the
                platform, and families get permanent access with professional
                backup. The cost: less than a cup of coffee per month.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/photographers">
                    <Camera className="mr-2 h-4 w-4" />
                    Learn How It Works
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Summary: The Right Choice Depends on You
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground">
                    Solution
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">Cost</th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Effort
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Protection
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Local Drive</td>
                  <td className="py-3 px-4">$100-300 one-time</td>
                  <td className="py-3 px-4">High</td>
                  <td className="py-3 px-4">Low (single point of failure)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Cloud (Google, iCloud)</td>
                  <td className="py-3 px-4">$2-10/month</td>
                  <td className="py-3 px-4">Low</td>
                  <td className="py-3 px-4">Medium (policy changes)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Hybrid</td>
                  <td className="py-3 px-4">$200 + $10/month</td>
                  <td className="py-3 px-4">High</td>
                  <td className="py-3 px-4">High</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4">Memory Insurance</td>
                  <td className="py-3 px-4">$8/month</td>
                  <td className="py-3 px-4">None</td>
                  <td className="py-3 px-4">High (professional managed)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground mt-6">
            The best photo storage solution is one you&apos;ll actually use. For
            most families, that means something automatic that doesn&apos;t
            require ongoing management. Your wedding photos, your children&apos;s
            first steps, your last photos with loved ones—they deserve better
            than a hard drive in a closet.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Protect Your Memories?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If your photographer uses PhotoVault, your photos are already
            protected. If not, ask them about Memory Insurance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers">
                <Camera className="mr-2 h-5 w-5" />
                For Photographers
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/resources/photo-storage-comparison">
                Compare All Options
              </Link>
            </Button>
          </div>
        </section>

        {/* Related Resources */}
        <section className="mt-16">
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
                    Side-by-side comparison of PhotoVault, Google Photos, iCloud,
                    and more.
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
              href="/resources/wedding-photo-storage"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    Wedding Photo Storage Guide
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    How to ensure your wedding photos last 50+ years.
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
