'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Camera, User, ExternalLink, Grid3X3, List, Filter, Lock, AlertCircle, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import GalleryEditModal from './GalleryEditModal'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  cover_image_url?: string
  platform: string
  photographer_name?: string
  session_date?: string
  photo_count: number
  gallery_url?: string
  created_at: string
  user_id?: string
  client_id?: string
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
      
      // Fetch galleries from Supabase
      // For photographers: fetch galleries where they are the photographer (photographer_id = userId)
      // For clients: fetch galleries where they are the user (user_id = userId)
      let query = supabase
        .from('galleries')
        .select('*')
      
      if (isPhotographer) {
        // Fetch galleries created by this photographer
        query = query.eq('photographer_id', userId)
      } else {
        // Fetch galleries for this client
        query = query.eq('user_id', userId)
      }
      
      const { data: galleriesData, error } = await query.order('created_at', { ascending: false })
      
      console.log('GalleryGrid: Query response - data count:', galleriesData?.length, 'error:', error)
      
      if (error) {
        console.error('GalleryGrid: Error fetching galleries:', error)
        console.error('GalleryGrid: Error code:', error.code)
        console.error('GalleryGrid: Error message:', error.message)
        console.error('GalleryGrid: Error details:', error.details)
        console.error('GalleryGrid: Error hint:', error.hint)
        // If table doesn't exist yet, show empty state
        if (error.message.includes('Could not find')) {
          console.log('GalleryGrid: Galleries table not found - showing empty state')
          setGalleries([])
          setLoading(false)
          return
        }
        console.log('GalleryGrid: Setting empty galleries due to error')
        setGalleries([])
        setLoading(false)
        return
      }
      
      console.log('GalleryGrid: Fetched galleries:', galleriesData?.length || 0)
      console.log('GalleryGrid: Raw galleries data:', galleriesData)
      
      // Map database fields to Gallery interface
      const mappedGalleries: Gallery[] = (galleriesData || []).map(g => ({
        id: g.id,
        gallery_name: g.gallery_name,
        gallery_description: g.gallery_description,
        cover_image_url: g.cover_image_url || '/images/placeholder-family.svg',
        platform: g.platform,
        photographer_name: g.photographer_name,
        session_date: g.session_date,
        photo_count: g.photo_count || 0,
        gallery_url: g.gallery_url,
        created_at: g.created_at
      }))
      
      console.log('GalleryGrid: Mapped galleries:', mappedGalleries)
      setGalleries(mappedGalleries)
      setLoading(false)
    } catch (error) {
      console.error('GalleryGrid: Catch block - Error fetching galleries:', error)
      setGalleries([])
      setLoading(false)
    }
  }, [user?.email, user?.id, userType, userId, isPhotographer])

  const filterAndSortGalleries = useCallback(() => {
    let filtered = [...galleries]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(gallery =>
        gallery.gallery_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gallery.photographer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gallery.platform.toLowerCase().includes(searchTerm.toLowerCase())
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
        filtered = filtered.filter(gallery => !gallery.user_id && !gallery.client_id)
      } else {
        // Show galleries for specific client
        filtered = filtered.filter(gallery => 
          gallery.user_id === clientFilter || gallery.client_id === clientFilter
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
    return new Date(dateString).toLocaleDateString('en-US', {
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
            placeholder="Search galleries, photographers, or platforms..."
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
          {filteredGalleries.map((gallery) => {
            const isLocked = isGalleryLocked()
            const inGracePeriod = isGalleryInGracePeriod()
            
            return (
              <Card key={gallery.id} className={`group transition-shadow duration-200 ${isLocked ? 'opacity-50' : 'hover:shadow-lg'}`}>
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                    {gallery.cover_image_url ? (
                      <img
                        src={gallery.cover_image_url}
                        alt={gallery.gallery_name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-200 ${isLocked ? '' : 'group-hover:scale-105'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Lock Overlay for expired accounts */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
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
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
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
    </div>
  )
}
