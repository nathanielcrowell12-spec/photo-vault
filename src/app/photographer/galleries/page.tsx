'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Loader2,
  Send,
  MapPin,
  Users,
  Trash2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GallerySearchBar } from '@/components/GallerySearchBar'
import { GalleryFilters, GalleryFiltersState } from '@/components/GalleryFilters'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description: string | null
  photo_count: number
  created_at: string
  session_date: string | null
  event_date: string | null
  location: string | null
  people: string[] | null
  event_type: string | null
  payment_status: string | null
  billing_mode: string | null
  total_amount: number | null
  payment_option_id: string | null
  relevance?: number
  client: {
    id: string
    name: string
    email: string
  } | null
}

export default function GalleriesPage() {
  // Use custom hook for auth redirect (handles Next.js 15 HMR correctly)
  const { user, userType, loading: authLoading, hasAccess } = useAuthRedirect({
    requiredType: 'photographer',
  })
  const router = useRouter()
  const { toast } = useToast()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<GalleryFiltersState>({
    eventType: null,
    year: null,
    location: null,
    person: null
  })
  const [filterOptions, setFilterOptions] = useState({
    years: [] as number[],
    locations: [] as string[],
    people: [] as string[]
  })
  const [sendingNotification, setSendingNotification] = useState<string | null>(null)
  const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isInitialLoad = useRef(true)

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/photographer/galleries/filter-options')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions({
          years: data.years || [],
          locations: data.locations || [],
          people: data.people || []
        })
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  // Search galleries using API
  const searchGalleries = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Build search request
      const searchRequest: Record<string, unknown> = {}
      if (searchQuery) searchRequest.query = searchQuery
      if (filters.eventType) searchRequest.event_type = filters.eventType
      if (filters.location) searchRequest.location = filters.location
      if (filters.person) searchRequest.people = [filters.person]
      if (filters.year) {
        searchRequest.event_date_start = `${filters.year}-01-01`
        searchRequest.event_date_end = `${filters.year}-12-31`
      }

      const response = await fetch('/api/photographer/galleries/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchRequest)
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setGalleries(data.galleries || [])
    } catch (err) {
      console.error('Error searching galleries:', err)
      // Fallback to direct query
      await fetchGalleriesDirect()
    } finally {
      setLoading(false)
    }
  }, [user?.id, searchQuery, filters])

  // Direct query fallback
  const fetchGalleriesDirect = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('photo_galleries')
        .select(`
          id,
          gallery_name,
          gallery_description,
          photo_count,
          created_at,
          session_date,
          event_date,
          location,
          people,
          event_type,
          payment_status,
          billing_mode,
          total_amount,
          payment_option_id,
          client:clients(id, name, email)
        `)
        .eq('photographer_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      const transformedData = (data || []).map(gallery => ({
        ...gallery,
        client: Array.isArray(gallery.client) ? gallery.client[0] || null : gallery.client
      }))
      setGalleries(transformedData)
    } catch (err) {
      console.error('Error fetching galleries:', err)
    }
  }

  // Initial data load when authenticated (auth redirect handled by useAuthRedirect hook)
  useEffect(() => {
    if (!hasAccess || authLoading) return
    fetchFilterOptions()
    searchGalleries()
    // Mark initial load complete after first data fetch
    isInitialLoad.current = false
    // Callbacks are stable via useCallback - including them would cause HMR loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, authLoading])

  // Re-search when search or filters change (skip initial mount - first useEffect handles it)
  useEffect(() => {
    // Skip on initial load - the first useEffect handles initial data fetch
    if (isInitialLoad.current) return
    if (hasAccess && !authLoading) {
      searchGalleries()
    }
    // searchGalleries is memoized with its own deps - including it would cause HMR loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters, hasAccess, authLoading])

  const handleResendNotification = async (galleryId: string, clientEmail: string | undefined) => {
    if (!clientEmail) {
      toast({
        title: 'No client email',
        description: 'This gallery does not have a client email address.',
        variant: 'destructive'
      })
      return
    }

    try {
      setSendingNotification(galleryId)
      const response = await fetch('/api/email/gallery-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.code === 'PHOTOGRAPHER_STRIPE_MISSING'
          ? 'You must complete your payment setup before sending gallery notifications. Please connect your Stripe account in Settings.'
          : data.message || data.error || 'Failed to send notification'
        throw new Error(errorMessage)
      }

      toast({
        title: 'Notification sent',
        description: `Gallery ready email sent to ${clientEmail}`,
      })
    } catch (err: any) {
      console.error('Error sending notification:', err)
      toast({
        title: 'Payment setup required',
        description: err.message || 'Could not send notification email',
        variant: 'destructive'
      })
    } finally {
      setSendingNotification(null)
    }
  }

  const handleDeleteGallery = async (gallery: Gallery) => {
    const originalGalleries = galleries
    setIsDeleting(true)

    // Optimistic update
    setGalleries(prev => prev.filter(g => g.id !== gallery.id))

    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete gallery')
      }

      toast({
        title: 'Gallery deleted',
        description: `"${gallery.gallery_name}" has been moved to Recently Deleted. You have 30 days to restore it.`,
      })

      setShowDeleteDialog(false)
      setDeletingGallery(null)
    } catch (error) {
      console.error('Error deleting gallery:', error)
      // Rollback on error
      setGalleries(originalGalleries)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete gallery. Please try again.'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getPaymentStatusBadge = (gallery: Gallery) => {
    if (!gallery.payment_option_id || gallery.payment_option_id === 'shoot_only') {
      return <Badge variant="outline">Shoot Only</Badge>
    }

    switch (gallery.payment_status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
      default:
        return <Badge variant="outline">No Payment</Badge>
    }
  }

  const formatCurrency = (cents: number | null) => {
    if (!cents) return '$0'
    return `$${(cents / 100).toFixed(0)}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/photographer/dashboard">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Galleries</h1>
              <p className="text-muted-foreground">Manage your photo galleries</p>
            </div>
          </div>
          <Link href="/photographer/galleries/create">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Create Gallery
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          <GallerySearchBar
            onSearch={setSearchQuery}
            placeholder="Search galleries by name, location, people, or notes..."
          />
          <GalleryFilters
            onFiltersChange={setFilters}
            availableYears={filterOptions.years}
            availableLocations={filterOptions.locations}
            availablePeople={filterOptions.people}
          />
        </div>

        {/* Gallery Grid */}
        {galleries.length === 0 ? (
          <Card className="bg-slate-800/50 border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No galleries found' : 'No galleries yet'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first gallery to get started'}
              </p>
              {!searchQuery && (
                <Link href="/photographer/galleries/create">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Gallery
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery) => (
              <Card key={gallery.id} className="bg-slate-800/50 border-border hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-foreground text-lg truncate">
                        {gallery.gallery_name}
                      </CardTitle>
                      {gallery.client && (
                        <CardDescription className="text-muted-foreground truncate">
                          {gallery.client.name}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-border">
                        <DropdownMenuItem
                          className="text-foreground hover:text-foreground focus:text-foreground cursor-pointer"
                          onClick={() => router.push(`/gallery/${gallery.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Gallery
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-foreground hover:text-foreground focus:text-foreground cursor-pointer"
                          onClick={() => router.push(`/photographer/galleries/${gallery.id}/upload`)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-foreground hover:text-foreground focus:text-foreground cursor-pointer"
                          onClick={() => router.push(`/photographer/galleries/${gallery.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        {gallery.client?.email && (
                          <DropdownMenuItem
                            className="text-foreground hover:text-foreground focus:text-foreground cursor-pointer"
                            onClick={() => handleResendNotification(gallery.id, gallery.client?.email)}
                            disabled={sendingNotification === gallery.id}
                          >
                            {sendingNotification === gallery.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Resend Notification
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive hover:text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => {
                            setDeletingGallery(gallery)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Gallery
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      <span>{gallery.photo_count || 0} photos</span>
                    </div>
                    {(gallery.event_date || gallery.session_date) && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(gallery.event_date || gallery.session_date)}</span>
                      </div>
                    )}
                    {gallery.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate max-w-[100px]">{gallery.location}</span>
                      </div>
                    )}
                  </div>

                  {/* People Tags */}
                  {gallery.people && gallery.people.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {gallery.people.slice(0, 3).map((person, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-slate-700/50 text-foreground">
                          {person}
                        </Badge>
                      ))}
                      {gallery.people.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{gallery.people.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(gallery)}
                      {gallery.billing_mode === 'all_in_one' && (
                        <Badge variant="outline" className="text-xs">All-In-One</Badge>
                      )}
                    </div>
                    {gallery.total_amount && gallery.total_amount > 0 && (
                      <span className="text-amber-400 font-medium">
                        {formatCurrency(gallery.total_amount)}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600 text-foreground hover:text-foreground hover:bg-slate-700"
                      onClick={() => router.push(`/gallery/${gallery.id}`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-medium"
                      onClick={() => router.push(`/photographer/galleries/${gallery.id}/upload`)}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gallery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move &quot;{deletingGallery?.gallery_name}&quot; to Recently Deleted.
              You can restore it within 30 days. After that, it will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setDeletingGallery(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deletingGallery) {
                  handleDeleteGallery(deletingGallery)
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Gallery'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
