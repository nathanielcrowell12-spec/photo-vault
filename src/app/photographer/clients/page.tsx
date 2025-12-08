'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Camera, 
  Plus,
  Users,
  Mail,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Send,
  CreditCard,
  Phone,
  Calendar,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Search,
  UserPlus,
  Upload
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

      // Fetch photographer's clients from database
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false })

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
      // Fetch photographer's galleries from database
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

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not photographer (after userType is loaded)
  if (userType && userType !== 'photographer') {
    router.push('/dashboard')
    return null
  }

  // Check if email already exists (email detection for cross-photographer linking)
  const checkExistingEmail = async (email: string) => {
    if (!email || !email.includes('@')) return

    try {
      // Check if this email exists for ANY photographer
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      if (data && data.photographer_id !== user?.id) {
        // Email exists and belongs to another photographer
        setExistingClientInfo(data)
        setLinkExistingClient(true)
        setFormError(
          `This email is already registered with another photographer. Creating this client will link them to your account while maintaining the existing primary photographer relationship.`
        )
      } else if (data && data.photographer_id === user?.id) {
        // Email exists and belongs to this photographer
        setFormError('You already have a client with this email address.')
      } else {
        // Email doesn't exist - new client
        setExistingClientInfo(null)
        setLinkExistingClient(false)
        setFormError('')
      }
    } catch (error) {
      // No existing client found
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
        // Link to existing client - do NOT create new record
        // The existing client keeps their primary_photographer_id
        // This photographer can create galleries for them, but won't earn monthly commission
        console.log('[Clients] Linking to existing client:', existingClientInfo.id)

        // Note: No database changes needed. When photographer creates a gallery,
        // they'll select this client via email detection in the gallery creation flow.
        // The clients table maintains ONE record per email address.

        setFormError('')
        alert(`Client linked! Note: ${existingClientInfo.name} already has galleries with another photographer. You can create new galleries for them, but the original photographer will continue earning monthly commission.`)

      } else {
        // Create new client record
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
          if (error.code === '23505') { // Unique constraint violation
            setFormError('A client with this email already exists. Please check the email and try again.')
          } else {
            throw error
          }
          return
        }

        console.log('[Clients] New client created:', data.id)

        // TODO: Send invitation email if newClient.sendInvite is true
        if (newClient.sendInvite) {
          console.log('TODO: Send invitation email to', newClient.email)
        }
      }

      // Reset form and refresh list
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

  const handleContactClient = (client: Client) => {
    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${client.email}?subject=Message from your photographer`
    }
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.phone && client.phone.includes(searchQuery))
  )

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="text-neutral-400 hover:text-white">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">Clients</h1>
              <p className="text-neutral-400">Manage your photography clients</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{clients.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">Active Galleries</CardTitle>
              <Camera className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{galleries.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.03] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-400">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {galleries.reduce((sum, gallery) => sum + (gallery.photo_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="bg-neutral-800/50 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-neutral-100">Your Clients</CardTitle>
                <CardDescription className="text-neutral-400">
                  Manage your photography clients and their galleries
                </CardDescription>
              </div>
              {clients.length > 0 && (
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-neutral-100">No clients yet</h3>
                <p className="text-neutral-400 mb-4">
                  Start by adding your first photography client
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-amber-500 hover:bg-amber-600 text-black">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-neutral-100">No clients found</h3>
                <p className="text-neutral-400 mb-4">
                  Try adjusting your search query
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')} className="border-white/10 text-neutral-300 hover:bg-white/5">
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div key={client.id} className="border border-white/10 bg-white/[0.03] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-neutral-100">{client.name}</h3>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="bg-green-500/20 text-green-400 border-green-500/30">
                            {client.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(client.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {client.client_notes && (
                          <p className="text-sm text-neutral-400 mt-2">
                            {client.client_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleContactClient(client)} className="border-white/10 text-neutral-300 hover:bg-white/5">
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Galleries */}
        {galleries.length > 0 && (
          <Card className="mt-8 bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-neutral-100">Recent Galleries</CardTitle>
              <CardDescription className="text-neutral-400">
                Your latest photography galleries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleries.slice(0, 6).map((gallery) => (
                  <div key={gallery.id} className="border border-white/10 bg-white/[0.03] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-100">{gallery.gallery_name}</h4>
                      <Badge variant="outline" className="border-white/20 text-neutral-300">
                        {gallery.photo_count || 0} photos
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-400 mb-3">
                      {gallery.gallery_description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <span>{gallery.photo_count} photos</span>
                      {gallery.session_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(gallery.session_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <Button size="sm" variant="outline" asChild className="mt-3 border-white/10 text-neutral-300 hover:bg-white/5">
                      <Link href={`/gallery/${gallery.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Gallery
                      </Link>
                    </Button>
                  </div>
                ))}
                {galleries.length > 6 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild className="border-white/10 text-neutral-300 hover:bg-white/5">
                      <Link href="/photographer/dashboard">
                        View All Galleries
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-neutral-100">Add New Client</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-neutral-300">Name *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Client name"
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-neutral-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  onBlur={(e) => checkExistingEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
                {linkExistingClient && existingClientInfo && (
                  <p className="text-xs text-amber-400 mt-1">
                    ℹ️ This client exists with {existingClientInfo.name}. You can still add them to your client list.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="text-neutral-300">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-neutral-300">Address</Label>
                <Textarea
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                  rows={2}
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-neutral-300">Notes (Private)</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Any additional notes about this client (photographer only)..."
                  rows={2}
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
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
                className="border-white/10 text-neutral-300 hover:bg-white/5"
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