'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Archive,
  Flag,
  X,
  Loader2,
  ChevronLeft,
  Shield,
  Lightbulb,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Conversation {
  id: string
  other_user: {
    id: string
    name: string
    user_type: string
    email: string
  }
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
  is_archived: boolean
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  message_text: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface Contact {
  id: string
  name: string
  email: string
  user_type: string
  is_admin: boolean
}

interface MessagingPanelProps {
  onClose?: () => void
  initialConversationId?: string
}

export default function MessagingPanel({ onClose, initialConversationId }: MessagingPanelProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportMessageId, setReportMessageId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [userType, setUserType] = useState<string>('')
  const [showContactList, setShowContactList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUserProfile = useCallback(async () => {
    if (!user) return

    try {
      const { data: profile } = await supabaseBrowser
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserType(profile.user_type)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [user])

  const fetchContacts = useCallback(async () => {
    if (!user || !userType) return

    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch('/api/conversations/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch contacts')

      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }, [user, userType])

  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch conversations')

      const data = await response.json()
      setConversations(data.conversations || [])

      // Auto-select initial conversation if provided
      if (initialConversationId && data.conversations) {
        const conv = data.conversations.find((c: Conversation) => c.id === initialConversationId)
        if (conv) setSelectedConversation(conv)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [user, initialConversationId])

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return

    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data.messages || [])
      scrollToBottom()
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [user])

  const startConversation = async (contactId: string) => {
    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      // Create or get conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ other_user_id: contactId }),
      })

      if (!response.ok) throw new Error('Failed to create conversation')

      const data = await response.json()

      // Refresh conversations list
      await fetchConversations()

      // Find and select the new/existing conversation after a brief delay
      // to ensure state has updated from fetchConversations
      setTimeout(() => {
        setConversations(prev => {
          const conv = prev.find(c => c.id === data.conversation_id)
          if (conv) {
            setSelectedConversation(conv)
          }
          return prev
        })
      }, 100)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation')
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return

    try {
      setSending(true)
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message_text: newMessage.trim() }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      setNewMessage('')
      scrollToBottom()

      // Refresh conversations to update preview
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const archiveConversation = async (conversationId: string) => {
    try {
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      await fetch(`/api/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      })

      setSelectedConversation(null)
      fetchConversations()
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  const reportMessage = async () => {
    if (!reportMessageId || !reportReason.trim()) return

    try {
      setReporting(true)
      const session = await supabaseBrowser.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) return

      await fetch(`/api/conversations/messages/${reportMessageId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reportReason.trim() }),
      })

      setReportMessageId(null)
      setReportReason('')
      alert('Message reported successfully')
    } catch (error) {
      console.error('Error reporting message:', error)
      alert('Failed to report message')
    } finally {
      setReporting(false)
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
    fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    if (userType) {
      fetchConversations()
      fetchContacts()
    }

    // Subscribe to real-time updates
    const channel = supabaseBrowser
      .channel('messaging')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
        },
        () => {
          fetchConversations()
          if (selectedConversation) {
            fetchMessages(selectedConversation.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [fetchConversations, fetchContacts, selectedConversation, fetchMessages, userType])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  if (loading) {
    return (
      <Card className="w-full h-full max-h-[min(800px,calc(100vh-2rem))] min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    )
  }

  return (
    <Card className="w-full h-full max-h-[min(800px,calc(100vh-2rem))] min-h-[400px] flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {selectedConversation
              ? (selectedConversation.other_user.user_type === 'admin'
                  ? 'PhotoVault Support'
                  : selectedConversation.other_user.name)
              : 'Messages'}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r overflow-y-auto ${selectedConversation ? 'hidden md:block' : ''}`}>
          {/* Beta Feedback Banner */}
          {contacts.length > 0 && !showContactList && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-primary">
                  Beta Feedback? Message <span className="font-semibold">PhotoVault Support</span> with feature ideas!
                </p>
              </div>
            </div>
          )}

          {/* Start New Chat Button - show for ALL user types */}
          {contacts.length > 0 && conversations.length > 0 && !showContactList && (
            <div className="p-4 border-b bg-muted/50">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowContactList(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          )}

          {/* Show contacts for user to message */}
          {contacts.length > 0 && (conversations.length === 0 || showContactList) && (
            <div className="p-4 border-b bg-muted">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {conversations.length === 0 ? 'Your Contacts' : 'Start New Chat'}
                </h3>
                {conversations.length > 0 && (
                  <button
                    onClick={() => setShowContactList(false)}
                    className="text-primary hover:text-primary/80 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {/* Beta banner inside contact list when no conversations exist */}
              {conversations.length === 0 && (
                <div className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-primary">
                    Beta Feedback? Message <span className="font-semibold">PhotoVault Support</span> with feature ideas!
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      startConversation(contact.id)
                      setShowContactList(false)
                    }}
                    className="w-full p-3 bg-card rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        contact.is_admin ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {contact.is_admin ? (
                          <Shield className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                          {contact.is_admin && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Support
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.is_admin ? 'Feature requests & help' : contact.email}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversations.length === 0 && contacts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      conv.other_user.user_type === 'admin' ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      {conv.other_user.user_type === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {conv.other_user.user_type === 'admin' ? 'PhotoVault Support' : conv.other_user.name}
                          </h4>
                          {conv.other_user.user_type === 'admin' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                              Support
                            </Badge>
                          )}
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message_preview || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(conv.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat View */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-muted flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.other_user.user_type === 'admin'
                        ? 'PhotoVault Support'
                        : selectedConversation.other_user.name}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedConversation.other_user.user_type === 'admin'
                        ? 'Support'
                        : selectedConversation.other_user.user_type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => archiveConversation(selectedConversation.id)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
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
                      <div className="max-w-[70%]">
                        <div
                          className={`rounded-lg p-3 ${
                            isSender
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card text-card-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className={`text-xs ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(message.created_at)}
                          </span>
                          {!isSender && (
                            <button
                              onClick={() => setReportMessageId(message.id)}
                              className="text-xs text-muted-foreground hover:text-destructive"
                              title="Report message"
                            >
                              <Flag className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="resize-none"
                    rows={2}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Report Modal */}
      {reportMessageId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Report Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Please describe why you're reporting this message..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportMessageId(null)
                    setReportReason('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={reportMessage}
                  disabled={reporting || !reportReason.trim()}
                  className="flex-1"
                  variant="destructive"
                >
                  {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
