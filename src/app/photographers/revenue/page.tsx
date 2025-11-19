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
    monthlyUpfrontCommission: number
    monthlyRecurringCommission: number
    yearlyUpfrontCommission: number
    yearlyRecurringCommission: number
    activeClientsCount: number
    monthlyRecurringClientsCount: number
    projectedMonthlyRecurring: number
    projectedYearlyRecurring: number
    projectedYearlyTotal: number
  }
  recentTransactions: Array<{
    id: string
    clientName: string
    amount: number
    type: 'upfront' | 'recurring'
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Redirecting...</p>
        </div>
      </div>
    )
  }

  const fetchRevenueData = async () => {
    try {
      // Simulate API call - in real implementation, this would call the API
      setTimeout(() => {
        setRevenueData({
          summary: {
            totalUpfrontCommission: 1250, // $50 × 25 clients
            totalMonthlyCommission: 480, // $4 × 120 months total
            monthlyUpfrontCommission: 200, // $50 × 4 new clients this month
            monthlyRecurringCommission: 96, // $4 × 24 recurring clients
            yearlyUpfrontCommission: 2400, // $50 × 48 clients this year
            yearlyRecurringCommission: 1152, // $4 × 288 months this year
            activeClientsCount: 48,
            monthlyRecurringClientsCount: 24,
            projectedMonthlyRecurring: 96,
            projectedYearlyRecurring: 1152,
            projectedYearlyTotal: 3552 // $2400 upfront + $1152 recurring
          },
          recentTransactions: [
            {
              id: '1',
              clientName: 'Sarah & John Smith',
              amount: 50,
              type: 'upfront',
              date: '2024-10-15',
              status: 'paid'
            },
            {
              id: '2',
              clientName: 'Mike Johnson Family',
              amount: 4,
              type: 'recurring',
              date: '2024-10-01',
              status: 'paid'
            },
            {
              id: '3',
              clientName: 'Emma & David Wedding',
              amount: 50,
              type: 'upfront',
              date: '2024-09-28',
              status: 'paid'
            },
            {
              id: '4',
              clientName: 'Lisa Martinez Family',
              amount: 4,
              type: 'recurring',
              date: '2024-09-15',
              status: 'paid'
            },
            {
              id: '5',
              clientName: 'Robert Chen Portrait',
              amount: 50,
              type: 'upfront',
              date: '2024-09-10',
              status: 'paid'
            }
          ],
          topClients: [
            {
              name: 'Sarah & John Smith',
              total: 104,
              upfront: 50,
              recurring: 54
            },
            {
              name: 'Mike Johnson Family',
              total: 92,
              upfront: 50,
              recurring: 42
            },
            {
              name: 'Emma & David Wedding',
              total: 86,
              upfront: 50,
              recurring: 36
            },
            {
              name: 'Lisa Martinez Family',
              total: 74,
              upfront: 50,
              recurring: 24
            },
            {
              name: 'Robert Chen Portrait',
              total: 62,
              upfront: 50,
              recurring: 12
            }
          ]
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching revenue data:', error)
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
    csv += `Total Upfront Commission,${revenueData.summary.totalUpfrontCommission}\n`
    csv += `Total Monthly Commission,${revenueData.summary.totalMonthlyCommission}\n`
    csv += `Active Clients,${revenueData.summary.activeClientsCount}\n`
    csv += `Monthly Recurring Clients,${revenueData.summary.monthlyRecurringClientsCount}\n`
    csv += `Projected Monthly Recurring,${revenueData.summary.projectedMonthlyRecurring}\n`
    csv += `Projected Yearly Total,${revenueData.summary.projectedYearlyTotal}\n\n`

    csv += 'Recent Transactions\n'
    csv += 'Date,Client,Type,Amount,Status\n'
    revenueData.recentTransactions.forEach(transaction => {
      csv += `${transaction.date},${transaction.clientName},${transaction.type},${transaction.amount},${transaction.status}\n`
    })

    csv += '\nTop Clients\n'
    csv += 'Client,Total,Upfront,Recurring\n'
    revenueData.topClients.forEach(client => {
      csv += `${client.name},${client.total},${client.upfront},${client.recurring}\n`
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  if (!revenueData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Revenue Data</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              No commission data available yet. Start inviting clients to begin earning.
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
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
              <span className="text-xl font-bold">Revenue Dashboard</span>
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
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Upfront</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenueData.summary.totalUpfrontCommission)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  $50 (6mo) or $100 (1yr) per client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Monthly Recurring</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(revenueData.summary.projectedMonthlyRecurring)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  $4/month per active client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Clients</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {revenueData.summary.activeClientsCount}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {revenueData.summary.monthlyRecurringClientsCount} paying monthly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Projected Yearly</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(revenueData.summary.projectedYearlyTotal)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Upfront + recurring
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  <span>Revenue Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Upfront vs recurring commission earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Upfront Commissions</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          $50 (6 months) or $100 (1 year)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(revenueData.summary.totalUpfrontCommission)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {Math.round(revenueData.summary.totalUpfrontCommission / 50)} clients
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Recurring Commissions</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          $4/month per active client
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(revenueData.summary.totalMonthlyCommission)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {revenueData.summary.monthlyRecurringClientsCount} clients
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">Total Commission Earned</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        All time earnings
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(revenueData.summary.totalUpfrontCommission + revenueData.summary.totalMonthlyCommission)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Earning Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Top Earning Clients</span>
                </CardTitle>
                <CardDescription>
                  Your highest revenue generating clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.topClients.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
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
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Recent Transactions</span>
              </CardTitle>
              <CardDescription>
                Your latest commission payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'upfront' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        {transaction.type === 'upfront' ? (
                          <DollarSign className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.clientName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
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
