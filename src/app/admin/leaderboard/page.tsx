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
import {
  ArrowLeft,
  Crown,
  Medal,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react'
import type { LeaderboardEntry, LeaderboardResponse } from '@/app/api/admin/leaderboard/route'

type PeriodFilter = 'month' | 'year' | 'all'

// Wrap the main content in a component for Suspense boundary
function LeaderboardContent() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [periodLabel, setPeriodLabel] = useState('')
  const [period, setPeriod] = useState<PeriodFilter>((searchParams.get('period') as PeriodFilter) || 'all')
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [loading, user, userType, router])

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
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/admin/leaderboard?${params}`, { cache: 'no-store' })
      const payload: LeaderboardResponse = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load leaderboard')
      }
      setEntries(payload.data?.entries || [])
      setPeriodLabel(payload.data?.period || '')
    } catch (err) {
      console.error('[admin/leaderboard] Failed to fetch data', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDataLoading(false)
    }
  }, [period])

  useEffect(() => {
    if (loading || !user || userType !== 'admin') {
      return
    }
    fetchData()
  }, [loading, user, userType, fetchData])

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod)
    // Update URL
    const params = new URLSearchParams()
    if (newPeriod !== 'all') params.set('period', newPeriod)
    router.push(`/admin/leaderboard${params.toString() ? `?${params}` : ''}`)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-medium w-5 text-center">{rank}</span>
    }
  }

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 2:
        return 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
      case 3:
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      default:
        return 'bg-card border-border'
    }
  }

  // Calculate totals
  const totalPhotovaultRevenue = entries.reduce((sum, e) => sum + e.photovaultRevenueCents, 0)
  const totalPhotographerEarnings = entries.reduce((sum, e) => sum + e.photographerEarningsCents, 0)

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

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-neutral-900">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/revenue">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Trophy className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Photographer Leaderboard</h1>
                <p className="text-sm text-muted-foreground">
                  Rankings by revenue generated for PhotoVault.
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
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Filters & Summary */}
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

                  {/* Summary Stats */}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">PhotoVault Revenue:</span>{' '}
                      <span className="font-semibold text-primary">{formatCurrency(totalPhotovaultRevenue)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Photographer Payouts:</span>{' '}
                      <span className="font-semibold text-card-foreground">{formatCurrency(totalPhotographerEarnings)}</span>
                    </div>
                  </div>

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

            {/* Leaderboard */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {periodLabel} Rankings
                </CardTitle>
                <CardDescription>
                  {entries.length} photographer{entries.length !== 1 ? 's' : ''} with revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-8 text-destructive">
                    <p>Failed to load leaderboard. Please try again.</p>
                    <Button variant="outline" onClick={fetchData} className="mt-4">
                      Retry
                    </Button>
                  </div>
                ) : dataLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No photographers with revenue{period !== 'all' && ` for ${periodLabel}`}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.photographerId}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border",
                          getRankBgClass(entry.rank)
                        )}
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* Name & Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-card-foreground truncate">
                            {entry.photographerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.galleryCount} {entry.galleryCount === 1 ? 'gallery' : 'galleries'} &bull; {entry.transactionCount} {entry.transactionCount === 1 ? 'transaction' : 'transactions'}
                          </p>
                        </div>

                        {/* Revenue Columns */}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">PhotoVault Rev</p>
                          <p className="font-semibold text-primary">{formatCurrency(entry.photovaultRevenueCents)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Photographer</p>
                          <p className="font-semibold text-card-foreground">{formatCurrency(entry.photographerEarningsCents)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  )
}
