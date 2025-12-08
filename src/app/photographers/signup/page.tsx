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
import Image from 'next/image'

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
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/photographers" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-neutral-100">PhotoVault Pro</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-400">Already have an account?</span>
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
                <Badge className="mb-4 bg-blue-100 text-blue-800">
                  Become a Memory Guardian
                </Badge>
                <h1 className="text-4xl font-bold mb-4 text-neutral-100">Protect Your Clients&apos; Memories</h1>
                <p className="text-lg text-neutral-400">
                  Give families Memory Insurance. Earn $4/month passive income forever.
                </p>
              </div>

              <Card className="bg-neutral-800/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-neutral-100">Create Your Photographer Account</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Free during beta • $22/month after launch
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
                      <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded-lg text-sm">
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
                          Start Protecting Memories
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-neutral-500">
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
                <p className="absolute bottom-3 right-3 text-xs text-white/70">
                  Photo by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Unsplash</a>
                </p>
              </div>

              <Card className="border border-white/10 bg-neutral-800/50">
                <CardContent className="pt-6">
                  <Badge className="mb-4 bg-green-100 text-green-800">
                    Memory Guardian Benefits
                  </Badge>
                  <h2 className="text-2xl font-bold mb-4 text-neutral-100">What You&apos;ll Deliver to Clients</h2>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">Memory Insurance for Every Family</div>
                        <div className="text-sm text-neutral-400">Professional-grade protection for irreplaceable photos</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">One-Tap Camera Roll Delivery</div>
                        <div className="text-sm text-neutral-400">No more zip files. Full resolution, instant.</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">$4/Month Passive Income Forever</div>
                        <div className="text-sm text-neutral-400">Earn while families sleep soundly</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">Digital Safety Deposit Box</div>
                        <div className="text-sm text-neutral-400">Survives hard drive crashes, phone losses, house fires</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">Your Branding, Their Peace of Mind</div>
                        <div className="text-sm text-neutral-400">Every photo protected under your name</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">Replace Pixieset & ShootProof</div>
                        <div className="text-sm text-neutral-400">Same features, plus you earn more</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-neutral-100">14-Day Free Trial</div>
                        <div className="text-sm text-neutral-400">No credit card required to start</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800/50 border-white/10">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-neutral-100">Platform Pricing</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">$22/month</div>
                  <div className="text-sm text-neutral-400 space-y-1">
                    <div>✓ Unlimited clients & galleries</div>
                    <div>✓ Full commission tracking</div>
                    <div>✓ Advanced analytics & reports</div>
                    <div>✓ Professional support</div>
                  </div>
                  <div className="mt-4 p-3 bg-neutral-700/30 rounded-lg">
                    <div className="text-xs text-neutral-500 mb-1">Break-even calculation:</div>
                    <div className="text-sm text-neutral-300">
                      <strong>6 active clients</strong> × $4/mo = $24/mo
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Platform fee covered + profit on every additional client!
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800/50 border-white/10">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3 text-neutral-100">Your Passive Income Potential</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-neutral-100">10 Families Protected:</div>
                      <div className="text-neutral-400">
                        $500 upfront + $40/month passive income
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-100">25 Families Protected:</div>
                      <div className="text-neutral-400">
                        $1,250 upfront + $100/month passive income
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-100">50 Families Protected:</div>
                      <div className="text-neutral-400">
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

