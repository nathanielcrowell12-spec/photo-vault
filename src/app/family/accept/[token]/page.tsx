'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface InvitationData {
  id: string
  email: string
  name: string
  relationship: string
  primaryName: string
  sharedGalleryCount: number
  invitedAt: string
}

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [requiresLogin, setRequiresLogin] = useState(false)

  // Fetch invitation details on mount
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/family/secondaries/accept?token=${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid invitation')
          return
        }

        if (!data.valid) {
          setError(data.error || 'This invitation is no longer valid')
          return
        }

        setInvitation(data.invitation)
      } catch (err) {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchInvitation()
    }
  }, [token])

  // Handle accept button click
  async function handleAccept() {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch('/api/family/secondaries/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation')
        return
      }

      if (data.requiresLogin) {
        setRequiresLogin(true)
        return
      }

      setAccepted(true)
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(data.redirectUrl || '/family/galleries')
      }, 2000)

    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  // Requires login state
  if (requiresLogin && invitation) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h1>
          <p className="text-gray-600 mb-6">
            An account exists for <strong>{invitation.email}</strong>. 
            Please log in to accept this invitation.
          </p>
          <Link 
            href={`/login?redirect=/family/accept/${token}`}
            className="inline-block bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (accepted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Family!</h1>
          <p className="text-gray-600 mb-4">
            You now have access to {invitation?.primaryName}'s shared galleries.
          </p>
          <p className="text-sm text-gray-500">Redirecting you to your galleries...</p>
        </div>
      </div>
    )
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-8 text-center text-white">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h1 className="text-2xl font-bold">You're Invited!</h1>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-lg text-gray-700 mb-6">
            <strong>{invitation?.primaryName}</strong> has designated you as family on their PhotoVault account.
          </p>

          {/* What you'll get */}
          <div className="bg-neutral-800 border border-amber-700 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-amber-800 mb-3">What you'll have access to:</h3>
            <ul className="space-y-2 text-amber-700">
              <li className="flex items-start gap-2">
                <span>📸</span>
                <span><strong>{invitation?.sharedGalleryCount || 0}</strong> shared {invitation?.sharedGalleryCount === 1 ? 'gallery' : 'galleries'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔔</span>
                <span>Notifications if the account needs attention</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💳</span>
                <span>Ability to help with payments if needed</span>
              </li>
            </ul>
          </div>

          {/* Invitation details */}
          <div className="text-sm text-gray-500 mb-6">
            <p>Invited as: <strong className="text-gray-700">{invitation?.relationship}</strong></p>
            <p>Email: <strong className="text-gray-700">{invitation?.email}</strong></p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Accept button */}
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            By accepting, you agree to PhotoVault's Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

