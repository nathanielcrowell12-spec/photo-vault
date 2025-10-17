'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  Clock,
  DollarSign,
  Camera,
  Users,
  FileText,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'

interface ClientPayment {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description: string
  payment_method: string
  gallery_access: {
    photographer_name: string
    gallery_name: string
    access_expires: string
  }
}

interface ClientBillingInfo {
  client_name: string
  email: string
  phone: string
  billing_address: string
  payment_method: {
    type: string
    last4: string
    brand: string
    expiry: string
  } | null
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial'
  next_billing_date: string
  total_paid: number
  galleries: Array<{
    id: string
    photographer_name: string
    gallery_name: string
    access_expires: string
    status: 'active' | 'expired' | 'suspended'
  }>
}

export default function ClientBillingPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [billingInfo, setBillingInfo] = useState<ClientBillingInfo | null>(null)
  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userType === 'client') {
      fetchBillingData()
    }
  }, [userType])

  if (userType !== 'client') {
    router.push('/dashboard')
    return null
  }

  const fetchBillingData = async () => {
    try {
      // Simulate API call - in real implementation, this would fetch from database
      setTimeout(() => {
        setBillingInfo({
          client_name: 'John & Jane Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          billing_address: '123 Main St, Anytown, ST 12345',
          payment_method: {
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expiry: '12/25'
          },
          subscription_status: 'active',
          next_billing_date: '2024-11-15',
          total_paid: 100,
          galleries: [
            {
              id: '1',
              photographer_name: 'Emma Rodriguez Photography',
              gallery_name: 'Smith Wedding - October 2024',
              access_expires: '2025-10-15',
              status: 'active'
            },
            {
              id: '2',
              photographer_name: 'Mike Chen Studios',
              gallery_name: 'Family Portrait Session',
              access_expires: '2024-12-15',
              status: 'active'
            }
          ]
        })

        setPayments([
          {
            id: '1',
            date: '2024-10-15',
            amount: 100,
            status: 'paid',
            description: 'Smith Wedding Gallery - Annual Access',
            payment_method: 'Visa •••• 4242',
            gallery_access: {
              photographer_name: 'Emma Rodriguez Photography',
              gallery_name: 'Smith Wedding - October 2024',
              access_expires: '2025-10-15'
            }
          },
          {
            id: '2',
            date: '2024-09-15',
            amount: 20,
            status: 'paid',
            description: 'Family Portrait Session - 6 Month Trial',
            payment_method: 'Visa •••• 4242',
            gallery_access: {
              photographer_name: 'Mike Chen Studios',
              gallery_name: 'Family Portrait Session',
              access_expires: '2024-12-15'
            }
          }
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching billing data:', error)
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Refunded</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const downloadInvoice = (paymentId: string) => {
    // Simulate invoice download
    console.log('Downloading invoice for payment:', paymentId)
    alert('Invoice downloaded!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading billing information...</p>
        </div>
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
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Billing & Payments</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {billingInfo && getStatusBadge(billingInfo.subscription_status)}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {billingInfo && (
            <>
              {/* Account Summary */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span>Account Summary</span>
                  </CardTitle>
                  <CardDescription>
                    Your PhotoVault account information and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Account Information</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Name:</span>
                          <span className="ml-2 font-medium">{billingInfo.client_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Email:</span>
                          <span className="ml-2 font-medium">{billingInfo.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                          <span className="ml-2 font-medium">{billingInfo.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Total Paid:</span>
                          <span className="ml-2 font-medium text-green-600">{formatCurrency(billingInfo.total_paid)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Billing Information</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Status:</span>
                          <span className="ml-2">{getStatusBadge(billingInfo.subscription_status)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Next Billing:</span>
                          <span className="ml-2">{formatDate(billingInfo.next_billing_date)}</span>
                        </div>
                        {billingInfo.payment_method && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
                            <span className="ml-2">
                              {billingInfo.payment_method.brand} •••• {billingInfo.payment_method.last4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Galleries */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-6 w-6 text-purple-600" />
                    <span>Your Photo Galleries</span>
                  </CardTitle>
                  <CardDescription>
                    Galleries you have access to and their expiration dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingInfo.galleries.map((gallery) => (
                      <div key={gallery.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                            <Camera className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{gallery.gallery_name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              by {gallery.photographer_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Access expires: {formatDate(gallery.access_expires)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(gallery.status)}
                          <Button variant="outline" size="sm">
                            View Gallery
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span>Payment History</span>
                  </CardTitle>
                  <CardDescription>
                    All your payments and receipts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{payment.description}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {payment.gallery_access.photographer_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Paid on {formatDate(payment.date)} • {payment.payment_method}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-slate-500">{getStatusBadge(payment.status)}</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadInvoice(payment.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download All Receipts
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Billing Summary
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>

              {/* Help Section */}
              <Card className="mt-8">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                      Our support team is here to help with any billing questions or issues.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Support
                      </Button>
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Support
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Billing FAQ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
