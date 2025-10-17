'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Shield, 
  Search, 
  Download, 
  Users, 
  Camera, 
  CheckCircle, 
  Star,
  ArrowRight,
  Clock,
  Lock,
  Cloud
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 sticky top-0 z-50">
        <div className="container-pixieset py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold text-foreground tracking-tight">PhotoVault</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/login">
                Log In
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg">
              <Link href="/signup">
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container-pixieset section-spacing">
        <div className="text-center mb-24 fade-in-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 text-foreground leading-[1.1] tracking-tight">
            Find and Keep Every Photo<br />You Love — Forever
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Stop losing precious family memories. PhotoVault automatically finds and organizes every professional photo from your photographers — weddings, newborns, family sessions — all in one secure place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button asChild size="lg" className="btn-primary px-10 py-6">
              <Link href="/signup">
                Find My Photos
                <Search className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="btn-outline px-10 py-6"
              onClick={() => {
                const element = document.getElementById('how-it-works');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-16">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
              Log in here
            </Link>
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="font-medium">Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <span className="font-medium">Never expires</span>
            </div>
          </div>
        </div>

        {/* Problem Section */}
        <section className="section-spacing-sm bg-secondary/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                Lost Your Photos Again?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                We've all been there. Your photographer sends a gallery link, you download a few favorites, and six months later... it's gone forever.
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
                    Most photographer galleries expire after 6-12 months. Your memories disappear without warning.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Search className="h-7 w-7 text-foreground/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Scattered Everywhere</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Photos spread across Pixieset, ShootProof, SmugMug, and more. Impossible to find what you need.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border card-shadow-hover bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Lock className="h-7 w-7 text-foreground/70" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Forgotten Passwords</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Different logins for every photographer. Lost passwords mean lost access to your own photos.
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
              We Bring Them All Home
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              PhotoVault connects to your photographers' platforms and automatically imports every gallery into your personal vault. Your family's story, safe forever.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-10 md:p-12 card-shadow">
            <div className="grid md:grid-cols-3 gap-10">
              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Connect Your Photographers</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Link Pixieset, ShootProof, SmugMug, and 15+ other platforms in minutes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <Cloud className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Automatic Backup</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every photo automatically saved to your secure vault. Never lose a memory again.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Cherish Forever</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Organize by family member, event, or year. Your memories, beautifully organized.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="section-spacing-sm bg-secondary/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                How It Works
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Three simple steps to secure your family's photo collection forever.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Vault",
                  description: "Sign up in 30 seconds. Your secure, private photo vault is ready instantly.",
                  icon: <Shield className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "2", 
                  title: "Link Your Photographers",
                  description: "Connect to Pixieset, ShootProof, SmugMug, and other platforms you've used.",
                  icon: <Camera className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop&crop=center"
                },
                {
                  step: "3",
                  title: "Access Your Timeline", 
                  description: "All your photos organized chronologically. Download, share, and cherish forever.",
                  icon: <Heart className="h-7 w-7" />,
                  image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop&crop=center"
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

        {/* Trust Section */}
        <section className="section-spacing-sm">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
              Your Memories Are Safe Here
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Built on the same rock-solid technology that Netflix and Airbnb trust. Your photos are protected, backed up, and accessible forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="text-center border border-border card-shadow-hover bg-card">
              <CardContent className="p-7">
                <Shield className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-foreground text-sm">Bank-Level Security</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Your photos are encrypted and protected</p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border card-shadow-hover bg-card">
              <CardContent className="p-7">
                <Cloud className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-foreground text-sm">Automatic Backups</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Multiple copies kept safe automatically</p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border card-shadow-hover bg-card">
              <CardContent className="p-7">
                <Lock className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-foreground text-sm">Private by Default</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Only you can access your memories</p>
              </CardContent>
            </Card>

            <Card className="text-center border border-border card-shadow-hover bg-card">
              <CardContent className="p-7">
                <Clock className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-foreground text-sm">Never Expires</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Your vault stays active forever</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-spacing-sm bg-secondary/50 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          <div className="container-pixieset">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-5 text-foreground tracking-tight">
                Loved by Families Everywhere
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  quote: "I found photos from my wedding that I thought were gone forever. PhotoVault saved memories I didn't even know I had!",
                  author: "Sarah M.",
                  location: "Mother of 2"
                },
                {
                  quote: "Finally, all my kids' school photos and family sessions in one place. No more searching through emails for gallery links.",
                  author: "Jennifer L.", 
                  location: "Mother of 3"
                },
                {
                  quote: "The peace of mind knowing my photos will never expire again is priceless. PhotoVault is a family treasure.",
                  author: "Michael R.",
                  location: "Father of 2"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="border border-border card-shadow-hover bg-card">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-primary fill-current" />
                      ))}
                    </div>
                    <p className="text-foreground mb-5 text-sm leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-primary rounded-2xl p-12 md:p-16 text-white section-spacing-sm">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 tracking-tight">
            Start Finding Your Photos
          </h2>
          <p className="text-lg md:text-xl mb-10 opacity-95 max-w-2xl mx-auto font-light leading-relaxed">
            Join thousands of families who've secured their memories forever. Find and organize every professional photo in minutes.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/95 text-base font-semibold px-10 py-6 rounded-lg shadow-lg">
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}/ /   D e p l o y m e n t   t r i g g e r 
 
}  
 