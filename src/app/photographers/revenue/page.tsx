'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Download,
  FileText
} from 'lucide-react'
import Link from 'next/link'

interface RevenueData {
  summary: {
    totalUpfrontCommission: number
    totalMonthlyCommission: number
    totalEarnings: number
    transactionCount: number
    activeClientsCount: number
    monthlyRecurringClientsCount: number
    projectedMonthlyRecurring: number
    projectedYearlyRecurring: number
    projectedYearlyTotal: number
  }
  recentTransactions: Array<{
    id: string
    clientName: string
    galleryName: string
    amount: number
    type: 'upfront' | 'monthly' | 'reactivation'
    date: string
    status: string
  }>
  topClients: Array<{
    name: string
    total: number
    upfront: number
    recurring: number
  }>
}

export default function RevenuePage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }
    fetchRevenueData()
  }, [period, userType, router])

  // Show loading or redirect if not photographer
  if (userType !== 'photographer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real commission data from API
      const response = await fetch('/api/photographer/commissions?limit=100')

      if (!response.ok) {
        throw new Error('Failed to fetch commission data')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const { commissions, totals } = data

      // If no commissions exist, show empty state
      if (!commissions || commissions.length === 0) {
        setRevenueData(null)
        setLoading(false)
        return
      }

      // Map API response to page structure
      const recentTransactions = commissions.slice(0, 10).map((c: any) => ({
        id: c.id,
        clientName: c.client_email || 'Unknown Client',
        galleryName: c.gallery_name || 'Gallery',
        amount: c.amount_dollars,
        type: c.payment_type,
        date: c.created_at,
        status: c.status
      }))

      // Aggregate clients by email for top clients list
      const clientTotals: Record<string, { upfront: number; recurring: number }> = {}
      commissions.forEach((c: any) => {
        const key = c.client_email || 'unknown'
        if (!clientTotals[key]) {
          clientTotals[key] = { upfront: 0, recurring: 0 }
        }
        if (c.payment_type === 'upfront') {
          clientTotals[key].upfront += c.amount_dollars
        } else {
          clientTotals[key].recurring += c.amount_dollars
        }
      })

      const topClients = Object.entries(clientTotals)
        .map(([name, amounts]) => ({
          name,
          total: amounts.upfront + amounts.recurring,
          upfront: amounts.upfront,
          recurring: amounts.recurring
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      // Count unique clients
      const uniqueClients = new Set(commissions.map((c: any) => c.client_email)).size

      // Count monthly recurring clients (clients with monthly payments)
      const monthlyClients = new Set(
        commissions
          .filter((c: any) => c.payment_type === 'monthly')
          .map((c: any) => c.client_email)
      ).size

      // Calculate projections based on current monthly recurring
      const projectedMonthlyRecurring = totals.monthlyEarnings > 0
        ? (totals.monthlyEarnings / Math.max(1, commissions.filter((c: any) => c.payment_type === 'monthly').length)) * monthlyClients
        : 0

      setRevenueData({
        summary: {
          totalUpfrontCommission: totals.upfrontEarnings,
          totalMonthlyCommission: totals.monthlyEarnings,
          totalEarnings: totals.totalEarnings,
          transactionCount: totals.transactionCount,
          activeClientsCount: uniqueClients,
          monthlyRecurringClientsCount: monthlyClients,
          projectedMonthlyRecurring: projectedMonthlyRecurring,
          projectedYearlyRecurring: projectedMonthlyRecurring * 12,
          projectedYearlyTotal: totals.upfrontEarnings + (projectedMonthlyRecurring * 12)
        },
        recentTransactions,
        topClients
      })

      setLoading(false)
    } catch (err) {
      console.error('Error fetching revenue data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load revenue data')
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const exportToCSV = () => {
    if (!revenueData) return

    // Create CSV content
    let csv = 'Revenue Summary\n\n'
    csv += 'Metric,Amount\n'
    csv += `Total Earnings,$${revenueData.summary.totalEarnings.toFixed(2)}\n`
    csv += `Upfront Commissions,$${revenueData.summary.totalUpfrontCommission.toFixed(2)}\n`
    csv += `Monthly Commissions,$${revenueData.summary.totalMonthlyCommission.toFixed(2)}\n`
    csv += `Total Transactions,${revenueData.summary.transactionCount}\n`
    csv += `Unique Clients,${revenueData.summary.activeClientsCount}\n`
    csv += `Recurring Clients,${revenueData.summary.monthlyRecurringClientsCount}\n`
    csv += `Projected Monthly Recurring,$${revenueData.summary.projectedMonthlyRecurring.toFixed(2)}\n`
    csv += `Projected Yearly Total,$${revenueData.summary.projectedYearlyTotal.toFixed(2)}\n\n`

    csv += 'Recent Transactions\n'
    csv += 'Date,Client,Gallery,Type,Amount,Status\n'
    revenueData.recentTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString()
      csv += `${date},"${transaction.clientName}","${transaction.galleryName}",${transaction.type},$${transaction.amount.toFixed(2)},${transaction.status}\n`
    })

    csv += '\nTop Clients\n'
    csv += 'Client,Total,Upfront,Recurring\n'
    revenueData.topClients.forEach(client => {
      csv += `"${client.name}",$${client.total.toFixed(2)},$${client.upfront.toFixed(2)},$${client.recurring.toFixed(2)}\n`
    })

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photovault_revenue_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 border-border">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Error Loading Data</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchRevenueData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!revenueData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 border-border">
          <CardContent className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">No Revenue Yet</h2>
            <p className="text-muted-foreground mb-6">
              Once clients pay for their galleries, your commission earnings will appear here.
            </p>
            <Button asChild>
              <Link href="/photographers/invite">
                Invite Your First Client
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold text-foreground">Revenue Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/photographers/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/photographers/reports">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Photographer
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Period Selector */}
          <div className="mb-8">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="all">All Time</TabsTrigger>
                <TabsTrigger value="yearly">This Year</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Upfront</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenueData.summary.totalUpfrontCommission)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  $50 (6mo) or $100 (1yr) per client
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Recurring</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(revenueData.summary.projectedMonthlyRecurring)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  $4/month per active client
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {revenueData.summary.activeClientsCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueData.summary.monthlyRecurringClientsCount} paying monthly
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Projected Yearly</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(revenueData.summary.projectedYearlyTotal)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Upfront + recurring
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Breakdown */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <span>Revenue Breakdown</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Upfront vs recurring commission earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-foreground">Upfront Commissions</p>
                        <p className="text-sm text-muted-foreground">
                          Year 1 client payments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(revenueData.summary.totalUpfrontCommission)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {revenueData.summary.activeClientsCount} client{revenueData.summary.activeClientsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-foreground">Recurring Commissions</p>
                        <p className="text-sm text-muted-foreground">
                          Year 2+ monthly payments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(revenueData.summary.totalMonthlyCommission)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {revenueData.summary.monthlyRecurringClientsCount} recurring
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Total Earnings</p>
                      <p className="text-sm text-muted-foreground">
                        {revenueData.summary.transactionCount} transaction{revenueData.summary.transactionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(revenueData.summary.totalEarnings)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Earning Clients */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Top Earning Clients</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your highest revenue generating clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.topClients.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(client.upfront)} upfront + {formatCurrency(client.recurring)} recurring
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          {formatCurrency(client.total)}
                        </p>
                        <div className="flex space-x-1 mt-1">
                          {client.upfront > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Upfront
                            </Badge>
                          )}
                          {client.recurring > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="mt-8 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Recent Transactions</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your latest commission payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'upfront'
                          ? 'bg-green-900/20'
                          : 'bg-blue-900/20'
                      }`}>
                        {transaction.type === 'upfront' ? (
                          <DollarSign className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={transaction.type === 'upfront' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {transaction.type === 'upfront' ? 'Upfront' : 'Recurring'}
                        </Badge>
                      </div>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
