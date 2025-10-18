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
  Calendar
} from 'lucide-react'
import { PAYMENT_OPTIONS, getPaymentOptionById } from '@/lib/payment-models'

export default function InviteAcceptancePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [photographerInfo, setPhotographerInfo] = useState<{
    id: string
    name: string
    business_name?: string
    email: string
  } | null>(null)
  const [paymentOption, setPaymentOption] = useState<{
    id: string
    name: string
    description: string
    price: number
    duration_months: number
  } | null>(null)
  const [accepting, setAccepting] = useState(false)

  const photographerId = params.photographerId as string
  const paymentOptionId = params.paymentOption as string

  useEffect(() => {
    // Simulate fetching photographer info and payment option
    setTimeout(() => {
      setPhotographerInfo({
        name: 'Emma Photography',
        email: 'emma@emmaphotography.com',
        business_name: 'Emma Photography Studio',
        avatar: '📸'
      })
      setPaymentOption(getPaymentOptionById(paymentOptionId))
      setLoading(false)
    }, 1000)
  }, [photographerId, paymentOptionId])

  const handleAcceptInvitation = async () => {
    setAccepting(true)
    
    try {
      // Simulate accepting invitation
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/signup?invite=true')
    } catch (error) {
      console.error('Error accepting invitation:', error)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!photographerInfo || !paymentOption) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              This invitation link is invalid or has expired. Please contact your photographer for a new invitation.
            </p>
            <Button asChild>
              <Link href="/">Go to PhotoVault</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-600" />
            <span className="text-xl font-bold">PhotoVault</span>
          </div>
          <Badge variant="outline" className="bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200">
            Family Invitation
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
                  {photographerInfo.avatar}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{photographerInfo.name}</h1>
                  <p className="text-slate-600 dark:text-slate-300">{photographerInfo.business}</p>
                  <p className="text-sm text-slate-500">{photographerInfo.email}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📸 Your Photos Are Ready!
                </h2>
                <p className="text-blue-700 dark:text-blue-300">
                  {photographerInfo.name} has invited you to access your professional photos through PhotoVault. 
                  Your photos will be stored permanently and never expire.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Option */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>PhotoVault Access</span>
              </CardTitle>
              <CardDescription>
                Your photographer has selected this access option for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{paymentOption.name}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{paymentOption.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">${paymentOption.price}</div>
                    <div className="text-sm text-slate-500">
                      {paymentOption.duration === 12 ? 'per year' : 'for 6 months'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="default">
                    {paymentOption.duration} months access
                  </Badge>
                  <Badge variant="outline">
                    Never expires
                  </Badge>
                  <Badge variant="outline">
                    Secure storage
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">What you get:</h4>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {paymentOption.terms.map((term: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why PhotoVault?</CardTitle>
              <CardDescription>
                Your photos deserve permanent, secure storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Never Expires</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Your photos stay accessible forever, even after other gallery links expire
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-6 w-6 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Bank-Level Security</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Your photos are encrypted and stored with enterprise-grade security
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Users className="h-6 w-6 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Share with Family</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Easily share your photos with family members and friends
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Camera className="h-6 w-6 text-orange-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">All Your Photos</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Connect galleries from multiple photographers in one place
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Info */}
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Photographer Partnership</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Good news!</strong> Your photographer receives commission from your PhotoVault subscription, 
                  so they&apos;re incentivized to provide you with excellent service.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This partnership ensures your photographer continues to support your photo storage needs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms Agreement */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  By accepting this invitation, you agree to PhotoVault&apos;s terms of service and commission structure. 
                  Your photographer will receive commission on your subscription as long as you maintain active payments.
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <p className="text-orange-800 dark:text-orange-200 font-medium">
                    Important: If you stop paying for 6+ months, your gallery becomes inactive and your photographer&apos;s commission stops.
                  </p>
                </div>
                <p>
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Read full terms and commission structure →
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Accept Invitation */}
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Access Your Photos?</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Accept this invitation to create your PhotoVault account and access your photos forever.
              </p>
              
              <Button 
                onClick={handleAcceptInvitation}
                disabled={accepting}
                size="lg"
                className="bg-pink-600 hover:bg-pink-700 text-white px-8"
              >
                {accepting ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Accept Invitation & Create Account
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 mt-4">
                You&apos;ll be redirected to create your PhotoVault account
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
