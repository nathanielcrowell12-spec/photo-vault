'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AccessGuard from '@/components/AccessGuard'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
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

  // Date filtering state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Generate year options (current year back to 2024)
  const yearOptions = Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => new Date().getFullYear() - i)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userType])

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      // Calculate date range for selected month
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]

      const response = await fetch(`/api/admin/revenue?startDate=${startDate}&endDate=${endDate}`, { cache: 'no-store' })
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
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (loading || !user || userType !== 'admin') {
      return
    }
    fetchData()
  }, [loading, user, userType, fetchData])

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

  const selectedMonthLabel = `${monthNames[selectedMonth]} ${selectedYear}`

  const revenueStats = revenueData
    ? [
        { label: 'Total Revenue', value: formatCurrency(revenueData.stats.totalRevenue), subtext: 'All time', href: null },
        {
          label: selectedMonthLabel,
          value: formatCurrency(revenueData.stats.thisMonth),
          subtext: 'Selected month',
          href: null,
        },
        {
          label: `${selectedYear} YTD`,
          value: formatCurrency(revenueData.stats.thisYear),
          subtext: `Year to date`,
          href: null,
        },
        { label: 'Average Order', value: formatCurrency(revenueData.stats.averageOrder), subtext: 'Per transaction', href: null },
      ]
    : [
        { label: 'Total Revenue', value: '$0.00', subtext: 'All time', href: null },
        { label: selectedMonthLabel, value: '$0.00', subtext: 'Selected month', href: null },
        { label: `${selectedYear} YTD`, value: '$0.00', subtext: 'Year to date', href: null },
        { label: 'Average Order', value: '$0.00', subtext: 'Per transaction', href: null },
      ]

  const recentPayments = revenueData?.recentPayments || []
  const topPhotographers = revenueData?.topPhotographers || []
  const failedPayments = revenueData?.failedPayments || []

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <DollarSign className="h-10 w-10 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Revenue Management</h1>
                  <p className="text-sm text-muted-foreground">
                    Monitor revenue, payments, and financial metrics across PhotoVault.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Admin Access
              </Badge>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="text-sm font-medium">View data for:</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[100px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={dataLoading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", dataLoading && "animate-spin")} />
                {dataLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Revenue Overview */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>
                  PhotoVault commission revenue from client payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {revenueStats.map((stat) => (
                    stat.href ? (
                      <Link key={stat.label} href={stat.href}>
                        <div className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors group h-full">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-card-foreground">{stat.value}</p>
                          <p className="text-xs text-primary group-hover:underline">View transactions →</p>
                        </div>
                      </Link>
                    ) : (
                      <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-card-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Activity */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Payment Activity
                  </CardTitle>
                  <CardDescription>
                    Transactions for {selectedMonthLabel}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  disabled={dataLoading}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", dataLoading && "animate-spin")} />
                  {dataLoading ? 'Syncing...' : 'Sync Payments'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {recentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            {dataLoading ? 'Loading...' : 'No payments this month'}
                          </td>
                        </tr>
                      ) : (
                        recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-3 font-medium text-card-foreground">{payment.id}</td>
                            <td className="px-4 py-3 text-muted-foreground">{payment.customer}</td>
                            <td className="px-4 py-3 text-card-foreground">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                                  payment.status === 'Paid' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                  payment.status === 'Refunded' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                  payment.status === 'Pending' && "bg-muted text-muted-foreground"
                                )}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{payment.date}</td>
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
              <Card className="border-2 border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Revenue Photographers
                  </CardTitle>
                  <CardDescription>
                    Highest grossing photographers ranked by total earnings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topPhotographers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {dataLoading ? 'Loading...' : 'No photographers yet'}
                    </div>
                  ) : (
                    topPhotographers.map((photographer, index) => (
                      <div
                        key={`${photographer.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                      >
                        <div>
                          <p className="font-semibold text-card-foreground">{photographer.name}</p>
                          <p className="text-xs text-muted-foreground">{photographer.sessions} galleries</p>
                        </div>
                        <span className="text-sm font-medium text-card-foreground">{formatCurrency(photographer.revenue)}</span>
                      </div>
                    ))
                  )}
                  <Link href="/admin/leaderboard">
                    <Button variant="outline" className="w-full">
                      View full leaderboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Failed Payments
                  </CardTitle>
                  <CardDescription>
                    Payments requiring attention.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {failedPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {dataLoading ? 'Loading...' : 'No failed payments'}
                    </div>
                  ) : (
                    failedPayments.map((payment) => (
                      <div key={payment.id} className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-amber-800 dark:text-amber-200">{payment.id}</p>
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{formatCurrency(payment.amount)}</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{payment.customer}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Reason: {payment.reason}</p>
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

          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

