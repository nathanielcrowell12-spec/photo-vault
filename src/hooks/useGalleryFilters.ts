import { useState, useMemo } from 'react'
import { Gallery } from '@/types/gallery'
import { GALLERY_SORT_OPTIONS, GALLERY_FILTER_OPTIONS } from '@/lib/component-constants'

interface UseGalleryFiltersReturn {
  sortBy: string
  setSortBy: (sort: 'date' | 'photographer' | 'platform' | 'name') => void
  filterBy: string
  setFilterBy: (filter: string) => void
  clientFilter: string
  setClientFilter: (client: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredGalleries: Gallery[]
}

export function useGalleryFilters(galleries: Gallery[], isPhotographer: boolean): UseGalleryFiltersReturn {
  const [sortBy, setSortBy] = useState<'date' | 'photographer' | 'platform' | 'name'>(GALLERY_SORT_OPTIONS.DATE)
  const [filterBy, setFilterBy] = useState<string>(GALLERY_FILTER_OPTIONS.ALL)
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGalleries = useMemo(() => {
    let filtered = [...galleries]

    // Filter by platform
    if (filterBy !== GALLERY_FILTER_OPTIONS.ALL) {
      filtered = filtered.filter(gallery => gallery.platform === filterBy)
    }

    // Filter by client (for photographers)
    if (isPhotographer && clientFilter !== 'all') {
      filtered = filtered.filter(gallery => gallery.client_id === clientFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(gallery =>
        gallery.gallery_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gallery.gallery_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gallery.photographer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort galleries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case GALLERY_SORT_OPTIONS.DATE:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case GALLERY_SORT_OPTIONS.PHOTOGRAPHER:
          return (a.photographer_name || '').localeCompare(b.photographer_name || '')
        case GALLERY_SORT_OPTIONS.PLATFORM:
          return a.platform.localeCompare(b.platform)
        case GALLERY_SORT_OPTIONS.NAME:
          return a.gallery_name.localeCompare(b.gallery_name)
        default:
          return 0
      }
    })

    return filtered
  }, [galleries, filterBy, clientFilter, searchTerm, sortBy, isPhotographer])

  return {
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    clientFilter,
    setClientFilter,
    searchTerm,
    setSearchTerm,
    filteredGalleries
  }
}
