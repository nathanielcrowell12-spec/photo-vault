'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SignOutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut()
      // Force clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
      })
      // Redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 500)
    }
    handleSignOut()
  }, [signOut, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing out...</h1>
        <p className="text-muted-foreground dark:text-foreground">Please wait...</p>
      </div>
    </div>
  )
}
