'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  DollarSign,
  Package,
  Calendar,
  UserPlus,
  Loader2,
  AlertCircle,
  Info,
  Plus,
  Download,
  CreditCard,
  Tag,
  Check,
  Zap,
  Eye,
  Send,
  Shield
} from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { PeopleTagInput } from '@/components/ui/people-tag-input'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import {
  getPhotographerPaymentOptions,
  calculateAllInOnePricing,
  getPaymentOptionSummary,
  type PaymentOption
} from '@/lib/payment-models'
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'
import { calculateTimeFromSignup } from '@/lib/analytics/client-helpers'

// ============================================================================
// Types
// ============================================================================

interface Client {
  id: string
  name: string
  email: string
  phone?: string
}

type BillingMode = 'storage_only' | 'all_in_one' | 'external'
type PaymentTiming = 'before_access' | 'after_proofing' | 'external'
type PresetFlow = 'classic' | 'proof_first' | 'deliver_and_done'
type AiEditsPermission = 'not_allowed' | 'allowed' | 'approval_required'

const WIZARD_STEPS = [
  { id: 1, label: 'Client', icon: UserPlus },
  { id: 2, label: 'Details', icon: Camera },
  { id: 3, label: 'Delivery', icon: Send },
  { id: 4, label: 'Pricing', icon: DollarSign },
  { id: 5, label: 'Review', icon: Check },
] as const

const PRESET_FLOWS: {
  id: PresetFlow
  name: string
  description: string
  icon: typeof Zap
  settings: {
    paymentTiming: PaymentTiming
    billingMode: BillingMode
    proofingEnabled: boolean
    proofingDeadlineDays: number | null
    aiEditsPermission: AiEditsPermission
  }
}[] = [
  {
    id: 'classic',
    name: 'Classic PhotoVault',
    description: 'Client pays before viewing. Standard gallery experience.',
    icon: Shield,
    settings: {
      paymentTiming: 'before_access',
      billingMode: 'all_in_one',
      proofingEnabled: false,
      proofingDeadlineDays: null,
      aiEditsPermission: 'not_allowed',
    },
  },
  {
    id: 'proof_first',
    name: 'Proof First, Pay Later',
    description: 'Client reviews and selects favorites before paying.',
    icon: Eye,
    settings: {
      paymentTiming: 'after_proofing',
      billingMode: 'all_in_one',
      proofingEnabled: true,
      proofingDeadlineDays: 14,
      aiEditsPermission: 'allowed',
    },
  },
  {
    id: 'deliver_and_done',
    name: 'Deliver and Done',
    description: 'You handle billing elsewhere. Gallery access with no paywall.',
    icon: Zap,
    settings: {
      paymentTiming: 'external',
      billingMode: 'external',
      proofingEnabled: false,
      proofingDeadlineDays: null,
      aiEditsPermission: 'not_allowed',
    },
  },
]

// ============================================================================
// Step Indicator Component
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Wizard progress" className="flex items-center justify-between max-w-2xl mx-auto mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const StepIcon = step.icon
        const isActive = step.id === currentStep
        const isComplete = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${isComplete ? 'bg-primary border-primary text-primary-foreground' : ''}
                  ${isActive ? 'border-primary text-primary bg-primary/10' : ''}
                  ${!isActive && !isComplete ? 'border-muted-foreground/30 text-muted-foreground/50' : ''}
                `}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground/50'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-1rem] ${
                  step.id < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function CreateGalleryPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const track = useTrackEvent()

  // Wizard state
  const [step, setStep] = useState(1)
  const [selectedPreset, setSelectedPreset] = useState<PresetFlow | null>(null)

  // Client selection
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loadingClients, setLoadingClients] = useState(true)
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  // Gallery details
  const [galleryName, setGalleryName] = useState('')
  const [galleryDescription, setGalleryDescription] = useState('')
  // Delivery settings (new wizard fields)
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('before_access')
  const [proofingEnabled, setProofingEnabled] = useState(false)
  const [proofingDeadlineDays, setProofingDeadlineDays] = useState<number | null>(null)
  const [aiEditsPermission, setAiEditsPermission] = useState<AiEditsPermission>('not_allowed')

  // Billing mode and pricing
  const [billingMode, setBillingMode] = useState<BillingMode>('all_in_one')
  const [shootFee, setShootFee] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState('')

  // Get payment options from our payment-models.ts
  const paymentOptions = useMemo(() => getPhotographerPaymentOptions(), [])

  // Metadata fields
  const [eventDate, setEventDate] = useState<Date | null>(null)
  const [location, setLocation] = useState('')
  const [people, setPeople] = useState<string[]>([])
  const [eventType, setEventType] = useState('')
  const [photographerName, setPhotographerName] = useState('')
  const [notes, setNotes] = useState('')

  // Form state
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // ============================================================================
  // Preset Application
  // ============================================================================

  const applyPreset = (presetId: PresetFlow) => {
    const preset = PRESET_FLOWS.find(p => p.id === presetId)
    if (!preset) return

    setSelectedPreset(presetId)
    setPaymentTiming(preset.settings.paymentTiming)
    setBillingMode(preset.settings.billingMode)
    setProofingEnabled(preset.settings.proofingEnabled)
    setProofingDeadlineDays(preset.settings.proofingDeadlineDays)
    setAiEditsPermission(preset.settings.aiEditsPermission)

    // For Deliver and Done, clear pricing since there's no paywall
    if (presetId === 'deliver_and_done') {
      setShootFee('')
      setSelectedPackageId('')
    }
  }

  // ============================================================================
  // Client Fetching
  // ============================================================================

  const fetchClients = async () => {
    if (!user?.id) return

    try {
      setLoadingClients(true)
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('photographer_id', user.id)
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (userType !== 'photographer') {
      router.push('/dashboard')
      return
    }

    fetchClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userType, authLoading])

  // ============================================================================
  // Client Creation
  // ============================================================================

  const handleAddClient = async () => {
    if (!newClientForm.name || !newClientForm.email) {
      setError('Name and email are required to add a client')
      return
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          photographer_id: user?.id,
          name: newClientForm.name,
          email: newClientForm.email.toLowerCase(),
          phone: newClientForm.phone || null,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setError('A client with this email already exists')
        } else {
          throw error
        }
        return
      }

      setClients([...clients, data])
      setSelectedClientId(data.id)
      setShowAddClient(false)
      setNewClientForm({ name: '', email: '', phone: '' })
      setError('')
    } catch (err) {
      console.error('Error adding client:', err)
      setError('Failed to add client. Please try again.')
    }
  }

  // ============================================================================
  // Pricing Calculations
  // ============================================================================

  const selectedPackage = useMemo(() => {
    return paymentOptions.find(p => p.id === selectedPackageId)
  }, [paymentOptions, selectedPackageId])

  const pricingSummary = useMemo(() => {
    const shootFeeNum = parseFloat(shootFee) || 0

    if (billingMode === 'external') {
      return {
        mode: 'external' as const,
        shootFee: 0,
        storageFee: 0,
        totalAmount: 0,
        photographerPayout: 0,
        photovaultRevenue: 0,
        stripeFees: 0,
        isShootOnly: false,
      }
    }

    if (billingMode === 'storage_only') {
      const storageFee = selectedPackage?.price || 0
      const storageCommission = (storageFee * (selectedPackage?.photographer_commission || 0)) / 100

      return {
        mode: 'storage_only' as const,
        shootFee: 0,
        storageFee,
        totalAmount: storageFee,
        photographerPayout: storageCommission,
        photovaultRevenue: storageFee - storageCommission,
        stripeFees: storageFee > 0 ? Math.round((storageFee * 0.029 + 0.30) * 100) / 100 : 0,
        isShootOnly: selectedPackageId === 'shoot_only'
      }
    } else {
      const pricing = calculateAllInOnePricing(shootFeeNum, selectedPackageId)
      if (!pricing) {
        return {
          mode: 'all_in_one' as const,
          shootFee: shootFeeNum,
          storageFee: 0,
          totalAmount: shootFeeNum,
          photographerPayout: shootFeeNum,
          photovaultRevenue: 0,
          stripeFees: shootFeeNum > 0 ? Math.round((shootFeeNum * 0.029 + 0.30) * 100) / 100 : 0,
          isShootOnly: selectedPackageId === 'shoot_only'
        }
      }

      return {
        mode: 'all_in_one' as const,
        shootFee: pricing.shoot_fee,
        storageFee: pricing.storage_fee,
        totalAmount: pricing.total_amount,
        photographerPayout: pricing.photographer_receives,
        photovaultRevenue: pricing.photovault_receives,
        stripeFees: pricing.stripe_fees_estimate,
        isShootOnly: selectedPackageId === 'shoot_only'
      }
    }
  }, [billingMode, shootFee, selectedPackageId, selectedPackage])

  const getExpiryDate = () => {
    if (paymentTiming === 'external') {
      // Deliver and Done: 6 months
      const now = new Date()
      return new Date(now.setMonth(now.getMonth() + 6))
    }
    const now = new Date()
    switch (selectedPackageId) {
      case 'year_package':
        return new Date(now.setMonth(now.getMonth() + 12))
      case 'six_month_package':
      case 'six_month_trial':
        return new Date(now.setMonth(now.getMonth() + 6))
      case 'shoot_only':
        return new Date(now.setDate(now.getDate() + 90))
      default:
        return null
    }
  }

  // ============================================================================
  // Step Validation
  // ============================================================================

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!selectedClientId
      case 2: return !!galleryName
      case 3: return true // delivery settings always have defaults
      case 4:
        if (paymentTiming === 'external') return true // no pricing needed
        return !!selectedPackageId && (billingMode !== 'all_in_one' || shootFee !== '')
      case 5: return true
      default: return false
    }
  }

  // ============================================================================
  // Gallery Creation
  // ============================================================================

  const handleCreateGallery = async () => {
    setCreating(true)
    setError('')

    try {
      const { count: existingGalleryCount } = await supabase
        .from('photo_galleries')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', user?.id)

      const isFirstGallery = (existingGalleryCount || 0) === 0

      const shootFeeNum = parseFloat(shootFee) || 0
      const shootFeeCents = Math.round(shootFeeNum * 100)
      const storageFeeCents = Math.round((selectedPackage?.price || 0) * 100)
      const totalCents = paymentTiming === 'external'
        ? 0
        : billingMode === 'all_in_one'
          ? shootFeeCents + storageFeeCents
          : storageFeeCents

      const expiryDate = getExpiryDate()

      // Calculate proofing deadline
      const proofingDeadline = proofingEnabled && proofingDeadlineDays
        ? new Date(Date.now() + proofingDeadlineDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: user?.id,
          client_id: selectedClientId,
          gallery_name: galleryName,
          gallery_description: galleryDescription || null,
          session_date: eventDate?.toISOString().split('T')[0] || null,
          photo_count: 0,
          platform: 'photovault',
          gallery_status: 'draft',
          // Pricing fields
          payment_option_id: paymentTiming === 'external' ? null : selectedPackageId,
          billing_mode: billingMode,
          shoot_fee: billingMode === 'all_in_one' ? shootFeeCents : 0,
          storage_fee: paymentTiming === 'external' ? 0 : storageFeeCents,
          total_amount: totalCents,
          payment_status: paymentTiming === 'external' ? 'external' : 'pending',
          gallery_expires_at: expiryDate?.toISOString() || null,
          // Download tracking for shoot_only
          download_tracking_enabled: selectedPackageId === 'shoot_only',
          total_photos_to_download: 0,
          photos_downloaded: 0,
          all_photos_downloaded: false,
          // Wizard fields (new)
          payment_timing: paymentTiming,
          proofing_enabled: proofingEnabled,
          proofing_deadline: proofingDeadline,
          ai_edits_permission: aiEditsPermission,
          preset_flow: selectedPreset,
          // Metadata fields for search
          event_date: eventDate?.toISOString().split('T')[0] || null,
          location: location || null,
          people: people.length > 0 ? people : [],
          event_type: eventType || null,
          photographer_name: photographerName || null,
          notes: notes || null
        })
        .select()
        .single()

      if (galleryError) throw galleryError

      const timeFromSignup = calculateTimeFromSignup(user?.created_at)
      track(EVENTS.PHOTOGRAPHER_CREATED_GALLERY, {
        gallery_id: gallery.id,
        is_first_gallery: isFirstGallery,
        photo_count: 0,
        time_from_signup_seconds: timeFromSignup ?? 0,
      })

      router.push(`/photographer/galleries/${gallery.id}/upload`)

    } catch (err: any) {
      console.error('Error creating gallery:', err)
      const errorMessage = err?.message || err?.details || err?.hint || 'Failed to create gallery. Please try again.'
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  // ============================================================================
  // Loading / Auth Guards
  // ============================================================================

  if (authLoading || loadingClients) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (userType !== 'photographer') {
    return null
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const selectedClient = clients.find(c => c.id === selectedClientId)

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create New Gallery
              </h1>
              <p className="text-muted-foreground">
                Set up your client gallery with delivery preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Preset Flow Cards — shown before Step 1 or on Step 1 */}
        {step === 1 && !selectedPreset && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-1">Quick Start</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a preset to auto-fill settings, or skip to customize everything manually.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESET_FLOWS.map((preset) => {
                const PresetIcon = preset.icon
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="text-left p-4 rounded-lg border-2 border-border hover:border-primary transition-colors bg-card/50 hover:bg-card group"
                  >
                    <PresetIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                    <h3 className="font-semibold text-foreground">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground mt-3 underline"
            >
              Skip presets — I&apos;ll configure manually
            </button>
          </div>
        )}

        {/* Selected Preset Badge */}
        {selectedPreset && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Preset:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
              {PRESET_FLOWS.find(p => p.id === selectedPreset)?.name}
            </span>
            <button
              onClick={() => setSelectedPreset(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Change
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Step Content */}
        <div className="grid gap-8">
          {/* ================================================================ */}
          {/* Step 1: Client Selection */}
          {/* ================================================================ */}
          {step === 1 && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <UserPlus className="h-5 w-5" />
                  Client Selection
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Choose an existing client or add a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showAddClient ? (
                  <>
                    <div>
                      <Label htmlFor="client" className="text-muted-foreground">Select Client *</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Choose a client..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id} className="text-foreground hover:bg-muted">
                              {client.name} ({client.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddClient(true)}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Client
                    </Button>
                  </>
                ) : (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-background">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Add New Client</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddClient(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <Label htmlFor="newClientName" className="text-muted-foreground">Name *</Label>
                        <Input
                          id="newClientName"
                          value={newClientForm.name}
                          onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                          placeholder="Client name"
                          className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientEmail" className="text-muted-foreground">Email *</Label>
                        <Input
                          id="newClientEmail"
                          type="email"
                          value={newClientForm.email}
                          onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                          placeholder="client@example.com"
                          className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newClientPhone" className="text-muted-foreground">Phone</Label>
                        <Input
                          id="newClientPhone"
                          value={newClientForm.phone}
                          onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <Button onClick={handleAddClient} className="bg-amber-500 hover:bg-amber-600 text-black">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ================================================================ */}
          {/* Step 2: Gallery Details + Metadata */}
          {/* ================================================================ */}
          {step === 2 && (
            <>
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Camera className="h-5 w-5" />
                    Gallery Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Basic information about this photo session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="galleryName" className="text-muted-foreground">Gallery Name *</Label>
                    <Input
                      id="galleryName"
                      value={galleryName}
                      onChange={(e) => setGalleryName(e.target.value)}
                      placeholder="e.g., Smith Wedding, Family Session 2025"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="galleryDescription" className="text-muted-foreground">Description</Label>
                    <Textarea
                      id="galleryDescription"
                      value={galleryDescription}
                      onChange={(e) => setGalleryDescription(e.target.value)}
                      placeholder="Optional description for this gallery"
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventDate" className="text-muted-foreground">Session Date</Label>
                    <DatePicker
                      id="eventDate"
                      value={eventDate}
                      onChange={(date) => setEventDate(date || null)}
                      placeholder="When did this session take place?"
                      className="w-full bg-background border-border text-foreground"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Metadata (collapsible feel — all optional) */}
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Tag className="h-5 w-5" />
                    Metadata
                    <span className="text-sm font-normal text-muted-foreground">(optional)</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Makes this gallery easier to find later
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="location" className="text-muted-foreground">Location</Label>
                    <LocationAutocomplete
                      value={location}
                      onChange={setLocation}
                      placeholder="e.g., Central Park, Madison"
                    />
                  </div>

                  <div>
                    <Label htmlFor="people" className="text-muted-foreground">People in Photos</Label>
                    <PeopleTagInput
                      value={people}
                      onChange={setPeople}
                      placeholder="Add names (press Enter)..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="eventType" className="text-muted-foreground">Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select event type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="wedding" className="text-foreground hover:bg-muted">Wedding</SelectItem>
                        <SelectItem value="birthday" className="text-foreground hover:bg-muted">Birthday</SelectItem>
                        <SelectItem value="family" className="text-foreground hover:bg-muted">Family Session</SelectItem>
                        <SelectItem value="portrait" className="text-foreground hover:bg-muted">Portrait</SelectItem>
                        <SelectItem value="graduation" className="text-foreground hover:bg-muted">Graduation</SelectItem>
                        <SelectItem value="corporate" className="text-foreground hover:bg-muted">Corporate</SelectItem>
                        <SelectItem value="other" className="text-foreground hover:bg-muted">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="photographerName" className="text-muted-foreground">Photographer Name</Label>
                    <Input
                      id="photographerName"
                      value={photographerName}
                      onChange={(e) => setPhotographerName(e.target.value)}
                      placeholder="Leave blank to use your profile name"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-muted-foreground">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional details about this session..."
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ================================================================ */}
          {/* Step 3: Delivery Settings (NEW) */}
          {/* ================================================================ */}
          {step === 3 && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Send className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  How should your client receive and interact with this gallery?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Timing */}
                <div>
                  <Label className="text-foreground font-medium mb-3 block">Payment Timing</Label>
                  <RadioGroup
                    value={paymentTiming}
                    onValueChange={(value) => {
                      setPaymentTiming(value as PaymentTiming)
                      if (value === 'external') {
                        setBillingMode('external')
                      } else if (billingMode === 'external') {
                        setBillingMode('all_in_one')
                      }
                    }}
                    className="grid gap-3"
                  >
                    <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-card cursor-pointer">
                      <RadioGroupItem value="before_access" id="timing_before" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="timing_before" className="font-medium cursor-pointer text-foreground">
                          Pay Before Access
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client pays through PhotoVault before viewing photos. Standard gallery flow.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-card cursor-pointer">
                      <RadioGroupItem value="after_proofing" id="timing_after" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="timing_after" className="font-medium cursor-pointer text-foreground">
                          Pay After Proofing
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client reviews photos and submits preferences first, then pays. Builds confidence before purchase.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-card cursor-pointer">
                      <RadioGroupItem value="external" id="timing_external" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="timing_external" className="font-medium cursor-pointer text-foreground">
                          External Payment (No Paywall)
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          You handle billing separately (HoneyBook, Square, cash). Client gets direct access. Gallery expires in 6 months.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Proofing Toggle */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground font-medium">Client Proofing</Label>
                      <p className="text-sm text-muted-foreground">
                        Let clients select filter preferences and leave notes per photo
                      </p>
                    </div>
                    <Switch
                      checked={proofingEnabled}
                      onCheckedChange={setProofingEnabled}
                    />
                  </div>

                  {proofingEnabled && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      <div>
                        <Label htmlFor="proofingDeadline" className="text-muted-foreground">
                          Proofing Deadline (days)
                        </Label>
                        <Select
                          value={proofingDeadlineDays?.toString() ?? 'none'}
                          onValueChange={(v) => setProofingDeadlineDays(v === 'none' ? null : parseInt(v))}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground w-48">
                            <SelectValue placeholder="No deadline" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="none">No deadline</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="21">21 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Proofing auto-closes after this period. Leave blank for no deadline.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Edits (Phase 2 — show toggle for future) */}
                <div className="border border-border rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground font-medium">AI Edits (Coming Soon)</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow clients to request filter-based edits on delivered photos
                      </p>
                    </div>
                    <Select
                      value={aiEditsPermission}
                      onValueChange={(v) => setAiEditsPermission(v as AiEditsPermission)}
                      disabled
                    >
                      <SelectTrigger className="bg-background border-border text-foreground w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="not_allowed">Not Allowed</SelectItem>
                        <SelectItem value="allowed">Auto-Approve</SelectItem>
                        <SelectItem value="approval_required">Require Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ================================================================ */}
          {/* Step 4: Pricing */}
          {/* ================================================================ */}
          {step === 4 && (
            <>
              {paymentTiming === 'external' ? (
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <DollarSign className="h-5 w-5" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Deliver and Done:</strong> No payment is processed through PhotoVault.
                        Your client gets direct gallery access. The gallery will expire in 6 months.
                        Your $22/month platform subscription covers this gallery.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Billing Mode */}
                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <CreditCard className="h-5 w-5" />
                        Billing Mode
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        How would you like to bill this client?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={billingMode}
                        onValueChange={(value) => setBillingMode(value as BillingMode)}
                        className="grid gap-4"
                      >
                        <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-card cursor-pointer">
                          <RadioGroupItem value="all_in_one" id="all_in_one" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="all_in_one" className="font-medium cursor-pointer text-foreground">
                              All-In-One Invoice (Recommended)
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Client receives one invoice combining your shoot fee + storage.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-card cursor-pointer">
                          <RadioGroupItem value="storage_only" id="storage_only" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="storage_only" className="font-medium cursor-pointer text-foreground">
                              Storage Only (I Bill Separately)
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              PhotoVault only handles the storage subscription. You invoice your shoot fee separately.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Pricing Details */}
                  <Card className="bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <DollarSign className="h-5 w-5" />
                        Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {billingMode === 'all_in_one' && (
                        <div>
                          <Label htmlFor="shootFee" className="text-muted-foreground">Your Shoot Fee *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                              id="shootFee"
                              type="number"
                              min="0"
                              step="0.01"
                              value={shootFee}
                              onChange={(e) => setShootFee(e.target.value)}
                              placeholder="0.00"
                              className="pl-7 bg-background border-border text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your photography fee - you keep 100%
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="package" className="text-muted-foreground">Storage Package *</Label>
                        <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Choose a package..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {paymentOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id} className="text-foreground hover:bg-muted">
                                <div className="flex flex-col py-1">
                                  <span className="font-medium">{option.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {getPaymentOptionSummary(option.id)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedPackageId === 'shoot_only' && (
                        <Alert>
                          <Download className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Shoot Only:</strong> Gallery access until all photos are downloaded OR 90 days.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pricing Summary */}
                  {selectedPackageId && (billingMode === 'storage_only' || shootFee !== '') && (
                    <Card className="border-amber-500/20 bg-amber-500/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-400">
                          <Package className="h-5 w-5" />
                          Pricing Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              {billingMode === 'all_in_one' ? 'Client Will Pay:' : 'Storage Fee:'}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              ${pricingSummary.totalAmount.toFixed(2)}
                            </p>
                            {billingMode === 'all_in_one' && pricingSummary.shootFee > 0 && (
                              <p className="text-xs text-muted-foreground">
                                (${pricingSummary.shootFee.toFixed(2)} shoot + ${pricingSummary.storageFee.toFixed(2)} storage)
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-muted-foreground">You Will Receive:</p>
                            <p className="text-2xl font-bold text-green-400">
                              ${pricingSummary.photographerPayout.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {(selectedPackageId === 'year_package' || selectedPackageId === 'six_month_package') && (
                          <Alert>
                            <Calendar className="h-4 w-4" />
                            <AlertDescription>
                              After the prepaid period, client will be billed $8/month automatically.
                              You&apos;ll earn <strong>$4/month</strong> passive income.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
                          <p>Package: {selectedPackage?.name}</p>
                          <p>PhotoVault revenue: ${pricingSummary.photovaultRevenue.toFixed(2)}</p>
                          {pricingSummary.isShootOnly && (
                            <p>Expires: {getExpiryDate()?.toLocaleDateString() || 'After all downloads'}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}

          {/* ================================================================ */}
          {/* Step 5: Review */}
          {/* ================================================================ */}
          {step === 5 && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Check className="h-5 w-5" />
                  Review Gallery Settings
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Confirm everything looks right before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {/* Client */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium text-foreground">{selectedClient?.name} ({selectedClient?.email})</span>
                  </div>

                  {/* Gallery */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Gallery Name</span>
                    <span className="font-medium text-foreground">{galleryName}</span>
                  </div>

                  {eventDate && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Session Date</span>
                      <span className="font-medium text-foreground">{eventDate.toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Delivery */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Payment Timing</span>
                    <span className="font-medium text-foreground">
                      {paymentTiming === 'before_access' && 'Pay Before Access'}
                      {paymentTiming === 'after_proofing' && 'Pay After Proofing'}
                      {paymentTiming === 'external' && 'External Payment (No Paywall)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Client Proofing</span>
                    <span className="font-medium text-foreground">
                      {proofingEnabled
                        ? `Enabled${proofingDeadlineDays ? ` (${proofingDeadlineDays}-day deadline)` : ''}`
                        : 'Disabled'}
                    </span>
                  </div>

                  {/* Pricing */}
                  {paymentTiming !== 'external' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Billing Mode</span>
                        <span className="font-medium text-foreground">
                          {billingMode === 'all_in_one' ? 'All-In-One' : 'Storage Only'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Package</span>
                        <span className="font-medium text-foreground">{selectedPackage?.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Client Pays</span>
                        <span className="font-medium text-foreground text-lg">${pricingSummary.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">You Receive</span>
                        <span className="font-medium text-green-400 text-lg">${pricingSummary.photographerPayout.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {paymentTiming === 'external' && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium text-foreground">{getExpiryDate()?.toLocaleDateString()}</span>
                    </div>
                  )}

                  {selectedPreset && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Preset Used</span>
                      <span className="font-medium text-foreground">
                        {PRESET_FLOWS.find(p => p.id === selectedPreset)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => { setStep(step - 1); setError('') }}
                disabled={creating}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {step === 1 && (
              <Button
                variant="outline"
                onClick={() => router.push('/photographer/dashboard')}
                disabled={creating}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            )}

            {step < 5 ? (
              <Button
                onClick={() => { setStep(step + 1); setError('') }}
                disabled={!canProceed()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateGallery}
                disabled={creating}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Gallery...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Create Gallery & Upload Photos
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
