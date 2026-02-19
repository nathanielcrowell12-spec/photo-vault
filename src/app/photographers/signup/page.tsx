'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Camera, CheckCircle, ArrowRight, Mail, Lock, User, Phone, Building, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PhotographerSignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, 'photographer', formData.businessName || formData.fullName)

      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An error occurred during signup')
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/photographers" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">PhotoVault Pro</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Already have an account?</span>
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
                <Badge className="mb-4 bg-green-100 text-green-800">
                  Beta — Free for 12 Months
                </Badge>
                <h1 className="text-4xl font-bold mb-4 text-foreground">Start Earning Passive Income</h1>
                <p className="text-lg text-muted-foreground">
                  Deliver galleries. Earn $4/month per client, forever. Takes 30 seconds — no credit card required.
                </p>
              </div>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Create Your Photographer Account</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Free for 12 months during beta. No credit card required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">
                        <Building className="h-4 w-4 inline mr-2" />
                        Business Name <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Your photography business name"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
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
                        Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
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
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? (
                        'Creating Account...'
                      ) : (
                        <>
                          Create Free Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
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

            {/* Right Side - Hero Image + Benefits */}
            <div className="space-y-6">
              {/* Hero Image */}
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1598367886186-71a4e6afc589?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDAwMzd8MHwxfHNlYXJjaHwxfHxwaG90b2dyYXBoZXIlMjBnb2xkZW4lMjBob3VyJTIwY2FtZXJhJTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MHwwfHx8MTc2NTAyNTMxNnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Professional photographer capturing moments at golden hour"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-3 right-3 text-xs text-foreground/70">
                  Photo by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Unsplash</a>
                </p>
              </div>

              <Card className="border border-border bg-card/50">
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-green-100 text-green-800">
                    Why Photographers Switch
                  </Badge>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">What You Get</h2>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">$4/Month Per Client, Forever</div>
                        <div className="text-sm text-muted-foreground">Passive income from work you already did</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">$50 Upfront Per Gallery</div>
                        <div className="text-sm text-muted-foreground">Client pays $100 for 12 months — you keep half</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">Costs Don&apos;t Scale With Growth</div>
                        <div className="text-sm text-muted-foreground">Clients pay for their own storage, not you</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">Professional Gallery Delivery</div>
                        <div className="text-sm text-muted-foreground">Beautiful galleries with download controls and sharing</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">Replace Pixieset & ShootProof</div>
                        <div className="text-sm text-muted-foreground">Same delivery features, plus you actually earn from it</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-foreground">Platform Pricing</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">$22/month</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>✓ Unlimited clients & galleries</div>
                    <div>✓ Full commission tracking</div>
                    <div>✓ Advanced analytics & reports</div>
                    <div>✓ Professional support</div>
                  </div>
                  <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Break-even calculation:</div>
                    <div className="text-sm text-muted-foreground">
                      <strong>6 active clients</strong> × $4/mo = $24/mo
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Platform fee covered + profit on every additional client!
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-foreground">Your Passive Income Potential</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-foreground">10 Families Protected:</div>
                      <div className="text-muted-foreground">
                        $500 upfront + $40/month passive income
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">25 Families Protected:</div>
                      <div className="text-muted-foreground">
                        $1,250 upfront + $100/month passive income
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">50 Families Protected:</div>
                      <div className="text-muted-foreground">
                        $2,500 upfront + $200/month passive income
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

