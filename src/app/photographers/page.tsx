import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PricingComparison } from "@/components/pricing-comparison";
import {
  ArrowLeft,
  Camera,
  Users,
  DollarSign,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  Star,
  TrendingUp,
  Heart
} from "lucide-react";

export const metadata: Metadata = {
  title: "PhotoVault for Photographers | Earn Passive Income From Every Shoot",
  description: "Turn every photoshoot into passive income. Earn $4/month per client forever while giving families permanent photo storage. Replace Pixieset, ShootProof, SmugMug.",
  keywords: "photographer photo storage, client gallery hosting, photography passive income, memory insurance, photo delivery platform, Pixieset alternative, ShootProof alternative",
  openGraph: {
    type: "website",
    title: "PhotoVault for Photographers | Earn Passive Income",
    description: "Turn every photoshoot into $4/month passive income. Give clients permanent photo storage while building recurring revenue.",
    url: "https://www.photovault.photo/photographers",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://www.photovault.photo/images/og-photographers.webp",
        width: 1200,
        height: 630,
        alt: "PhotoVault for Photographers - Memory Insurance Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PhotoVault for Photographers | Earn Passive Income",
    description: "Turn every photoshoot into $4/month passive income. Give clients permanent photo storage.",
    images: ["https://www.photovault.photo/images/og-photographers.webp"],
  },
  alternates: {
    canonical: "https://www.photovault.photo/photographers",
  },
};

// FAQ data for both rendering and structured data
const faqs = [
  {
    question: "How does PhotoVault work?",
    answer: "You upload galleries and invite clients. Clients pay $8/month (or prepay 6-12 months) for permanent access to their photos. You earn 50% of every payment as passive income. That's it."
  },
  {
    question: "Do I keep ownership of my photos?",
    answer: "Yes, photographers retain full copyright and control. Clients only access approved galleries. Your work stays yours."
  },
  {
    question: "How much can I earn?",
    answer: "You earn $4/month per active client, plus upfront commissions on prepaid packages ($25 for 6-month, $50 for annual). 25 clients = $100/month passive income. 100 clients = $400/month. All from work you've already done."
  },
  {
    question: "How does PhotoVault compare to Pixieset/ShootProof?",
    answer: "Those platforms charge you $20-30/month and you earn nothing. PhotoVault charges $22/month but you earn commission on every client — so it pays for itself with just 6 clients."
  },
  {
    question: "What's included in the $22/month fee?",
    answer: "Unlimited galleries, unlimited uploads, a desktop app for large gallery uploads, automated client email sequences, advanced analytics, commission tracking, and full Stripe payment processing. No storage limits, no per-gallery fees."
  },
  {
    question: "What happens to photos if PhotoVault shuts down?",
    answer: "All photos are stored on enterprise infrastructure (AWS via Supabase). You can always download your galleries. We're bootstrapped with no VC pressure — built to be sustainable, not to grow unsustainably."
  },
  {
    question: "How do my clients feel about paying $8/month?",
    answer: "Clients can prepay ($50 for 6 months or $100 for a year) so it feels like a one-time cost. By the time monthly billing starts, they've had their photos long enough that the value is proven. $8/month is less than most streaming services for something irreplaceable."
  }
];

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* FAQPage Structured Data for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer
              }
            }))
          })
        }}
      />
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-pixieset py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/images/logos/photovault logo.png" 
                alt="PhotoVault Pro" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-foreground tracking-tight ml-2">Pro</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/login">
                Log In
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-foreground text-sm font-semibold rounded-lg">
              <Link href="/photographers/signup">
                Start Your Free Beta
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-pixieset section-spacing">
        {/* Beta Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-semibold">
            <Star className="h-4 w-4" />
            <span>Beta — Free for Founding Photographers</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-24 fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground leading-[1.1] tracking-tight">
            Turn Every Photoshoot<br />Into Passive Income
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Your clients pay $8/month for permanent photo storage. You earn $4/month forever. No extra work, no storage fees, no per-gallery pricing — just recurring income from shoots you&apos;ve already done.
          </p>
          
          {/* Pricing Highlight */}
          <div className="bg-card/50 border border-border rounded-2xl p-10 md:p-12 mb-12 max-w-4xl mx-auto card-shadow">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-semibold text-primary mb-3">Earn $4/month</div>
                <div className="text-lg text-foreground mb-4 font-medium">Per Client, Forever</div>
                <div className="text-sm text-muted-foreground">
                  Plus $25-$50 upfront commission on prepaid packages
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-semibold text-primary mb-3">$22/month platform fee</div>
                <div className="text-lg text-foreground mb-2 font-medium">Pays for itself with 6 clients</div>
                <div className="text-sm text-muted-foreground">
                  Unlimited galleries • Unlimited uploads • Desktop app included
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>No setup fees • Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button asChild size="lg" className="btn-primary px-10 py-6">
              <Link href="/photographers/signup">
                Start Your Free Beta
                <Camera className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="btn-outline px-10 py-6">
              <Link href="/photographers#how-it-works">
                See How It Works
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-16">
            Already a partner?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
              Log in here
            </Link>
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="font-medium">Replace Pixieset, ShootProof, SmugMug</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Keep full ownership</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Earn referral revenue</span>
            </div>
          </div>
        </div>

        {/* Problem Section */}
        <section className="section-spacing-sm bg-card/30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                The Photography Business Model Is Broken
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                You trade time for money, pay platforms that charge more as you grow, and lose touch with clients the moment you deliver. Sound familiar?
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Your Costs Go Up As You Grow</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pixieset, ShootProof, SmugMug — they all charge you more as you add galleries. More clients should mean more income, not more overhead.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">You Deliver and Disappear</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You pour your heart into a shoot, deliver beautiful work, and never hear from that client again. No re-bookings, no referrals, no relationship.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Zero Passive Income</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You have years of completed work sitting in archives earning nothing. 100 past clients could be $400/month — but right now they&apos;re $0.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="section-spacing-sm">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
              The Gallery Platform That Pays You Back
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              PhotoVault flips the model. Your clients pay for permanent storage, you earn 50% as passive income. More clients means more revenue — not more overhead.
            </p>
          </div>

          <div className="bg-card/50 border border-border rounded-2xl p-10 md:p-12 card-shadow">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">What You Get</h3>
                <div className="space-y-4">
                  {[
                    "Earn $4/month passive income on every client — forever",
                    "$25-$50 upfront commission on prepaid packages",
                    "Unlimited galleries and uploads — no storage fees",
                    "Desktop app for large wedding galleries (1,000+ photos)",
                    "Automated client email sequences (you stay top-of-mind)",
                    "Same price as competitors — but you earn instead of just paying"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">What Your Clients Get</h3>
                <div className="space-y-4">
                  {[
                    "Permanent access to their photos — galleries never expire",
                    "One tap to camera roll — full resolution, no zip files",
                    "Share with family instantly from any device",
                    "All their photographers' work in one place",
                    "Less than a coffee per month for irreplaceable memories",
                    "Photos survive hard drive crashes, phone losses, and moves"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="section-spacing-sm bg-card/30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                Up and Running in 5 Minutes
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Sign up, upload a gallery, invite your client. Start earning from day one.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: "1",
                  title: "Sign Up & Connect Stripe",
                  description: "Create your account and connect Stripe in under 5 minutes. This is how you get paid — commissions deposit directly to your bank.",
                  icon: <Camera className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "2",
                  title: "Upload & Invite Clients",
                  description: "Upload galleries via browser or desktop app (handles large wedding shoots). Send branded invitations — clients get permanent access.",
                  icon: <Users className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "3",
                  title: "Earn Passive Income",
                  description: "Clients choose a storage plan. You earn 50% of every payment — $4/month ongoing or $25-$50 upfront on prepaid packages.",
                  icon: <DollarSign className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop&crop=center"
                }
              ].map((item, index) => (
                <Card key={index} className="overflow-hidden border border-border card-shadow-hover bg-card/50 group">
                  <div className="image-card h-48">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="image-card-content">
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-foreground/90 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary text-foreground rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="text-primary">
                        {item.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue Section */}
        <section className="section-spacing-sm">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
              The Math Is Simple
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Your clients pay $8/month for permanent photo storage. You earn $4/month per client, forever. No extra work — just income from shoots you&apos;ve already done.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="border border-border card-shadow-hover bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Your Commission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-semibold text-primary">$25-$50 + $4/month</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Earn $25 (6-month) or $50 (1-year) upfront commission + $4/month passive income for every client through PhotoVault.
                  </p>
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> 25 clients × $50 upfront (1-year) = $1,250 + 25 clients × $4/month = $100/month passive income
                    </p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button asChild variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                      <Link href="/photographers/commission-details">
                        Click for More Details
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border card-shadow-hover bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Stay Connected to Clients</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-semibold text-primary">No More Ghosting</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Galleries that never expire mean clients come back. Anniversary re-bookings, family referrals, and re-orders happen because you stayed in their life — not because you chased them.
                  </p>
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>The math:</strong> Even 1 re-booking per year from a past client is worth more than the commission alone
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="mb-16">
          <PricingComparison />
        </section>

        {/* Why I Built This / Founder Section */}
        <section className="mb-16">
          <div className="bg-card/50 border border-border rounded-2xl p-10 md:p-12 card-shadow max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-foreground tracking-tight">
              Why I Built This
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                My wife and I have used 5 different photographers over the years. Our wedding photos are on a USB drive somewhere. Our daughter&apos;s newborn session? An expired Pixieset link. Family portraits from 2 years ago? I genuinely don&apos;t know where those are.
              </p>
              <p>
                That&apos;s the problem for families. But the problem for photographers is just as bad — you pour your heart into a shoot, deliver beautiful work, and then never hear from that client again. Meanwhile your platform charges you more every month.
              </p>
              <p>
                PhotoVault fixes both sides. Families get permanent photo storage. Photographers get passive income from work they&apos;ve already done. No more paying for the privilege of storing someone else&apos;s photos.
              </p>
              <p className="text-foreground font-medium">
                — Nate, founder. Built in Madison, WI.
              </p>
            </div>
          </div>
        </section>

        {/* Founding Photographers CTA */}
        <section className="mb-16">
          <div className="bg-card/50 border border-primary/20 rounded-2xl p-10 md:p-12 text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1">
              <Star className="h-3 w-3 mr-1" />
              Limited Beta
            </Badge>
            <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
              Be a Founding Photographer
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We&apos;re looking for the first 20 photographers to shape PhotoVault. Free platform access during beta. Your feedback directly influences what we build. No risk, no commitment.
            </p>
            <Button asChild size="lg" className="btn-primary px-10 py-6">
              <Link href="/photographers/signup">
                Start Your Free Beta
                <Camera className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Common Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-border bg-card/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-foreground shadow-xl">
          <h2 className="text-4xl font-bold mb-6">
            Start Earning From Work You&apos;ve Already Done
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Every past client is potential passive income. 25 clients = $100/month. 100 clients = $400/month. The platform is free during beta — no risk, no commitment.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-green-600 hover:bg-gray-100">
              <Link href="/photographers/signup">
                Start Your Free Beta
                <Camera className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 text-sm opacity-75">
            Free during beta • No credit card required • Cancel anytime
          </div>
        </section>
      </main>

    </div>
  );
}
