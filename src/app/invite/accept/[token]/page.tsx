'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface InvitationData {
  photographer_name: string
  photographer_business_name?: string
  client_name: string
  client_email: string
  gallery_name: string
  gallery_description?: string
  photo_count: number
  gallery_id: string
}

export default function InviteAcceptancePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    fetchInvitation()
  }, [token])

  const fetchInvitation = async () => {
    try {
      setLoading(true)

      // Fetch invitation details from database
      const { data, error } = await supabase
        .from('client_invitations')
        .select(`
          client_name,
          client_email,
          gallery_id,
          photographer_id,
          status,
          expires_at
        `)
        .eq('invitation_token', token)
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation')
        setLoading(false)
        return
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      // Check if already accepted
      if (data.status === 'accepted') {
        setError('This invitation has already been used')
        setLoading(false)
        return
      }

      // Fetch gallery details
      const { data: gallery } = await supabase
        .from('photo_galleries')
        .select('gallery_name, gallery_description, photo_count')
        .eq('id', data.gallery_id)
        .single()

      // Fetch photographer details
      const { data: photographer } = await supabase
        .from('user_profiles')
        .select('full_name, business_name')
        .eq('id', data.photographer_id)
        .single()

      setInvitation({
        photographer_name: photographer?.full_name || 'Your Photographer',
        photographer_business_name: photographer?.business_name,
        client_name: data.client_name,
        client_email: data.client_email,
        gallery_name: gallery?.gallery_name || 'Your Gallery',
        gallery_description: gallery?.gallery_description,
        photo_count: gallery?.photo_count || 0,
        gallery_id: data.gallery_id,
      })

      // Pre-fill form with client data
      setFormData(prev => ({
        ...prev,
        name: data.client_name,
        email: data.client_email,
      }))

      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching invitation:', err)
      setError('Failed to load invitation')
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      setCreating(true)

      // Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            user_type: 'client',
            invitation_token: token,
          },
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      // Mark invitation as accepted
      await supabase
        .from('client_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('invitation_token', token)

      // Redirect to client dashboard
      router.push('/client/dashboard?welcome=true')
    } catch (err: any) {
      console.error('Error creating account:', err)
      setError(err.message || 'Failed to create account')
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-pink-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact your photographer for a new invitation link.
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
    <div className="min-h-screen bg-neutral-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Camera className="h-16 w-16 text-pink-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Your Photos Are Ready!</h1>
          <p className="text-lg text-gray-600">
            Create your account to access your gallery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Gallery Info */}
          <Card>
            <CardHeader>
              <CardTitle>Gallery Details</CardTitle>
              <CardDescription>From {invitation?.photographer_business_name || invitation?.photographer_name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{invitation?.gallery_name}</h3>
                {invitation?.gallery_description && (
                  <p className="text-gray-600 text-sm mb-3">{invitation.gallery_description}</p>
                )}
                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                  📷 {invitation?.photo_count} photos ready
                </Badge>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">What is PhotoVault?</h4>
                <p className="text-sm text-blue-800">
                  PhotoVault is a secure platform where you can access all your professional photos
                  from different photographers in one beautiful place. No more lost USB drives or expired download links!
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Secure cloud storage</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Download in high resolution</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Share with family & friends</span>
              </div>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>Quick and easy signup to access your photos</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pre-filled from your photographer's invitation
                  </p>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>Create Account & View Photos</>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
