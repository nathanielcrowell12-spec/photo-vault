import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Users,
  Cloud,
  HardDrive,
  DollarSign,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Photo Storage Comparison 2026 | PhotoVault vs Google Photos vs iCloud",
  description:
    "Compare PhotoVault, Google Photos, iCloud, Amazon Photos, and Dropbox. Find the best photo storage service for your family with our honest, feature-by-feature comparison.",
  keywords:
    "PhotoVault vs Google Photos, best photo storage service 2026, photo storage comparison, iCloud vs Google Photos, Amazon Photos review, Dropbox photo storage, permanent photo storage, family photo backup comparison",
  openGraph: {
    type: "article",
    title: "Photo Storage Comparison 2026 | PhotoVault vs Google Photos vs iCloud",
    description:
      "Compare the top photo storage services side-by-side. Honest pros and cons for PhotoVault, Google Photos, iCloud, Amazon Photos, and Dropbox.",
    url: "https://photovault.photo/resources/photo-storage-comparison",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://photovault.photo/images/og-photo-storage-comparison.jpg",
        width: 1200,
        height: 630,
        alt: "Photo Storage Comparison 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Storage Comparison 2026",
    description:
      "Compare PhotoVault, Google Photos, iCloud, Amazon Photos, and Dropbox side-by-side.",
    images: ["https://photovault.photo/images/og-photo-storage-comparison.jpg"],
  },
  alternates: {
    canonical: "https://photovault.photo/resources/photo-storage-comparison",
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
      name: "Photo Storage Comparison",
      item: "https://photovault.photo/resources/photo-storage-comparison",
    },
  ],
};

// Structured data for Article schema
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Photo Storage Comparison 2026: PhotoVault vs Google Photos vs iCloud",
  description:
    "Compare the top photo storage services side-by-side. Honest pros and cons for PhotoVault, Google Photos, iCloud, Amazon Photos, and Dropbox.",
  image: "https://photovault.photo/images/og-photo-storage-comparison.jpg",
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
    "@id": "https://photovault.photo/resources/photo-storage-comparison",
  },
};

// Service data for comparison
const services = [
  {
    name: "PhotoVault",
    icon: Shield,
    iconColor: "text-primary",
    permanentStorage: { value: true, note: "Designed for permanent access" },
    photographerManaged: { value: true, note: "Professional delivery and management" },
    familySharing: { value: true, note: "Built-in family access" },
    memoryInsurance: { value: true, note: "Core business model" },
    price: "$8/mo",
    priceNote: "After $100 setup",
    pros: [
      "Permanent storage with no policy change risk",
      "Professional photographer management",
      "Original quality preserved (no compression)",
      "Built for professional photos specifically",
      "One-tap download to camera roll",
    ],
    cons: [
      "Requires photographer to use the platform",
      "Not for everyday phone photos",
      "Monthly subscription required",
    ],
    bestFor: "Families with professional photos (weddings, newborns, portraits) who want guaranteed permanent access without any technical management.",
  },
  {
    name: "Google Photos",
    icon: Cloud,
    iconColor: "text-blue-500",
    permanentStorage: { value: false, note: "Policy changes; inactive account deletion" },
    photographerManaged: { value: false, note: "Self-managed only" },
    familySharing: { value: true, note: "Up to 5 family members" },
    memoryInsurance: { value: false, note: "No guarantee model" },
    price: "Free-$10/mo",
    priceNote: "15GB free, then paid tiers",
    pros: [
      "Excellent search and AI organization",
      "Automatic phone backup",
      "Free tier available",
      "Cross-platform apps",
      "Easy sharing features",
    ],
    cons: [
      "Ended unlimited free storage in 2021",
      "Inactive accounts deleted after 2 years",
      "Compresses photos on free tier",
      "Privacy concerns with Google ecosystem",
      "Terms can change at any time",
    ],
    bestFor: "Casual users who want automatic phone backup and don't mind using Google's ecosystem. Great for everyday photos, less ideal for irreplaceable professional work.",
  },
  {
    name: "iCloud",
    icon: Cloud,
    iconColor: "text-gray-400",
    permanentStorage: { value: false, note: "Requires ongoing subscription" },
    photographerManaged: { value: false, note: "Self-managed only" },
    familySharing: { value: true, note: "Family Sharing with up to 5 members" },
    memoryInsurance: { value: false, note: "No guarantee model" },
    price: "$1-$10/mo",
    priceNote: "5GB free, 50GB-2TB paid",
    pros: [
      "Seamless Apple device integration",
      "Automatic iPhone backup",
      "iCloud Photos syncs everywhere",
      "Strong privacy reputation",
      "Family Sharing included",
    ],
    cons: [
      "Stop paying, lose access to photos over 5GB",
      "Poor experience on non-Apple devices",
      "Limited free storage",
      "No way to 'own' your storage permanently",
      "Locked into Apple ecosystem",
    ],
    bestFor: "Apple-only households who want seamless sync across all their devices. Best when already paying for Apple One bundle.",
  },
  {
    name: "Amazon Photos",
    icon: HardDrive,
    iconColor: "text-orange-500",
    permanentStorage: { value: "partial", note: "Prime dependent" },
    photographerManaged: { value: false, note: "Self-managed only" },
    familySharing: { value: true, note: "Family Vault with Prime" },
    memoryInsurance: { value: false, note: "No guarantee model" },
    price: "Free w/Prime",
    priceNote: "Unlimited photos, 5GB video",
    pros: [
      "Unlimited photo storage with Prime",
      "Original quality preserved",
      "Family Vault feature",
      "Good desktop app",
      "No additional cost if you have Prime",
    ],
    cons: [
      "Cancel Prime = lose unlimited storage",
      "Only 5GB for videos",
      "Less intuitive than competitors",
      "Fewer editing/organization features",
      "Your storage is tied to shopping subscription",
    ],
    bestFor: "Existing Prime members who want free unlimited photo storage. Not recommended as primary storage since it depends on maintaining Prime membership.",
  },
  {
    name: "Dropbox",
    icon: HardDrive,
    iconColor: "text-blue-600",
    permanentStorage: { value: false, note: "Subscription required" },
    photographerManaged: { value: false, note: "Self-managed only" },
    familySharing: { value: true, note: "Dropbox Family plan" },
    memoryInsurance: { value: false, note: "No guarantee model" },
    price: "$12/mo",
    priceNote: "2GB free, Plus starts at $12/mo",
    pros: [
      "Excellent file sync technology",
      "Works on any platform",
      "Good for photographers sharing with clients",
      "Version history and recovery",
      "Professional reputation",
    ],
    cons: [
      "Expensive compared to alternatives",
      "Not photo-focused (general file storage)",
      "Very limited free tier (2GB)",
      "No photo-specific AI features",
      "Overkill for just photo storage",
    ],
    bestFor: "Users who need general file sync AND photo storage. Better suited for photographers sharing client work than for family photo preservation.",
  },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (value === true) {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (value === false) {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
  return <AlertTriangle className="h-5 w-5 text-amber-500" />;
}

export default function PhotoStorageComparisonPage() {
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

      <main className="container mx-auto px-4 py-12 max-w-6xl">
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
          <span className="text-foreground">Photo Storage Comparison</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Photo Storage Comparison 2026
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            An honest, feature-by-feature comparison of the top photo storage
            services. We list PhotoVault first (it&apos;s our service), but we&apos;ll
            be fair about what each option does well.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span>Updated January 2026</span>
            <span>-</span>
            <span>10 min read</span>
          </div>
        </header>

        {/* Quick Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Quick Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-4 text-foreground font-semibold">
                    Feature
                  </th>
                  {services.map((service) => (
                    <th
                      key={service.name}
                      className="text-center py-4 px-3 text-foreground font-semibold"
                    >
                      {service.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="py-4 px-4 font-medium text-foreground">
                    Permanent Storage
                  </td>
                  {services.map((service) => (
                    <td key={service.name} className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <FeatureIcon value={service.permanentStorage.value} />
                        <span className="text-xs">{service.permanentStorage.note}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="py-4 px-4 font-medium text-foreground">
                    Photographer Managed
                  </td>
                  {services.map((service) => (
                    <td key={service.name} className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <FeatureIcon value={service.photographerManaged.value} />
                        <span className="text-xs">{service.photographerManaged.note}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border">
                  <td className="py-4 px-4 font-medium text-foreground">
                    Family Sharing
                  </td>
                  {services.map((service) => (
                    <td key={service.name} className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <FeatureIcon value={service.familySharing.value} />
                        <span className="text-xs">{service.familySharing.note}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="py-4 px-4 font-medium text-foreground">
                    Memory Insurance Model
                  </td>
                  {services.map((service) => (
                    <td key={service.name} className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <FeatureIcon value={service.memoryInsurance.value} />
                        <span className="text-xs">{service.memoryInsurance.note}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border">
                  <td className="py-4 px-4 font-medium text-foreground">
                    Price
                  </td>
                  {services.map((service) => (
                    <td key={service.name} className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-foreground">
                          {service.price}
                        </span>
                        <span className="text-xs">{service.priceNote}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            * Scroll horizontally on mobile to see all services
          </p>
        </section>

        {/* Detailed Service Breakdowns */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Detailed Breakdown by Service
          </h2>

          <div className="space-y-8">
            {services.map((service, index) => (
              <Card
                key={service.name}
                className={`bg-card/50 border-border ${
                  index === 0 ? "ring-2 ring-primary/50" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <service.icon className={`h-8 w-8 ${service.iconColor}`} />
                    <h3 className="text-2xl font-bold text-foreground">
                      {service.name}
                    </h3>
                    {index === 0 && (
                      <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                        Our Service
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm font-semibold text-green-500 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Pros
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {service.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cons
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        {service.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Best For:
                      </span>
                      <span className="text-muted-foreground">{service.bestFor}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* The Honest Truth Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            The Honest Truth About Each Service
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p>
              We&apos;re a photo storage company, so let&apos;s be upfront about our
              biases and limitations:
            </p>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  When PhotoVault is NOT the right choice:
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>
                      You want automatic phone backup for everyday photos - use Google
                      Photos or iCloud
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>
                      You don&apos;t have professional photos worth protecting - stick with
                      free cloud options
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>
                      Your photographer doesn&apos;t use PhotoVault - we can&apos;t help
                      (yet)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    <span>
                      You want to DIY your photo organization - you&apos;ll hate our
                      managed approach
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  When PhotoVault IS the right choice:
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      You have professional photos worth thousands of dollars
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      You want guaranteed permanent access, not &quot;until we change our
                      terms&quot;
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      You&apos;re tired of photographer gallery links that expire
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      You want family members to have their own permanent copies
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* The Real Problem Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            The Real Problem With &quot;Free&quot; Photo Storage
          </h2>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
            <p>
              Every free or cheap cloud service has the same fundamental problem:
              <strong className="text-foreground">
                {" "}
                their business model requires them to change terms over time.
              </strong>
            </p>

            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Google Photos (2021):</strong> Ended unlimited free storage.
                  Photos uploaded after June 2021 count against your 15GB limit.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Google (2023):</strong> Announced inactive accounts (including
                  photos) would be deleted after 2 years of inactivity.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>Amazon Photos:</strong> Your &quot;unlimited&quot; storage only exists
                  while you maintain a Prime subscription.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                <span>
                  <strong>iCloud:</strong> Stop paying = 30 days to download before photos
                  over 5GB are permanently deleted.
                </span>
              </li>
            </ul>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mt-6">
              <p className="text-foreground font-medium">
                &quot;Free&quot; photo storage is a marketing term, not a business model. At
                some point, the company needs to monetize your photos or cut costs.
                When they do, your memories are at risk.
              </p>
            </div>
          </div>
        </section>

        {/* Use Case Recommendations */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            Our Recommendation by Use Case
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Everyday Phone Photos
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Google Photos (Android) or iCloud (iPhone). The convenience of
                  automatic backup outweighs the risks for casual photos.
                </p>
                <p className="text-xs text-amber-500">
                  Risk: Moderate - but these aren&apos;t irreplaceable
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Professional Photos (Weddings, Portraits)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  PhotoVault or a hybrid local + cloud approach. These photos cost
                  hundreds to thousands to create - they deserve real protection.
                </p>
                <p className="text-xs text-green-500">
                  Risk: Low - professional-grade protection
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Apple-Only Households
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  iCloud with Apple One bundle. The ecosystem integration is worth
                  the subscription if you&apos;re all-in on Apple.
                </p>
                <p className="text-xs text-amber-500">
                  Risk: Moderate - subscription dependency
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Existing Prime Members
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Amazon Photos as a secondary backup. It&apos;s free with your
                  membership, but don&apos;t rely on it as your only copy.
                </p>
                <p className="text-xs text-amber-500">
                  Risk: Moderate - tied to Prime subscription
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Tech-Savvy Users
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  NAS (Synology/QNAP) + cloud backup. Full control, but requires
                  ongoing maintenance and technical knowledge.
                </p>
                <p className="text-xs text-green-500">
                  Risk: Low - if maintained properly
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  For Photographers Sharing With Clients
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  PhotoVault (if you want clients to keep photos permanently) or
                  Dropbox/dedicated gallery software for temporary sharing.
                </p>
                <p className="text-xs text-blue-500">
                  Depends on your delivery model
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Read our complete guide to photo storage for a deeper dive into
            protecting your memories long-term.
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
                Read the Complete Guide
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
              href="/resources/photo-storage-guide"
              className="block group"
            >
              <Card className="bg-card/50 border-border h-full group-hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground group-hover:text-primary mb-2">
                    The State of Photo Storage in 2026
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Why your photos aren&apos;t as safe as you think, and what to do
                    about it.
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
          </div>
        </section>
      </main>
    </div>
  );
}
