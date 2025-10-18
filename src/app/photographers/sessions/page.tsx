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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Camera, 
  Plus,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface PhotoSession {
  id: string
  client_id: string
  photographer_id: string
  session_date: string
  session_type: string
  description?: string
  gallery_id?: string
  commission_reset: boolean
  created_at: string
  clients?: {
    id: string
    email: string
    name: string
  }
}

interface Client {
  id: string
  email: string
  name: string
  last_payment_date: string
  status: 'active' | 'inactive'
  commission_eligible: boolean
}

export default function SessionsPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<PhotoSession[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [newSession, setNewSession] = useState({
    clientId: '',
    sessionDate: '',
    sessionType: '',
    description: ''
  })

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/new-session?photographer_id=${user?.id}`)
      const data = await response.json()
      if (data.success) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchClients = async () => {
    // Simulate fetching clients
    setClients([
      {
        id: '1',
        email: 'sarah@email.com',
        name: 'Sarah & John Smith',
        last_payment_date: '2024-01-15',
        status: 'inactive',
        commission_eligible: false
      },
      {
        id: '2',
        email: 'mike@email.com',
        name: 'Mike Johnson Family',
        last_payment_date: '2024-10-01',
        status: 'active',
        commission_eligible: true
      }
    ])
    setLoading(false)
  }

  useEffect(() => {
    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }
    fetchSessions()
    fetchClients()
  }, [userType, router, fetchSessions])

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

  const handleCreateSession = async () => {
    if (!newSession.clientId || !newSession.sessionDate) return

    setCreatingSession(true)
    
    try {
      const response = await fetch('/api/sessions/new-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: newSession.clientId,
          photographerId: user?.id,
          sessionDate: newSession.sessionDate,
          sessionType: newSession.sessionType,
          description: newSession.description
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Reset form
        setNewSession({
          clientId: '',
          sessionDate: '',
          sessionType: '',
          description: ''
        })
        
        // Refresh sessions
        await fetchSessions()
        
        // Show success message
        alert(data.message)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
    } finally {
      setCreatingSession(false)
    }
  }

  const getClientById = (clientId: string) => {
    return clients.find(client => client.id === clientId)
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
              <span className="text-xl font-bold">Photo Sessions</span>
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
            <h1 className="text-3xl font-bold mb-4">Photo Sessions & Commission Reset</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Record new photo sessions to reset commission cycles for inactive clients. This incentivizes long-term client relationships.
            </p>
          </div>

          {/* Commission Reset Info */}
          <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-6 w-6 text-green-600" />
                <span>Commission Reset Rule</span>
              </CardTitle>
              <CardDescription>
                How new sessions restore your commission eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  🎯 New Session = Commission Reset
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-3">
                  When you book a new photo session with an inactive client, their commission cycle resets and you earn 50% commission again.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700 dark:text-green-300">
                  <div>
                    <h4 className="font-medium mb-2">Before New Session:</h4>
                    <ul className="space-y-1">
                      <li>• Client inactive for 6+ months</li>
                      <li>• No commission earned</li>
                      <li>• Gallery belongs to PhotoVault</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">After New Session:</h4>
                    <ul className="space-y-1">
                      <li>• Commission cycle resets</li>
                      <li>• You earn 50% commission again</li>
                      <li>• Client relationship restored</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create New Session */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Record New Photo Session</span>
              </CardTitle>
              <CardDescription>
                Book a new session to reset commission cycle for inactive clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-select">Select Client</Label>
                  <select
                    id="client-select"
                    className="w-full p-2 border rounded-lg"
                    value={newSession.clientId}
                    onChange={(e) => setNewSession(prev => ({ ...prev, clientId: e.target.value }))}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email}) - {client.status} - {client.commission_eligible ? 'Commission Eligible' : 'No Commission'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-date">Session Date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={newSession.sessionDate}
                    onChange={(e) => setNewSession(prev => ({ ...prev, sessionDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-type">Session Type</Label>
                <Input
                  id="session-type"
                  placeholder="e.g., Wedding, Family Portrait, Newborn, etc."
                  value={newSession.sessionType}
                  onChange={(e) => setNewSession(prev => ({ ...prev, sessionType: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the session..."
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              {newSession.clientId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  {(() => {
                    const client = getClientById(newSession.clientId)
                    if (!client) return null
                    
                    return (
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Commission Impact for {client.name}
                        </h4>
                        <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                          <li>• Current Status: {client.status}</li>
                          <li>• Commission Eligible: {client.commission_eligible ? 'Yes' : 'No'}</li>
                          <li>• Last Payment: {new Date(client.last_payment_date).toLocaleDateString()}</li>
                          {!client.commission_eligible && (
                            <li>• <strong>This session will reset commission cycle!</strong></li>
                          )}
                        </ul>
                      </div>
                    )
                  })()}
                </div>
              )}

              <Button 
                onClick={handleCreateSession}
                disabled={creatingSession || !newSession.clientId || !newSession.sessionDate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creatingSession ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Recording Session...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Photo Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Recent Photo Sessions</span>
              </CardTitle>
              <CardDescription>
                Sessions that have reset commission cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No photo sessions recorded yet</p>
                  <p className="text-sm">Record your first session above to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{session.clients?.name || 'Unknown Client'}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {session.session_type} • {new Date(session.session_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.commission_reset && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Commission Reset
                            </Badge>
                          )}
                        </div>
                      </div>
                      {session.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {session.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
