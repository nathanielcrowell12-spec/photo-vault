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
import { Activity, BarChart3, Clock, LineChart as LineChartIcon, PieChart as PieChartIcon, Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

type UserGrowthDataPoint = {
  date: string
  photographers: number
  clients: number
  total: number
}

type GalleryStatusBreakdown = {
  status: string
  count: number
  percentage: number
}

type HealthCheckData = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  queryLatencyMs: number
  tableCounts: {
    users: number
    galleries: number
    photos: number
  }
  lastChecked: string
}

type AnalyticsData = {
  metrics: {
    totalUsers: number
    photosUploaded: number
    storageUsed: string
    activeToday: number
  }
  recentEvents: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
  userGrowth: UserGrowthDataPoint[]
  galleryBreakdown: GalleryStatusBreakdown[]
  healthCheck: HealthCheckData
}

// Chart colors matching globals.css
const CHART_COLORS = {
  photographers: '#00B3A4',  // chart-1 (primary teal)
  clients: '#00D9C5',        // chart-2 (light teal)
  Draft: '#008F84',          // chart-3
  Ready: '#00B3A4',          // chart-1
  Live: '#00D9C5',           // chart-2
  Archived: '#00665D',       // chart-4
}

export default function AnalyticsPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userType])

  useEffect(() => {
    if (loading || !user || userType !== 'admin') {
      return
    }

    const fetchData = async () => {
      setDataLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/admin/analytics', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load analytics data')
        }
        setAnalyticsData(payload.data)
      } catch (err) {
        console.error('[admin/analytics] Failed to fetch data', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
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

  const analyticsMetrics = analyticsData
    ? [
        {
          label: 'Total Users',
          value: analyticsData.metrics.totalUsers.toString(),
          subtext: 'Lifetime registrations',
        },
        {
          label: 'Photos Uploaded',
          value: analyticsData.metrics.photosUploaded.toLocaleString(),
          subtext: 'Across all galleries',
        },
        {
          label: 'Storage Used',
          value: analyticsData.metrics.storageUsed,
          subtext: 'Supabase storage footprint',
        },
        {
          label: 'Active Today',
          value: analyticsData.metrics.activeToday.toString(),
          subtext: 'Unique active sessions',
        },
      ]
    : [
        { label: 'Total Users', value: '—', subtext: 'Lifetime registrations' },
        { label: 'Photos Uploaded', value: '—', subtext: 'Across all galleries' },
        { label: 'Storage Used', value: '—', subtext: 'Supabase storage footprint' },
        { label: 'Active Today', value: '—', subtext: 'Unique active sessions' },
      ]

  const recentEvents = analyticsData?.recentEvents || []

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Analytics &amp; Reports</h1>
                <p className="text-sm text-muted-foreground">
                  View PhotoVault user, photo, and system performance analytics. Live data will display once tracking is connected.
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
            {/* Metric Cards */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Growth Metrics
                </CardTitle>
                <CardDescription>
                  Core platform metrics. Replace placeholders with Supabase analytics or data warehouse queries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {analyticsMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-blue-100 bg-white p-4">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.subtext}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts coming soon */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-blue-600" />
                    User Growth Chart
                  </CardTitle>
                  <CardDescription>
                    Cumulative user counts over the last 6 months by user type.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.userGrowth && analyticsData.userGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={192}>
                      <LineChart data={analyticsData.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="photographers"
                          name="Photographers"
                          stroke={CHART_COLORS.photographers}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.photographers, strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="clients"
                          name="Clients"
                          stroke={CHART_COLORS.clients}
                          strokeWidth={2}
                          dot={{ fill: CHART_COLORS.clients, strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-muted-foreground">
                      {dataLoading ? 'Loading chart data...' : 'No user growth data available'}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    Gallery Status Breakdown
                  </CardTitle>
                  <CardDescription>
                    Distribution of galleries by status across the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.galleryBreakdown && analyticsData.galleryBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={192}>
                      <PieChart>
                        <Pie
                          data={analyticsData.galleryBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ percentage }) => `${percentage}%`}
                          labelLine={{ stroke: '#64748b' }}
                        >
                          {analyticsData.galleryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[entry.status as keyof typeof CHART_COLORS] || '#00B3A4'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string) => [`${value} galleries`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-muted-foreground">
                      {dataLoading ? 'Loading chart data...' : 'No gallery data available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Feed */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Stream of notable events. Replace with live audit logs or analytics events feed.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                  Export Logs
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {dataLoading ? 'Loading...' : 'No recent activity'}
                  </div>
                ) : (
                  recentEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{event.type}</p>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Database Health Check
                </CardTitle>
                <CardDescription>
                  Real-time database connectivity and performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {/* Health Status */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-2 flex items-center gap-2">
                      {analyticsData?.healthCheck?.status === 'healthy' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-xl font-semibold text-green-600">Healthy</p>
                        </>
                      )}
                      {analyticsData?.healthCheck?.status === 'degraded' && (
                        <>
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <p className="text-xl font-semibold text-yellow-600">Degraded</p>
                        </>
                      )}
                      {analyticsData?.healthCheck?.status === 'unhealthy' && (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <p className="text-xl font-semibold text-red-600">Unhealthy</p>
                        </>
                      )}
                      {!analyticsData?.healthCheck && (
                        <p className="text-xl font-semibold text-slate-900">—</p>
                      )}
                    </div>
                  </div>
                  {/* Query Latency */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-muted-foreground">Query Latency</p>
                    <p className={`mt-2 text-xl font-semibold ${
                      analyticsData?.healthCheck?.queryLatencyMs !== undefined
                        ? analyticsData.healthCheck.queryLatencyMs < 500
                          ? 'text-green-600'
                          : analyticsData.healthCheck.queryLatencyMs < 1000
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        : 'text-slate-900'
                    }`}>
                      {analyticsData?.healthCheck?.queryLatencyMs !== undefined
                        ? `${analyticsData.healthCheck.queryLatencyMs}ms`
                        : '—'}
                    </p>
                  </div>
                  {/* Table Counts */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {analyticsData?.healthCheck?.tableCounts
                        ? (analyticsData.healthCheck.tableCounts.users +
                           analyticsData.healthCheck.tableCounts.galleries +
                           analyticsData.healthCheck.tableCounts.photos).toLocaleString()
                        : '—'}
                    </p>
                    {analyticsData?.healthCheck?.tableCounts && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {analyticsData.healthCheck.tableCounts.users} users,{' '}
                        {analyticsData.healthCheck.tableCounts.galleries} galleries,{' '}
                        {analyticsData.healthCheck.tableCounts.photos} photos
                      </p>
                    )}
                  </div>
                  {/* Last Checked */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-muted-foreground">Last Checked</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {analyticsData?.healthCheck?.lastChecked
                        ? new Date(analyticsData.healthCheck.lastChecked).toLocaleTimeString()
                        : '—'}
                    </p>
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
