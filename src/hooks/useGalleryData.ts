import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Gallery, Client } from '@/types/gallery'
import { API_KEY_DISPLAY_LENGTH, ERROR_MESSAGES } from '@/lib/component-constants'

interface UseGalleryDataReturn {
  galleries: Gallery[]
  clients: Client[]
  loading: boolean
  error: string | null
  fetchGalleries: () => Promise<void>
  fetchClients: () => Promise<void>
}

export function useGalleryData(userId: string, userType: string): UseGalleryDataReturn {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isPhotographer = userType === 'photographer'

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('GalleryGrid: Fetching galleries for user:', userId)
      console.log('GalleryGrid: User type:', userType)
      console.log('GalleryGrid: Using anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, API_KEY_DISPLAY_LENGTH) + '...')
      
      let query = supabase.from('galleries').select('*')
      
      if (isPhotographer) {
        query = query.eq('photographer_id', userId)
      } else {
        query = query.eq('user_id', userId)
      }
      
      const { data: galleriesData, error: galleriesError } = await query
      
      if (galleriesError) {
        console.error('Error fetching galleries:', galleriesError)
        setError(ERROR_MESSAGES.FETCH_GALLERIES_FAILED)
        return
      }

      // Transform the data to include photographer names
      const mappedGalleries: Gallery[] = (galleriesData || []).map(galleryRecord => ({
        ...galleryRecord,
        photographer_name: galleryRecord.photographer_name || 'Unknown Photographer'
      }))

      setGalleries(mappedGalleries)
      console.log('GalleryGrid: Fetched galleries:', mappedGalleries.length)
      
    } catch (fetchError) {
      console.error('Error fetching galleries:', fetchError)
      setError(ERROR_MESSAGES.FETCH_GALLERIES_FAILED)
    } finally {
      setLoading(false)
    }
  }, [userId, isPhotographer, userType])

  const fetchClients = useCallback(async () => {
    if (!isPhotographer) return

    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('photographer_id', userId)

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        setError(ERROR_MESSAGES.FETCH_CLIENTS_FAILED)
        return
      }

      setClients(clientsData || [])
    } catch (fetchError) {
      console.error('Error fetching clients:', fetchError)
      setError(ERROR_MESSAGES.FETCH_CLIENTS_FAILED)
    }
  }, [userId, isPhotographer])

  return {
    galleries,
    clients,
    loading,
    error,
    fetchGalleries,
    fetchClients
  }
}
