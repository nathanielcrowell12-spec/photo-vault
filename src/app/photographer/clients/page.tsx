'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Camera,
  Plus,
  Users,
  Eye,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Search,
  UserPlus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  client_notes?: string
  status: string
  created_at: string
  gallery_count?: number
  photo_count?: number
  primary_photographer_id?: string
  photographer_id?: string
}

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  photo_count?: number
  session_date?: string
  user_id?: string
  client_id?: string
  client_name?: string
}

export default function ClientsPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [linkExistingClient, setLinkExistingClient] = useState(false)
  const [existingClientInfo, setExistingClientInfo] = useState<Client | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    sendInvite: true
  })

  const fetchClients = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // CHANGED: Sort by name alphabetically instead of created_at
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('photographer_id', user.id)
        .order('name', { ascending: true })

      console.log('[Clients] Fetch result:', { clientsData, error })

      if (error) {
        console.error('[Clients] Error fetching clients:', error)
        setClients([])
        return
      }

      setClients(clientsData || [])
      console.log('[Clients] Set clients:', clientsData?.length || 0)
    } catch (error) {
      console.error('[Clients] Error fetching clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleries = async () => {
    if (!user?.id) return

    try {
      const { data: galleriesData, error } = await supabase
        .from('photo_galleries')
        .select('*')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching galleries:', error)
        setGalleries([])
        return
      }

      setGalleries(galleriesData || [])
    } catch (error) {
      console.error('Error fetching galleries:', error)
      setGalleries([])
    }
  }

  useEffect(() => {
    console.log('[Clients] useEffect triggered:', { userId: user?.id, userType, authLoading })

    if (authLoading) {
      console.log('[Clients] Still loading auth...')
      return
    }

    if (!user) {
      console.log('[Clients] No user, redirecting to login')
      router.push('/login')
      return
    }

    if (userType === 'photographer') {
      console.log('[Clients] User is photographer, fetching data')
      fetchClients()
      fetchGalleries()
    } else if (userType) {
      console.log('[Clients] User is not photographer, redirecting')
      router.push('/dashboard')
    } else {
      console.log('[Clients] Waiting for userType to load...')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userType, authLoading])

  // NEW: Group galleries by client_id using useMemo
  const galleriesByClient = useMemo(() => {
    const grouped: Record<string, Gallery[]> = {}
    galleries.forEach(gallery => {
      if (gallery.client_id) {
        if (!grouped[gallery.client_id]) {
          grouped[gallery.client_id] = []
        }
        grouped[gallery.client_id].push(gallery)
      }
    })
    return grouped
  }, [galleries])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (userType && userType !== 'photographer') {
    router.push('/dashboard')
    return null
  }

  const checkExistingEmail = async (email: string) => {
    if (!email || !email.includes('@')) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (data && data.photographer_id !== user?.id) {
        setExistingClientInfo(data)
        setLinkExistingClient(true)
        setFormError(
          `This email is already registered with another photographer. Creating this client will link them to your account while maintaining the existing primary photographer relationship.`
        )
      } else if (data && data.photographer_id === user?.id) {
        setFormError('You already have a client with this email address.')
      } else {
        setExistingClientInfo(null)
        setLinkExistingClient(false)
        setFormError('')
      }
    } catch (error) {
      setExistingClientInfo(null)
      setLinkExistingClient(false)
      setFormError('')
    }
  }

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) return

    setFormError('')
    setFormLoading(true)

    try {
      if (linkExistingClient && existingClientInfo) {
        console.log('[Clients] Linking to existing client:', existingClientInfo.id)
        setFormError('')
        alert(`Client linked! Note: ${existingClientInfo.name} already has galleries with another photographer. You can create new galleries for them, but the original photographer will continue earning monthly commission.`)
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            photographer_id: user?.id,
            name: newClient.name,
            email: newClient.email.toLowerCase(),
            phone: newClient.phone || null,
            address: newClient.address || null,
            client_notes: newClient.notes || null,
            status: 'active'
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            setFormError('A client with this email already exists. Please check the email and try again.')
          } else {
            throw error
          }
          return
        }

        console.log('[Clients] New client created:', data.id)

        if (newClient.sendInvite) {
          console.log('TODO: Send invitation email to', newClient.email)
        }
      }

      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        sendInvite: true
      })
      setLinkExistingClient(false)
      setExistingClientInfo(null)
      setShowAddModal(false)
      fetchClients()

    } catch (error) {
      console.error('Error creating client:', error)
      setFormError('Failed to add client. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  // NEW: Toggle expand/collapse for client galleries
  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  // CHANGED: Filter by client name only (not email/phone)
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header - unchanged */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clients</h1>
              <p className="text-muted-foreground">Manage your photography clients</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards - unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{clients.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Galleries</CardTitle>
              <Camera className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{galleries.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {galleries.reduce((sum, gallery) => sum + (gallery.photo_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List - REDESIGNED */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Your Clients</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Clients listed alphabetically with their galleries
                </CardDescription>
              </div>
              {clients.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">No clients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first photography client
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">No clients found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search query
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')} className="border-border text-muted-foreground hover:bg-muted">
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => {
                  const clientGalleries = galleriesByClient[client.id] || []
                  const isExpanded = expandedClients.has(client.id)

                  return (
                    <div key={client.id} className="border border-border bg-card rounded-lg overflow-hidden">
                      {/* Client Header - clickable to expand */}
                      <div
                        className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={() => toggleClientExpanded(client.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h3 className="font-medium text-foreground">{client.name}</h3>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {clientGalleries.length} {clientGalleries.length === 1 ? 'gallery' : 'galleries'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Galleries - shown when expanded */}
                      {isExpanded && (
                        <div className="border-t border-border bg-background/30">
                          {clientGalleries.length === 0 ? (
                            <div className="p-4 pl-11 text-sm text-muted-foreground italic">
                              No galleries yet
                            </div>
                          ) : (
                            <div className="p-2 pl-11 space-y-2">
                              {clientGalleries.map((gallery) => (
                                <div
                                  key={gallery.id}
                                  className="flex items-center justify-between p-2 rounded hover:bg-white/[0.02]"
                                >
                                  <div className="flex items-center gap-3">
                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-foreground">{gallery.gallery_name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      ({gallery.photo_count || 0} photos)
                                    </span>
                                  </div>
                                  <Button size="sm" variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                                    <Link href={`/gallery/${gallery.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* REMOVED: Recent Galleries section - galleries now shown under each client */}
      </main>

      {/* Add Client Modal - unchanged */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-foreground">Add New Client</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-muted-foreground">Name *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Client name"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  onBlur={(e) => checkExistingEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
                {linkExistingClient && existingClientInfo && (
                  <p className="text-xs text-amber-400 mt-1">
                    This client exists with {existingClientInfo.name}. You can still add them to your client list.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="text-muted-foreground">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-muted-foreground">Address</Label>
                <Textarea
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  rows={2}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-muted-foreground">Notes (Private)</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Any additional notes about this client (photographer only)..."
                  rows={2}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={formLoading}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={formLoading || !newClient.name || !newClient.email}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}