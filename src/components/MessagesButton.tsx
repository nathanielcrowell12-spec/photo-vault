'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, HelpCircle } from 'lucide-react'
import MessagingPanel from './MessagingPanel'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface MessagesButtonProps {
  variant?: 'icon' | 'button'
  showLabel?: boolean
}

export default function MessagesButton({ variant = 'icon', showLabel = false }: MessagesButtonProps) {
  const { user } = useAuth()
  const [showMessages, setShowMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const session = await supabaseBrowser.auth.getSession()
        const token = session.data.session?.access_token

        if (!token) return

        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) return

        const data = await response.json()
        const total = data.conversations?.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0) || 0
        setUnreadCount(total)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    // Subscribe to real-time updates
    const channel = supabaseBrowser
      .channel('messages-badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabaseBrowser.removeChannel(channel)
    }
  }, [user])

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setShowMessages(true)}
          title="Messages"
        >
          <HelpCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {showMessages && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl">
              <MessagingPanel onClose={() => setShowMessages(false)} />
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowMessages(true)}
        className="relative"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {showLabel && 'Messages'}
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showMessages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl">
            <MessagingPanel onClose={() => setShowMessages(false)} />
          </div>
        </div>
      )}
    </>
  )
}
