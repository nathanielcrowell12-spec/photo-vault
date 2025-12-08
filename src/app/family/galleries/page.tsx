'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Calendar,
  User,
  ExternalLink,
  Users,
  Heart,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  HandHeart,
  Copy,
  CheckCircle2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface SharedGallery {
  id: string
  gallery_name: string
  gallery_description?: string
  cover_image_url?: string
  platform: string
  photographer_name?: string
  session_date?: string
  photo_count: number
  created_at: string
  primary_name: string
  relationship: string
  shared_by_account_id: string
  account_status: 'active' | 'grace_period' | 'suspended'
  needs_attention: boolean
  already_incorporated?: boolean
}

export default function FamilyGalleriesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [galleries, setGalleries] = useState<SharedGallery[]>([])
  const [accountCount, setAccountCount] = useState(0)
  const [accountsNeedingAttention, setAccountsNeedingAttention] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Incorporate modal state
  const [hasOwnAccount, setHasOwnAccount] = useState(false)
  const [incorporateModalOpen, setIncorporateModalOpen] = useState(false)
  const [selectedForIncorporate, setSelectedForIncorporate] = useState<Set<string>>(new Set())
  const [incorporatingGalleries, setIncorporatingGalleries] = useState<SharedGallery[]>([])
  const [isIncorporating, setIsIncorporating] = useState(false)
  const [incorporateSuccess, setIncorporateSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    async function fetchSharedGalleries() {
      // Wait for auth to be fully loaded before fetching
      if (authLoading || !user) return

      setLoading(true)
      setError(null)

      try {
        // Fetch both shared galleries and incorporate data in parallel
        const [sharedRes, incorporateRes] = await Promise.all([
          fetch('/api/family/shared-galleries'),
          fetch('/api/family/incorporate')
        ])

        const sharedData = await sharedRes.json()
        const incorporateData = await incorporateRes.json()

        if (!sharedRes.ok) {
          throw new Error(sharedData.error || 'Failed to fetch shared galleries')
        }

        // Merge incorporate status into galleries
        const incorporatedIds = new Set(
          (incorporateData.galleries || [])
            .filter((g: any) => g.already_incorporated)
            .map((g: any) => g.id)
        )

        const galleriesWithIncorporateStatus = (sharedData.galleries || []).map((g: SharedGallery) => ({
          ...g,
          already_incorporated: incorporatedIds.has(g.id)
        }))

        setGalleries(galleriesWithIncorporateStatus)
        setAccountCount(sharedData.account_count || 0)
        setAccountsNeedingAttention(sharedData.accounts_needing_attention || [])
        setHasOwnAccount(incorporateData.has_own_account || false)
      } catch (err) {
        console.error('Error fetching shared galleries:', err)
        setError(err instanceof Error ? err.message : 'Failed to load galleries')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchSharedGalleries()
    }
  }, [authLoading, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatRelationship = (relationship: string) => {
    const labels: Record<string, string> = {
      spouse: 'Spouse/Partner',
      child: 'Child',
      parent: 'Parent',
      sibling: 'Sibling',
      other: 'Family'
    }
    return labels[relationship] || 'Family'
  }

  // Open incorporate modal for a specific account's galleries
  const openIncorporateModal = (accountGalleries: SharedGallery[]) => {
    const availableGalleries = accountGalleries.filter(g => !g.already_incorporated)
    if (availableGalleries.length === 0) {
      setError('All galleries from this account have already been incorporated')
      return
    }
    setIncorporatingGalleries(availableGalleries)
    setSelectedForIncorporate(new Set(availableGalleries.map(g => g.id)))
    setIncorporateModalOpen(true)
  }

  // Toggle gallery selection for incorporate
  const toggleGallerySelection = (galleryId: string) => {
    setSelectedForIncorporate(prev => {
      const next = new Set(prev)
      if (next.has(galleryId)) {
        next.delete(galleryId)
      } else {
        next.add(galleryId)
      }
      return next
    })
  }

  // Handle incorporate submission
  const handleIncorporate = async () => {
    if (selectedForIncorporate.size === 0) return

    setIsIncorporating(true)
    setError(null)

    try {
      const res = await fetch('/api/family/incorporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_ids: Array.from(selectedForIncorporate)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to incorporate galleries')
      }

      // Update local state to mark galleries as incorporated
      setGalleries(prev => prev.map(g => 
        selectedForIncorporate.has(g.id) 
          ? { ...g, already_incorporated: true }
          : g
      ))

      setIncorporateSuccess(`Successfully incorporated ${data.incorporated_count} gallery(s) into your account!`)
      setIncorporateModalOpen(false)
      setSelectedForIncorporate(new Set())

      // Clear success message after 5 seconds
      setTimeout(() => setIncorporateSuccess(null), 5000)
    } catch (err) {
      console.error('Error incorporating galleries:', err)
      setError(err instanceof Error ? err.message : 'Failed to incorporate galleries')
    } finally {
      setIsIncorporating(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading shared galleries...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Group galleries by account
  const galleriesByAccount = galleries.reduce((acc, gallery) => {
    const key = gallery.shared_by_account_id
    if (!acc[key]) {
      acc[key] = {
        primary_name: gallery.primary_name,
        relationship: gallery.relationship,
        account_status: gallery.account_status,
        needs_attention: gallery.needs_attention,
        galleries: []
      }
    }
    acc[key].galleries.push(gallery)
    return acc
  }, {} as Record<string, { primary_name: string; relationship: string; account_status: string; needs_attention: boolean; galleries: SharedGallery[] }>)

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b bg-neutral-800/50 border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/client/dashboard"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Family Galleries</h1>
                <p className="text-sm text-slate-600">
                  Photo galleries shared with you by family
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {incorporateSuccess && (
          <div className="max-w-4xl mx-auto mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{incorporateSuccess}</span>
            <button 
              onClick={() => setIncorporateSuccess(null)}
              className="ml-auto hover:bg-green-100 rounded p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {galleries.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-pink-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shared Galleries Yet</h2>
            <p className="text-gray-600 mb-6">
              When family members share their photo galleries with you, they&apos;ll appear here.
            </p>
            <Link href="/client/dashboard">
              <Button variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="bg-white">
                <Users className="h-3 w-3 mr-1" />
                {accountCount} {accountCount === 1 ? 'Family Account' : 'Family Accounts'}
              </Badge>
              <Badge variant="outline" className="bg-white">
                <Camera className="h-3 w-3 mr-1" />
                {galleries.length} {galleries.length === 1 ? 'Gallery' : 'Galleries'}
              </Badge>
            </div>

            {/* Galleries grouped by account */}
            {Object.entries(galleriesByAccount).map(([accountId, { primary_name, relationship, account_status, needs_attention, galleries: accountGalleries }]) => (
              <div key={accountId} className="space-y-4">
                {/* Account Needs Attention Banner */}
                {needs_attention && (
                  <div className={`
                    rounded-lg p-4 flex items-center justify-between
                    ${account_status === 'suspended' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}
                  `}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${account_status === 'suspended' ? 'text-red-500' : 'text-amber-500'}`} />
                      <div>
                        <h4 className={`font-semibold ${account_status === 'suspended' ? 'text-red-800' : 'text-amber-800'}`}>
                          {account_status === 'suspended' ? 'Account Suspended' : 'Account Needs Attention'}
                        </h4>
                        <p className={`text-sm ${account_status === 'suspended' ? 'text-red-600' : 'text-amber-600'}`}>
                          {account_status === 'suspended'
                            ? `${primary_name}'s account has been suspended. Help pay to restore access.`
                            : `${primary_name}'s account is at risk. Payment hasn't been received.`}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className={account_status === 'suspended' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                    >
                      <Link href={`/family/takeover?account=${accountId}`}>
                        <HandHeart className="h-4 w-4 mr-2" />
                        Help Pay
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Account Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-semibold">
                    {primary_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{primary_name}&apos;s Galleries</h2>
                    <p className="text-sm text-gray-500">
                      Shared with you as their {formatRelationship(relationship).toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {needs_attention && (
                      <Badge variant="outline" className={account_status === 'suspended' ? 'border-red-300 text-red-600' : 'border-amber-300 text-amber-600'}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {account_status === 'suspended' ? 'Suspended' : 'At Risk'}
                      </Badge>
                    )}
                    {/* Incorporate Button - only show if user has own account */}
                    {hasOwnAccount && accountGalleries.some(g => !g.already_incorporated) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openIncorporateModal(accountGalleries)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Incorporate
                      </Button>
                    )}
                  </div>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accountGalleries.map((gallery) => (
                    <Card key={gallery.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Cover Image */}
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                          {gallery.cover_image_url ? (
                            <img
                              src={gallery.cover_image_url}
                              alt={gallery.gallery_name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Camera className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {/* Photo Count */}
                          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {gallery.photo_count} photos
                          </div>

                          {/* Family shared badge */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            <Badge className="bg-pink-500 text-white text-xs">
                              <Heart className="h-3 w-3 mr-1" />
                              Family
                            </Badge>
                            {gallery.already_incorporated && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Copied
                              </Badge>
                            )}
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <Button
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => router.push(`/gallery/${gallery.id}`)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Gallery
                            </Button>
                          </div>
                        </div>

                        {/* Gallery Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                            {gallery.gallery_name}
                          </h3>

                          {gallery.gallery_description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {gallery.gallery_description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {gallery.photographer_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[100px]">{gallery.photographer_name}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {gallery.session_date
                                  ? formatDate(gallery.session_date)
                                  : formatDate(gallery.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Incorporate Modal */}
      <Dialog open={incorporateModalOpen} onOpenChange={setIncorporateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-blue-500" />
              Incorporate Galleries
            </DialogTitle>
            <DialogDescription>
              Copy these galleries to your own PhotoVault account. The original galleries will remain accessible to other family members until the source account is closed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Commission Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> After incorporation, these galleries become part of your account. 
                Any future subscription payments go to your photographer.
              </p>
            </div>

            {/* Gallery Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Select galleries to incorporate:</p>
              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                {incorporatingGalleries.map(gallery => (
                  <div 
                    key={gallery.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleGallerySelection(gallery.id)}
                  >
                    <Checkbox 
                      checked={selectedForIncorporate.has(gallery.id)}
                      onCheckedChange={() => toggleGallerySelection(gallery.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{gallery.gallery_name}</p>
                      <p className="text-sm text-gray-500">{gallery.photo_count} photos</p>
                    </div>
                    {gallery.cover_image_url && (
                      <img 
                        src={gallery.cover_image_url} 
                        alt="" 
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              {selectedForIncorporate.size} of {incorporatingGalleries.length} galleries selected
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIncorporateModalOpen(false)}
              disabled={isIncorporating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIncorporate}
              disabled={isIncorporating || selectedForIncorporate.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isIncorporating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Incorporating...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Incorporate {selectedForIncorporate.size} Gallery{selectedForIncorporate.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

