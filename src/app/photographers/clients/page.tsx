'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
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
import { supabase } from '@/lib/supabase'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  client_notes?: string
  status: string
  created_at: string
  gallery_count?: number
  photo_count?: number
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
  // Use custom hook for auth redirect (handles Next.js 15 HMR correctly)
  const { user, userType, loading: authLoading, hasAccess } = useAuthRedirect({
    requiredType: 'photographer',
  })
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    sendInvite: true
  })

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch photographer's clients from database
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('photographer_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
        setClients([])
        return
      }

      setClients(clientsData || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchGalleries = useCallback(async () => {
    try {
      // Fetch photographer's galleries from database
      const { data: galleriesData, error } = await supabase
        .from('photo_galleries')
        .select('*')
        .eq('photographer_id', user?.id)
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
  }, [user?.id])

  // Initial data load when authenticated (auth redirect handled by useAuthRedirect hook)
  useEffect(() => {
    if (!hasAccess || authLoading) return
    fetchClients()
    fetchGalleries()
    // Callbacks are stable via useCallback - including them would cause HMR loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, authLoading])

  // Show loading or redirect if not photographer
  if (userType !== 'photographer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) return

    setFormError('')
    setFormLoading(true)
    
    try {
      // Create client record in database
      const { data, error } = await supabase
        .from('clients')
        .insert({
          photographer_id: user?.id,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone || null,
          client_notes: newClient.notes || null,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setFormError('A client with this email already exists')
        } else {
          throw error
        }
        return
      }

      // TODO: Send invitation email if newClient.sendInvite is true
      if (newClient.sendInvite) {
        console.log('TODO: Send invitation email to', newClient.email)
      }
      
      // Reset form and refresh list
      setNewClient({
        name: '',
        email: '',
        phone: '',
        notes: '',
        sendInvite: true
      })
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clients</h1>
              <p className="text-muted-foreground dark:text-muted-foreground">Manage your photography clients</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Galleries</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{galleries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {galleries.reduce((sum, gallery) => sum + (gallery.photo_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Clients</CardTitle>
            <CardDescription>
              Manage your photography clients and their galleries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first photography client
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{client.name}</h3>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                          <p className="text-sm text-muted-foreground mt-2">
                            {client.client_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleContactClient(client)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/gallery/${client.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Galleries
                          </Link>
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
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Galleries</CardTitle>
              <CardDescription>
                Your latest photography galleries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleries.slice(0, 6).map((gallery) => (
                  <div key={gallery.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{gallery.gallery_name}</h4>
                      <Badge variant="outline">
                        {gallery.photo_count || 0} photos
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {gallery.gallery_description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{gallery.photo_count} photos</span>
                      {gallery.session_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(gallery.session_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <Button size="sm" variant="outline" asChild className="mt-3">
                      <Link href={`/gallery/${gallery.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Gallery
                      </Link>
                    </Button>
                  </div>
                ))}
                {galleries.length > 6 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" asChild>
                      <Link href="/dashboard">
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
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Client name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Any additional notes about this client..."
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={formLoading || !newClient.name || !newClient.email}
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