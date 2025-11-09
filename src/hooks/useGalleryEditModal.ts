import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Gallery, Client } from '@/types/gallery'
import { DESCRIPTION_TEXTAREA_ROWS, ERROR_TYPES } from '@/lib/component-constants'

interface GalleryFormData {
  gallery_name: string
  gallery_description: string
  photographer_name: string
  session_date: string
  location: string
  people: string
  client_id: string
}

interface UseGalleryEditModalReturn {
  formData: GalleryFormData
  setFormData: (data: GalleryFormData) => void
  clients: Client[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchClients: () => Promise<void>
  handleSave: () => Promise<void>
  resetForm: () => void
}

export function useGalleryEditModal(
  gallery: Gallery | null,
  isOpen: boolean,
  userType: string,
  userId: string | undefined,
  onSave: () => void
): UseGalleryEditModalReturn {
  const [formData, setFormData] = useState({
    gallery_name: '',
    gallery_description: '',
    photographer_name: '',
    session_date: '',
    location: '',
    people: '',
    client_id: 'none'
  })
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPhotographer = userType === 'photographer'

  const resetForm = useCallback(() => {
    setFormData({
      gallery_name: '',
      gallery_description: '',
      photographer_name: '',
      session_date: '',
      location: '',
      people: '',
      client_id: 'none'
    })
    setError(null)
  }, [])

  const fetchClients = useCallback(async () => {
    if (!isPhotographer || !userId) return

    try {
      setLoading(true)
      setError(null)

      const { data: clientsData, error: fetchError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('photographer_id', userId)

      if (fetchError) {
        console.error(`Error fetching clients: ${fetchError.message}`)
        setError('Failed to load clients')
        return
      }

      setClients(clientsData || [])
    } catch (fetchError) {
      console.error(`Error fetching clients: ${fetchError}`)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [isPhotographer, userId])

  const prepareGalleryData = useCallback(() => {
    if (!gallery) return null

    const baseData = {
      gallery_name: formData.gallery_name,
      gallery_description: formData.gallery_description,
      photographer_name: formData.photographer_name,
      session_date: formData.session_date || null,
    }

    if (isPhotographer) {
      return {
        ...baseData,
        client_id: formData.client_id === 'none' ? null : (formData.client_id || null),
        metadata: {
          location: formData.location,
          people: formData.people.split(',').map(p => p.trim()).filter(p => p)
        }
      }
    }

    return baseData
  }, [gallery, formData, isPhotographer])

  const handleSave = useCallback(async () => {
    if (!gallery) return

    try {
      setSaving(true)
      setError(null)

      const updateData = prepareGalleryData()
      if (!updateData) {
        setError('Invalid gallery data')
        return
      }

      const { error: saveError } = await supabase
        .from('galleries')
        .update(updateData)
        .eq('id', gallery.id)

      if (saveError) {
        console.error(`Error saving gallery: ${saveError.message}`)
        setError('Failed to save gallery')
        return
      }

      onSave()
    } catch (saveError) {
      console.error(`Error saving gallery: ${saveError}`)
      setError('Failed to save gallery')
    } finally {
      setSaving(false)
    }
  }, [gallery, prepareGalleryData, onSave])

  // Initialize form data when gallery changes
  useEffect(() => {
    if (gallery && isOpen) {
      setFormData({
        gallery_name: gallery.gallery_name || '',
        gallery_description: gallery.gallery_description || '',
        photographer_name: gallery.photographer_name || '',
        session_date: gallery.session_date || '',
        location: gallery.metadata?.location || '',
        people: gallery.metadata?.people?.join(', ') || '',
        client_id: gallery.client_id || 'none'
      })
    } else if (!isOpen) {
      resetForm()
    }
  }, [gallery, isOpen, resetForm])

  // Fetch clients when modal opens for photographers
  useEffect(() => {
    if (isOpen && isPhotographer) {
      fetchClients()
    }
  }, [isOpen, isPhotographer, fetchClients])

  return {
    formData,
    setFormData,
    clients,
    loading,
    saving,
    error,
    fetchClients,
    handleSave,
    resetForm
  }
}
