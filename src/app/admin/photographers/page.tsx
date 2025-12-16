'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Camera,
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  ImageIcon,
} from 'lucide-react'
import AccessGuard from '@/components/AccessGuard'
import type { Photographer, PhotographersResponse } from '@/types/admin'

export default function PhotographersPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalPhotographers: number
    activeCount: number
    totalGalleries: number
    totalRevenueCents: number
  } | null>(null)

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [loading, user, userType, router])

  const fetchData = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
      })
      const response = await fetch(`/api/admin/photographers?${params}`, { cache: 'no-store' })
      const payload: PhotographersResponse = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load photographers')
      }

      setPhotographers(payload.data?.photographers || [])
      setTotal(payload.data?.total || 0)
      if (payload.data?.stats) {
        setStats(payload.data.stats)
      }
    } catch (err) {
      console.error('[admin/photographers] Failed to fetch data', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setDataLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    if (loading || !user || userType !== 'admin') return
    fetchData()
  }, [loading, user, userType, fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </Badge>
        )
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  // Platform-wide stats from API (not calculated from current page)
  const activeCount = stats?.activeCount ?? 0
  const totalRevenue = stats?.totalRevenueCents ?? 0
  const totalGalleries = stats?.totalGalleries ?? 0

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Camera className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Photographers</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all photographers on PhotoVault
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
            {/* Error State */}
            {error && (
              <Card className="border border-destructive/50 bg-destructive/10">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Photographers</p>
                      <p className="text-2xl font-bold">{total}</p>
                    </div>
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold">{activeCount}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Galleries</p>
                      <p className="text-2xl font-bold">{totalGalleries}</p>
                    </div>
                    <ImageIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue (Page)</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Search */}
                  <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
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
                    <RefreshCw className={`mr-2 h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Photographers Table */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Photographers
                </CardTitle>
                <CardDescription>
                  {total} total photographer{total !== 1 ? 's' : ''}{search && ` matching "${search}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Loading photographers...</span>
                  </div>
                ) : photographers.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No photographers yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {search
                        ? `No photographers found matching "${search}"`
                        : 'Photographers will appear here once they sign up.'}
                    </p>
                    {search && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearch('')
                          setSearchInput('')
                        }}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-center">Galleries</TableHead>
                            <TableHead className="text-center">Clients</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {photographers.map((photographer) => (
                            <TableRow key={photographer.id}>
                              <TableCell className="font-medium">
                                {photographer.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                {photographer.email}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {photographer.city && photographer.state
                                  ? `${photographer.city}, ${photographer.state}`
                                  : photographer.city || photographer.state || '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {photographer.galleryCount}
                              </TableCell>
                              <TableCell className="text-center">
                                {photographer.clientCount}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(photographer.totalRevenueCents)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(photographer.paymentStatus)}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {formatDate(photographer.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || dataLoading}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <span className="flex items-center text-sm text-muted-foreground px-2">
                            Page {page} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
