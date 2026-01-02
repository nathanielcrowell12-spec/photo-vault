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
  RefreshCw,
  Target,
  Heart
} from "lucide-react";

export const metadata: Metadata = {
  title: "PhotoVault for Photographers | Memory Insurance Platform",
  description: "Turn every photoshoot into passive income. Earn $4/month per client forever while giving families permanent photo storage. Replace Pixieset, ShootProof, SmugMug.",
  keywords: "photographer photo storage, client gallery hosting, photography passive income, memory insurance, photo delivery platform, Pixieset alternative, ShootProof alternative",
  openGraph: {
    type: "website",
    title: "PhotoVault for Photographers | Earn Passive Income",
    description: "Turn every photoshoot into $4/month passive income. Give clients permanent photo storage while building recurring revenue.",
    url: "https://photovault.photo/photographers",
    siteName: "PhotoVault",
    images: [
      {
        url: "https://photovault.photo/images/og-photographers.webp",
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
    images: ["https://photovault.photo/images/og-photographers.webp"],
  },
  alternates: {
    canonical: "https://photovault.photo/photographers",
  },
};

// FAQ data for both rendering and structured data
const faqs = [
  {
    question: "How does PhotoVault help photographers?",
    answer: "PhotoVault stores client galleries permanently, automates engagement, and generates referral income. No more expiring galleries or lost client connections."
  },
  {
    question: "Do I keep ownership of my photos?",
    answer: "Yes, photographers retain full copyright and control. Clients only access approved galleries. Your work stays yours."
  },
  {
    question: "What's the commission program?",
    answer: "Earn $25 (6-month) or $50 (1-year) upfront + $4/month passive income for every family you protect. Plus $22/month platform fee."
  },
  {
    question: "How does PhotoVault compare to Pixieset/ShootProof?",
    answer: "PhotoVault charges $22/month vs $20-30/month competitors, but you earn $25-$50 + $4/month commission on every client - making it profitable!"
  },
  {
    question: "What's included in the $22/month fee?",
    answer: "Unlimited galleries, advanced analytics, commission tracking, PDF reports, client invitations, and professional CMS integration."
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
                Start Protecting Memories
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-pixieset section-spacing">
        {/* Hero Section */}
        <div className="text-center mb-24 fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground leading-[1.1] tracking-tight">
            You&apos;re not just a photographer.<br />You&apos;re the guardian of their family history.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Hard drives fail. The Cloud is someone else&apos;s computer. Your clients&apos; memories need real protection. PhotoVault is Memory Insurance—turn every photoshoot into passive income while giving families a digital safety deposit box for their most precious moments.
          </p>
          
          {/* Pricing Highlight */}
          <div className="bg-card/50 border border-border rounded-2xl p-10 md:p-12 mb-12 max-w-4xl mx-auto card-shadow">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-semibold text-primary mb-3">$22/month</div>
                <div className="text-lg text-foreground mb-4 font-medium">Professional Photo Sharing Platform</div>
                <div className="text-sm text-muted-foreground">
                  Unlimited galleries • Advanced analytics • Commission tracking
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-semibold text-primary mb-3">Earn $25-$50 + $4/month</div>
                <div className="text-lg text-foreground mb-2 font-medium">Commission Program</div>
                <div className="text-sm text-muted-foreground">
                  $25 (6mo) or $50 (1yr) upfront + $4/month passive income per client
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
                Start Protecting Memories
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
                Your Clients&apos; Memories Are at Risk
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                It&apos;s not <em>if</em> your clients&apos; hard drive will fail. It&apos;s <em>when</em>. Professional data recovery costs $500-$5,000. PhotoVault costs $8/month.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Hard Drives Have a 100% Failure Rate</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Eventually. Your clients&apos; wedding photos, baby&apos;s first steps, grandma&apos;s last Christmas—sitting on hardware that will someday fail.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Zip Files Are a Nightmare</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Remember sending clients a 4GB zip file? Remember them asking how to open it on their phone? We fixed that.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card/50">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary/50 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Expired Galleries = Lost Revenue</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your clients can&apos;t share memories they can&apos;t access. No anniversary re-orders, no referrals, no passive income.
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
              Memory Insurance for Your Clients&apos; Most Precious Moments
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              PhotoVault is a digital safety deposit box for family memories. One tap downloads to camera roll. Professional-grade protection. And you earn $4/month forever on every client.
            </p>
          </div>

          <div className="bg-card/50 border border-border rounded-2xl p-10 md:p-12 card-shadow">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">Why Photographers Love PhotoVault</h3>
                <div className="space-y-4">
                  {[
                    "Become the guardian of your clients' family history",
                    "Earn $4/month passive income on every client—forever",
                    "Your branding on their digital safety deposit box",
                    "One-tap delivery to camera roll (no more zip files)",
                    "Automated anniversary reminders drive re-bookings",
                    "Replace Pixieset, ShootProof, SmugMug—and earn more"
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
                    "Memory Insurance: Professional-grade protection for irreplaceable photos",
                    "One tap to camera roll—full resolution, instant",
                    "Share with family without zip files or tech headaches",
                    "All their photographers, all their memories, one place",
                    "For the price of one coffee a month: never lose a photo",
                    "Peace of mind that wedding photos survive any hard drive crash"
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
                Simple Integration — Lasting Results
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Connect your existing workflow in minutes. No learning curve, no disruption to your current process.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: "1",
                  title: "Connect Your Platform",
                  description: "Link your Pixieset, ShootProof, or SmugMug account. Import existing galleries instantly.",
                  icon: <Camera className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "2", 
                  title: "Client Invitations",
                  description: "Send branded invitations to existing clients. They get permanent access to their photos.",
                  icon: <Users className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "3",
                  title: "Automated Engagement", 
                  description: "Clients get reminders, sharing suggestions, and anniversary notifications. You stay top-of-mind.",
                  icon: <RefreshCw className="h-7 w-7" />,
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
              Every Photoshoot Becomes Passive Income
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Your clients pay $8/month for Memory Insurance—you earn $4/month forever. No extra work. Just protecting the moments you already captured.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="border border-border card-shadow-hover bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Referral Revenue</CardTitle>
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

            <Card className="border-2 border-blue-100 dark:border-blue-900/20">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Increased Bookings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-blue-600">2-3x More</div>
                  <p className="text-muted-foreground dark:text-foreground">
                    Clients with permanent photo access are 2-3x more likely to book anniversary sessions and refer friends.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Result:</strong> More repeat clients and word-of-mouth referrals
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

        {/* Testimonials */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Photographers Who Became Memory Guardians
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I used to worry about clients losing their photos after galleries expired. Now I tell them: 'Your memories are insured. You'll never lose these.' The relief on their faces—and the $4/month I earn—makes it a no-brainer.",
                author: "Emma Rodriguez",
                business: "Emma Photography",
                location: "Wedding Specialist"
              },
              {
                quote: "One of my clients lost everything in a house fire. Everything except the photos in PhotoVault. I'm not just their photographer anymore—I'm the guardian of their family history.",
                author: "Mike Chen",
                business: "Chen Studios",
                location: "Family & Portrait"
              },
              {
                quote: "I earn $400/month in passive income from 100 past clients. But honestly? The best part is knowing their wedding photos, their kids' first birthdays—all of it is safe. That matters.",
                author: "Sarah Thompson",
                business: "Thompson Photography",
                location: "Event Specialist"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border border-border bg-card/50">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Questions We Hear Every Day
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
            Become a Memory Guardian Today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Your clients&apos; memories deserve better than a failing hard drive. Give them Memory Insurance—and earn $4/month passive income on every client, forever.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-green-600 hover:bg-gray-100">
              <Link href="/photographers/signup">
                Start Protecting Memories
                <Camera className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 text-sm opacity-75">
            No credit card required • Cancel anytime
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-foreground">PhotoVault</span>
              </div>
              <p className="text-muted-foreground">
                Memory Insurance for families. Passive income for photographers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">For Photographers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/photographers/benefits" className="hover:text-blue-600">Benefits</Link></li>
                <li><Link href="/photographers/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/photographers/integration" className="hover:text-blue-600">Integration</Link></li>
                <li><Link href="/photographers/support" className="hover:text-blue-600">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/photographers/case-studies" className="hover:text-blue-600">Case Studies</Link></li>
                <li><Link href="/photographers/blog" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="/photographers/webinars" className="hover:text-blue-600">Webinars</Link></li>
                <li><Link href="/photographers/help" className="hover:text-blue-600">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-white/10" />
          <div className="text-center text-sm text-muted-foreground">
            © 2024 PhotoVault. Grow your photography business with lifetime client access.
          </div>
        </div>
      </footer>
    </div>
  );
}
