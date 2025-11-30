'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Search,
  Image as ImageIcon,
  Calendar,
  Users,
  DollarSign,
  ExternalLink,
  Upload,
  MoreHorizontal,
  Eye,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description: string | null
  photo_count: number
  created_at: string
  session_date: string | null
  payment_status: string | null
  billing_mode: string | null
  total_amount: number | null
  payment_option_id: string | null
  client: {
    id: string
    name: string
    email: string
  } | null
}

export default function GalleriesPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (userType !== 'photographer') {
      router.push('/client/dashboard')
      return
    }
    fetchGalleries()
  }, [user, userType, authLoading, router])

  const fetchGalleries = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Use photo_galleries (canonical table) - photos FK references this table
      const { data, error } = await supabase
        .from('photo_galleries')
        .select(`
          id,
          gallery_name,
          gallery_description,
          photo_count,
          created_at,
          session_date,
          payment_status,
          billing_mode,
          total_amount,
          payment_option_id,
          client:clients(id, name, email)
        `)
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGalleries(data || [])
    } catch (err) {
      console.error('Error fetching galleries:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredGalleries = galleries.filter(gallery => {
    const searchLower = searchQuery.toLowerCase()
    return (
      gallery.gallery_name?.toLowerCase().includes(searchLower) ||
      gallery.client?.name?.toLowerCase().includes(searchLower) ||
      gallery.client?.email?.toLowerCase().includes(searchLower)
    )
  })

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/photographer/dashboard">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Galleries</h1>
              <p className="text-slate-400">Manage your photo galleries</p>
            </div>
          </div>
          <Link href="/photographer/galleries/create">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Create Gallery
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search galleries by name or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Gallery Grid */}
        {filteredGalleries.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery ? 'No galleries found' : 'No galleries yet'}
              </h3>
              <p className="text-slate-400 text-center mb-4">
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
            {filteredGalleries.map((gallery) => (
              <Card key={gallery.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">
                        {gallery.gallery_name}
                      </CardTitle>
                      {gallery.client && (
                        <CardDescription className="text-slate-400 truncate">
                          {gallery.client.name}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
                          onClick={() => router.push(`/gallery/${gallery.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Gallery
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
                          onClick={() => router.push(`/photographer/galleries/${gallery.id}/upload`)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-slate-300 hover:text-white focus:text-white cursor-pointer"
                          onClick={() => router.push(`/photographer/galleries/${gallery.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                      <ImageIcon className="h-4 w-4" />
                      <span>{gallery.photo_count || 0} photos</span>
                    </div>
                    {gallery.session_date && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(gallery.session_date)}</span>
                      </div>
                    )}
                  </div>

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
                      className="flex-1 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                      onClick={() => router.push(`/gallery/${gallery.id}`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
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
    </div>
  )
}
