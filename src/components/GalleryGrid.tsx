'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Camera, User, ExternalLink, Grid3X3, List, Lock, AlertCircle, Edit, Share2, Trash2 } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
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
import GalleryEditModal from './GalleryEditModal'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  cover_image_url?: string
  platform: string
  photographer_name?: string
  photographer_id?: string
  session_date?: string
  photo_count: number
  gallery_url?: string
  created_at: string
  user_id?: string  // Owner for self-uploaded galleries
  client_id?: string
  // Metadata fields for search
  location?: string
  event_type?: string
  people?: string[]
  notes?: string
}

interface Client {
  id: string
  name: string
}

interface GalleryGridProps {
  userId: string
}

export default function GalleryGrid({ userId }: GalleryGridProps) {
  const { user, userType, paymentStatus, isPaymentActive } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [filteredGalleries, setFilteredGalleries] = useState<Gallery[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'photographer' | 'platform' | 'name'>('date')
  const [filterBy, setFilterBy] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingGallery, setDeletingGallery] = useState<Gallery | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isPhotographer = userType === 'photographer'

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('photographer_id', user?.id)
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }, [user?.id])

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true)
      console.log('GalleryGrid: Fetching galleries for user:', userId)
      console.log('GalleryGrid: Current user from context:', user?.email, user?.id)
      console.log('GalleryGrid: User type:', userType)
      console.log('GalleryGrid: Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('GalleryGrid: Using anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
      
      if (isPhotographer) {
        // Fetch galleries created by this photographer
        const { data: galleriesData, error } = await supabase
          .from('photo_galleries')
          .select('*')
          .eq('photographer_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('GalleryGrid: Error fetching galleries:', error)
          setGalleries([])
          setLoading(false)
          return
        }

        // Map and set galleries
        const mappedGalleries: Gallery[] = (galleriesData || []).map(g => ({
          id: g.id,
          gallery_name: g.gallery_name,
          gallery_description: g.gallery_description,
          cover_image_url: g.cover_image_url || '/images/placeholder-family.svg',
          platform: g.platform,
          photographer_name: g.photographer_name,
          photographer_id: g.photographer_id,
          session_date: g.session_date,
          photo_count: g.photo_count || 0,
          gallery_url: g.gallery_url,
          created_at: g.created_at,
          user_id: g.user_id,
          client_id: g.client_id,
          // Metadata fields for search
          location: g.location,
          event_type: g.event_type,
          people: g.people,
          notes: g.notes
        }))

        setGalleries(mappedGalleries)
        setLoading(false)
        return
      } else {
        // For clients: fetch galleries assigned to them via client_id OR self-uploaded
        // Step 1: Get client records linked to this auth user
        const { data: clientRecords } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)

        const clientIds = clientRecords?.map(c => c.id) || []
        console.log('GalleryGrid: Found client records:', clientIds.length, clientIds)

        // Step 2: Query galleries where client_id matches OR user_id matches (self-uploaded)
        let galleriesData: Record<string, unknown>[] = []
        let error: { message: string; code?: string } | null = null

        if (clientIds.length > 0) {
          // Client has photographer relationships - show those galleries plus self-uploaded
          const result = await supabase
            .from('photo_galleries')
            .select('*')
            .or(`client_id.in.(${clientIds.join(',')}),user_id.eq.${userId}`)
            .order('created_at', { ascending: false })

          galleriesData = result.data || []
          error = result.error
        } else {
          // No client records - only show self-uploaded galleries
          const result = await supabase
            .from('photo_galleries')
            .select('*')
            .eq('user_id', userId)
            .is('photographer_id', null)
            .order('created_at', { ascending: false })

          galleriesData = result.data || []
          error = result.error
        }

        if (error) {
          console.error('GalleryGrid: Error fetching client galleries:', error)
          setGalleries([])
          setLoading(false)
          return
        }

        // Map and set galleries
        const mappedGalleries: Gallery[] = (galleriesData || []).map((g: Record<string, unknown>) => ({
          id: g.id as string,
          gallery_name: g.gallery_name as string,
          gallery_description: g.gallery_description as string | undefined,
          cover_image_url: (g.cover_image_url as string) || '/images/placeholder-family.svg',
          platform: g.platform as string,
          photographer_name: g.photographer_name as string | undefined,
          photographer_id: g.photographer_id as string | undefined,
          session_date: g.session_date as string | undefined,
          photo_count: (g.photo_count as number) || 0,
          gallery_url: g.gallery_url as string | undefined,
          created_at: g.created_at as string,
          user_id: g.user_id as string | undefined,
          client_id: g.client_id as string | undefined,
          // Metadata fields for search
          location: g.location as string | undefined,
          event_type: g.event_type as string | undefined,
          people: g.people as string[] | undefined,
          notes: g.notes as string | undefined
        }))

        console.log('GalleryGrid: Fetched client galleries:', mappedGalleries.length)
        setGalleries(mappedGalleries)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error('GalleryGrid: Catch block - Error fetching galleries:', error)
      setGalleries([])
      setLoading(false)
    }
  }, [user?.email, user?.id, userType, userId, isPhotographer])

  const filterAndSortGalleries = useCallback(() => {
    let filtered = [...galleries]

    // Apply search filter - includes all metadata fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(gallery =>
        gallery.gallery_name.toLowerCase().includes(term) ||
        gallery.photographer_name?.toLowerCase().includes(term) ||
        gallery.platform.toLowerCase().includes(term) ||
        gallery.location?.toLowerCase().includes(term) ||
        gallery.event_type?.toLowerCase().includes(term) ||
        gallery.notes?.toLowerCase().includes(term) ||
        gallery.gallery_description?.toLowerCase().includes(term) ||
        gallery.people?.some(person => person.toLowerCase().includes(term))
      )
    }

    // Apply platform filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(gallery => gallery.platform === filterBy)
    }

    // Apply client filter (for photographers)
    if (isPhotographer && clientFilter !== 'all') {
      if (clientFilter === 'unassigned') {
        // Show galleries with no client assignment
        filtered = filtered.filter(gallery => !gallery.client_id)
      } else {
        // Show galleries for specific client
        filtered = filtered.filter(gallery =>
          gallery.client_id === clientFilter
        )
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.session_date || b.created_at).getTime() - new Date(a.session_date || a.created_at).getTime()
        case 'photographer':
          return (a.photographer_name || '').localeCompare(b.photographer_name || '')
        case 'platform':
          return a.platform.localeCompare(b.platform)
        case 'name':
          return a.gallery_name.localeCompare(b.gallery_name)
        default:
          return 0
      }
    })

    setFilteredGalleries(filtered)
  }, [galleries, searchTerm, filterBy, isPhotographer, clientFilter, sortBy])

  useEffect(() => {
    fetchGalleries()
    if (isPhotographer && user?.id) {
      fetchClients()
    }
  }, [userId, isPhotographer, user?.id])

  useEffect(() => {
    filterAndSortGalleries()
  }, [filterAndSortGalleries])

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

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'Pixieset': 'bg-purple-100 text-purple-800 border-purple-200',
      'SmugMug': 'bg-blue-100 text-blue-800 border-blue-200',
      'ShootProof': 'bg-green-100 text-green-800 border-green-200',
      'PhotoShelter': 'bg-orange-100 text-orange-800 border-orange-200',
      'Zenfolio': 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[platform] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatDate = (dateString: string) => {
    // Parse date string to avoid timezone shift issues
    // For date-only strings like "1984-10-10", use UTC to prevent day shift
    const date = new Date(dateString)

    // Check if it's a date-only string (no time component)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Use UTC methods to avoid timezone shift
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
    }

    // For full timestamps, use normal formatting
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isGalleryLocked = () => {
    // Only lock galleries for customers with expired payments
    if (userType !== 'client') return false
    
    // Check if customer's payment stopped >6 months ago
    // This would typically check last_payment_date from database
    // For now, we'll use payment_status as a proxy
    return paymentStatus === 'inactive'
  }

  const isGalleryInGracePeriod = () => {
    // Only show grace period warnings for customers
    if (userType !== 'client') return false
    
    // Check if customer is in grace period (6 months after last payment)
    return paymentStatus === 'grace_period'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your galleries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Your Photo Galleries</h2>
          <p className="text-gray-600 mt-1">
            {filteredGalleries.length} {filteredGalleries.length === 1 ? 'gallery' : 'galleries'} found
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, location, photographer, event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="Pixieset">Pixieset</SelectItem>
              <SelectItem value="SmugMug">SmugMug</SelectItem>
              <SelectItem value="ShootProof">ShootProof</SelectItem>
              <SelectItem value="PhotoShelter">PhotoShelter</SelectItem>
              <SelectItem value="Zenfolio">Zenfolio</SelectItem>
            </SelectContent>
          </Select>

          {isPhotographer && clients.length > 0 && (
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(value: 'date' | 'photographer' | 'platform' | 'name') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="photographer">Photographer</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gallery Grid/List */}
      {filteredGalleries.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterBy !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : isPhotographer
              ? 'Upload your first gallery to get started'
              : 'Connect your first photo platform to get started'
            }
          </p>
          {!searchTerm && filterBy === 'all' && clientFilter === 'all' && !isPhotographer && (
            <Button onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/client/upload'
              }
            }}>
              Import Photos
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredGalleries.map((gallery, index) => {
            const isLocked = isGalleryLocked()
            const inGracePeriod = isGalleryInGracePeriod()

            return (
              <Card key={gallery.id} className={`group transition-shadow duration-200 ${isLocked ? 'opacity-50' : 'hover:shadow-lg'}`}>
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                    <ImageWithFallback
                      src={gallery.cover_image_url}
                      alt={gallery.gallery_name}
                      className={`w-full h-full transition-transform duration-200 ${isLocked ? '' : 'group-hover:scale-105'}`}
                      priority={index < 6}
                    />
                    
                    {/* Lock Overlay for expired accounts */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-foreground">
                          <Lock className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Gallery Locked</p>
                          <p className="text-xs opacity-90">Account inactive</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Grace Period Warning */}
                    {inGracePeriod && !isLocked && (
                      <div className="absolute top-3 left-3 right-3">
                        <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Grace Period
                        </div>
                      </div>
                    )}
                    
                    {/* Platform Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getPlatformColor(gallery.platform)} text-xs font-medium`}>
                        {gallery.platform}
                      </Badge>
                    </div>

                    {/* Photo Count */}
                    <div className="absolute top-3 right-3 bg-black/70 text-foreground px-2 py-1 rounded text-xs">
                      {gallery.photo_count} photos
                    </div>

                    {/* Hover Overlay - Only show if not locked */}
                    {!isLocked && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              window.location.href = `/gallery/${gallery.id}`
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Gallery
                        </Button>
                      </div>
                    )}
                  </div>

                {/* Gallery Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                      {gallery.gallery_name}
                    </h3>
                    {!isLocked && (
                      <div className="flex items-center">
                        {/* Share button - only for clients with active payment */}
                        {!isPhotographer && isPaymentActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (typeof window !== 'undefined') {
                                window.location.href = `/client/gallery/${gallery.id}/share`
                              }
                            }}
                            title="Share gallery"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingGallery(gallery)
                            setShowEditModal(true)
                          }}
                          title="Edit gallery info"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingGallery(gallery)
                            setShowDeleteDialog(true)
                          }}
                          title="Delete gallery"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {gallery.gallery_description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {gallery.gallery_description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {gallery.photographer_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{gallery.photographer_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {gallery.session_date 
                          ? formatDate(gallery.session_date)
                          : `Connected ${formatDate(gallery.created_at)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {/* Gallery Edit Modal */}
      <GalleryEditModal
        gallery={editingGallery}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingGallery(null)
        }}
        onSave={() => {
          // Refresh galleries after save
          fetchGalleries()
        }}
      />

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
