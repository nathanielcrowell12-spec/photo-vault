'use client'

import { useState, useEffect } from 'react'
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
  session_date?: string
  photo_count: number
  client_id?: string
  client_name?: string
}

export default function ClientsPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    sendInvite: true
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (userType !== 'photographer') {
        router.push('/dashboard')
      } else {
        fetchClients()
        fetchGalleries()
      }
    }
  }, [user, userType, authLoading])

  // Show loading or redirect if not photographer
  if (userType !== 'photographer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Redirecting...</p>
        </div>
      </div>
    )
  }

  const fetchClients = async () => {
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

      // For each client, count their galleries
      const clientsWithCounts = await Promise.all(
        (clientsData || []).map(async (client) => {
          // Check if client has a user_id (registered PhotoVault user)
          const { data: galleries } = await supabase
            .from('galleries')
            .select('id, photo_count')
            .eq('photographer_id', user?.id)
            .or(`user_id.eq.${client.id}`)

          return {
            ...client,
            gallery_count: galleries?.length || 0,
            photo_count: galleries?.reduce((sum, g) => sum + (g.photo_count || 0), 0) || 0
          }
        })
      )

      setClients(clientsWithCounts)
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleries = async () => {
    try {
      // Fetch photographer's galleries
      const { data: galleriesData, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('photographer_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching galleries:', error)
        setGalleries([])
        return
      }

      // Map galleries with client info
      const galleriesWithClients = await Promise.all(
        (galleriesData || []).map(async (gallery) => {
          if (gallery.user_id) {
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('id', gallery.user_id)
              .eq('photographer_id', user?.id)
              .single()

            return {
              ...gallery,
              client_id: gallery.user_id,
              client_name: client?.name || 'Unknown'
            }
          }
          return gallery
        })
      )

      setGalleries(galleriesWithClients)
    } catch (error) {
      console.error('Error fetching galleries:', error)
      setGalleries([])
    }
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
    window.location.href = `mailto:${client.email}?subject=Message from your photographer`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Client Management</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Client Management</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Create client accounts, upload galleries, and send payment reminders. PhotoVault handles all billing automatically.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{clients.length}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{galleries.length}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Galleries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + (c.photo_count || 0), 0)}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Photos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Create New Client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <span>Create New Client</span>
                </CardTitle>
                <CardDescription>
                  Add a new client and prepare for photo session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    required
                    placeholder="e.g., Sarah & John Smith"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email Address *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    required
                    placeholder="client@email.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone Number (Optional)</Label>
                  <Input
                    id="client-phone"
                    placeholder="(555) 123-4567"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-notes">Notes (Optional)</Label>
                  <Textarea
                    id="client-notes"
                    placeholder="Session details, special requests, etc."
                    value={newClient.notes}
                    onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={newClient.sendInvite}
                    onChange={(e) => setNewClient(prev => ({ ...prev, sendInvite: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="sendInvite" className="text-sm cursor-pointer">
                    Send invitation email to join PhotoVault
                  </Label>
                </div>
                
                <Button 
                  onClick={handleCreateClient}
                  disabled={formLoading || !newClient.name || !newClient.email}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Client...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Client Account
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Reminder Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  <span>Payment Reminders</span>
                </CardTitle>
                <CardDescription>
                  How PhotoVault handles billing for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    💰 Automatic Billing Process
                  </h3>
                  <ol className="space-y-2 text-sm text-green-700 dark:text-green-300">
                    <li>1. You create client account and upload photos</li>
                    <li>2. PhotoVault sends payment reminder email to client</li>
                    <li>3. Client pays PhotoVault $8/month directly</li>
                    <li>4. You receive $4/month commission automatically</li>
                    <li>5. Client gets gallery access after payment</li>
                  </ol>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Benefits for You:</h4>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>• No payment processing needed</li>
                    <li>• Automatic commission payments</li>
                    <li>• Professional payment reminders</li>
                    <li>• Client retention through PhotoVault</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clients List */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Clients</CardTitle>
              <CardDescription>
                Manage client accounts and track payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300">Loading clients...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first client using the form above
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            <Badge variant={client.status === 'active' ? 'default' : 'outline'}>
                              {client.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${client.email}`} className="hover:text-primary">
                                {client.email}
                              </a>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${client.phone}`} className="hover:text-primary">
                                  {client.phone}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Added {new Date(client.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{client.gallery_count || 0}</span>
                              <span className="text-muted-foreground">
                                {client.gallery_count === 1 ? 'gallery' : 'galleries'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{client.photo_count || 0}</span>
                              <span className="text-muted-foreground">photos</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleContactClient(client)}>
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

          {/* Galleries List */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Galleries</CardTitle>
              <CardDescription>
                Your latest photo galleries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {galleries.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No galleries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first gallery to get started
                  </p>
                  <Button asChild>
                    <Link href="/dashboard">
                      <Upload className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {galleries.slice(0, 5).map((gallery) => (
                    <div key={gallery.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{gallery.gallery_name}</h3>
                            {gallery.client_name && (
                              <Badge variant="outline" className="text-xs">
                                {gallery.client_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{gallery.photo_count} photos</span>
                            {gallery.session_date && (
                              <>
                                <span>•</span>
                                <span>{new Date(gallery.session_date).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/gallery/${gallery.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Gallery
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {galleries.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/dashboard">
                          View All Galleries
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
