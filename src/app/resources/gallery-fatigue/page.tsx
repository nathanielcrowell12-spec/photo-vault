import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Users,
  HelpCircle,
  FolderOpen,
  AlertTriangle,
  Heart,
  Lock,
  KeyRound,
  DollarSign,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Gallery Fatigue: Why Your Family Photos Are Scattered Across 5 Platforms",
  description:
    "Families work with multiple photographers and end up managing photos across Pic-Time, Pixieset, Dropbox, and more. Learn how to consolidate your family photo archive in one permanent vault.",
  keywords:
    "gallery fatigue, photo organization, family photo storage, scattered photos, multiple photographer platforms",
  openGraph: {
    type: "article",
    title:
      "Gallery Fatigue: Why Your Family Photos Are Scattered Across 5 Platforms",
    description:
      "Families work with multiple photographers and end up managing photos across Pic-Time, Pixieset, Dropbox, and more. Learn how to consolidate your family photo archive in one permanent vault.",
    url: "https://www.photovault.photo/resources/gallery-fatigue",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Gallery Fatigue: Why Your Family Photos Are Scattered Across 5 Platforms",
    description:
      "Five photographers, five platforms, five passwords. There's a better way to store your family's professional photos.",
  },
  alternates: {
    canonical: "https://www.photovault.photo/resources/gallery-fatigue",
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
      name: "Gallery Fatigue",
      item: "https://www.photovault.photo/resources/gallery-fatigue",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "Gallery Fatigue: Why Families Have Five Logins for Five Photographers (And What to Do About It)",
  description:
    "Families work with multiple photographers and end up managing photos across Pic-Time, Pixieset, Dropbox, and more. Learn how to consolidate your family photo archive in one permanent vault.",
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
    "@id": "https://www.photovault.photo/resources/gallery-fatigue",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is gallery fatigue?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gallery fatigue is the frustration families experience when their professional photos are scattered across multiple platforms — Pic-Time, Pixieset, Dropbox, Google Drive, USB drives — each requiring separate logins and accounts. It makes finding and preserving family photos unnecessarily difficult.",
      },
    },
    {
      "@type": "Question",
      name: "How much does PhotoVault cost for families?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault costs $8/month or $100/year for families. This covers permanent storage for all your professional photos in one place, organized by photographer and session. Your photographer earns a commission from your subscription, so they're incentivized to deliver through PhotoVault.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to my photos if my photographer leaves?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault's Orphan Protocol ensures your photos remain accessible even if your photographer leaves the platform. Because you pay for your own storage, your photos are yours — they don't disappear when a photographer cancels their account.",
      },
    },
    {
      "@type": "Question",
      name: "Can all my photographers use PhotoVault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Any photographer can sign up for PhotoVault and deliver galleries to your vault. Each photographer's work is organized separately within your account, so all your professional photos live in one place regardless of who took them.",
      },
    },
  ],
};

const tocItems = [
  { id: "tldr", label: "TL;DR" },
  { id: "how-this-happens", label: "How This Happens" },
  { id: "photos-not-safe", label: "Your Photos Aren't as Safe as You Think" },
  { id: "real-cost", label: "The Real Cost of Photo Chaos" },
  { id: "what-gallery-fatigue-costs", label: "What Gallery Fatigue Actually Costs" },
  { id: "solution", label: "What the Solution Looks Like" },
  { id: "eight-dollar-question", label: "The $8/Month Question" },
  { id: "faq", label: "Common Questions" },
];

export default function GalleryFatiguePage() {
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
          <span className="text-foreground">Gallery Fatigue</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Gallery Fatigue: Why Families Have Five Logins for Five
            Photographers (And What to Do About It)
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            If you&apos;ve worked with more than one photographer in your life
            — and most families have — you already know this problem. Your
            wedding photos are on Pic-Time. Your newborn session is on
            Pixieset. Your family portraits from two years ago are in a Dropbox
            link you&apos;ve lost. Your kid&apos;s senior photos are on some
            platform you created an account for once. And somewhere, there&apos;s
            a USB drive in a drawer.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Published March 7, 2026</span>
            <span>~5 min read</span>
          </div>
        </header>

        {/* TL;DR */}
        <section id="tldr" className="mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                TL;DR
              </h2>
              <p className="text-foreground mb-3">
                <strong>Gallery Fatigue</strong> is what happens when your
                family&apos;s professional photos are scattered across five
                different platforms with five different logins. Every
                photographer uses their own system, and none of them talk to
                each other.
              </p>
              <p className="text-foreground mb-3">
                <strong>PhotoVault</strong> solves this by giving your family
                one permanent vault. Every photographer delivers to the same
                place. You pay $8/month — your photographer earns a commission
                — and your photos never expire.
              </p>
              <p className="text-sm text-muted-foreground">
                No more lost links, expired galleries, or forgotten passwords.
                One login, every photographer, every session, forever.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Table of Contents */}
        <section className="mb-12">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-3">
                In This Article
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

        {/* How This Happens */}
        <section id="how-this-happens" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            How This Happens
          </h2>

          <p className="text-muted-foreground mb-4">
            Every photographer uses whatever platform they prefer. Some use
            Pic-Time, Pixieset, ShootProof, CloudSpot, or SmugMug. A few still
            use Google Drive or Dropbox. There&apos;s no standard. Your
            family&apos;s professional photo history is scattered across a
            dozen different services.
          </p>

          <p className="text-muted-foreground mb-4">
            That&apos;s Gallery Fatigue. Five photographers, five platforms,
            five passwords, and low-grade anxiety every time someone asks:
            &ldquo;Do you have the photos from when...?&rdquo;
          </p>
        </section>

        {/* Your Photos Aren't as Safe as You Think */}
        <section id="photos-not-safe" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            Your Photos Aren&apos;t as Safe as You Think
          </h2>

          <p className="text-muted-foreground mb-4">
            What happens to your photos if a platform shuts down? What if your
            photographer stops paying their subscription? Most gallery
            platforms are designed for photo <em>delivery</em>, not photo{" "}
            <em>preservation</em>.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  ShootProof
                </h3>
                <p className="text-sm text-muted-foreground">
                  Charges photographers based on photo count — photographers
                  are incentivized to expire old galleries to keep costs down.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Pixieset
                </h3>
                <p className="text-sm text-muted-foreground">
                  Free tier comes with 3 GB of storage and a 15% commission
                  cut. These structures aren&apos;t designed with your
                  family&apos;s 20-year photo archive in mind.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>The uncomfortable truth:</strong> On most platforms, when
              your photographer stops paying, your photos disappear. Your
              memories are tied to someone else&apos;s subscription.
            </p>
          </div>
        </section>

        {/* The Real Cost of Photo Chaos */}
        <section id="real-cost" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            The Real Cost of Photo Chaos
          </h2>

          <div className="space-y-4 mb-6">
            {[
              {
                scenario: "A grandparent passes away.",
                need: "Someone needs a slideshow in 48 hours. Where are the photos?",
              },
              {
                scenario: "Your kid graduates.",
                need: "Someone wants a photo book spanning 18 years of sessions.",
              },
              {
                scenario: "Your anniversary comes up.",
                need: "The gallery link from your wedding photographer no longer exists.",
              },
            ].map((item) => (
              <Card key={item.scenario} className="bg-card/50 border-border">
                <CardContent className="p-4">
                  <p className="font-medium text-foreground">
                    {item.scenario}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.need}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-muted-foreground">
            These aren&apos;t hypothetical situations. They happen in families
            every day. And when they do, the photos are either there or they
            aren&apos;t.
          </p>
        </section>

        {/* What Gallery Fatigue Actually Costs */}
        <section id="what-gallery-fatigue-costs" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            What Gallery Fatigue Actually Costs
          </h2>

          <p className="text-muted-foreground mb-4">
            The average family works with 4&ndash;6 professional photographers
            over the course of raising kids. A meaningful percentage of those
            photos will be lost within 10 years. Hard drives fail. Cloud
            accounts get deleted. Links expire.
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>The real cost isn&apos;t financial.</strong> It&apos;s the
              photo you can&apos;t find when you need it most. The session you
              forgot existed. The gallery link that returns a 404. These are
              irreplaceable moments stored on replaceable infrastructure.
            </p>
          </div>
        </section>

        {/* What the Solution Looks Like */}
        <section id="solution" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            What the Solution Actually Looks Like
          </h2>

          <p className="text-muted-foreground mb-6">
            PhotoVault was built to be a permanent home for professional photos.
            Every photographer adds their work to your vault — not a new
            platform, not a new login. Clients pay $8/month to keep everything
            permanently.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: <FolderOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />,
                title: "Professional organization",
                desc: "Photos organized by photographer, session, and date — not mixed with screenshots and phone snapshots.",
              },
              {
                icon: <DollarSign className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />,
                title: "Photographer accountability",
                desc: "Your photographer earns $4/month as long as you're a subscriber. They're incentivized to deliver great work and keep you happy.",
              },
              {
                icon: <Users className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />,
                title: "Generational protection",
                desc: "Family Accounts let you designate up to 5 family members who can access your photos. Your memories aren't locked behind one person's login.",
              },
              {
                icon: <Lock className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />,
                title: "No expiry",
                desc: "Even if your photographer leaves the platform, your photos stay via the Orphan Protocol. You pay for your storage — your photos are yours.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border">
                <CardContent className="p-4 flex gap-3">
                  {item.icon}
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

        {/* The $8/Month Question */}
        <section id="eight-dollar-question" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            The $8/Month Question
          </h2>

          <p className="text-muted-foreground mb-4">
            Free photo storage services are built for convenience, not
            permanence. Google changed their storage policy in 2021. iCloud
            exists to keep you in Apple&apos;s ecosystem. Professional photos
            deserve intentional storage.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              <strong>Memory insurance isn&apos;t free.</strong> The question
              isn&apos;t whether $8/month is a lot — it&apos;s whether losing
              those photos would cost more.
            </p>
          </div>

          <p className="text-muted-foreground">
            For the cost of two coffees a month, every professional photo your
            family has ever taken lives in one place, organized, accessible,
            and permanent.
          </p>
        </section>

        {/* Gallery Fatigue Is Solvable */}
        <section className="mb-16">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Gallery Fatigue Is Solvable
            </h2>
            <p className="text-lg text-foreground">
              One vault. Every photographer. Every session. Always there.
            </p>
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
                What is gallery fatigue?
              </h3>
              <p className="text-muted-foreground">
                Gallery fatigue is the frustration families experience when
                their professional photos are scattered across multiple
                platforms — Pic-Time, Pixieset, Dropbox, Google Drive, USB
                drives — each requiring separate logins and accounts. It makes
                finding and preserving family photos unnecessarily difficult.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How much does PhotoVault cost for families?
              </h3>
              <p className="text-muted-foreground">
                PhotoVault costs $8/month or $100/year for families. This
                covers permanent storage for all your professional photos in
                one place, organized by photographer and session. Your
                photographer earns a commission from your subscription, so
                they&apos;re incentivized to deliver through PhotoVault.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What happens to my photos if my photographer leaves?
              </h3>
              <p className="text-muted-foreground">
                PhotoVault&apos;s Orphan Protocol ensures your photos remain
                accessible even if your photographer leaves the platform.
                Because you pay for your own storage, your photos are yours —
                they don&apos;t disappear when a photographer cancels their
                account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Can all my photographers use PhotoVault?
              </h3>
              <p className="text-muted-foreground">
                Yes. Any photographer can sign up for PhotoVault and deliver
                galleries to your vault. Each photographer&apos;s work is
                organized separately within your account, so all your
                professional photos live in one place regardless of who took
                them.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Keep Your Family&apos;s Photos Safe
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Stop juggling five platforms and five passwords. PhotoVault gives
            your family one permanent home for every professional photo — from
            every photographer, every session, every milestone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                <Shield className="mr-2 h-5 w-5" />
                Learn More About PhotoVault
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/resources/photo-storage-comparison">
                Compare Storage Options
              </Link>
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
          </div>
        </section>
      </main>
    </div>
  );
}
