'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface ViewContextType {
  viewMode: 'admin' | 'photographer' | 'customer'
  setViewMode: (mode: 'admin' | 'photographer' | 'customer') => void
  isAdminView: boolean
  isCustomerView: boolean
  isPhotographerView: boolean
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<'admin' | 'photographer' | 'customer'>('admin')

  const isAdminView = viewMode === 'admin'
  const isCustomerView = viewMode === 'customer'
  const isPhotographerView = viewMode === 'photographer'

  // Persist view mode in localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin-view-mode')
    if (savedViewMode && (savedViewMode === 'admin' || savedViewMode === 'photographer' || savedViewMode === 'customer')) {
      setViewMode(savedViewMode as 'admin' | 'photographer' | 'customer')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-view-mode', viewMode)
  }, [viewMode])

  const value = {
    viewMode,
    setViewMode,
    isAdminView,
    isCustomerView,
    isPhotographerView,
  }

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}

export function useView() {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }
  return context
}
