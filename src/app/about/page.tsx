'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Heart, Users, TrendingUp, Shield, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              About PhotoVault
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Local Photo Network
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Connecting families with photographers in a unified platform for lifetime photo access
            </p>
          </div>

          {/* Mission */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-pink-600" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                PhotoVault was created to solve a simple but critical problem: families were losing access to their precious memories when photo gallery links expired or photographers changed platforms.
              </p>
              <p className="text-lg">
                We've built a local photo network where all your memories from every photographer in your area are accessible in one place, forever.
              </p>
            </CardContent>
          </Card>

          {/* Value Propositions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>For Families</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Never lose access to your photos again</li>
                  <li>• All photographers in one dashboard</li>
                  <li>• Import photos from anywhere</li>
                  <li>• Upload your smartphone photos</li>
                  <li>• Lifetime access for just $8/month</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  <span>For Photographers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Retain clients with lifetime galleries</li>
                  <li>• Earn passive recurring income</li>
                  <li>• $22/month professional platform</li>
                  <li>• 50% commission on client payments</li>
                  <li>• No billing hassle - we handle it all</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Core Values</CardTitle>
              <CardDescription>What drives everything we do</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">Security First</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your photos are encrypted and safely stored with enterprise-grade security
                  </p>
                </div>
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">Lifetime Access</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No expiring links. Your memories stay accessible forever
                  </p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Local Network</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Connect with all photographers in your city through one platform
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Story */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                PhotoVault started when we noticed a frustrating pattern: families would pay photographers for beautiful photos, only to lose access when gallery links expired or photographers switched platforms.
              </p>
              <p>
                At the same time, photographers were losing touch with clients because there was no way to maintain engagement after the photo delivery.
              </p>
              <p>
                We created PhotoVault to solve both problems - giving families permanent access to all their photos from every local photographer, while helping photographers retain clients and earn recurring income.
              </p>
              <p className="font-semibold text-lg">
                Today, PhotoVault is the local photo network connecting families and photographers for lifetime memories.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Join PhotoVault?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Whether you're a family looking to preserve memories or a photographer growing your business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/login">
                  <Users className="h-5 w-5 mr-2" />
                  For Families - Get Started
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/photographers">
                  <Camera className="h-5 w-5 mr-2" />
                  For Photographers - Join Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

