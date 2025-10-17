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
  TrendingDown,
  Users,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface AnalyticsData {
  monthlyBreakdown: Array<{
    month: string
    upfront: number
    recurring: number
    total: number
    newClients: number
    activeClients: number
  }>
  growthMetrics: {
    revenueGrowth: number
    clientGrowth: number
    recurringGrowth: number
  }
  totals: {
    totalRevenue: number
    totalUpfront: number
    totalRecurring: number
    totalNewClients: number
    averageMonthlyRevenue: number
  }
  projections: {
    nextMonth: number
    next3Months: number
    nextYear: number
    recurringRunRate: number
  }
  retentionMetrics: {
    totalClients: number
    activeClients: number
    avgClientLifetime: number
    avgClientValue: number
  }
}

export default function AnalyticsPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('12')

  useEffect(() => {
    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }
    fetchAnalyticsData()
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

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      // Simulate API call - in real implementation, this would call the API
      setTimeout(() => {
        setAnalyticsData({
          monthlyBreakdown: [
            { month: 'Jan 2024', upfront: 150, recurring: 88, total: 238, newClients: 3, activeClients: 22 },
            { month: 'Feb 2024', upfront: 200, recurring: 92, total: 292, newClients: 4, activeClients: 23 },
            { month: 'Mar 2024', upfront: 250, recurring: 96, total: 346, newClients: 5, activeClients: 24 },
            { month: 'Apr 2024', upfront: 300, recurring: 100, total: 400, newClients: 6, activeClients: 25 },
            { month: 'May 2024', upfront: 350, recurring: 104, total: 454, newClients: 7, activeClients: 26 },
            { month: 'Jun 2024', upfront: 400, recurring: 108, total: 508, newClients: 8, activeClients: 27 },
            { month: 'Jul 2024', upfront: 450, recurring: 112, total: 562, newClients: 9, activeClients: 28 },
            { month: 'Aug 2024', upfront: 500, recurring: 116, total: 616, newClients: 10, activeClients: 29 },
            { month: 'Sep 2024', upfront: 450, recurring: 120, total: 570, newClients: 9, activeClients: 30 },
            { month: 'Oct 2024', upfront: 400, recurring: 124, total: 524, newClients: 8, activeClients: 31 },
            { month: 'Nov 2024', upfront: 350, recurring: 128, total: 478, newClients: 7, activeClients: 32 },
            { month: 'Dec 2024', upfront: 300, recurring: 132, total: 432, newClients: 6, activeClients: 33 }
          ],
          growthMetrics: {
            revenueGrowth: 12.5,
            clientGrowth: 8.3,
            recurringGrowth: 15.2
          },
          totals: {
            totalRevenue: 5420,
            totalUpfront: 4100,
            totalRecurring: 1320,
            totalNewClients: 82,
            averageMonthlyRevenue: 452
          },
          projections: {
            nextMonth: 485,
            next3Months: 1455,
            nextYear: 5820,
            recurringRunRate: 1584
          },
          retentionMetrics: {
            totalClients: 82,
            activeClients: 76,
            avgClientLifetime: 145,
            avgClientValue: 66
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
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

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Analytics Data</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Start earning commissions to see detailed analytics.
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
              <Link href="/photographers/revenue">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Revenue
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Revenue Analytics</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Period Selector */}
          <div className="mb-8">
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="3">Last 3 Months</TabsTrigger>
                <TabsTrigger value="6">Last 6 Months</TabsTrigger>
                <TabsTrigger value="12">Last 12 Months</TabsTrigger>
                <TabsTrigger value="24">Last 24 Months</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Growth Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenue Growth</p>
                    <p className={`text-2xl font-bold ${analyticsData.growthMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analyticsData.growthMetrics.revenueGrowth)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    analyticsData.growthMetrics.revenueGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {analyticsData.growthMetrics.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  vs previous month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Client Growth</p>
                    <p className={`text-2xl font-bold ${analyticsData.growthMetrics.clientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analyticsData.growthMetrics.clientGrowth)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    analyticsData.growthMetrics.clientGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {analyticsData.growthMetrics.clientGrowth >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  new clients this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recurring Growth</p>
                    <p className={`text-2xl font-bold ${analyticsData.growthMetrics.recurringGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(analyticsData.growthMetrics.recurringGrowth)}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    analyticsData.growthMetrics.recurringGrowth >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {analyticsData.growthMetrics.recurringGrowth >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  passive income growth
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Monthly Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <span>Monthly Revenue Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Upfront vs recurring commission trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyBreakdown.slice(-6).map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <span className="font-bold">{formatCurrency(month.total)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-green-100 dark:bg-green-900/20 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(month.upfront / month.total) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex-1 bg-blue-100 dark:bg-blue-900/20 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(month.recurring / month.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Upfront: {formatCurrency(month.upfront)}</span>
                        <span>Recurring: {formatCurrency(month.recurring)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Revenue Projections</span>
                </CardTitle>
                <CardDescription>
                  Based on current trends and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Next Month</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Projected revenue</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(analyticsData.projections.nextMonth)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Next 3 Months</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Quarterly projection</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(analyticsData.projections.next3Months)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">Next Year</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Annual projection</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(analyticsData.projections.nextYear)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">Recurring Run Rate</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Annual recurring revenue</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(analyticsData.projections.recurringRunRate)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Retention Metrics */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Client Retention & Lifetime Value</span>
              </CardTitle>
              <CardDescription>
                Understanding your client base and their value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analyticsData.retentionMetrics.totalClients}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analyticsData.retentionMetrics.activeClients}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Clients</p>
                  <Badge variant="outline" className="mt-1">
                    {((analyticsData.retentionMetrics.activeClients / analyticsData.retentionMetrics.totalClients) * 100).toFixed(1)}% retention
                  </Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analyticsData.retentionMetrics.avgClientLifetime.toFixed(0)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Avg Lifetime (days)</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {formatCurrency(analyticsData.retentionMetrics.avgClientValue)}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Avg Client Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
