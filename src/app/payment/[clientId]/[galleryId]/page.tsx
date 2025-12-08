'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Camera, 
  CheckCircle, 
  DollarSign,
  Users,
  Shield,
  Clock,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Lock,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PaymentData {
  client: {
    id: string
    name: string
    email: string
  }
  photographer: {
    id: string
    name: string
    business_name: string
    website_url: string
  }
  gallery: {
    id: string
    gallery_name: string
    session_date: string
    photo_count: number
    gallery_url: string
  }
  paymentOption: {
    id: string
    name: string
    price: number
    duration: number
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const clientId = params.clientId as string
  const galleryId = params.galleryId as string

  const fetchPaymentData = async () => {
    try {
      // In a real implementation, you would fetch this data from the API
      // For demo purposes, we'll simulate the data
      setTimeout(() => {
        setPaymentData({
          client: {
            id: clientId,
            name: 'Sarah & John Smith',
            email: 'sarah@email.com'
          },
          photographer: {
            id: 'photographer-1',
            name: 'Emma Photography',
            business_name: 'Emma Photography Studio',
            website_url: 'https://emmaphotography.com'
          },
          gallery: {
            id: galleryId,
            gallery_name: 'Wedding Photos - October 15, 2024',
            session_date: '2024-10-15',
            photo_count: 245,
            gallery_url: `/gallery/${galleryId}`
          },
          paymentOption: {
            id: 'photographer_billed',
            name: 'Photographer Billed - Monthly',
            price: 8,
            duration: 999
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentData()
  }, [clientId, galleryId, fetchPaymentData])

  const handlePayment = async () => {
    setProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Create payment record
      const { error } = await supabase
        .from('client_payments')
        .insert({
          client_id: clientId,
          photographer_id: paymentData?.photographer.id,
          gallery_id: galleryId,
          payment_option_id: paymentData?.paymentOption.id,
          amount_paid: paymentData?.paymentOption.price || 8,
          payment_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          status: 'active'
        })

      if (error) {
        console.error('Error creating payment record:', error)
        return
      }

      setPaymentSuccess(true)
      
      // Redirect to gallery after 3 seconds
      setTimeout(() => {
        router.push(paymentData?.gallery.gallery_url || '/dashboard')
      }, 3000)
      
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Not Found</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              This payment link is invalid or has expired. Please contact your photographer for a new payment link.
            </p>
            <Button asChild>
              <Link href="/">Go to PhotoVault</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Your payment has been processed. You now have access to your gallery.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-pink-600 hover:bg-pink-700">
                <a href={paymentData.gallery.gallery_url}>
                  <Camera className="h-4 w-4 mr-2" />
                  View Your Photos
                </a>
              </Button>
              <p className="text-xs text-slate-500">
                Redirecting automatically in 3 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-600" />
            <span className="text-xl font-bold">PhotoVault</span>
          </div>
          <Badge variant="outline" className="bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200">
            Secure Payment
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Photographer Info */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl">
                  📸
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{paymentData.photographer.business_name}</h1>
                  <p className="text-slate-600 dark:text-slate-300">{paymentData.photographer.name}</p>
                  {paymentData.photographer.website_url && (
                    <a href={paymentData.photographer.website_url} className="text-blue-600 hover:underline text-sm">
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📸 Your Photos Are Ready!
                </h2>
                <p className="text-blue-700 dark:text-blue-300">
                  {paymentData.photographer.business_name} has completed your photo session and uploaded {paymentData.gallery.photo_count} photos to PhotoVault.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-6 w-6 text-blue-600" />
                <span>Gallery Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{paymentData.gallery.gallery_name}</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Session Date: {new Date(paymentData.gallery.session_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {paymentData.gallery.photo_count} Photos
                  </Badge>
                  <Badge variant="outline">
                    Professional Quality
                  </Badge>
                  <Badge variant="outline">
                    High Resolution
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Payment Information</span>
              </CardTitle>
              <CardDescription>
                Secure payment to unlock your gallery access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{paymentData.paymentOption.name}</h3>
                    <p className="text-slate-600 dark:text-slate-300">PhotoVault Access</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">${paymentData.paymentOption.price}</div>
                    <div className="text-sm text-slate-500">per month</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="default">
                    Lifetime Access
                  </Badge>
                  <Badge variant="outline">
                    Secure Storage
                  </Badge>
                  <Badge variant="outline">
                    Download & Share
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">What you get:</h4>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Access to all {paymentData.gallery.photo_count} photos from your session</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>High-resolution downloads</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Share with family and friends</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Photos never expire - lifetime access</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Bank-level security and privacy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Secure Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>PCI compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span>Secure payment processing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Access Your Photos?</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Complete your payment to unlock access to your professional photos.
              </p>
              
              <Button 
                onClick={handlePayment}
                disabled={processing}
                size="lg"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 mb-4"
              >
                {processing ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay ${paymentData.paymentOption.price}/month
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500">
                Secure payment processed by PhotoVault
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
