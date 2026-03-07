import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  DollarSign,
  ArrowRight,
  TrendingUp,
  BarChart3,
  BookOpen,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "How to Create Recurring Revenue as a Photographer in 2026",
  description:
    "Learn how photographers build passive income from client subscriptions, print automation, memberships, and education. Stop starting every month from zero.",
  keywords:
    "photographer recurring revenue, passive income photography, photography business model, photographer subscription revenue, recurring income photographer",
  openGraph: {
    type: "article",
    title:
      "How to Create Recurring Revenue as a Photographer in 2026",
    description:
      "Learn how photographers build passive income from client subscriptions, print automation, memberships, and education.",
    url: "https://www.photovault.photo/resources/photographer-recurring-revenue",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Create Recurring Revenue as a Photographer in 2026",
    description:
      "Stop starting every month from zero. Four ways photographers build recurring income.",
  },
  alternates: {
    canonical: "https://www.photovault.photo/resources/photographer-recurring-revenue",
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
      name: "Photographer Recurring Revenue",
      item: "https://www.photovault.photo/resources/photographer-recurring-revenue",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "How to Create Recurring Revenue as a Photographer (Without Booking More Sessions)",
  description:
    "Learn how photographers build passive income from client subscriptions, print automation, memberships, and education.",
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
    "@id": "https://www.photovault.photo/resources/photographer-recurring-revenue",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much can photographers earn from client subscriptions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "On PhotoVault, photographers earn $4/month per subscribing client (50% of the $8/month client fee). A photographer with 100 active subscribers earns $400/month in passive income from work already completed. With 30 sessions per year and a 50% subscription rate, you can reach $420/month after 7 years of compounding.",
      },
    },
    {
      "@type": "Question",
      name: "What is the back catalog opportunity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The back catalog opportunity means reaching out to past clients from the last 3-5 years and offering them a way to keep their professional photos safe and accessible for $8/month. Many clients still care deeply about photos from weddings, family sessions, and other milestones. Each client who subscribes earns the photographer $4/month in passive income.",
      },
    },
    {
      "@type": "Question",
      name: "Which gallery platform pays photographers recurring revenue?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PhotoVault is the only gallery platform that pays photographers 50% of every client subscription. Most platforms charge photographers for storage and give clients free access. PhotoVault flips this model: clients pay for their own storage, and photographers earn a commission on every payment.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to build meaningful passive income?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "With 30 sessions per year and a 50% client subscription rate, a photographer can earn $60/month in passive income after the first year. By year 3, that grows to $180/month. By year 7, it compounds to $420/month. The key is that subscribers accumulate over time while requiring no additional work from the photographer.",
      },
    },
  ],
};

const tocItems = [
  { id: "tldr", label: "TL;DR" },
  { id: "why-not-one-and-done", label: "Why Photography Doesn't Have to Be One-and-Done" },
  { id: "four-ways", label: "Four Ways to Build Recurring Revenue" },
  { id: "subscription-math", label: "The Math on Client Subscriptions" },
  { id: "back-catalog", label: "The Back Catalog Opportunity" },
  { id: "why-platforms-dont", label: "Why Most Platforms Don't Support This" },
  { id: "getting-started", label: "Getting Started" },
  { id: "faq", label: "Common Questions" },
];

export default function PhotographerRecurringRevenuePage() {
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
          <span className="text-foreground">Photographer Recurring Revenue</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How to Create Recurring Revenue as a Photographer (Without Booking
            More Sessions)
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            The photography business has a structural problem. You book a
            wedding. You shoot it, edit it, deliver it. You get paid. Then you
            do it again. Every month starts from zero. Every slow season hurts
            the same way. This is feast-or-famine. It&apos;s a business model
            problem. And it&apos;s solvable.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Last updated March 2026</span>
            <span>~6 min read</span>
          </div>
        </header>

        {/* TL;DR */}
        <section id="tldr" className="mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                TL;DR
              </h2>
              <p className="text-foreground mb-3">
                There are four legitimate ways photographers build recurring
                revenue: client subscription storage, print sales automation,
                membership/retainer photography, and education/licensing. The
                most passive option is client subscription storage &mdash;
                clients pay monthly to keep their photos, you earn a commission.
              </p>
              <p className="text-foreground mb-3">
                On PhotoVault, clients pay $8/month and photographers earn
                $4/month per subscriber. With 30 sessions per year and a 50%
                subscription rate, you can build to $420/month in passive income
                by year 7 &mdash; from work you already completed.
              </p>
              <p className="text-sm text-muted-foreground">
                The back catalog opportunity is real: past clients from the last
                3&ndash;5 years still care about their photos and many will
                subscribe when asked.
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

        {/* Why Photography Doesn't Have to Be One-and-Done */}
        <section id="why-not-one-and-done" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            Why Photography Doesn&apos;t Have to Be One-and-Done
          </h2>

          <p className="text-muted-foreground mb-4">
            Think about what you leave behind when you deliver a gallery. Your
            client has photos they care about deeply. That gallery doesn&apos;t
            lose value after delivery &mdash; it gains it. The question is
            whether any of that ongoing value flows back to you. Under the
            traditional model, the answer is no.
          </p>
        </section>

        {/* Four Legitimate Ways */}
        <section id="four-ways" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Four Legitimate Ways Photographers Build Recurring Revenue
          </h2>

          {/* 1. Client Subscription Storage */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              1. Client Subscription Storage
            </h3>
            <p className="text-muted-foreground mb-4">
              Clients pay a monthly fee to keep their professional photos
              accessible, you earn a commission. This is how PhotoVault works.
              Clients pay $8/month, photographers earn $4. A photographer with
              100 active clients earns $400/month from work already completed.
            </p>
          </div>

          {/* 2. Print Sales Automation */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              2. Print Sales Automation
            </h3>
            <p className="text-muted-foreground mb-4">
              Set up automated email sequences that reconnect clients with their
              galleries at key moments &mdash; anniversaries, holidays,
              milestones. Some platforms (Pic-Time does this well) have print
              automation built in.
            </p>
          </div>

          {/* 3. Membership and Retainer Photography */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              3. Membership and Retainer Photography
            </h3>
            <p className="text-muted-foreground mb-4">
              Offer families an annual membership: one or two guaranteed
              sessions per year for a flat monthly fee ($100&ndash;$200/month).
              Predictable revenue, deeper client relationships.
            </p>
          </div>

          {/* 4. Education and Licensing */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              4. Education and Licensing
            </h3>
            <p className="text-muted-foreground mb-4">
              Presets, workshops, mentorships, online courses. The market for
              photography education is substantial and margins are high.
            </p>
          </div>
        </section>

        {/* The Math on Client Subscription Storage */}
        <section id="subscription-math" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            The Math on Client Subscription Storage
          </h2>

          <p className="text-muted-foreground mb-6">
            Say you shoot 30 sessions per year. If half subscribe at $8/month,
            that&apos;s 15 new subscribers per year at $4/month each.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                    Year
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    Cumulative Subscribers
                  </th>
                  <th className="text-left py-3 px-4 text-foreground font-semibold">
                    Monthly Passive Income
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">1</td>
                  <td className="py-3 px-4 text-foreground">15</td>
                  <td className="py-3 px-4 text-foreground">$60/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">2</td>
                  <td className="py-3 px-4 text-foreground">30</td>
                  <td className="py-3 px-4 text-foreground">$120/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">3</td>
                  <td className="py-3 px-4 text-foreground">45</td>
                  <td className="py-3 px-4 text-foreground">$180/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">5</td>
                  <td className="py-3 px-4 text-foreground">75</td>
                  <td className="py-3 px-4 text-foreground">$300/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground font-medium">
                    7
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    105
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    $420/month
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>After 7 years: $420/month from work you did years ago.</strong>{" "}
              That&apos;s a car payment. That&apos;s money during the slow
              season.
            </p>
          </div>
        </section>

        {/* The Back Catalog Opportunity */}
        <section id="back-catalog" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-500" />
            The Back Catalog Opportunity
          </h2>

          <p className="text-muted-foreground mb-4">
            A client you photographed in 2022 still has photos they care about.
            If you reach out and offer them a way to keep those photos safe for
            $8/month (with you earning half), many will take you up on it.
          </p>
        </section>

        {/* Why Most Platforms Don't Support This */}
        <section id="why-platforms-dont" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-amber-500" />
            Why Most Platforms Don&apos;t Support This
          </h2>

          <p className="text-muted-foreground mb-4">
            Their business model is charging photographers for storage. If
            clients paid directly and photographers earned a commission, that
            revenue would leave their platform. PhotoVault was built
            specifically on this aligned model.
          </p>
        </section>

        {/* Getting Started */}
        <section id="getting-started" className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            Getting Started
          </h2>

          <div className="space-y-4">
            {[
              {
                step: "Step 1",
                title: "Audit your current platform",
                desc: "Does it pay you anything for client storage? If not, you're leaving money on the table.",
              },
              {
                step: "Step 2",
                title: "Look at your back catalog",
                desc: "How many past clients from the last 3-5 years? Each one is a potential subscriber.",
              },
              {
                step: "Step 3",
                title: "Pick a model",
                desc: "Subscription storage is the most passive. Memberships require active sessions. Education requires content creation.",
              },
              {
                step: "Step 4",
                title: "Start with existing clients",
                desc: "Start with existing clients before chasing new ones. They already trust you and value your work.",
              },
            ].map((item) => (
              <Card key={item.step} className="bg-card/50 border-border">
                <CardContent className="p-4 flex gap-3">
                  <span className="text-sm font-bold text-primary mt-0.5 shrink-0 w-14">
                    {item.step}
                  </span>
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

        {/* What a Different Business Looks Like */}
        <section className="mb-16">
          <Card className="bg-green-500/10 border border-green-500/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-3">
                What a Different Business Looks Like
              </h2>
              <p className="text-foreground mb-3">
                Recurring revenue doesn&apos;t replace session bookings. But the
                business looks different when January comes with $300 in
                automatic passive income while you were sleeping.
              </p>
              <p className="text-sm text-muted-foreground italic">
                PhotoVault is the only gallery platform that pays photographers
                50% of every client subscription.
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
                How much can photographers earn from client subscriptions?
              </h3>
              <p className="text-muted-foreground">
                On PhotoVault, photographers earn $4/month per subscribing
                client (50% of the $8/month client fee). A photographer with
                100 active subscribers earns $400/month in passive income from
                work already completed. With 30 sessions per year and a 50%
                subscription rate, you can reach $420/month after 7 years of
                compounding.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What is the back catalog opportunity?
              </h3>
              <p className="text-muted-foreground">
                The back catalog opportunity means reaching out to past clients
                from the last 3&ndash;5 years and offering them a way to keep
                their professional photos safe and accessible for $8/month.
                Many clients still care deeply about photos from weddings,
                family sessions, and other milestones. Each client who
                subscribes earns the photographer $4/month in passive income.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Which gallery platform pays photographers recurring revenue?
              </h3>
              <p className="text-muted-foreground">
                PhotoVault is the only gallery platform that pays photographers
                50% of every client subscription. Most platforms charge
                photographers for storage and give clients free access.
                PhotoVault flips this model: clients pay for their own storage,
                and photographers earn a commission on every payment.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How long does it take to build meaningful passive income?
              </h3>
              <p className="text-muted-foreground">
                With 30 sessions per year and a 50% client subscription rate, a
                photographer can earn $60/month in passive income after the
                first year. By year 3, that grows to $180/month. By year 7, it
                compounds to $420/month. The key is that subscribers accumulate
                over time while requiring no additional work from the
                photographer.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Start Earning From Every Photoshoot
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            PhotoVault is free for 12 months during beta, and your $22/month
            rate is locked in forever. Join as a founding photographer and
            start turning past work into passive income &mdash; no credit card
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
              href="/resources/photovault-vs-shootproof"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    PhotoVault vs ShootProof 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compare PhotoVault and ShootProof side-by-side for your
                    photography business.
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
                    Honest comparison of business models, features, and pricing
                    for photographers.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link
              href="/resources/photovault-vs-pictime"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    PhotoVault vs Pic-Time 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Compare PhotoVault and Pic-Time for gallery delivery and
                    photographer revenue.
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
