'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Calculator,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Crown
} from 'lucide-react'
import Link from 'next/link'

export default function BusinessAnalyticsPage() {
  // Adjustable assumptions
  const [customersPerPhotographer, setCustomersPerPhotographer] = useState(15)
  const [averageStoragePerCustomer, setAverageStoragePerCustomer] = useState(20) // GB
  const [monthlyChurnRate, setMonthlyChurnRate] = useState(5) // percentage
  const [cacPerPhotographer, setCacPerPhotographer] = useState(10) // Customer Acquisition Cost

  // Editable fixed costs - tech stack and business decisions
  const [monthlyCosts, setMonthlyCosts] = useState({
    supabase: 25, // Pro plan (as you mentioned)
    vercel: 20,
    domain: 2,
    emailService: 30, // SendGrid/Postmark
    marketing: 250, // Your monthly ad spend
    tools: 0, // Free tier everything
    legal: 0, // Bootstrap
    staff: 0, // Just you
    misc: 50 // Buffer for unexpected
  })

  // Editable variable costs - based on usage and tech stack
  const [variableCosts, setVariableCosts] = useState({
    storagePerGB: 0.023, // AWS S3 Standard
    bandwidthPerCustomer: 0.18, // Estimated CDN costs
    paymentProcessingRate: 0.029, // Stripe percentage
    paymentProcessingFixed: 0.30, // Stripe fixed fee
    emailCostPerCustomer: 0.05,
    supportCostPerCustomer: 0.10
  })

  const TOTAL_FIXED_MONTHLY = Object.values(monthlyCosts).reduce((a, b) => a + b, 0)

  // Variable costs per customer (calculated from editable values)
  const storageCostPerCustomer = averageStoragePerCustomer * variableCosts.storagePerGB
  const bandwidthCostPerCustomer = variableCosts.bandwidthPerCustomer
  const paymentProcessingPerCustomer = (8 * variableCosts.paymentProcessingRate) + variableCosts.paymentProcessingFixed
  const emailCostPerCustomer = variableCosts.emailCostPerCustomer
  const supportCostPerCustomer = variableCosts.supportCostPerCustomer

  const TOTAL_VARIABLE_COST_PER_CUSTOMER = 
    storageCostPerCustomer + 
    bandwidthCostPerCustomer + 
    paymentProcessingPerCustomer + 
    emailCostPerCustomer + 
    supportCostPerCustomer

  // Revenue model
  const PHOTOGRAPHER_SUBSCRIPTION = 22 // per month
  const PHOTOVAULT_SHARE = 4 // 50% of customer payment
  const PHOTOGRAPHER_SHARE = 4 // 50% of customer payment

  // Calculate metrics for different photographer counts
  const photographerCounts = [25, 50, 100, 200, 500, 1000]

  const calculateMetrics = (photographerCount: number) => {
    const totalCustomers = photographerCount * customersPerPhotographer
    
    // Revenue
    const photographerSubscriptionRevenue = photographerCount * PHOTOGRAPHER_SUBSCRIPTION
    const customerPaymentRevenue = totalCustomers * PHOTOVAULT_SHARE
    const totalMonthlyRevenue = photographerSubscriptionRevenue + customerPaymentRevenue
    const totalAnnualRevenue = totalMonthlyRevenue * 12

    // Costs
    const variableCosts = totalCustomers * TOTAL_VARIABLE_COST_PER_CUSTOMER
    const totalMonthlyCosts = TOTAL_FIXED_MONTHLY + variableCosts
    const totalAnnualCosts = totalMonthlyCosts * 12

    // Profit
    const monthlyProfit = totalMonthlyRevenue - totalMonthlyCosts
    const annualProfit = monthlyProfit * 12
    const profitMargin = (monthlyProfit / totalMonthlyRevenue) * 100

    // Unit Economics
    const revenuePerCustomer = PHOTOVAULT_SHARE // $4/month
    const costPerCustomer = TOTAL_VARIABLE_COST_PER_CUSTOMER
    const profitPerCustomer = revenuePerCustomer - costPerCustomer
    const customerLTV = (profitPerCustomer * 12 * 3) // Assuming 3-year avg lifetime
    const ltv_cac_ratio = customerLTV / cacPerPhotographer

    // Photographer Economics
    const revenuePerPhotographer = (customersPerPhotographer * PHOTOGRAPHER_SHARE) - PHOTOGRAPHER_SUBSCRIPTION
    const photographerAnnualProfit = revenuePerPhotographer * 12

    // Business Valuation (SaaS multiples)
    const arrMultipleLow = 3
    const arrMultipleHigh = 7
    const valuationLow = totalAnnualRevenue * arrMultipleLow
    const valuationHigh = totalAnnualRevenue * arrMultipleHigh
    const valuationMid = (valuationLow + valuationHigh) / 2

    // Growth metrics
    const monthlyGrowthNeeded = photographerCount * (monthlyChurnRate / 100)
    const customersChurnedMonthly = totalCustomers * (monthlyChurnRate / 100)

    return {
      photographerCount,
      totalCustomers,
      photographerSubscriptionRevenue,
      customerPaymentRevenue,
      totalMonthlyRevenue,
      totalAnnualRevenue,
      variableCosts,
      totalMonthlyCosts,
      totalAnnualCosts,
      monthlyProfit,
      annualProfit,
      profitMargin,
      revenuePerCustomer,
      costPerCustomer,
      profitPerCustomer,
      customerLTV,
      ltv_cac_ratio,
      revenuePerPhotographer,
      photographerAnnualProfit,
      valuationLow,
      valuationMid,
      valuationHigh,
      monthlyGrowthNeeded,
      customersChurnedMonthly
    }
  }

  const allMetrics = photographerCounts.map(count => calculateMetrics(count))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (amount: number) => {
    return `${amount.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <Crown className="h-4 w-4 mr-2" />
              Admin Only
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Business Analytics & Projections</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Live profitability calculator, operating expenses, and business valuation metrics
            </p>
          </div>

          {/* Adjustable Assumptions */}
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                <span>Business Assumptions</span>
              </CardTitle>
              <CardDescription>
                Modify these values to see how metrics change
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customersPerPhotographer">Customers per Photographer</Label>
                  <Input
                    id="customersPerPhotographer"
                    type="number"
                    value={customersPerPhotographer}
                    onChange={(e) => setCustomersPerPhotographer(Number(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-slate-500">Average: 10-20</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storagePerCustomer">Avg Storage per Customer (GB)</Label>
                  <Input
                    id="storagePerCustomer"
                    type="number"
                    value={averageStoragePerCustomer}
                    onChange={(e) => setAverageStoragePerCustomer(Number(e.target.value))}
                    min="5"
                    max="100"
                  />
                  <p className="text-xs text-slate-500">Typical: 15-30 GB</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churnRate">Monthly Churn Rate (%)</Label>
                  <Input
                    id="churnRate"
                    type="number"
                    value={monthlyChurnRate}
                    onChange={(e) => setMonthlyChurnRate(Number(e.target.value))}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500">Good: 3-5%</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cac">CAC per Photographer ($)</Label>
                  <Input
                    id="cac"
                    type="number"
                    value={cacPerPhotographer}
                    onChange={(e) => setCacPerPhotographer(Number(e.target.value))}
                    min="0"
                    max="500"
                  />
                  <p className="text-xs text-slate-500">Your goal: $0-10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Configuration */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Cost Configuration</span>
              </CardTitle>
              <CardDescription>
                Update these when you change tech stack, upgrade plans, or adjust spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="fixed-costs" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fixed-costs">Fixed Costs (Monthly)</TabsTrigger>
                  <TabsTrigger value="variable-costs">Variable Costs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fixed-costs" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supabase-cost">Supabase Plan ($/month)</Label>
                      <Input
                        id="supabase-cost"
                        type="number"
                        value={monthlyCosts.supabase}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, supabase: Number(e.target.value)}))}
                        min="0"
                        step="1"
                      />
                      <p className="text-xs text-slate-500">Current: Pro ($25)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vercel-cost">Vercel Plan ($/month)</Label>
                      <Input
                        id="vercel-cost"
                        type="number"
                        value={monthlyCosts.vercel}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, vercel: Number(e.target.value)}))}
                        min="0"
                        step="1"
                      />
                      <p className="text-xs text-slate-500">Current: Pro ($20)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-service-cost">Email Service ($/month)</Label>
                      <Input
                        id="email-service-cost"
                        type="number"
                        value={monthlyCosts.emailService}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, emailService: Number(e.target.value)}))}
                        min="0"
                        step="1"
                      />
                      <p className="text-xs text-slate-500">SendGrid/Postmark</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marketing-cost">Marketing Budget ($/month)</Label>
                      <Input
                        id="marketing-cost"
                        type="number"
                        value={monthlyCosts.marketing}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, marketing: Number(e.target.value)}))}
                        min="0"
                        step="10"
                      />
                      <p className="text-xs text-slate-500">Your ad spend</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain-cost">Domain & DNS ($/month)</Label>
                      <Input
                        id="domain-cost"
                        type="number"
                        value={monthlyCosts.domain}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, domain: Number(e.target.value)}))}
                        min="0"
                        step="0.5"
                      />
                      <p className="text-xs text-slate-500">Annual cost ÷ 12</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="misc-cost">Miscellaneous ($/month)</Label>
                      <Input
                        id="misc-cost"
                        type="number"
                        value={monthlyCosts.misc}
                        onChange={(e) => setMonthlyCosts(prev => ({...prev, misc: Number(e.target.value)}))}
                        min="0"
                        step="5"
                      />
                      <p className="text-xs text-slate-500">Buffer for unexpected</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variable-costs" className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storage-per-gb">Storage Cost ($/GB/month)</Label>
                      <Input
                        id="storage-per-gb"
                        type="number"
                        value={variableCosts.storagePerGB}
                        onChange={(e) => setVariableCosts(prev => ({...prev, storagePerGB: Number(e.target.value)}))}
                        min="0"
                        step="0.001"
                      />
                      <p className="text-xs text-slate-500">AWS S3: $0.023</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bandwidth-per-customer">Bandwidth ($/customer/month)</Label>
                      <Input
                        id="bandwidth-per-customer"
                        type="number"
                        value={variableCosts.bandwidthPerCustomer}
                        onChange={(e) => setVariableCosts(prev => ({...prev, bandwidthPerCustomer: Number(e.target.value)}))}
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500">CDN costs</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-rate">Payment Processing Rate (%)</Label>
                      <Input
                        id="payment-rate"
                        type="number"
                        value={variableCosts.paymentProcessingRate * 100}
                        onChange={(e) => setVariableCosts(prev => ({...prev, paymentProcessingRate: Number(e.target.value) / 100}))}
                        min="0"
                        max="10"
                        step="0.1"
                      />
                      <p className="text-xs text-slate-500">Stripe: 2.9%</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-fixed">Payment Fixed Fee ($)</Label>
                      <Input
                        id="payment-fixed"
                        type="number"
                        value={variableCosts.paymentProcessingFixed}
                        onChange={(e) => setVariableCosts(prev => ({...prev, paymentProcessingFixed: Number(e.target.value)}))}
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500">Stripe: $0.30</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-per-customer">Email ($/customer/month)</Label>
                      <Input
                        id="email-per-customer"
                        type="number"
                        value={variableCosts.emailCostPerCustomer}
                        onChange={(e) => setVariableCosts(prev => ({...prev, emailCostPerCustomer: Number(e.target.value)}))}
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500">Notifications</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support-per-customer">Support ($/customer/month)</Label>
                      <Input
                        id="support-per-customer"
                        type="number"
                        value={variableCosts.supportCostPerCustomer}
                        onChange={(e) => setVariableCosts(prev => ({...prev, supportCostPerCustomer: Number(e.target.value)}))}
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500">AI support</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projections">Projections</TabsTrigger>
              <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
              <TabsTrigger value="valuation">Valuation</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Fixed Costs</div>
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(TOTAL_FIXED_MONTHLY)}/mo</div>
                    <div className="text-sm text-slate-500 mt-1">{formatCurrency(TOTAL_FIXED_MONTHLY * 12)}/year</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Variable Cost per Customer</div>
                    <div className="text-3xl font-bold text-orange-600">{formatCurrency(TOTAL_VARIABLE_COST_PER_CUSTOMER)}/mo</div>
                    <div className="text-sm text-slate-500 mt-1">Storage + Processing + Support</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Profit per Customer</div>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)}/mo</div>
                    <div className="text-sm text-slate-500 mt-1">{formatPercent(((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) / PHOTOVAULT_SHARE) * 100)} margin</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Revenue per Customer (PhotoVault 50%):</span>
                      <span className="font-semibold">{formatCurrency(PHOTOVAULT_SHARE)}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Customer:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(TOTAL_VARIABLE_COST_PER_CUSTOMER)}/month</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span>Net Profit per Customer:</span>
                      <span className="font-bold text-green-600">{formatCurrency(PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue per Photographer (subscription):</span>
                      <span className="font-semibold">{formatCurrency(PHOTOGRAPHER_SUBSCRIPTION)}/month</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Break-even Customer Count:</span>
                      <span className="font-semibold">{Math.ceil(TOTAL_FIXED_MONTHLY / (PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER))} customers</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break-even Photographer Count:</span>
                      <span className="font-semibold">{Math.ceil(Math.ceil(TOTAL_FIXED_MONTHLY / (PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)) / customersPerPhotographer)} photographers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projections Tab */}
            <TabsContent value="projections" className="space-y-6">
              {allMetrics.map((metrics, index) => (
                <Card key={index} className={metrics.monthlyProfit > 0 ? 'border-2 border-green-200 dark:border-green-800' : 'border-2 border-red-200 dark:border-red-800'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">
                        {metrics.photographerCount} Photographers
                      </CardTitle>
                      <Badge className={metrics.monthlyProfit > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {metrics.monthlyProfit > 0 ? 'PROFITABLE ✓' : 'LOSS ✗'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {metrics.totalCustomers.toLocaleString()} total customers ({customersPerPhotographer} per photographer)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Revenue Column */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-green-600 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Revenue
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Photographer Subscriptions:</span>
                            <span className="font-semibold">{formatCurrency(metrics.photographerSubscriptionRevenue)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">({metrics.photographerCount} × $22)</span>
                            <span></span>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span>Customer Payments (50%):</span>
                            <span className="font-semibold">{formatCurrency(metrics.customerPaymentRevenue)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">({metrics.totalCustomers.toLocaleString()} × $4)</span>
                            <span></span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total Monthly:</span>
                            <span className="font-bold text-green-600">{formatCurrency(metrics.totalMonthlyRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Total Annual:</span>
                            <span className="font-bold text-green-600">{formatCurrency(metrics.totalAnnualRevenue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Costs & Profit Column */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-red-600 flex items-center">
                          <DollarSign className="h-5 w-5 mr-2" />
                          Costs & Profit
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Fixed Costs:</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(TOTAL_FIXED_MONTHLY)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Variable Costs (Total):</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(metrics.variableCosts)}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">({metrics.totalCustomers.toLocaleString()} customers × ${TOTAL_VARIABLE_COST_PER_CUSTOMER.toFixed(2)} per customer)</span>
                            <span></span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total Costs:</span>
                            <span className="font-bold text-red-600">-{formatCurrency(metrics.totalMonthlyCosts)}</span>
                          </div>
                          <Separator />
                          <div className={`flex justify-between text-xl p-3 rounded-lg ${metrics.monthlyProfit > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <span className="font-bold">NET PROFIT:</span>
                            <span className={`font-bold ${metrics.monthlyProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(metrics.monthlyProfit)}/mo
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Annual Profit:</span>
                            <span className={`font-bold ${metrics.annualProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(metrics.annualProfit)}/year
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profit Margin:</span>
                            <span className="font-semibold">{formatPercent(metrics.profitMargin)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <Separator className="my-4" />
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">MRR (Monthly Recurring Revenue)</div>
                        <div className="font-bold">{formatCurrency(metrics.totalMonthlyRevenue)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">ARR (Annual Recurring Revenue)</div>
                        <div className="font-bold">{formatCurrency(metrics.totalAnnualRevenue)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded">
                        <div className="text-xs text-slate-500 mb-1">Business Valuation (Mid)</div>
                        <div className="font-bold text-purple-600">{formatCurrency(metrics.valuationMid)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Unit Economics Tab */}
            <TabsContent value="unit-economics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-6 w-6 text-blue-600" />
                    <span>Customer Unit Economics</span>
                  </CardTitle>
                  <CardDescription>Per customer profitability metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold">Revenue per Customer</h3>
                        <div className="text-3xl font-bold text-green-600">{formatCurrency(PHOTOVAULT_SHARE)}/mo</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Customer pays $8/mo, you keep 50%
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold">Cost per Customer</h3>
                        <div className="text-3xl font-bold text-red-600">{formatCurrency(TOTAL_VARIABLE_COST_PER_CUSTOMER)}/mo</div>
                        <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                          <div>• Storage: ${storageCostPerCustomer.toFixed(2)}</div>
                          <div>• Bandwidth: ${bandwidthCostPerCustomer.toFixed(2)}</div>
                          <div>• Payment processing: ${paymentProcessingPerCustomer.toFixed(2)}</div>
                          <div>• Email: ${emailCostPerCustomer.toFixed(2)}</div>
                          <div>• Support: ${supportCostPerCustomer.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Profit per Customer</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)}/mo
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Customer LTV (3-year avg)</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) * 12 * 3)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">LTV:CAC Ratio</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {(((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) * 12 * 3) / cacPerPhotographer).toFixed(1)}:1
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {(((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) * 12 * 3) / cacPerPhotographer) > 3 ? '✓ Excellent (>3:1)' : '⚠ Needs improvement'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-purple-600" />
                    <span>Photographer Unit Economics</span>
                  </CardTitle>
                  <CardDescription>What photographers earn with PhotoVault</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3">Photographer with {customersPerPhotographer} Customers</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Commission revenue:</span>
                          <span className="text-green-600 font-semibold">+{formatCurrency(customersPerPhotographer * PHOTOGRAPHER_SHARE)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform fee:</span>
                          <span className="text-red-600 font-semibold">-{formatCurrency(PHOTOGRAPHER_SUBSCRIPTION)}/mo</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold">Net earnings:</span>
                          <span className={`font-bold ${(customersPerPhotographer * PHOTOGRAPHER_SHARE - PHOTOGRAPHER_SUBSCRIPTION) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(customersPerPhotographer * PHOTOGRAPHER_SHARE - PHOTOGRAPHER_SUBSCRIPTION)}/mo
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual earnings:</span>
                          <span className="font-bold">
                            {formatCurrency((customersPerPhotographer * PHOTOGRAPHER_SHARE - PHOTOGRAPHER_SUBSCRIPTION) * 12)}/year
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>Break-even for photographer:</strong> {Math.ceil(PHOTOGRAPHER_SUBSCRIPTION / PHOTOGRAPHER_SHARE)} active customers
                      <div className="text-xs mt-1">
                        (${PHOTOGRAPHER_SUBSCRIPTION} platform fee ÷ ${PHOTOGRAPHER_SHARE} commission per customer)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Valuation Tab */}
            <TabsContent value="valuation" className="space-y-6">
              {allMetrics.map((metrics, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{metrics.photographerCount} Photographers - Business Valuation</CardTitle>
                    <CardDescription>{metrics.totalCustomers.toLocaleString()} customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">MRR</div>
                          <div className="text-xl font-bold">{formatCurrency(metrics.totalMonthlyRevenue)}</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">ARR</div>
                          <div className="text-xl font-bold">{formatCurrency(metrics.totalAnnualRevenue)}</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">LTV:CAC</div>
                          <div className="text-xl font-bold">{metrics.ltv_cac_ratio.toFixed(1)}:1</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Margin</div>
                          <div className="text-xl font-bold">{formatPercent(metrics.profitMargin)}</div>
                        </div>
                      </div>

                      {/* Valuation Range */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                        <h3 className="font-semibold mb-4 text-lg">Business Valuation (SaaS Multiples)</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Conservative (3x ARR):</span>
                            <span className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.valuationLow)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Market Rate (5x ARR):</span>
                            <span className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.valuationMid)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Premium (7x ARR):</span>
                            <span className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.valuationHigh)}</span>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                          *SaaS businesses typically valued at 3-7x ARR depending on growth rate, margins, and retention
                        </div>
                      </div>

                      {/* Additional Metrics */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-sm">Customer Metrics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Customer LTV:</span>
                              <span className="font-semibold">{formatCurrency(metrics.customerLTV)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>CAC Payback Period:</span>
                              <span className="font-semibold">
                                {(cacPerPhotographer / (PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)).toFixed(1)} months
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Monthly Churn:</span>
                              <span className="font-semibold">{metrics.customersChurnedMonthly.toFixed(0)} customers</span>
                            </div>
                          </div>
                        </div>
                        <div className="border p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 text-sm">Photographer Economics</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Avg Monthly Earnings:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(metrics.revenuePerPhotographer)}/mo
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Annual Earnings:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(metrics.photographerAnnualProfit)}/year
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2">
                              With {customersPerPhotographer} active clients
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Operating Expenses Breakdown</CardTitle>
                  <CardDescription>Fixed costs that don&apos;t scale with customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Supabase Plan</div>
                        <div className="text-xs text-slate-500">Database + Storage + Auth</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.supabase)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Vercel Plan</div>
                        <div className="text-xs text-slate-500">Hosting + CDN + Deployment</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.vercel)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Email Service</div>
                        <div className="text-xs text-slate-500">SendGrid/Postmark for notifications</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.emailService)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Marketing Budget</div>
                        <div className="text-xs text-slate-500">Your monthly ad spend</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.marketing)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Domain & DNS</div>
                        <div className="text-xs text-slate-500">Domain registration</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.domain)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Miscellaneous</div>
                        <div className="text-xs text-slate-500">Buffer for unexpected costs</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(monthlyCosts.misc)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-3 bg-slate-50 dark:bg-slate-800 px-4 rounded-lg">
                      <div className="font-bold text-lg">Total Fixed Monthly Costs</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(TOTAL_FIXED_MONTHLY)}</div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <div className="font-bold">Total Fixed Annual Costs</div>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(TOTAL_FIXED_MONTHLY * 12)}</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold mb-2">Cost Management & Future Planning</h3>
                    <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                      <li>• <strong>No staff costs</strong> - Automated with AI (you + Claude)</li>
                      <li>• <strong>No office</strong> - Remote/home office</li>
                      <li>• <strong>No legal fees</strong> - Bootstrapped approach</li>
                      <li>• <strong>Scalable marketing</strong> - Adjust budget based on growth</li>
                      <li>• <strong>Tech stack flexibility</strong> - Update costs when upgrading plans</li>
                      <li>• <strong>Future additions</strong> - Add new services (analytics, monitoring, etc.) to misc costs</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variable Costs (Per Customer/Month)</CardTitle>
                  <CardDescription>Costs that scale with each customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Storage ({averageStoragePerCustomer} GB)</div>
                        <div className="text-xs text-slate-500">@ ${variableCosts.storagePerGB}/GB</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(storageCostPerCustomer)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Bandwidth/CDN</div>
                        <div className="text-xs text-slate-500">Photo downloads, viewing</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(bandwidthCostPerCustomer)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Payment Processing</div>
                        <div className="text-xs text-slate-500">{(variableCosts.paymentProcessingRate * 100)}% + ${variableCosts.paymentProcessingFixed} on $8</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(paymentProcessingPerCustomer)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Email Notifications</div>
                        <div className="text-xs text-slate-500">Payment reminders, updates</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(emailCostPerCustomer)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <div className="font-semibold">Support/Operations</div>
                        <div className="text-xs text-slate-500">AI-assisted customer support</div>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(supportCostPerCustomer)}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-3 bg-slate-50 dark:bg-slate-800 px-4 rounded-lg">
                      <div className="font-bold text-lg">Total per Customer</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(TOTAL_VARIABLE_COST_PER_CUSTOMER)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Key Insights */}
          <Card className="mt-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-green-600" />
                <span>Key Insights & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Ultra-Low CAC is Your Superpower</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      At $0-10 CAC, you have a {(((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) * 12 * 3) / 10).toFixed(0)}:1 LTV:CAC ratio. This is exceptional (typical SaaS target is 3:1).
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Profitable at Small Scale</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Break-even at just {Math.ceil(TOTAL_FIXED_MONTHLY / (PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER))} customers (~{Math.ceil(Math.ceil(TOTAL_FIXED_MONTHLY / (PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)) / customersPerPhotographer)} photographers). Profitable quickly.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Strong Unit Economics</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER)}/month profit per customer = {formatPercent(((PHOTOVAULT_SHARE - TOTAL_VARIABLE_COST_PER_CUSTOMER) / PHOTOVAULT_SHARE) * 100)} margin. Storage is cheap!
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Focus on Volume</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      With lean operations and no staff, your biggest opportunity is scaling photographer count. Each photographer brings {customersPerPhotographer} customers = {formatCurrency((customersPerPhotographer * PHOTOVAULT_SHARE - customersPerPhotographer * TOTAL_VARIABLE_COST_PER_CUSTOMER))}/mo profit.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">First Milestone: 100 Photographers</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      At 100 photographers × {customersPerPhotographer} customers = 1,500 customers = {formatCurrency(calculateMetrics(100).monthlyProfit)}/month profit ({formatCurrency(calculateMetrics(100).annualProfit)}/year). Business valued at ~{formatCurrency(calculateMetrics(100).valuationMid)}.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

