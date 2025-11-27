'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SubscribeCard } from '@/components/SubscribeButton'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  DollarSign,
  Camera,
  Shield,
  Lock,
  Loader2,
  AlertCircle,
  PartyPopper
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface GalleryInfo {
  id: string
  gallery_name: string
  photographer_id: string
  photographer_name?: string
  photo_count: number
}

// Inner component that uses useSearchParams
function ClientPaymentContent() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gallery, setGallery] = useState<GalleryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const galleryId = searchParams.get('gallery')
  const paymentStatus = searchParams.get('payment')

  useEffect(() => {
    if (paymentStatus === 'success') {
      setPaymentSuccess(true)
    }
  }, [paymentStatus])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (galleryId) {
      fetchGalleryInfo()
    } else {
      setLoading(false)
    }
  }, [user, authLoading, galleryId])

  const fetchGalleryInfo = async () => {
    try {
      // Get gallery with photographer info
      const { data: galleryData, error: galleryError } = await supabase
        .from('photo_galleries')
        .select(`
          id,
          gallery_name,
          photographer_id,
          photo_count
        `)
        .eq('id', galleryId)
        .single()

      if (galleryError) throw galleryError

      // Get photographer name
      const { data: photographerData } = await supabase
        .from('photographers')
        .select('business_name')
        .eq('id', galleryData.photographer_id)
        .single()

      setGallery({
        ...galleryData,
        photographer_name: photographerData?.business_name || 'Your Photographer'
      })
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Payment Success View
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your subscription is now active. You have full access to your photo gallery.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href={galleryId ? `/gallery/${galleryId}` : '/client/dashboard'}>
                  <Camera className="h-4 w-4 mr-2" />
                  View Your Photos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/client/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No Gallery Selected
  if (!gallery) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4 py-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-8 pb-6 text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No Gallery Selected</h2>
                <p className="text-slate-600 mb-6">
                  Please select a gallery from your dashboard to subscribe.
                </p>
                <Button asChild>
                  <Link href="/client/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">Subscribe to Gallery</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Lock className="h-3 w-3 mr-1" />
            Secure Payment
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Gallery Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Your Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="h-16 w-16 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{gallery.gallery_name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    by {gallery.photographer_name}
                  </p>
                  <Badge variant="secondary">
                    {gallery.photo_count} photos
                  </Badge>
                </CardContent>
              </Card>

              {/* Pricing Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Year 1: $100 Upfront
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Full year of access to all your photos
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
                      Year 2+: $8/month
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Ongoing access with monthly billing
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Secure Payment
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Payment processed securely by Stripe. Your card information
                        is never stored on our servers. Cancel anytime.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Subscribe Card */}
            <div>
              <SubscribeCard
                galleryId={gallery.id}
                photographerId={gallery.photographer_id}
                galleryName={gallery.gallery_name}
                photographerName={gallery.photographer_name}
                photoCount={gallery.photo_count}
              />

              {/* What's Included */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">What&apos;s Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Unlimited high-resolution downloads',
                      'Access from any device (phone, tablet, computer)',
                      'Share galleries with family and friends',
                      'Photos stored securely forever',
                      'No hidden fees or surprises',
                      'Cancel anytime with no penalty',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Main export with Suspense boundary
export default function ClientPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ClientPaymentContent />
    </Suspense>
  )
}
