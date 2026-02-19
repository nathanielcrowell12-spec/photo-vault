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
import { Camera, Users, Heart, CheckCircle, ArrowRight, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { signUp, user, userType: currentUserType } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const userType = 'client' // Customer signup page - fixed to client

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
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

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
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
                  All Your Photos, One Place
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Keep Your Photos Forever</h1>
                <p className="text-lg text-muted-foreground dark:text-foreground">
                  Every photographer, every session, one beautiful gallery. No more expired links or lost files.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>
                    Takes 30 seconds. Your photographer will send you photos here.
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
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg text-sm">
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
                    Why PhotoVault
                  </Badge>
                  <h2 className="text-2xl font-bold mb-4">Your Photos, Always Available</h2>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Every Photographer, One Place</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Wedding, family, newborn — all your sessions in one gallery</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">No Expired Links</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Your photos stay available. No scrambling for old download links.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Full Resolution Downloads</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Download any photo to your phone or computer, anytime</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-semibold">Share With Family</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Invite family members to view and download photos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Simple Pricing</h3>
                  <div className="text-sm space-y-2 text-muted-foreground dark:text-muted-foreground">
                    <div>• First year included when your photographer sets up your gallery</div>
                    <div>• $8/month after the first year to keep everything</div>
                    <div>• One account for your whole family</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">How It Works</h3>
                  <div className="text-sm space-y-2 text-muted-foreground dark:text-muted-foreground">
                    <div>1. Your photographer creates a gallery for you</div>
                    <div>2. You get an email with a link to view and download</div>
                    <div>3. All your photos stay here — organized by session</div>
                    <div>4. Share with family whenever you want</div>
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
