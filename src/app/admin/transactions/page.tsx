'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RefreshCw,
  Search,
} from 'lucide-react'
import type { Transaction, TransactionsResponse } from '@/types/admin'

type PeriodFilter = 'month' | 'year' | 'all'

// Wrap the main content in a component for Suspense boundary
function TransactionsContent() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [period, setPeriod] = useState<PeriodFilter>((searchParams.get('period') as PeriodFilter) || 'all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userType])

  // Update period from URL params
  useEffect(() => {
    const urlPeriod = searchParams.get('period') as PeriodFilter
    if (urlPeriod && ['month', 'year', 'all'].includes(urlPeriod)) {
      setPeriod(urlPeriod)
    }
  }, [searchParams])

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        period,
        page: page.toString(),
        ...(search && { search }),
      })
      const response = await fetch(`/api/admin/transactions?${params}`, { cache: 'no-store' })
      const payload: TransactionsResponse = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load transactions')
      }
      setTransactions(payload.data?.transactions || [])
      setTotal(payload.data?.total || 0)
      setPageSize(payload.data?.pageSize || 25)
    } catch (err) {
      console.error('[admin/transactions] Failed to fetch data', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDataLoading(false)
    }
  }, [period, page, search])

  useEffect(() => {
    if (loading || !user || userType !== 'admin') {
      return
    }
    fetchData()
  }, [loading, user, userType, fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1) // Reset to first page on new search
  }

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod)
    setPage(1) // Reset to first page on filter change
    // Update URL
    const params = new URLSearchParams()
    if (newPeriod !== 'all') params.set('period', newPeriod)
    router.push(`/admin/transactions${params.toString() ? `?${params}` : ''}`)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'upfront':
        return 'Upfront'
      case 'monthly':
        return 'Monthly'
      case 'reactivation':
        return 'Reactivation'
      default:
        return type
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || userType !== 'admin') {
    return null
  }

  const periodLabel = period === 'month'
    ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : period === 'year'
    ? new Date().getFullYear().toString()
    : 'All Time'

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/revenue">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Receipt className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Transactions</h1>
                <p className="text-sm text-muted-foreground">
                  View all commission transactions across PhotoVault.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-accent text-primary border-border">
              Admin Access
            </Badge>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Filters */}
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Period Filter */}
                  <div className="flex gap-2">
                    {(['month', 'year', 'all'] as PeriodFilter[]).map((p) => (
                      <Button
                        key={p}
                        variant={period === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePeriodChange(p)}
                      >
                        {p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'All Time'}
                      </Button>
                    ))}
                  </div>

                  {/* Search */}
                  <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by client email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    disabled={dataLoading}
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", dataLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  {periodLabel} Transactions
                </CardTitle>
                <CardDescription>
                  {total} total transaction{total !== 1 ? 's' : ''}{search && ` matching "${search}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-8 text-destructive">
                    <p>Failed to load transactions. Please try again.</p>
                    <Button variant="outline" onClick={fetchData} className="mt-4">
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Photographer</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-right">Total Paid</th>
                            <th className="px-4 py-3 text-right">PhotoVault</th>
                            <th className="px-4 py-3 text-right">Photographer</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {dataLoading ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                                Loading...
                              </td>
                            </tr>
                          ) : transactions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                No transactions found
                                {search && ` matching "${search}"`}
                                {period !== 'all' && ` for ${periodLabel}`}
                              </td>
                            </tr>
                          ) : (
                            transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 text-card-foreground whitespace-nowrap">
                                  {formatDate(tx.date)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                                  {tx.clientEmail}
                                </td>
                                <td className="px-4 py-3 text-card-foreground max-w-[150px] truncate">
                                  {tx.photographerName}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary" className="font-normal">
                                    {formatPaymentType(tx.paymentType)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-card-foreground text-right font-medium">
                                  {formatCurrency(tx.totalPaidCents)}
                                </td>
                                <td className="px-4 py-3 text-primary text-right font-medium">
                                  {formatCurrency(tx.photovaultCommissionCents)}
                                </td>
                                <td className="px-4 py-3 text-card-foreground text-right">
                                  {formatCurrency(tx.photographerCommissionCents)}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                                      tx.status === 'paid' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                      tx.status === 'refunded' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                      tx.status === 'pending' && "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || dataLoading}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || dataLoading}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

// Main page export with Suspense boundary for useSearchParams
export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  )
}
