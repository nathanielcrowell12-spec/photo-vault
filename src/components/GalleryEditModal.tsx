'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Save, X, Calendar, User, MapPin, Users, UserCheck, Heart, Tag, FileText, AlertTriangle, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  photographer_name?: string
  photographer_id?: string | null
  session_date?: string
  client_id?: string | null
  user_id?: string
  // Top-level columns for full-text search
  location?: string
  people?: string[]
  event_type?: string
  notes?: string
  // Legacy nested metadata (for backward compatibility)
  metadata?: {
    location?: string
    people?: string[]
  }
}

interface PhotographerOption {
  id: string
  name: string
  paymentStatus: string
}

interface Client {
  id: string
  name: string
  email: string
}

interface GalleryEditModalProps {
  gallery: Gallery | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function GalleryEditModal({ gallery, isOpen, onClose, onSave }: GalleryEditModalProps) {
  const { user, userType } = useAuth()
  const [formData, setFormData] = useState({
    gallery_name: '',
    gallery_description: '',
    photographer_name: '',
    session_date: '',
    location: '',
    people: '',
    event_type: '',
    notes: '',
    client_id: ''
  })
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isPhotographer = userType === 'photographer'
  const isClient = userType === 'client'
  const isAdmin = userType === 'admin'

  // Photographer assignment state (admin only)
  const [photographers, setPhotographers] = useState<PhotographerOption[]>([])
  const [selectedPhotographer, setSelectedPhotographer] = useState<string | null>(null)
  const [loadingPhotographers, setLoadingPhotographers] = useState(false)

  // Family sharing state
  const [isFamilyShared, setIsFamilyShared] = useState(false)
  const [familySharingEnabled, setFamilySharingEnabled] = useState(false)
  const [togglingSharing, setTogglingSharing] = useState(false)

  // Fetch photographer's clients (function inlined to avoid HMR loops)
  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email')
          .eq('photographer_id', user?.id)
          .eq('status', 'active')
          .order('name')

        if (error) throw error
        setClients(data || [])
      } catch (err) {
        console.error('Error fetching clients:', err)
      }
    }

    if (isOpen && isPhotographer && user?.id) {
      fetchClients()
    }
  }, [isOpen, isPhotographer, user?.id])

  // Initialize selectedPhotographer from gallery
  useEffect(() => {
    if (gallery?.photographer_id) {
      setSelectedPhotographer(gallery.photographer_id)
    } else {
      setSelectedPhotographer(null)
    }
  }, [gallery])

  // Fetch photographers list (admin only)
  useEffect(() => {
    async function fetchPhotographers() {
      setLoadingPhotographers(true)
      try {
        const response = await fetch('/api/admin/photographers')
        const data = await response.json()
        if (data.success && data.data?.photographers) {
          setPhotographers(data.data.photographers.map((p: { id: string; name: string; paymentStatus: string }) => ({
            id: p.id,
            name: p.name,
            paymentStatus: p.paymentStatus,
          })))
        }
      } catch (err) {
        console.error('Error fetching photographers:', err)
      } finally {
        setLoadingPhotographers(false)
      }
    }

    if (isAdmin && isOpen) {
      fetchPhotographers()
    }
  }, [isAdmin, isOpen])

  // Check if selected photographer is inactive
  const selectedPhotographerInactive = selectedPhotographer
    ? photographers.find(p => p.id === selectedPhotographer)?.paymentStatus !== 'active'
    : false

  // Fetch family sharing status for clients
  useEffect(() => {
    async function fetchSharingStatus() {
      if (!isOpen || !isClient || !gallery?.id) return

      try {
        const res = await fetch(`/api/galleries/${gallery.id}/sharing`)
        const data = await res.json()

        if (res.ok) {
          setIsFamilyShared(data.is_family_shared || false)
          setFamilySharingEnabled(data.family_sharing_enabled || false)
        }
      } catch (err) {
        console.error('Error fetching sharing status:', err)
      }
    }

    fetchSharingStatus()
  }, [isOpen, isClient, gallery?.id])

  // Handle family sharing toggle
  const handleFamilySharingToggle = async (shared: boolean) => {
    if (!gallery?.id) return

    setTogglingSharing(true)
    try {
      const res = await fetch(`/api/galleries/${gallery.id}/sharing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_family_shared: shared })
      })

      const data = await res.json()

      if (res.ok) {
        setIsFamilyShared(shared)
      } else {
        setError(data.error || 'Failed to update sharing')
      }
    } catch (err) {
      console.error('Error toggling family sharing:', err)
      setError('Failed to update sharing')
    } finally {
      setTogglingSharing(false)
    }
  }

  // Update form when gallery changes
  useEffect(() => {
    if (gallery) {
      // Read from top-level columns first, fallback to metadata for backward compat
      const location = gallery.location || gallery.metadata?.location || ''
      const people = gallery.people?.length
        ? gallery.people.join(', ')
        : gallery.metadata?.people?.join(', ') || ''

      setFormData({
        gallery_name: gallery.gallery_name || '',
        gallery_description: gallery.gallery_description || '',
        photographer_name: gallery.photographer_name || '',
        session_date: gallery.session_date || '',
        location,
        people,
        event_type: gallery.event_type || '',
        notes: gallery.notes || '',
        client_id: gallery.client_id || gallery.user_id || 'none'
      })
    }
  }, [gallery])

  const handleSave = async () => {
    if (!gallery) return

    setSaving(true)
    setError(null)

    try {
      // Parse people tags
      const peopleArray = formData.people
        ? formData.people.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : []

      // Prepare update data - write to TOP-LEVEL columns for full-text search
      const updateData: Record<string, unknown> = {
        gallery_name: formData.gallery_name,
        gallery_description: formData.gallery_description,
        photographer_name: formData.photographer_name,
        session_date: formData.session_date || null,
        // Top-level columns for search_vector trigger
        location: formData.location || null,
        people: peopleArray,
        event_type: formData.event_type || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      }

      // If photographer, update client assignment
      if (isPhotographer) {
        const clientId = formData.client_id === 'none' ? null : formData.client_id
        updateData.user_id = clientId
        updateData.client_id = clientId
      }

      // Update gallery in database
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update(updateData)
        .eq('id', gallery.id)

      if (updateError) {
        throw updateError
      }

      // If admin changed photographer assignment, call the assign API
      if (isAdmin && selectedPhotographer !== gallery.photographer_id) {
        try {
          const assignResponse = await fetch(`/api/admin/galleries/${gallery.id}/assign-photographer`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photographer_id: selectedPhotographer }),
          })

          const assignData = await assignResponse.json()

          if (!assignResponse.ok) {
            console.error('Photographer assignment failed:', assignData.error)
            // Show warning but don't fail the save - gallery data was already saved
            setError(`Gallery saved but photographer assignment failed: ${assignData.error}`)
            // Still close and refresh since gallery data was saved
            onSave()
            onClose()
            return
          }

          // If email was sent, log it
          if (assignData.email_sent) {
            console.log('Onboarding email sent to photographer')
          }
        } catch (assignErr) {
          console.error('Error assigning photographer:', assignErr)
          setError('Gallery saved but failed to update photographer assignment')
          onSave()
          onClose()
          return
        }
      }

      // Notify parent component
      onSave()
      onClose()

    } catch (err) {
      console.error('Error saving gallery:', err)
      setError(err instanceof Error ? err.message : 'Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Gallery Information</DialogTitle>
          <DialogDescription>
            Update the gallery name, date, and other details. These can be edited at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
          {/* Gallery Name */}
          <div className="space-y-2">
            <Label htmlFor="gallery_name">
              <Calendar className="h-4 w-4 inline mr-2" />
              Gallery Name
            </Label>
            <Input
              id="gallery_name"
              value={formData.gallery_name}
              onChange={(e) => setFormData(prev => ({ ...prev, gallery_name: e.target.value }))}
              placeholder="e.g., Summer Wedding, Family Portraits"
              disabled={saving}
            />
          </div>

          {/* Client Assignment (Photographer Only) */}
          {isPhotographer && (
            <div className="space-y-2">
              <Label htmlFor="client_id">
                <UserCheck className="h-4 w-4 inline mr-2" />
                Assign to Client
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                disabled={saving}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Personal Gallery)</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Assign this gallery to a client to give them access
              </p>
            </div>
          )}

          {/* Photographer Assignment (Admin Only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="photographer">
                <Camera className="h-4 w-4 inline mr-2" />
                Assign Photographer
              </Label>
              <Select
                value={selectedPhotographer || '__none__'}
                onValueChange={(value) => setSelectedPhotographer(value === '__none__' ? null : value)}
                disabled={saving || loadingPhotographers}
              >
                <SelectTrigger id="photographer">
                  <SelectValue placeholder={loadingPhotographers ? 'Loading...' : 'Select a photographer...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">None (Unassign)</span>
                  </SelectItem>
                  {photographers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.paymentStatus !== 'active' && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Warning for inactive photographer */}
              {selectedPhotographerInactive && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      This photographer hasn&apos;t completed Stripe setup. Clients won&apos;t be able to pay until they do.
                      An onboarding email will be sent when you save.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Family Sharing (Client Only) */}
          {isClient && (
            <div className="space-y-2 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-lg border border-pink-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <Label htmlFor="family_sharing" className="font-medium">
                    Share with Family
                  </Label>
                </div>
                <Switch
                  id="family_sharing"
                  checked={isFamilyShared}
                  onCheckedChange={handleFamilySharingToggle}
                  disabled={togglingSharing || !familySharingEnabled}
                />
              </div>
              {familySharingEnabled ? (
                <p className="text-xs text-muted-foreground">
                  {isFamilyShared
                    ? 'Family members can view this gallery'
                    : 'Toggle on to share this gallery with your designated family members'}
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  Enable family sharing in{' '}
                  <a href="/client/settings/family" className="underline hover:text-amber-700">
                    Settings → Family Sharing
                  </a>{' '}
                  to share galleries with family
                </p>
              )}
            </div>
          )}

          {/* Session Date */}
          <div className="space-y-2">
            <Label htmlFor="session_date">
              <Calendar className="h-4 w-4 inline mr-2" />
              Date (free format)
            </Label>
            <Input
              id="session_date"
              value={formData.session_date}
              onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
              placeholder="e.g., June 15, 2024 or Summer 2024"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Enter any date format you prefer - year, season, specific date, etc.
            </p>
          </div>

          {/* Photographer Name */}
          <div className="space-y-2">
            <Label htmlFor="photographer_name">
              <User className="h-4 w-4 inline mr-2" />
              Photographer
            </Label>
            <Input
              id="photographer_name"
              value={formData.photographer_name}
              onChange={(e) => setFormData(prev => ({ ...prev, photographer_name: e.target.value }))}
              placeholder="e.g., Jane Smith Photography"
              disabled={saving}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="h-4 w-4 inline mr-2" />
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Central Park, New York"
              disabled={saving}
            />
          </div>

          {/* People Tags */}
          <div className="space-y-2">
            <Label htmlFor="people">
              <Users className="h-4 w-4 inline mr-2" />
              People (comma separated)
            </Label>
            <Input
              id="people"
              value={formData.people}
              onChange={(e) => setFormData(prev => ({ ...prev, people: e.target.value }))}
              placeholder="e.g., John, Jane, Sarah"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Add names to make this gallery searchable by person
            </p>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type">
              <Tag className="h-4 w-4 inline mr-2" />
              Event Type
            </Label>
            <Select
              value={formData.event_type || 'none'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value === 'none' ? '' : value }))}
              disabled={saving}
            >
              <SelectTrigger id="event_type">
                <SelectValue placeholder="Select event type (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="newborn">Newborn</SelectItem>
                <SelectItem value="maternity">Maternity</SelectItem>
                <SelectItem value="graduation">Graduation</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              <FileText className="h-4 w-4 inline mr-2" />
              Notes (searchable)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add searchable notes about this gallery..."
              rows={2}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Notes are included in gallery search
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="gallery_description">Description (optional)</Label>
            <Textarea
              id="gallery_description"
              value={formData.gallery_description}
              onChange={(e) => setFormData(prev => ({ ...prev, gallery_description: e.target.value }))}
              placeholder="Add notes about this gallery..."
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !formData.gallery_name}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


