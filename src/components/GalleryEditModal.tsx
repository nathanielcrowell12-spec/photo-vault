'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, X, Calendar, User, MapPin, Users, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  photographer_name?: string
  session_date?: string
  client_id?: string | null
  user_id?: string
  metadata?: {
    location?: string
    people?: string[]
  }
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
    client_id: ''
  })
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isPhotographer = userType === 'photographer'

  const fetchClients = async () => {
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

  // Fetch photographer's clients
  useEffect(() => {
    if (isOpen && isPhotographer && user?.id) {
      fetchClients()
    }
  }, [isOpen, isPhotographer, user?.id, fetchClients])

  // Update form when gallery changes
  useEffect(() => {
    if (gallery) {
      setFormData({
        gallery_name: gallery.gallery_name || '',
        gallery_description: gallery.gallery_description || '',
        photographer_name: gallery.photographer_name || '',
        session_date: gallery.session_date || '',
        location: gallery.metadata?.location || '',
        people: gallery.metadata?.people?.join(', ') || '',
        client_id: gallery.client_id || gallery.user_id || ''
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

      // Prepare update data
      const updateData: Record<string, unknown> = {
        gallery_name: formData.gallery_name,
        gallery_description: formData.gallery_description,
        photographer_name: formData.photographer_name,
        session_date: formData.session_date || null,
        metadata: {
          ...gallery.metadata,
          location: formData.location,
          people: peopleArray
        },
        updated_at: new Date().toISOString()
      }

      // If photographer, update client assignment
      if (isPhotographer && formData.client_id) {
        updateData.user_id = formData.client_id
        updateData.client_id = formData.client_id
      }

      // Update gallery in database
      const { error: updateError } = await supabase
        .from('galleries')
        .update(updateData)
        .eq('id', gallery.id)

      if (updateError) {
        throw updateError
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Gallery Information</DialogTitle>
          <DialogDescription>
            Update the gallery name, date, and other details. These can be edited at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                  <SelectItem value="">None (Personal Gallery)</SelectItem>
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

        <DialogFooter>
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


