'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AccessGuard from '@/components/AccessGuard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DollarSign,
  Globe,
  Mail,
  ShieldCheck,
  Settings,
  Sliders,
  UploadCloud,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const toggleSettings = [
  { label: 'Enable Photo AI Enhancements', value: false },
  { label: 'Allow Client Self-Signup', value: true },
  { label: 'Enable Maintenance Mode', value: false },
  { label: 'Require Two-Factor Authentication', value: false },
]

export default function SystemSettingsPage() {
  const { user, userType, loading, changePassword } = useAuth()
  const router = useRouter()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  })

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userType])

  useEffect(() => {
    // Validate password requirements
    setPasswordRequirements({
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    })
  }, [newPassword])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!passwordRequirements.hasUppercase || !passwordRequirements.hasLowercase || !passwordRequirements.hasNumber) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setIsChanging(true)

    try {
      const { error: changeError } = await changePassword(newPassword)

      if (changeError) {
        setError(changeError instanceof Error ? changeError.message : 'Failed to change password. Please try again.')
      } else {
        setSuccess('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Password change error:', err)
    } finally {
      setIsChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || userType !== 'admin') {
    return null
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 border-border">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Configure PhotoVault system-wide settings and integrations. All fields are read-only until backend settings storage is enabled.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Access
            </Badge>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Account Settings */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your admin account password and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminEmail"
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordRequirements.minLength ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            At least 8 characters
                          </div>
                          <div className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordRequirements.hasUppercase ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            One uppercase letter
                          </div>
                          <div className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordRequirements.hasLowercase ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            One lowercase letter
                          </div>
                          <div className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {passwordRequirements.hasNumber ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            One number
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {success}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isChanging}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isChanging ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Application Settings */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Application Settings
                </CardTitle>
                <CardDescription>
                  General PhotoVault configuration. Editing will be available after connecting settings storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" value="PhotoVault" disabled />
                  <p className="text-xs text-muted-foreground">Frontend brand name displayed to all users.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryDomain">Primary Domain</Label>
                  <Input id="primaryDomain" value="app.photovault.com" disabled />
                  <p className="text-xs text-muted-foreground">Production domain for PhotoVault.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" value="support@photovault.com" disabled />
                  <p className="text-xs text-muted-foreground">All automated support communications send from this address.</p>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-blue-600" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Toggle major product capabilities. Backend integration pending.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {toggleSettings.map((toggle) => (
                  <div key={toggle.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">Available soon</p>
                    </div>
                    <Switch checked={toggle.value} disabled />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Email Configuration */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  SMTP and transactional email settings. Connect provider to enable editing.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value="smtp.sendgrid.net" disabled />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input value="587" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Sender Name</Label>
                  <Input value="PhotoVault" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Sender Email</Label>
                  <Input value="noreply@photovault.com" disabled />
                </div>
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                  Email template editing will be available once transactional email service is connected.
                </div>
              </CardContent>
            </Card>

            {/* Storage Settings */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-blue-600" />
                  Storage Settings
                </CardTitle>
                <CardDescription>
                  Configure storage limits and auto-cleanup policies per subscription tier.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Free Tier Limit</Label>
                  <Input value="1 GB" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Pro Tier Limit</Label>
                  <Input value="50 GB" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Business Tier Limit</Label>
                  <Input value="500 GB" disabled />
                </div>
                <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                  Auto-cleanup jobs pending configuration. Connect Supabase storage policies to enable adjustments.
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Manage Stripe integration, pricing tiers, and commission rates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stripe Publishable Key</Label>
                    <Input value="pk_live_************************" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Secret Key</Label>
                    <Input type="password" value="sk_live_************************" disabled />
                  </div>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Payment pricing updates will unlock once Stripe Connect onboarding is completed.
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Adjust password requirements, session timeouts, and other policies. Hook into security service to enable editing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">Password requires uppercase & number</p>
                    <p className="text-xs text-muted-foreground">Policy enforced by default</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">Session timeout (minutes)</p>
                    <p className="text-xs text-muted-foreground">Automatic logout after inactivity</p>
                  </div>
                  <Input value="60" disabled className="w-20 text-right" />
                </div>
                <Button variant="outline" disabled className="cursor-not-allowed">
                  Configure Security Providers
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

