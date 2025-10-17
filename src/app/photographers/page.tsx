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

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 sticky top-0 z-50">
        <div className="container-pixieset py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold text-foreground tracking-tight">PhotoVault Pro</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/login">
                Log In
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg">
              <Link href="/photographers/signup">
                Join as a Partner
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-pixieset section-spacing">
        {/* Hero Section */}
        <div className="text-center mb-24 fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground leading-[1.1] tracking-tight">
            Keep Your Clients Engaged Forever —<br />No More Expiring Galleries
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Stop losing clients to gallery expirations. PhotoVault gives photographers permanent client storage, automated engagement, and referral revenue. Grow your business with lifetime client access.
          </p>
          
          {/* Pricing Highlight */}
          <div className="bg-secondary/50 border border-border rounded-2xl p-10 md:p-12 mb-12 max-w-4xl mx-auto card-shadow">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-semibold text-primary mb-3">$22/month</div>
                <div className="text-lg text-foreground mb-4 font-medium">Professional Photo Sharing Platform</div>
                <div className="text-sm text-muted-foreground">
                  Unlimited galleries • Advanced analytics • Commission tracking
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-semibold text-primary mb-3">Earn $50 + $4/month</div>
                <div className="text-lg text-foreground mb-2 font-medium">Commission Program</div>
                <div className="text-sm text-muted-foreground">
                  $50 upfront + $4/month passive income per client
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                <span>14-day free trial • No setup fees</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button asChild size="lg" className="btn-primary px-10 py-6">
              <Link href="/photographers/signup">
                Get Started
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
        <section className="section-spacing-sm bg-secondary/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                Expired Galleries Are Costing You Clients
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Your clients lose access to their photos after 6-12 months. They can&apos;t share memories, order prints, or refer you to friends. You&apos;re missing opportunities every day.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="border border-border card-shadow-hover bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-foreground/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Gallery Expirations</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Pixieset, ShootProof, and SmugMug galleries expire. Your clients lose access to their memories and your work.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Users className="h-7 w-7 text-foreground/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Lost Engagement</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Clients can&apos;t share your photos after galleries expire. No social media buzz, no word-of-mouth referrals.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-full mx-auto mb-5 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-foreground/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Missed Revenue</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    No re-orders, no anniversary sessions, no referrals. You&apos;re leaving money on the table every month.
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
              Your Clients&apos; Photos. Always There. Always Branded.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              PhotoVault gives your clients permanent access to their galleries while keeping your branding front and center. Automated engagement keeps you top-of-mind for future bookings.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-10 md:p-12 card-shadow">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">Photographer Benefits</h3>
                <div className="space-y-4">
                  {[
                    "Permanent client galleries that never expire",
                    "Automated engagement emails to keep clients active", 
                    "Your branding on every client interaction",
                    "Referral revenue when clients renew storage",
                    "Client analytics and engagement tracking",
                    "Easy integration with existing workflow"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-primary">Client Experience</h3>
                <div className="space-y-4">
                  {[
                    "All photos organized in one beautiful dashboard",
                    "Easy sharing with family and friends",
                    "Download options for prints and social media",
                    "Timeline view of all their photo sessions",
                    "Secure, private access forever",
                    "Connection to other photographer galleries"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="section-spacing-sm bg-secondary/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
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
                <Card key={index} className="overflow-hidden border border-border card-shadow-hover bg-card group">
                  <div className="image-card h-48">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="image-card-content">
                      <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                      <p className="text-white/90 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-lg font-semibold mx-auto mb-4 group-hover:scale-110 transition-transform">
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
              Turn Every Gallery Into Ongoing Income
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Earn referral revenue when clients renew their storage. Turn one-time clients into recurring revenue streams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="border border-border card-shadow-hover bg-card">
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
                  <div className="text-3xl font-semibold text-primary">$50 + $4/month</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Earn $50 upfront commission + $4/month passive income for every client through PhotoVault.
                  </p>
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Example:</strong> 25 clients × $50 upfront = $1,250 + 25 clients × $4/month = $100/month passive income
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
                  <p className="text-slate-600 dark:text-slate-300">
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
            <h2 className="text-4xl font-bold mb-6 text-slate-800 dark:text-white">
              Trusted by Forward-Thinking Photographers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "PhotoVault solved my biggest problem - clients losing access to their galleries. Now they can always find their photos and I earn passive income.",
                author: "Emma Rodriguez",
                business: "Emma Photography",
                location: "Wedding Specialist"
              },
              {
                quote: "My clients love having all their photos in one place. The automated engagement keeps me top-of-mind for future bookings.",
                author: "Mike Chen", 
                business: "Chen Studios",
                location: "Family & Portrait"
              },
              {
                quote: "The referral revenue is a game-changer. I'm earning $200/month from past clients who now have permanent access to their galleries.",
                author: "Sarah Thompson",
                business: "Thompson Photography",
                location: "Event Specialist"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-4 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.business}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6 text-slate-800 dark:text-white">
              Questions We Hear Every Day
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
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
                answer: "Earn $50 upfront + $4/month passive income for every client. Plus $22/month platform fee with 14-day free trial."
              },
              {
                question: "How does PhotoVault compare to Pixieset/ShootProof?",
                answer: "PhotoVault charges $22/month vs $20-30/month competitors, but you earn $50 + $4/month commission on every client - making it profitable!"
              },
              {
                question: "What's included in the $22/month fee?",
                answer: "Unlimited galleries, advanced analytics, commission tracking, PDF reports, client invitations, and professional CMS integration."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">{faq.question}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-6">
            Start Your 14-Day Free Trial Today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join hundreds of photographers earning $50 + $4/month commission on every client. 
            Replace expensive platforms with a profitable alternative.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-green-600 hover:bg-gray-100">
              <Link href="/photographers/signup">
                Get Started
                <Camera className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 text-sm opacity-75">
            No credit card required • Cancel anytime • 14-day free trial
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">PhotoVault</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Keep clients engaged forever and earn recurring revenue.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Photographers</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/photographers/benefits" className="hover:text-blue-600">Benefits</Link></li>
                <li><Link href="/photographers/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/photographers/integration" className="hover:text-blue-600">Integration</Link></li>
                <li><Link href="/photographers/support" className="hover:text-blue-600">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/photographers/case-studies" className="hover:text-blue-600">Case Studies</Link></li>
                <li><Link href="/photographers/blog" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="/photographers/webinars" className="hover:text-blue-600">Webinars</Link></li>
                <li><Link href="/photographers/help" className="hover:text-blue-600">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            © 2024 PhotoVault. Grow your photography business with lifetime client access.
          </div>
        </div>
      </footer>
    </div>
  );
}
