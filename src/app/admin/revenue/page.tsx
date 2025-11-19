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
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react'

type RevenueData = {
  stats: {
    totalRevenue: number
    thisMonth: number
    thisYear: number
    averageOrder: number
  }
  recentPayments: Array<{
    id: string
    customer: string
    amount: number
    status: string
    date: string
  }>
  topPhotographers: Array<{
    name: string
    revenue: number
    sessions: number
  }>
  failedPayments: Array<{
    id: string
    customer: string
    amount: number
    reason: string
    date: string
  }>
}

export default function RevenuePage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
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
        const response = await fetch('/api/admin/revenue', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load revenue data')
        }
        setRevenueData(payload.data)
      } catch (err) {
        console.error('[admin/revenue] Failed to fetch data', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [loading, user, userType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

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

  const revenueStats = revenueData
    ? [
        { label: 'Total Revenue', value: formatCurrency(revenueData.stats.totalRevenue), subtext: 'All time' },
        {
          label: 'This Month',
          value: formatCurrency(revenueData.stats.thisMonth),
          subtext: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
        {
          label: 'This Year',
          value: formatCurrency(revenueData.stats.thisYear),
          subtext: new Date().getFullYear().toString(),
        },
        { label: 'Average Order', value: formatCurrency(revenueData.stats.averageOrder), subtext: 'Per transaction' },
      ]
    : [
        { label: 'Total Revenue', value: '$0.00', subtext: 'All time' },
        { label: 'This Month', value: '$0.00', subtext: 'November 2025' },
        { label: 'This Year', value: '$0.00', subtext: '2025' },
        { label: 'Average Order', value: '$0.00', subtext: 'Per transaction' },
      ]

  const recentPayments = revenueData?.recentPayments || []
  const topPhotographers = revenueData?.topPhotographers || []
  const failedPayments = revenueData?.failedPayments || []

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DollarSign className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Revenue Management</h1>
                <p className="text-sm text-slate-600">
                  Monitor revenue, payments, and financial metrics across PhotoVault.
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
            {/* Revenue Overview */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  Key revenue metrics calculated from payments and subscriptions. Real data will appear once Stripe and internal payment reporting are connected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {revenueStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-blue-100 bg-white p-4">
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.subtext}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Activity */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Payment Activity
                  </CardTitle>
                  <CardDescription>
                    Recent payment transactions. Replace placeholder rows with live data from Stripe and internal billing tables.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Payments
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {recentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            {dataLoading ? 'Loading...' : 'No payments yet'}
                          </td>
                        </tr>
                      ) : (
                        recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 font-medium text-slate-700">{payment.id}</td>
                            <td className="px-4 py-3 text-slate-600">{payment.customer}</td>
                            <td className="px-4 py-3 text-slate-600">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  payment.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : payment.status === 'Inactive'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{payment.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Top Earners & Failed Payments */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Top Revenue Photographers
                  </CardTitle>
                  <CardDescription>
                    Highest grossing photographers ranked by total revenue. Replace placeholders once revenue analytics are connected.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topPhotographers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {dataLoading ? 'Loading...' : 'No photographers yet'}
                    </div>
                  ) : (
                    topPhotographers.map((photographer, index) => (
                      <div
                        key={`${photographer.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{photographer.name}</p>
                          <p className="text-xs text-slate-500">{photographer.sessions} sessions</p>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{formatCurrency(photographer.revenue)}</span>
                      </div>
                    ))
                  )}
                  <Button variant="outline" className="w-full" disabled>
                    View full leaderboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Failed Payments
                  </CardTitle>
                  <CardDescription>
                    Payments requiring attention. Hook this into Stripe&apos;s failure webhook or billing retry queue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {failedPayments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {dataLoading ? 'Loading...' : 'No failed payments'}
                    </div>
                  ) : (
                    failedPayments.map((payment) => (
                      <div key={payment.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-amber-800">{payment.id}</p>
                          <span className="text-sm font-medium text-amber-700">{formatCurrency(payment.amount)}</span>
                        </div>
                        <p className="text-sm text-amber-700">{payment.customer}</p>
                        <p className="text-xs text-amber-600">Reason: {payment.reason}</p>
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" variant="outline" disabled className="cursor-not-allowed">
                            Retry Payment
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Integrations */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Payment Integrations
                </CardTitle>
                <CardDescription>
                  Stripe and internal payment services status. Update once webhooks and service monitors are wired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-slate-800">Stripe Connect</p>
                      <p className="text-sm text-slate-500">Integration pending</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold text-slate-800">Webhook Processing</p>
                      <p className="text-sm text-slate-500">Awaiting deployment</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      Pending
                    </Badge>
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

