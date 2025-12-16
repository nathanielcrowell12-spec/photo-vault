'use client'

import { useEffect } from 'react'

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call server-side logout API
        await fetch('/api/auth/logout', { method: 'POST' })

        // Clear all local storage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()

          // Clear all cookies client-side as well
          document.cookie.split(";").forEach(c => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          })
        }

        // Redirect to root (which should then redirect to landing page)
        window.location.href = '/'
      } catch (error) {
        console.error('Logout error:', error)
        // Redirect anyway
        window.location.href = '/'
      }
    }

    performLogout()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground dark:text-foreground">Signing out...</p>
      </div>
    </div>
  )
}
