import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Camera,
  Download,
  Lock,
  Smartphone,
  HardDrive,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Best Google Photos Alternatives 2026 | Permanent Photo Storage Options",
  description:
    "Looking for Google Photos alternatives after the 2021 policy changes? Compare PhotoVault, iCloud, Amazon Photos, Dropbox, and OneDrive. Find permanent photo storage that won't delete your memories.",
  keywords:
    "Google Photos alternatives, Google Photos alternative permanent storage, leaving Google Photos, Google Photos replacement 2026, best photo storage after Google Photos, permanent photo backup, family photo storage alternatives",
  openGraph: {
    type: "article",
    title: "Best Google Photos Alternatives 2026 | Permanent Photo Storage",
    description:
      "Compare the best Google Photos alternatives for permanent photo storage. Find the right solution after Google's 2021 policy changes.",
    url: "https://photovault.photo/resources/google-photos-alternatives",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://photovault.photo/images/og-google-photos-alternatives.jpg",
        width: 1200,
        height: 630,
        alt: "Google Photos Alternatives 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Google Photos Alternatives 2026",
    description:
      "Compare permanent photo storage options after Google's policy changes.",
    images: ["https://photovault.photo/images/og-google-photos-alternatives.jpg"],
  },
  alternates: {
    canonical: "https://photovault.photo/resources/google-photos-alternatives",
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
      name: "Google Photos Alternatives",
      item: "https://photovault.photo/resources/google-photos-alternatives",
    },
  ],
};

// Structured data for Article schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best Google Photos Alternatives 2026: Permanent Photo Storage Options",
  description:
    "Compare the best Google Photos alternatives for permanent photo storage after Google's 2021 policy changes.",
  image: "https://photovault.photo/images/og-google-photos-alternatives.jpg",
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
    "@id": "https://photovault.photo/resources/google-photos-alternatives",
  },
};

export default function GooglePhotosAlternativesPage() {
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
          <span className="text-foreground">Google Photos Alternatives</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Best Google Photos Alternatives in 2026
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Google Photos changed the rules in 2021. If you&apos;re looking for a
            new home for your memories, here&apos;s everything you need to know
            about the best alternatives—and how to migrate without losing a single
            photo.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span>Updated January 2026</span>
            <span>-</span>
            <span>15 min read</span>
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
                <a href="#why-leaving" className="hover:text-primary">
                  1. Why People Are Leaving Google Photos
                </a>
              </li>
              <li>
                <a href="#what-to-look-for" className="hover:text-primary">
                  2. What to Look For in an Alternative
                </a>
              </li>
              <li>
                <a href="#top-alternatives" className="hover:text-primary">
                  3. Top Google Photos Alternatives for 2026
                </a>
              </li>
              <li>
                <a href="#comparison-table" className="hover:text-primary">
                  4. Comparison Table
                </a>
              </li>
              <li>
                <a href="#migration-tips" className="hover:text-primary">
                  5. How to Export from Google Photos
                </a>
              </li>
              <li>
                <a href="#conclusion" className="hover:text-primary">
                  6. Conclusion: Which Alternative Is Right for You?
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 1: Why People Are Leaving */}
        <section id="why-leaving" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            Why People Are Leaving Google Photos
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              For years, Google Photos was the default choice for millions. Free
              unlimited storage, excellent search, and seamless integration with
              Android made it hard to beat. Then came June 1, 2021.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              The 2021 Policy Change
            </h3>
            <p>
              Google ended unlimited free &quot;High Quality&quot; photo storage.
              Every photo now counts against your 15GB Google account storage,
              shared with Gmail and Google Drive. For most families with years of
              photos, this meant one thing:{" "}
              <strong className="text-foreground">pay up or delete.</strong>
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 my-6">
              <p className="text-foreground font-medium mb-2">
                The Real Impact
              </p>
              <p className="text-sm">
                The average smartphone user takes 1,000+ photos per year. At
                ~3MB per photo, that&apos;s 3GB annually. A family of four burns
                through the free 15GB in just over a year.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              It&apos;s Not Just About Storage
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Account Deletion Risk:</strong> Google can delete
                  inactive accounts after 2 years, including all photos.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Privacy Concerns:</strong> Google scans photos for AI
                  training and advertising insights.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Quality Compression:</strong> The old &quot;High
                  Quality&quot; setting reduced resolution. Original quality was
                  never truly free.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>No Export Guarantees:</strong> Getting your photos out
                  is possible but not seamless.
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">
              When Google Photos Still Makes Sense
            </h3>
            <p>
              To be fair, Google Photos remains excellent for certain users:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Light users:</strong> If you take fewer than 500
                  photos/year, 15GB may last years.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Android users:</strong> The integration is unmatched.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Google One subscribers:</strong> If you already pay for
                  100GB+, the cost is reasonable.
                </span>
              </li>
            </ul>
            <p className="mt-4">
              But if you&apos;re concerned about long-term preservation, control
              over your data, or simply want to avoid another price hike,
              it&apos;s time to explore alternatives.
            </p>
          </div>
        </section>

        {/* Section 2: What to Look For */}
        <section id="what-to-look-for" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            What to Look For in an Alternative
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Not all photo storage is created equal. Here are the key factors
              to evaluate before switching:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Permanence
                    </h3>
                  </div>
                  <p className="text-sm">
                    Will your photos still be there in 20 years? Look for
                    services with clear data retention policies and no account
                    deletion for inactivity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Family Sharing
                    </h3>
                  </div>
                  <p className="text-sm">
                    Can you easily share albums with relatives? Some services
                    charge extra for family plans or make sharing complicated.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      True Cost
                    </h3>
                  </div>
                  <p className="text-sm">
                    What&apos;s the 5-year cost? Some &quot;free&quot; services
                    become expensive once you exceed limits. Calculate the
                    long-term investment.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Privacy & Security
                    </h3>
                  </div>
                  <p className="text-sm">
                    Who can see your photos? Are they used for AI training?
                    End-to-end encryption matters for sensitive family memories.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Ease of Use
                    </h3>
                  </div>
                  <p className="text-sm">
                    Can grandma access the photos? The best backup is useless if
                    family members can&apos;t figure out how to view or download.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Export Options
                    </h3>
                  </div>
                  <p className="text-sm">
                    Can you easily get your photos out? Avoid vendor lock-in.
                    You should be able to download everything at any time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Top Alternatives */}
        <section id="top-alternatives" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Cloud className="h-8 w-8 text-blue-500" />
            Top Google Photos Alternatives for 2026
          </h2>

          <div className="space-y-8">
            {/* PhotoVault */}
            <Card className="bg-card border-primary/50 border-2">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      PhotoVault
                    </h3>
                    <p className="text-sm text-primary font-medium">
                      Memory Insurance Model
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-xl font-bold text-foreground">$8/month</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  PhotoVault takes a different approach: rather than competing
                  as general cloud storage, it focuses specifically on
                  professional photos delivered by photographers. Think of it as
                  insurance for your most important memories.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Strengths
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Permanent storage - no expiring gallery links
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        One-tap download to phone camera roll
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Built-in family sharing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Professional-grade backup redundancy
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-500 mb-2">
                      Considerations
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Designed for professional photos, not phone backups
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Requires photographer to use the platform
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Best for:</strong> Families who want permanent,
                  worry-free storage for wedding photos, newborn sessions,
                  family portraits, and other professional photography.
                </p>

                <div className="mt-4">
                  <Button asChild>
                    <Link href="/photographers">
                      <Camera className="mr-2 h-4 w-4" />
                      Learn About Memory Insurance
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* iCloud */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      iCloud
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Apple Ecosystem
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-xl font-bold text-foreground">$0.99/month</p>
                    <p className="text-xs text-muted-foreground">50GB</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  If your family is all-in on Apple devices, iCloud Photos
                  offers the tightest integration. Photos sync automatically
                  across iPhone, iPad, Mac, and Apple TV.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Strengths
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Seamless Apple device integration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Shared Family library (up to 6 people)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Advanced Privacy (end-to-end encryption option)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Reasonable pricing ($2.99/200GB, $9.99/2TB)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Weaknesses
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Poor experience on Windows/Android
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Storage shared with device backups
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Weak sharing with non-Apple users
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Best for:</strong> Apple-only households who want
                  seamless, automatic photo backup without thinking about it.
                </p>
              </CardContent>
            </Card>

            {/* Amazon Photos */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Amazon Photos
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Prime Perk
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">With Prime</p>
                    <p className="text-xl font-bold text-foreground">$14.99/month</p>
                    <p className="text-xs text-muted-foreground">Unlimited photos</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  Amazon Photos offers unlimited full-resolution photo storage
                  for Prime members. It&apos;s one of the best values if you
                  already subscribe to Prime for shopping and video.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Strengths
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Unlimited full-resolution photos (Prime)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        5GB video storage included
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Family Vault for sharing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Fire TV and Echo Show integration
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Weaknesses
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Requires active Prime subscription
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Cancel Prime = lose unlimited storage
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Video storage is limited
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Less polished interface than competitors
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Best for:</strong> Existing Prime members who want
                  unlimited photo backup as a bonus benefit.
                </p>
              </CardContent>
            </Card>

            {/* Dropbox */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Dropbox
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      General Cloud Storage
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-xl font-bold text-foreground">$11.99/month</p>
                    <p className="text-xs text-muted-foreground">2TB</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  Dropbox isn&apos;t a dedicated photo service, but its camera
                  upload feature and reliable sync make it a solid option for
                  users who want one place for all their files.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Strengths
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Works on all platforms
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Excellent file sync reliability
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Easy sharing with anyone
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        File versioning and recovery
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Weaknesses
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Not photo-focused (basic gallery)
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        More expensive than alternatives
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        No smart search or face recognition
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Free tier only 2GB
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Best for:</strong> Users who want a single cloud
                  storage solution for photos, documents, and everything else.
                </p>
              </CardContent>
            </Card>

            {/* OneDrive */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      Microsoft OneDrive
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Microsoft Ecosystem
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="text-xl font-bold text-foreground">$1.99/month</p>
                    <p className="text-xs text-muted-foreground">100GB</p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">
                  OneDrive offers solid photo storage with a bonus: Microsoft
                  365 subscribers get 1TB included. Windows users benefit from
                  deep OS integration.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-500 mb-2">
                      Strengths
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        1TB included with Microsoft 365 ($6.99/mo)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Built into Windows
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Personal Vault for sensitive photos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Cross-platform apps available
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">
                      Weaknesses
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Photo features less refined than competitors
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Slower mobile app performance
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Confusing for non-Windows users
                      </li>
                    </ul>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Best for:</strong> Microsoft 365 subscribers and
                  Windows-centric households looking to maximize existing
                  subscriptions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Comparison Table */}
        <section id="comparison-table" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-purple-500" />
            Side-by-Side Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Free Tier
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Paid Plans
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Family Sharing
                  </th>
                  <th className="text-left py-3 px-4 text-foreground">
                    Best For
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border bg-primary/5">
                  <td className="py-3 px-4 font-medium text-foreground">
                    PhotoVault
                  </td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">$8/mo (unlimited photos)</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Professional photos</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-medium text-foreground">
                    iCloud
                  </td>
                  <td className="py-3 px-4">5GB</td>
                  <td className="py-3 px-4">$0.99-$9.99/mo</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Apple users</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-medium text-foreground">
                    Amazon Photos
                  </td>
                  <td className="py-3 px-4">5GB</td>
                  <td className="py-3 px-4">Free with Prime</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Prime members</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-medium text-foreground">
                    Dropbox
                  </td>
                  <td className="py-3 px-4">2GB</td>
                  <td className="py-3 px-4">$11.99/mo (2TB)</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Cross-platform files</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-medium text-foreground">
                    OneDrive
                  </td>
                  <td className="py-3 px-4">5GB</td>
                  <td className="py-3 px-4">$1.99-$9.99/mo</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Microsoft 365 users</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-medium text-foreground">
                    Google Photos
                  </td>
                  <td className="py-3 px-4">15GB (shared)</td>
                  <td className="py-3 px-4">$1.99-$9.99/mo</td>
                  <td className="py-3 px-4">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </td>
                  <td className="py-3 px-4">Android users</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            For a more detailed comparison including privacy features and export
            options, see our{" "}
            <Link
              href="/resources/photo-storage-comparison"
              className="text-primary hover:underline"
            >
              complete photo storage comparison
            </Link>
            .
          </p>
        </section>

        {/* Section 5: Migration Tips */}
        <section id="migration-tips" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Download className="h-8 w-8 text-green-500" />
            How to Export from Google Photos
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Ready to switch? Here&apos;s how to get your photos out of Google
              Photos using Google Takeout:
            </p>

            <Card className="bg-card/50 border-border my-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Step-by-Step Export Guide
                </h3>

                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        Go to Google Takeout
                      </p>
                      <p className="text-sm">
                        Visit{" "}
                        <a
                          href="https://takeout.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          takeout.google.com
                        </a>{" "}
                        and sign in with your Google account.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        Select Google Photos Only
                      </p>
                      <p className="text-sm">
                        Click &quot;Deselect all&quot; first, then scroll down
                        and check only &quot;Google Photos.&quot; This prevents
                        downloading unnecessary data.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        Choose Export Settings
                      </p>
                      <p className="text-sm">
                        Select &quot;Export once&quot; and choose file size
                        (2GB is manageable). Pick your delivery method (email
                        link is easiest).
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        Wait for Processing
                      </p>
                      <p className="text-sm">
                        Large libraries can take hours or days. Google will
                        email you when ready (links expire after 1 week).
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      5
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        Download and Organize
                      </p>
                      <p className="text-sm">
                        Download all ZIP files. Note: Google exports JSON
                        metadata separately from photos, which can be messy.
                        Third-party tools like Google Photos Takeout Helper can
                        merge them.
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Important Notes
              </h4>
              <ul className="text-sm space-y-2">
                <li>
                  <strong>Metadata caveat:</strong> Google exports photo dates
                  in JSON files, not in the image EXIF data. Some import tools
                  may not recognize them.
                </li>
                <li>
                  <strong>Don&apos;t delete yet:</strong> Only delete from
                  Google Photos after confirming everything imported correctly
                  to your new service.
                </li>
                <li>
                  <strong>Check for duplicates:</strong> If you had Google
                  Photos syncing from multiple devices, expect duplicates in
                  your export.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6: Conclusion */}
        <section id="conclusion" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Conclusion: Which Alternative Is Right for You?
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              There&apos;s no single &quot;best&quot; Google Photos alternative.
              The right choice depends on your ecosystem, budget, and what
              you&apos;re storing:
            </p>

            <div className="space-y-4 mt-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        For professional photos (weddings, portraits):
                      </strong>{" "}
                      PhotoVault&apos;s Memory Insurance ensures permanent,
                      worry-free preservation.
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        For Apple households:
                      </strong>{" "}
                      iCloud provides the most seamless experience across all
                      your devices.
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        For Prime members:
                      </strong>{" "}
                      Amazon Photos is essentially free unlimited storage you
                      may not be using.
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        For Microsoft 365 users:
                      </strong>{" "}
                      OneDrive&apos;s 1TB is already included in your
                      subscription.
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="flex items-center gap-3">
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        For cross-platform needs:
                      </strong>{" "}
                      Dropbox works reliably everywhere, though it&apos;s
                      pricier.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="mt-6">
              The most important thing isn&apos;t which service you choose—it&apos;s
              that you have a backup plan at all. Your memories are irreplaceable.
              Take the time to protect them properly.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Protect Your Professional Photos Forever
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you&apos;ve invested in professional photography—weddings, family
            portraits, newborn sessions—those photos deserve better than expiring
            gallery links. Ask your photographer about PhotoVault.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/photographers">
                <Camera className="mr-2 h-5 w-5" />
                For Photographers
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/resources/photo-storage-guide">
                Read the Photo Storage Guide
              </Link>
            </Button>
          </div>
        </section>

        {/* Related Resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Related Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
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
                    A comprehensive guide to protecting your family photos
                    long-term.
                  </p>
                </CardContent>
              </Card>
            </Link>
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
          </div>
        </section>
      </main>
    </div>
  );
}
