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
import {
  AlertTriangle,
  BarChart,
  Lock,
  MonitorDot,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react'

const securityStatus = [
  {
    label: 'Threat Level',
    value: 'Normal',
    description: 'No active incidents detected.',
    state: 'operational' as const,
  },
  {
    label: 'Failed Logins',
    value: '—',
    description: '24 hour window',
    state: 'pending' as const,
  },
  {
    label: 'Active Sessions',
    value: '—',
    description: 'Across all users',
    state: 'pending' as const,
  },
  {
    label: 'SSL Status',
    value: 'Valid',
    description: 'CN=app.photovault.com',
    state: 'operational' as const,
  },
]

const securityEvents = [
  { id: 'SEC-001', type: 'Login Failure', detail: 'Placeholder admin account', time: '—' },
  { id: 'SEC-002', type: 'Password Reset', detail: 'Client account', time: '—' },
  { id: 'SEC-003', type: 'Rate Limit', detail: 'API token exceeded limit', time: '—' },
]

const auditLog = [
  { id: 'AUD-001', actor: 'admin@photovault.photo', action: 'Updated system settings', timestamp: '—' },
  { id: 'AUD-002', actor: 'admin@photovault.photo', action: 'Reviewed gallery report', timestamp: '—' },
  { id: 'AUD-003', actor: 'support@photovault.photo', action: 'Reset client password', timestamp: '—' },
]

export default function SecurityPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userType])

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShieldAlert className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Security &amp; Logs</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor PhotoVault security events, audit logs, and access controls. Real telemetry will appear once the security stack is connected.
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
            {/* Security Status */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Security Status
                </CardTitle>
                <CardDescription>
                  High-level security indicators. Replace with monitoring feed and alerting system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {securityStatus.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-blue-100 bg-white p-4"
                    >
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Events and Audit Logs */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Security Events
                    </CardTitle>
                    <CardDescription>
                      Recent security-related activity. Connect to logging provider to replace placeholder entries.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-amber-800">{event.type}</p>
                        <span className="text-xs text-amber-600">{event.time}</span>
                      </div>
                      <p className="text-sm text-amber-700">{event.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-blue-600" />
                      Audit Log
                    </CardTitle>
                    <CardDescription>
                      Administrative actions across the platform. Replace with Supabase audit logs or dedicated logging service.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                    Download CSV
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{entry.actor}</p>
                          <p className="text-sm text-muted-foreground">{entry.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Access Controls */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Access Controls
                </CardTitle>
                <CardDescription>
                  Configure IP allowlisting, rate limits, and session policies. Controls will activate once backend enforcement is available.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-muted-foreground">IP Allowlist</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">Disabled</p>
                  <p className="text-xs text-muted-foreground">Enable to restrict admin access</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-muted-foreground">Rate Limit</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">Standard</p>
                  <p className="text-xs text-muted-foreground">Adjust via API gateway</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-muted-foreground">Session Timeout</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">60 min</p>
                  <p className="text-xs text-muted-foreground">Configurable in settings</p>
                </div>
              </CardContent>
            </Card>

            {/* Security Guidance */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldQuestion className="h-5 w-5 text-blue-600" />
                  Security Checklist
                </CardTitle>
                <CardDescription>
                  Ensure these items are complete before launch.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-slate-800">Webhook Verification</p>
                  <p>Confirm Stripe and Supabase webhooks are verified and monitored.</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-slate-800">SOC/Compliance</p>
                  <p>Document compliance posture (SOC 2, GDPR, COPPA as needed).</p>
                </div>
              </CardContent>
            </Card>

            {/* Monitoring Integrations */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorDot className="h-5 w-5 text-blue-600" />
                  Monitoring Integrations
                </CardTitle>
                <CardDescription>
                  Connect security tooling to surface real alerts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-800">Supabase Logs</p>
                    <p className="text-xs text-muted-foreground">Pending connection</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-800">Cloudflare WAF</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-800">Sentry Alerts</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

