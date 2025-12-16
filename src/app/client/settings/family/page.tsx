'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  Trash2,
  CreditCard,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Heart,
} from 'lucide-react'
import AccessGuard from '@/components/AccessGuard'
import Link from 'next/link'

interface Secondary {
  id: string
  email: string
  name: string
  relationship: string
  status: 'pending' | 'accepted'
  has_payment_method: boolean
  is_billing_payer: boolean
  invited_at: string
  accepted_at: string | null
  secondary_user_id: string | null
}

interface FamilyStatus {
  family_sharing_enabled: boolean
  max_secondaries: number
  current_secondary_count: number
}

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other Family' },
]

export default function FamilySettingsPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus | null>(null)
  const [secondaries, setSecondaries] = useState<Secondary[]>([])
  const [toggling, setToggling] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRelationship, setInviteRelationship] = useState('')

  // Remove confirmation dialog
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; secondary: Secondary | null }>({
    open: false,
    secondary: null,
  })

  // Redirect if not client
  useEffect(() => {
    if (!authLoading && (!user || userType !== 'client')) {
      router.push('/login')
    }
  }, [authLoading, user, userType, router])

  // Fetch family status and secondaries
  useEffect(() => {
    if (user && userType === 'client') {
      fetchFamilyData()
    }
  }, [user, userType])

  async function fetchFamilyData() {
    setLoading(true)
    setError(null)

    try {
      // Fetch family status
      const statusRes = await fetch('/api/family/enable')
      const statusData = await statusRes.json()

      if (!statusRes.ok) {
        throw new Error(statusData.error || 'Failed to fetch family status')
      }

      setFamilyStatus(statusData)

      // Fetch secondaries if enabled
      if (statusData.family_sharing_enabled) {
        const secondariesRes = await fetch('/api/family/secondaries')
        const secondariesData = await secondariesRes.json()

        if (secondariesRes.ok) {
          setSecondaries(secondariesData.secondaries || [])
        }
      }
    } catch (err) {
      console.error('Error fetching family data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load family settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleFamilySharing(enabled: boolean) {
    setToggling(true)
    setError(null)

    try {
      const res = await fetch('/api/family/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update family sharing')
      }

      setFamilyStatus(prev => prev ? { ...prev, family_sharing_enabled: enabled } : null)
      setSuccess(data.message)

      // Fetch secondaries if enabling
      if (enabled) {
        const secondariesRes = await fetch('/api/family/secondaries')
        const secondariesData = await secondariesRes.json()
        if (secondariesRes.ok) {
          setSecondaries(secondariesData.secondaries || [])
        }
      } else {
        setSecondaries([])
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error toggling family sharing:', err)
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setToggling(false)
    }
  }

  async function handleInviteSecondary(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)

    try {
      const res = await fetch('/api/family/secondaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          relationship: inviteRelationship,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(data.message || `Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteName('')
      setInviteRelationship('')

      // Refresh secondaries list
      const secondariesRes = await fetch('/api/family/secondaries')
      const secondariesData = await secondariesRes.json()
      if (secondariesRes.ok) {
        setSecondaries(secondariesData.secondaries || [])
        setFamilyStatus(prev => prev ? {
          ...prev,
          current_secondary_count: secondariesData.secondaries?.length || 0
        } : null)
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error inviting secondary:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveSecondary() {
    if (!removeDialog.secondary) return

    const secondaryId = removeDialog.secondary.id
    setRemoving(secondaryId)
    setError(null)

    try {
      const res = await fetch(`/api/family/secondaries?id=${secondaryId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove secondary')
      }

      setSuccess('Family member removed successfully')
      setSecondaries(prev => prev.filter(s => s.id !== secondaryId))
      setFamilyStatus(prev => prev ? {
        ...prev,
        current_secondary_count: Math.max(0, (prev.current_secondary_count || 1) - 1)
      } : null)
      setRemoveDialog({ open: false, secondary: null })

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error removing secondary:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setRemoving(null)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatRelationship(relationship: string) {
    return RELATIONSHIP_OPTIONS.find(r => r.value === relationship)?.label || relationship
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading family settings...</p>
        </div>
      </div>
    )
  }

  if (!user || userType !== 'client') {
    return null
  }

  const slotsRemaining = (familyStatus?.max_secondaries || 5) - (familyStatus?.current_secondary_count || 0)
  const canInvite = slotsRemaining > 0

  return (
    <AccessGuard requiredAccess="canAccessClientDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/client/settings"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Family Sharing</h1>
                  <p className="text-sm text-muted-foreground">
                    Share your photo galleries with trusted family members
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Success/Error Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {/* Enable/Disable Card */}
            <Card className="bg-card/50 border-border shadow-sm overflow-hidden">
              <div className="bg-secondary/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">Enable Family Sharing</h3>
                      <p className="text-sm text-muted-foreground">
                        Allow trusted family members to view your shared galleries
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={familyStatus?.family_sharing_enabled || false}
                    onCheckedChange={handleToggleFamilySharing}
                    disabled={toggling}
                  />
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    <strong>{familyStatus?.current_secondary_count || 0}</strong> of{' '}
                    <strong>{familyStatus?.max_secondaries || 5}</strong> family slots used
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Family members can view shared galleries and take over billing if needed.
                  They&apos;ll be notified if your account ever needs attention.
                </p>
              </CardContent>
            </Card>

            {/* Only show the rest if family sharing is enabled */}
            {familyStatus?.family_sharing_enabled && (
              <>
                {/* Secondaries List */}
                <Card className="bg-card/50 border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-pink-600" />
                      Family Members
                    </CardTitle>
                    <CardDescription>
                      {secondaries.length === 0
                        ? 'No family members added yet'
                        : `${secondaries.length} family member${secondaries.length === 1 ? '' : 's'} with access`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {secondaries.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p>No family members yet</p>
                        <p className="text-sm">Invite someone below to share your galleries</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {secondaries.map(secondary => (
                          <div
                            key={secondary.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-foreground font-semibold">
                                {secondary.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900">{secondary.name}</span>
                                  <Badge
                                    variant={secondary.status === 'accepted' ? 'default' : 'secondary'}
                                    className={
                                      secondary.status === 'accepted'
                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                    }
                                  >
                                    {secondary.status === 'accepted' ? (
                                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted</>
                                    ) : (
                                      <><Clock className="h-3 w-3 mr-1" /> Pending</>
                                    )}
                                  </Badge>
                                  {secondary.has_payment_method && (
                                    <span title="Has payment method on file">
                                      <CreditCard className="h-4 w-4 text-green-600" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{secondary.email}</span>
                                  <span className="text-foreground">•</span>
                                  <span>{formatRelationship(secondary.relationship)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Invited {formatDate(secondary.invited_at)}
                                  {secondary.accepted_at && ` • Joined ${formatDate(secondary.accepted_at)}`}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveDialog({ open: true, secondary })}
                              disabled={removing === secondary.id}
                              className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            >
                              {removing === secondary.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invite Form */}
                <Card className="bg-card/50 border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-pink-600" />
                      Invite Family Member
                    </CardTitle>
                    <CardDescription>
                      {canInvite
                        ? `You can add ${slotsRemaining} more family member${slotsRemaining === 1 ? '' : 's'}`
                        : 'You\'ve reached the maximum number of family members'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {canInvite ? (
                      <form onSubmit={handleInviteSecondary} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteName">Name</Label>
                            <Input
                              id="inviteName"
                              placeholder="Their name"
                              value={inviteName}
                              onChange={e => setInviteName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRelationship">Relationship</Label>
                            <Select
                              value={inviteRelationship}
                              onValueChange={setInviteRelationship}
                              required
                            >
                              <SelectTrigger id="inviteRelationship">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                {RELATIONSHIP_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="family@example.com"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={inviting || !inviteEmail || !inviteName || !inviteRelationship}
                          className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                        >
                          {inviting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending Invitation...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 text-foreground" />
                        <p>All family slots are filled</p>
                        <p className="text-sm mt-1">Remove a family member to add someone new</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h3 className="font-semibold text-amber-800 mb-2">How Family Sharing Works</h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Family members can view galleries you&apos;ve marked as &quot;Family Shared&quot;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>They&apos;ll be notified if your account ever needs payment attention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>They can optionally add a payment method to help keep photos protected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      <span>Private galleries you don&apos;t share will remain completely private</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, secondary: removeDialog.secondary })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Family Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeDialog.secondary?.name}</strong> from your family sharing?
              They will lose access to all shared galleries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog({ open: false, secondary: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSecondary}
              disabled={removing !== null}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccessGuard>
  )
}

