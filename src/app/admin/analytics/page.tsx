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
import { Activity, BarChart3, Clock, LineChart, PieChart, Users } from 'lucide-react'

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
  }, [loading, user, userType, router])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Analytics &amp; Reports</h1>
                <p className="text-sm text-slate-600">
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
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
                      <p className="text-xs text-slate-400">{metric.subtext}</p>
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
                    <LineChart className="h-5 w-5 text-blue-600" />
                    User Growth Chart
                  </CardTitle>
                  <CardDescription>
                    Hook into analytics pipeline to plot signups and active user counts over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                    Line chart coming soon
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Platform Usage Breakdown
                  </CardTitle>
                  <CardDescription>
                    Display distribution of storage, gallery imports, and photo processing usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                    Pie chart coming soon
                  </div>
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
                  <div className="text-center py-8 text-slate-500">
                    {dataLoading ? 'Loading...' : 'No recent activity'}
                  </div>
                ) : (
                  recentEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{event.type}</p>
                          <p className="text-sm text-slate-500">{event.description}</p>
                        </div>
                        <span className="text-xs text-slate-400">{event.timestamp}</span>
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
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Integrate with monitoring to track API response times, errors, and uptime trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Average API Response</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">—</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Error Rate</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">—</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">Uptime (30 days)</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">—</p>
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
