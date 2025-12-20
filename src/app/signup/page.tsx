'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, Users, Heart, CheckCircle, ArrowRight, Mail, Lock, User, Phone } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { signUp, user, userType: currentUserType } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const userType = 'client' // Customer signup page - fixed to client

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Redirect if already logged in
  useEffect(() => {
    if (user && currentUserType) {
      console.log('[Signup] User already logged in, redirecting to dashboard')
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentUserType])

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
      const { error } = await signUp(formData.email, formData.password, userType, formData.fullName)

      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An error occurred during signup')
      } else {
        // Redirect to payment page for customers
        router.push('/signup/payment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PhotoVault</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground dark:text-foreground">Already have an account?</span>
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
                <Badge className="mb-4 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                  Memory Insurance for Families
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Protect Your Memories</h1>
                <p className="text-lg text-muted-foreground dark:text-foreground">
                  Your photos deserve better than a failing hard drive. Create your account and start protecting your irreplaceable memories.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Your Memory Insurance Account</CardTitle>
                  <CardDescription>
                    A digital safety deposit box for your family's irreplaceable photos
                  </CardDescription>
                </CardHeader>
                <CardContent>

                  {/* Signup Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        <User className="h-4 w-4 inline mr-2" />
                        Full Name
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
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? (
                        'Creating Account...'
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground dark:text-muted-foreground">
                      By signing up, you agree to our{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Benefits */}
            <div className="space-y-6">
              <Card className="border-2 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                    Memory Insurance
                  </Badge>
                  <h2 className="text-2xl font-bold mb-4">Your Photos Are Protected</h2>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Digital Safety Deposit Box</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Protected from hard drive failures—which have a 100% failure rate eventually</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">One Tap to Camera Roll</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Full resolution downloads. No zip files to wrestle with on your phone.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Family Sharing</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Share with family members you authorize</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Lifetime Archival</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">No expiring download links or lost USB drives</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">All Photographers, One Vault</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Collect memories from every photographer in one protected place</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Memory Insurance Pricing</h3>
                  <div className="text-sm space-y-2 text-muted-foreground dark:text-muted-foreground">
                    <div>• First year included with photographer session</div>
                    <div>• $8/month after first year—the price of one coffee</div>
                    <div>• One family account, unlimited memories</div>
                    <div>• Professional data recovery costs $500-$5,000. This costs $8.</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">How Memory Insurance Works</h3>
                  <div className="text-sm space-y-2 text-muted-foreground dark:text-muted-foreground">
                    <div>1. Create your account—your digital safety deposit box</div>
                    <div>2. Your photographer delivers protected memories</div>
                    <div>3. One tap to download full resolution to your camera roll</div>
                    <div>4. Share with family members you authorize</div>
                    <div>5. Protected from hard drive failures, lost USB drives, expired links</div>
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
