'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Camera, CheckCircle, ArrowRight, Mail, Lock, User, Phone, Building } from 'lucide-react'
import Link from 'next/link'

export default function PhotographerSignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, 'photographer', formData.businessName || formData.fullName)

      if (error) {
        setError(error.message || 'An error occurred during signup')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/photographers" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PhotoVault Pro</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">Already have an account?</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Signup Form */}
            <div>
              <div className="mb-8">
                <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  For Photographers
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Start Your 14-Day Free Trial</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  Join PhotoVault and start earning $50 + $4/month per client
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Your Photographer Account</CardTitle>
                  <CardDescription>
                    No credit card required • Cancel anytime
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">
                        <Building className="h-4 w-4 inline mr-2" />
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Your photography business name"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        <User className="h-4 w-4 inline mr-2" />
                        Your Full Name
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">
                        <Lock className="h-4 w-4 inline mr-2" />
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        <Lock className="h-4 w-4 inline mr-2" />
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? (
                        'Creating Account...'
                      ) : (
                        <>
                          Start 14-Day Free Trial
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      By signing up, you agree to our{' '}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Benefits */}
            <div className="space-y-6">
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    What&apos;s Included
                  </Badge>
                  <h2 className="text-2xl font-bold mb-4">Your Free Trial Includes</h2>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">14 Days Completely Free</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">No credit card required to start</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">Earn $50 Per New Client</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Upfront commission on every client</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">$4/Month Passive Income</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Recurring commission for life</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">Unlimited Galleries & Storage</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">No limits on clients or photos</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">Advanced Revenue Tracking</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Analytics, reports, and projections</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">Professional CMS Integration</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Works with your existing workflow</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold">Client Invitation System</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Automated payment reminders</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Platform Pricing</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">$22/month</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div>✓ Unlimited clients & galleries</div>
                    <div>✓ Full commission tracking</div>
                    <div>✓ Advanced analytics & reports</div>
                    <div>✓ Professional support</div>
                  </div>
                  <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Break-even calculation:</div>
                    <div className="text-sm">
                      <strong>6 active clients</strong> × $4/mo = $24/mo
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Platform fee covered + profit on every additional client!
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Commission Quick Math</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">10 Clients:</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        $500 upfront + $40/month recurring
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">25 Clients:</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        $1,250 upfront + $100/month recurring
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">50 Clients:</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        $2,500 upfront + $200/month recurring
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

