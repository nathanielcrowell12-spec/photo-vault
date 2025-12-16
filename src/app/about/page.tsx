'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Heart, Users, TrendingUp, Shield, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Banner Image */}
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-10 shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1531844806351-6f135a39b0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDAwMzd8MHwxfHNlYXJjaHwxfHxwaG90b2dyYXBoZXIlMjBzaG93aW5nJTIwcGhvdG9zJTIwY2xpZW50JTIwaGFwcHklMjBmYW1pbHklMjBtZW1vcmllc3xlbnwwfDB8fHwxNzY1MDI1Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Family sharing precious photo memories together"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <p className="absolute bottom-3 right-3 text-xs text-foreground/70">
              Photo by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Unsplash</a>
            </p>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-900/50 text-blue-200 border-blue-500/30">
              About PhotoVault
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Memory Insurance for Families
            </h1>
            <p className="text-xl text-muted-foreground">
              Professional-grade protection for your most precious photos. Because hard drives fail, but memories shouldn&apos;t.
            </p>
          </div>

          {/* Mission */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Heart className="h-6 w-6 text-pink-600" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Hard drives have a 100% failure rate eventually. Professional data recovery costs $500-$5,000. The &quot;cloud&quot; is just someone else&apos;s computer. Your family&apos;s most precious memories deserve real protection.
              </p>
              <p className="text-lg text-muted-foreground">
                PhotoVault is Memory Insurance—a digital safety deposit box for the photos that matter most. Wedding photos, baby&apos;s first steps, grandma&apos;s last Christmas. Protected. Accessible. Forever.
              </p>
            </CardContent>
          </Card>

          {/* Value Propositions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>For Families</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Memory Insurance: Your photos survive any hard drive crash</li>
                  <li>• One tap to camera roll—no more zip files</li>
                  <li>• All your photographers, all your memories, one place</li>
                  <li>• Share with family without tech headaches</li>
                  <li>• For the price of one coffee a month: peace of mind forever</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Camera className="h-5 w-5 text-purple-600" />
                  <span>For Photographers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Become the guardian of your clients&apos; family history</li>
                  <li>• Earn $4/month passive income on every client—forever</li>
                  <li>• Replace Pixieset, ShootProof, SmugMug—and earn more</li>
                  <li>• $22/month professional platform</li>
                  <li>• One-tap photo delivery (no more zip file complaints)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Why Memory Insurance Matters</CardTitle>
              <CardDescription className="text-muted-foreground">The protection your photos deserve</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2 text-foreground">Digital Safety Deposit Box</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional-grade protection that survives hard drive crashes, phone losses, and house fires
                  </p>
                </div>
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2 text-foreground">Lifetime Archival</h3>
                  <p className="text-sm text-muted-foreground">
                    No expiring galleries. Your wedding photos, baby&apos;s first steps—safe forever
                  </p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2 text-foreground">One Tap Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Full resolution photos delivered straight to your camera roll. No zip files.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Story */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                PhotoVault started when we watched families lose irreplaceable photos—wedding memories gone when a hard drive crashed, baby photos vanished when a phone was lost, grandma&apos;s last Christmas deleted by accident.
              </p>
              <p className="text-muted-foreground">
                Data recovery costs $500-$5,000. Success isn&apos;t guaranteed. And the &quot;cloud&quot; is just someone else&apos;s computer—full of zip files nobody can open on their phone.
              </p>
              <p className="text-muted-foreground">
                We built PhotoVault to be Memory Insurance: a digital safety deposit box where families protect what matters most, and photographers become the guardians of their clients&apos; family history.
              </p>
              <p className="font-semibold text-lg text-foreground">
                For the price of one coffee a month, never worry about losing your most precious photos again.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Your Memories Deserve Protection</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Whether you&apos;re a family protecting precious photos or a photographer becoming a Memory Guardian
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/login">
                  <Users className="h-5 w-5 mr-2" />
                  Protect My Photos
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/photographers">
                  <Camera className="h-5 w-5 mr-2" />
                  Become a Memory Guardian
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

