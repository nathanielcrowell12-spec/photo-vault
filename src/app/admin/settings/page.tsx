'use client'

import { useEffect } from 'react'
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
} from 'lucide-react'

const toggleSettings = [
  { label: 'Enable Photo AI Enhancements', value: false },
  { label: 'Allow Client Self-Signup', value: true },
  { label: 'Enable Maintenance Mode', value: false },
  { label: 'Require Two-Factor Authentication', value: false },
]

export default function SystemSettingsPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [loading, user, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user || userType !== 'admin') {
    return null
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">System Settings</h1>
                <p className="text-sm text-slate-600">
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
                  <p className="text-xs text-slate-500">Frontend brand name displayed to all users.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryDomain">Primary Domain</Label>
                  <Input id="primaryDomain" value="app.photovault.com" disabled />
                  <p className="text-xs text-slate-500">Production domain for PhotoVault.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" value="support@photovault.com" disabled />
                  <p className="text-xs text-slate-500">All automated support communications send from this address.</p>
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
                      <p className="text-xs text-slate-500">Available soon</p>
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
                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
                <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
                    <p className="text-xs text-slate-500">Policy enforced by default</p>
                  </div>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">Session timeout (minutes)</p>
                    <p className="text-xs text-slate-500">Automatic logout after inactivity</p>
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

