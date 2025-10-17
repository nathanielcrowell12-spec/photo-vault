'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  CreditCard,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Camera,
  Users,
  Calendar,
  Shield,
  Lock,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface PaymentPlan {
  id: string
  name: string
  description: string
  price: number
  duration: number
  features: string[]
  popular?: boolean
}

interface GalleryAccess {
  photographer_name: string
  gallery_name: string
  gallery_preview: string[]
  access_expires: string | null
}

export default function ClientPaymentPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: ''
  })
  const [processing, setProcessing] = useState(false)
  const [galleryAccess, setGalleryAccess] = useState<GalleryAccess | null>(null)

  if (userType !== 'client') {
    router.push('/dashboard')
    return null
  }

  useEffect(() => {
    fetchGalleryAccess()
  }, [])

  const fetchGalleryAccess = async () => {
    // Simulate fetching gallery access data
    setTimeout(() => {
      setGalleryAccess({
        photographer_name: 'Emma Rodriguez Photography',
        gallery_name: 'Smith Wedding - October 2024',
        gallery_preview: [
          '/api/placeholder/300/200',
          '/api/placeholder/300/200',
          '/api/placeholder/300/200'
        ],
        access_expires: null
      })
    }, 1000)
  }

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'annual_monthly',
      name: 'Annual + Monthly Access',
      description: 'Full year access with ongoing monthly renewal',
      price: 100,
      duration: 12,
      features: [
        'Full year gallery access',
        'Unlimited downloads',
        'Mobile app access',
        'Share with family & friends',
        'Automatic monthly renewal',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'six_month_trial',
      name: '6-Month Trial',
      description: 'Perfect for trying out the service',
      price: 20,
      duration: 6,
      features: [
        '6 months gallery access',
        'Unlimited downloads',
        'Mobile app access',
        'Share with family & friends',
        'No automatic renewal'
      ]
    },
    {
      id: 'monthly_only',
      name: 'Monthly Access',
      description: 'Pay monthly for ongoing access',
      price: 8,
      duration: 1,
      features: [
        'Monthly gallery access',
        'Unlimited downloads',
        'Mobile app access',
        'Share with family & friends',
        'Automatic monthly renewal'
      ]
    }
  ]

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert('Please select a payment plan')
      return
    }

    setProcessing(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, this would process payment with Stripe/etc
      alert('Payment successful! Your gallery access has been activated.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const selectedPlanData = paymentPlans.find(plan => plan.id === selectedPlan)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">Payment & Gallery Access</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
              Secure Payment
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {galleryAccess && (
            <>
              {/* Gallery Preview */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-6 w-6 text-purple-600" />
                    <span>Your Photo Gallery</span>
                  </CardTitle>
                  <CardDescription>
                    {galleryAccess.photographer_name} - {galleryAccess.gallery_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {galleryAccess.gallery_preview.map((preview, index) => (
                      <div key={index} className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        <Camera className="h-12 w-12 text-slate-400" />
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Choose a payment plan to access your full gallery with unlimited downloads
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Plans */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span>Choose Your Access Plan</span>
                  </CardTitle>
                  <CardDescription>
                    Select the plan that works best for you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {paymentPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                          selectedPlan === plan.id 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-green-600 text-white px-3 py-1">
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {formatCurrency(plan.price)}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {plan.duration === 1 ? 'per month' : plan.duration === 6 ? 'for 6 months' : 'for first year'}
                          </p>
                        </div>

                        <div className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-center">
                          <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                            selectedPlan === plan.id 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-slate-300'
                          }`}>
                            {selectedPlan === plan.id && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-6 w-6 text-blue-600" />
                    <span>Payment Information</span>
                  </CardTitle>
                  <CardDescription>
                    Your payment information is secure and encrypted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentMethod.cardNumber}
                          onChange={(e) => setPaymentMethod({...paymentMethod, cardNumber: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={paymentMethod.expiryDate}
                            onChange={(e) => setPaymentMethod({...paymentMethod, expiryDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            value={paymentMethod.cvv}
                            onChange={(e) => setPaymentMethod({...paymentMethod, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input
                          id="cardName"
                          placeholder="John Smith"
                          value={paymentMethod.name}
                          onChange={(e) => setPaymentMethod({...paymentMethod, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@email.com"
                          value={paymentMethod.email}
                          onChange={(e) => setPaymentMethod({...paymentMethod, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              {selectedPlanData && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-6 w-6 text-purple-600" />
                      <span>Order Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">
                          {selectedPlanData.name}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedPlanData.price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">
                          Gallery: {galleryAccess.gallery_name}
                        </span>
                        <span className="text-sm text-slate-500">
                          by {galleryAccess.photographer_name}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-green-600">
                          {formatCurrency(selectedPlanData.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Notice */}
              <Card className="mb-8 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Secure Payment
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your payment information is encrypted and secure. We use industry-standard 
                        security measures to protect your data. You can cancel your subscription 
                        at any time from your account settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Button */}
              <div className="text-center">
                <Button 
                  onClick={handlePayment}
                  disabled={!selectedPlan || processing}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-lg px-12 py-6"
                >
                  {processing ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay {selectedPlanData ? formatCurrency(selectedPlanData.price) : ''} & Access Gallery
                    </>
                  )}
                </Button>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                  By completing payment, you agree to our terms of service and privacy policy
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
