'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Users, 
  Camera, 
  DollarSign,
  Settings,
  BarChart3,
  Database,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'
import MessagesButton from '@/components/MessagesButton'
import { ThemePicker } from '@/components/ThemePicker'

type DashboardStatusResponse = {
  stats: {
    totalUsers: number | null
    activePhotographers: number | null
    monthlyRevenue: number | null
    systemUptime: string | null
  }
  statusCards: Array<{
    id: string
    title: string
    state: 'operational' | 'warning' | 'pending' | 'error'
    summary: string
    detail: string
    icon: string
  }>
}

const STATUS_STYLES: Record<DashboardStatusResponse['statusCards'][number]['state'], { bg: string; border: string; text: string; badge: string }> = {
  operational: {
    bg: 'bg-green-950/30',
    border: 'border-green-800/50',
    text: 'text-green-400',
    badge: 'bg-green-900/50 text-green-300',
  },
  warning: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-800/50',
    text: 'text-amber-400',
    badge: 'bg-amber-900/50 text-amber-300',
  },
  pending: {
    bg: 'bg-blue-950/30',
    border: 'border-blue-800/50',
    text: 'text-blue-400',
    badge: 'bg-blue-900/50 text-blue-300',
  },
  error: {
    bg: 'bg-red-950/30',
    border: 'border-red-800/50',
    text: 'text-red-400',
    badge: 'bg-red-900/50 text-red-300',
  },
}

const STATUS_ICON_MAP = {
  Shield,
  CheckCircle,
  AlertTriangle,
  Database,
  Globe,
  BarChart3,
  Activity,
  DollarSign,
} as const

export default function AdminDashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatusResponse | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  useEffect(() => {
    if (loading || !user) {
      return
    }

    let cancelled = false

    const fetchStatus = async () => {
      setStatusLoading(true)
      setStatusError(null)
      try {
        const response = await fetch('/api/admin/dashboard/status', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load dashboard status')
        }
        if (!cancelled) {
          setDashboardStatus(payload.data as DashboardStatusResponse)
        }
      } catch (error) {
        console.error('[admin/dashboard] status fetch failed', error)
        if (!cancelled) {
          setDashboardStatus(null)
          setStatusError(error instanceof Error ? error.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false)
        }
      }
    }

    fetchStatus()

    return () => {
      cancelled = true
    }
  }, [loading, user])

  const fallbackStatusCards = useMemo(
    () => [
      {
        id: 'overall',
        title: 'Platform',
        state: 'pending' as const,
        summary: 'Awaiting data',
        detail: 'Live metrics will appear once Supabase connectivity is confirmed.',
        icon: 'Shield',
      },
      {
        id: 'database',
        title: 'Database',
        state: 'pending' as const,
        summary: 'Awaiting data',
        detail: 'Connect to Supabase to surface health insights here.',
        icon: 'Database',
      },
      {
        id: 'cdn',
        title: 'CDN',
        state: 'pending' as const,
        summary: 'Integration pending',
        detail: 'Connect CDN monitoring to surface delivery health.',
        icon: 'Globe',
      },
      {
        id: 'performance',
        title: 'Performance',
        state: 'pending' as const,
        summary: 'Manual monitoring',
        detail: 'Hook up performance telemetry to replace this note.',
        icon: 'BarChart3',
      },
    ],
    [],
  )

  const statusCards = dashboardStatus?.statusCards ?? fallbackStatusCards
  const stats = dashboardStatus?.stats

  const quickStats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: stats?.totalUsers,
        formatter: (value: number | string) => Number(value).toLocaleString(),
        icon: Users,
      },
      {
        label: 'Active Photographers',
        value: stats?.activePhotographers,
        formatter: (value: number | string) => Number(value).toLocaleString(),
        icon: Camera,
      },
      {
        label: 'Monthly Revenue',
        value: stats?.monthlyRevenue,
        formatter: (value: number | string) =>
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value)),
        icon: DollarSign,
      },
      {
        label: 'System Uptime',
        value: stats?.systemUptime ?? null,
        formatter: (value: number | string) => String(value),
        icon: Activity,
      },
    ],
    [stats?.activePhotographers, stats?.monthlyRevenue, stats?.systemUptime, stats?.totalUsers],
  )

  const renderStatValue = (
    value: number | string | null | undefined,
    formatter: (val: number | string) => string,
  ) => {
    if (statusLoading) {
      return '...'
    }
    if (value === null || value === undefined) {
      return '—'
    }
    return formatter(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">PhotoVault Admin</h1>
                  <p className="text-sm text-muted-foreground">System Administration Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Admin Access
                </Badge>
                <MessagesButton variant="icon" />
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Welcome, {user?.email}</h2>
              <p className="text-lg text-muted-foreground">
                You have full administrative access to the PhotoVault system
              </p>
            </div>

            {/* System Status */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>Real-time system health and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {statusError && (
                    <div className="md:col-span-2 xl:col-span-4 rounded-md border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-400">
                      Unable to load live status: {statusError}
                    </div>
                  )}
                  {statusCards.map((card) => {
                    const styles = STATUS_STYLES[card.state]
                    const IconComponent =
                      STATUS_ICON_MAP[card.icon as keyof typeof STATUS_ICON_MAP] ?? Shield
                    return (
                      <div
                        key={card.id}
                        className={`p-4 rounded-lg border ${styles.border} ${styles.bg} flex flex-col gap-2`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${styles.text}`} />
                            <span className="font-semibold text-foreground">{card.title}</span>
                  </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles.badge}`}>
                            {card.summary}
                          </span>
                    </div>
                        <p className="text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <ThemePicker />

            {/* Admin Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>User Profiles</CardTitle>
                  <CardDescription>
                    Manage user accounts, privileges, and access levels. Suspend users or promote to admin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/users" className="flex items-center justify-center">
                      Manage User Profiles
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Analytics & Reports</CardTitle>
                  <CardDescription>
                    View system analytics, user metrics, and revenue reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/analytics" className="flex items-center justify-center">
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                    <Settings className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system-wide settings and integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/settings" className="flex items-center justify-center">
                      System Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Database Management</CardTitle>
                  <CardDescription>
                    Database maintenance, backups, and data management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/database" className="flex items-center justify-center">
                      Database Tools
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <CardTitle>Security & Logs</CardTitle>
                  <CardDescription>
                    Security monitoring, audit logs, and threat detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/security" className="flex items-center justify-center">
                      Security Center
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Revenue Management</CardTitle>
                  <CardDescription>
                    Monitor revenue, commissions, and payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/revenue" className="flex items-center justify-center">
                      Revenue Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Photographers</CardTitle>
                  <CardDescription>
                    View all photographers, their galleries, clients, and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/photographers" className="flex items-center justify-center">
                      View Photographers
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-card border-border">
                <CardHeader>
                  <div className="w-12 h-12 bg-pink-600/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-pink-600" />
                  </div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>
                    View all clients, their galleries, subscriptions, and spending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full justify-center" asChild>
                    <Link href="/admin/clients" className="flex items-center justify-center">
                      View Clients
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {quickStats.map((stat) => (
                <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">
                          {renderStatValue(stat.value, stat.formatter)}
                        </p>
                    </div>
                      <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}
