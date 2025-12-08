'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  DollarSign,
  Users,
  Mail,
  Copy,
  Send,
  AlertTriangle,
  Clock,
  Shield,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { PAYMENT_OPTIONS, getDefaultPaymentOptions } from '@/lib/payment-models'

export default function InvitePage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('photographer_billed')
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!loading && userType !== 'photographer') {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (userType !== 'photographer') {
    return null
  }

  const paymentOptions = getDefaultPaymentOptions()
  const selectedOption = paymentOptions.find(opt => opt.id === selectedPaymentOption)

  const handleSendInvitation = async () => {
    if (!clientEmail || !clientName || !sessionName) return

    setSending(true)
    
    try {
      // Simulate sending invitation
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSent(true)
    } catch (error) {
      console.error('Error sending invitation:', error)
    } finally {
      setSending(false)
    }
  }

  const copyInvitationLink = () => {
    const link = `https://photovault.com/invite/${user?.id}/${selectedPaymentOption}`
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invitation Sent!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Your client invitation has been sent to {clientEmail}. They&apos;ll receive an email with access to their gallery.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/photographers/invite">
                  Send Another Invitation
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
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
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Invite Clients</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Invite Clients to PhotoVault</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Send branded invitations to your clients with PhotoVault access. Choose how they&apos;ll pay for their permanent gallery access.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Client Information</span>
                </CardTitle>
                <CardDescription>
                  Enter your client&apos;s details and session information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input
                    id="client-name"
                    placeholder="e.g., Sarah & John Smith"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Client Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input
                    id="session-name"
                    placeholder="e.g., Wedding - October 15, 2024"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Add a personal message to your client..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Payment Option</span>
                </CardTitle>
                <CardDescription>
                  Choose how your client will pay for PhotoVault access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedPaymentOption} onValueChange={setSelectedPaymentOption}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="photographer_billed">Annual + Monthly</TabsTrigger>
                    <TabsTrigger value="six_month_trial">6-Month Trial</TabsTrigger>
                    <TabsTrigger value="ongoing_monthly">Ongoing Monthly</TabsTrigger>
                  </TabsList>

                  {paymentOptions.map((option) => (
                    <TabsContent key={option.id} value={option.id}>
                      <div className="mt-4 space-y-4">
                        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{option.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {option.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">${option.price}</div>
                              <div className="text-sm text-slate-500">
                                {option.id === 'photographer_billed' ? 'upfront + $8/month' : 
                                 option.duration === 999 ? 'per month' : 
                                 option.duration === 6 ? 'for 6 months' : 'per month'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            <Badge variant="default">
                              {option.id === 'photographer_billed' ? '$50 upfront + $4/month' : 
                               `$${(option.price * option.photographer_commission / 100).toFixed(0)} commission`}
                            </Badge>
                            <Badge variant="outline">
                              {option.id === 'photographer_billed' ? 'Annual + Ongoing' :
                               option.duration === 999 ? 'Lifetime access' : `${option.duration} months access`}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {option.terms.map((term, index) => (
                              <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
                                • {term}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Commission Warning */}
          {selectedOption && (
            <Card className="mt-8 border-2 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Important Commission Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Commission Rules
                  </h3>
                  <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
                    {selectedOption.id === 'photographer_billed' ? (
                      <>
                        <li>• <strong>Year 1:</strong> Client pays $100 upfront → You earn $50 commission</li>
                        <li>• <strong>Year 2+:</strong> Client pays $8/month ongoing → You earn $4/month passive commission</li>
                        <li>• PhotoVault handles all billing - no payment processing needed</li>
                      </>
                    ) : (
                      <li>• You earn ${(selectedOption.price * selectedOption.photographer_commission / 100).toFixed(0)} commission for client lifetime</li>
                    )}
                    <li>• Commission stops if client is inactive for 6+ months</li>
                    <li>• Reactivated galleries after 6+ months belong to PhotoVault</li>
                    <li>• <strong>NEW SESSION RULE:</strong> New photo session resets commission cycle</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Invitation Preview</CardTitle>
              <CardDescription>
                This is what your client will receive
            </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PhotoVault Invitation</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">from {user?.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Hi {clientName || 'Client'}!</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    {customMessage || `Your photos from ${sessionName || 'your recent session'} are ready! I've set up permanent access through PhotoVault so you can view, download, and share your photos forever.`}
                  </p>
                  
                  {selectedOption && (
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border">
                      <h5 className="font-medium mb-2">PhotoVault Access Details:</h5>
                      <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <li>• {selectedOption.description}</li>
                        <li>• ${selectedOption.price} {selectedOption.duration === 12 ? 'per year' : 'for 6 months'}</li>
                        <li>• Your photos stay accessible forever</li>
                        <li>• Gallery never expires or gets deleted</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Invitation */}
          <div className="mt-8 flex items-center justify-between">
            <Button asChild variant="outline">
              <Link href="/terms">
                <Shield className="h-4 w-4 mr-2" />
                View Terms & Commission Rules
              </Link>
            </Button>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={copyInvitationLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={sending || !clientEmail || !clientName || !sessionName}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
