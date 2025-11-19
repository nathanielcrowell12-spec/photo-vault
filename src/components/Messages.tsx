'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { MessageSquare, Send, User, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  message_text: string
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: {
    id: string
    full_name: string
    email: string
  }
  recipient?: {
    id: string
    full_name: string
    email: string
  }
}

interface Thread {
  id: string
  other_user: {
    id: string
    full_name: string
    email: string
    user_type: string
  }
  last_message: {
    message_text: string
    created_at: string
  } | null
  last_message_at: string
  unread_count: number
  created_at: string
}

interface MessagesProps {
  limit?: number
  showFullInterface?: boolean
}

export default function Messages({ limit = 5, showFullInterface = false }: MessagesProps) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchThreads = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        console.error('No access token available')
        return
      }

      const response = await fetch('/api/messages/threads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch threads')
      }

      const data = await response.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Error fetching threads:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return

    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch(`/api/messages?with=${otherUserId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages((data.messages || []).reverse())

      // Mark messages as read
      await markAsRead(otherUserId)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [user])

  const markAsRead = async (otherUserId: string) => {
    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      await fetch('/api/messages/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ other_user_id: otherUserId }),
      })

      // Update thread unread count locally
      setThreads(prev => prev.map(t =>
        t.other_user.id === otherUserId ? { ...t, unread_count: 0 } : t
      ))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedThread || !newMessage.trim()) return

    try {
      setSending(true)
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: selectedThread.other_user.id,
          message_text: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')

      // Refresh threads to update last message
      fetchThreads()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (days > 0) {
      return `${days}d ago`
    } else if (hours > 0) {
      return `${hours}h ago`
    } else {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes > 0 ? `${minutes}m ago` : 'Just now'
    }
  }

  useEffect(() => {
    fetchThreads()

    // Subscribe to real-time message updates
    const channel = supabaseBrowser
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user?.id}`,
        },
        () => {
          fetchThreads()
          if (selectedThread) {
            fetchMessages(selectedThread.other_user.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [fetchThreads, user?.id])

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.other_user.id)
    }
  }, [selectedThread, fetchMessages])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!showFullInterface) {
    // Dashboard preview mode - show recent threads
    return (
      <div className="space-y-3">
        {threads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Client messages will appear here</p>
          </div>
        ) : (
          <>
            {threads.slice(0, limit).map((thread) => (
              <Card key={thread.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {thread.other_user.full_name || thread.other_user.email}
                        </h4>
                        {thread.unread_count > 0 && (
                          <Badge variant="default" className="ml-2">
                            {thread.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {thread.last_message?.message_text || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(thread.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {threads.length > limit && (
              <Button variant="outline" className="w-full">
                View All Messages ({threads.length})
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  // Full messaging interface
  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      {/* Threads List */}
      <div className="md:col-span-1 border rounded-lg overflow-y-auto">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">Conversations</h3>
        </div>
        <div className="divide-y">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedThread?.id === thread.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedThread(thread)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {thread.other_user.full_name || thread.other_user.email}
                    </h4>
                    {thread.unread_count > 0 && (
                      <Badge variant="default" className="text-xs">
                        {thread.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {thread.last_message?.message_text || 'No messages yet'}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(thread.last_message_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages View */}
      <div className="md:col-span-2 border rounded-lg flex flex-col">
        {selectedThread ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">
                {selectedThread.other_user.full_name || selectedThread.other_user.email}
              </h3>
              <p className="text-xs text-gray-600 capitalize">
                {selectedThread.other_user.user_type}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id === user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isSender
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message_text}</p>
                      <span className={`text-xs ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
