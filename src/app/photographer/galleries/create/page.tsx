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
import {
  ArrowLeft,
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
  Tag
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

interface Client {
  id: string
  name: string
  email: string
  phone?: string
}

type BillingMode = 'storage_only' | 'all_in_one'

export default function CreateGalleryPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()

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
  const [sessionDate, setSessionDate] = useState('')

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

  // Fetch clients
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
  }, [user, userType, authLoading, router])

  // Handle inline client creation
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

      // Add to clients list and select
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

  // Get the selected package
  const selectedPackage = useMemo(() => {
    return paymentOptions.find(p => p.id === selectedPackageId)
  }, [paymentOptions, selectedPackageId])

  // Calculate pricing summary
  const pricingSummary = useMemo(() => {
    const shootFeeNum = parseFloat(shootFee) || 0

    if (billingMode === 'storage_only') {
      // Storage only - photographer bills separately
      // We just need to know the storage package details
      const storageFee = selectedPackage?.price || 0
      const storageCommission = (storageFee * (selectedPackage?.photographer_commission || 0)) / 100

      return {
        mode: 'storage_only' as const,
        shootFee: 0, // Not tracked in PhotoVault
        storageFee,
        totalAmount: storageFee, // Client only pays storage through PhotoVault
        photographerPayout: storageCommission,
        photovaultRevenue: storageFee - storageCommission,
        stripeFees: storageFee > 0 ? Math.round((storageFee * 0.029 + 0.30) * 100) / 100 : 0,
        isShootOnly: selectedPackageId === 'shoot_only'
      }
    } else {
      // All-in-one pricing
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

  // Calculate expiry date based on package
  const getExpiryDate = () => {
    const now = new Date()
    switch (selectedPackageId) {
      case 'year_package':
        return new Date(now.setMonth(now.getMonth() + 12))
      case 'six_month_package':
      case 'six_month_trial':
        return new Date(now.setMonth(now.getMonth() + 6))
      case 'shoot_only':
        return new Date(now.setDate(now.getDate() + 90)) // 90 days max
      default:
        return null
    }
  }

  // Handle gallery creation
  const handleCreateGallery = async () => {
    // Validation
    if (!selectedClientId) {
      setError('Please select a client')
      return
    }
    if (!galleryName) {
      setError('Please enter a gallery name')
      return
    }
    if (!selectedPackageId) {
      setError('Please select a storage package')
      return
    }

    // For all_in_one mode, shoot fee is required (can be $0 for free shoots)
    if (billingMode === 'all_in_one' && shootFee === '') {
      setError('Please enter your shoot fee (enter 0 for free shoots)')
      return
    }

    setCreating(true)
    setError('')

    try {
      const shootFeeNum = parseFloat(shootFee) || 0
      const shootFeeCents = Math.round(shootFeeNum * 100)
      const storageFeeCents = Math.round((selectedPackage?.price || 0) * 100)
      const totalCents = billingMode === 'all_in_one'
        ? shootFeeCents + storageFeeCents
        : storageFeeCents

      const expiryDate = getExpiryDate()

      // Create gallery in photo_galleries (the canonical gallery table)
      // This is the single source of truth - photos table FK references photo_galleries
      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: user?.id,
          client_id: selectedClientId,
          gallery_name: galleryName,
          gallery_description: galleryDescription || null,
          session_date: sessionDate || null,
          photo_count: 0,
          platform: 'photovault', // Required field
          gallery_status: 'draft',
          // Pricing fields
          payment_option_id: selectedPackageId,
          billing_mode: billingMode,
          shoot_fee: billingMode === 'all_in_one' ? shootFeeCents : 0,
          storage_fee: storageFeeCents,
          total_amount: totalCents,
          payment_status: 'pending',
          gallery_expires_at: expiryDate?.toISOString() || null,
          // Download tracking for shoot_only
          download_tracking_enabled: selectedPackageId === 'shoot_only',
          total_photos_to_download: 0, // Will be updated after upload
          photos_downloaded: 0,
          all_photos_downloaded: false,
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

      console.log('[CreateGallery] Gallery created:', gallery)

      // Redirect to upload page for this gallery
      router.push(`/photographer/galleries/${gallery.id}/upload`)

    } catch (err: any) {
      console.error('Error creating gallery:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      const errorMessage = err?.message || err?.details || err?.hint || 'Failed to create gallery. Please try again.'
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  // Loading states
  if (authLoading || loadingClients) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth check
  if (userType !== 'photographer') {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="text-neutral-400 hover:text-white">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">
                Create New Gallery
              </h1>
              <p className="text-neutral-400">
                Set up your client gallery with pricing
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Client Selection */}
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <UserPlus className="h-5 w-5" />
                Client Selection
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Choose an existing client or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showAddClient ? (
                <>
                  <div>
                    <Label htmlFor="client" className="text-neutral-300">Select Client *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                        <SelectValue placeholder="Choose a client..." />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-white/10">
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id} className="text-white hover:bg-white/5">
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
                    className="border-white/10 text-neutral-300 hover:bg-white/5"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </>
              ) : (
                <div className="border border-white/10 rounded-lg p-4 space-y-4 bg-neutral-900">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-neutral-100">Add New Client</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddClient(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="newClientName" className="text-neutral-300">Name *</Label>
                      <Input
                        id="newClientName"
                        value={newClientForm.name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                        placeholder="Client name"
                        className="bg-neutral-800 border-white/10 text-white placeholder:text-neutral-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newClientEmail" className="text-neutral-300">Email *</Label>
                      <Input
                        id="newClientEmail"
                        type="email"
                        value={newClientForm.email}
                        onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                        placeholder="client@example.com"
                        className="bg-neutral-800 border-white/10 text-white placeholder:text-neutral-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newClientPhone" className="text-neutral-300">Phone</Label>
                      <Input
                        id="newClientPhone"
                        value={newClientForm.phone}
                        onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="bg-neutral-800 border-white/10 text-white placeholder:text-neutral-500"
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

          {/* Gallery Details */}
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <Camera className="h-5 w-5" />
                Gallery Details
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Basic information about this photo session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="galleryName" className="text-neutral-300">Gallery Name *</Label>
                <Input
                  id="galleryName"
                  value={galleryName}
                  onChange={(e) => setGalleryName(e.target.value)}
                  placeholder="e.g., Smith Wedding, Family Session 2025"
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="galleryDescription" className="text-neutral-300">Description</Label>
                <Textarea
                  id="galleryDescription"
                  value={galleryDescription}
                  onChange={(e) => setGalleryDescription(e.target.value)}
                  placeholder="Optional description for this gallery"
                  rows={3}
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div>
                <Label htmlFor="sessionDate" className="text-neutral-300">Session Date</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="bg-neutral-900 border-white/10 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Gallery Metadata */}
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <Tag className="h-5 w-5" />
                Gallery Metadata
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Add details to make this gallery easier to find later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventDate" className="text-neutral-300">Event Date</Label>
                <DatePicker
                  id="eventDate"
                  value={eventDate}
                  onChange={(date) => setEventDate(date || null)}
                  placeholder="When did this session take place?"
                  className="w-full bg-neutral-900 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-neutral-300">Location</Label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g., Central Park, Madison"
                />
              </div>

              <div>
                <Label htmlFor="people" className="text-neutral-300">People in Photos</Label>
                <PeopleTagInput
                  value={people}
                  onChange={setPeople}
                  placeholder="Add names (press Enter)..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Add names of people featured in this gallery
                </p>
              </div>

              <div>
                <Label htmlFor="eventType" className="text-neutral-300">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                    <SelectValue placeholder="Select event type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10">
                    <SelectItem value="wedding" className="text-white hover:bg-white/5">Wedding</SelectItem>
                    <SelectItem value="birthday" className="text-white hover:bg-white/5">Birthday</SelectItem>
                    <SelectItem value="family" className="text-white hover:bg-white/5">Family Session</SelectItem>
                    <SelectItem value="portrait" className="text-white hover:bg-white/5">Portrait</SelectItem>
                    <SelectItem value="graduation" className="text-white hover:bg-white/5">Graduation</SelectItem>
                    <SelectItem value="corporate" className="text-white hover:bg-white/5">Corporate</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-white/5">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="photographerName" className="text-neutral-300">Photographer Name</Label>
                <Input
                  id="photographerName"
                  value={photographerName}
                  onChange={(e) => setPhotographerName(e.target.value)}
                  placeholder="Leave blank to use your profile name"
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-neutral-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details about this session..."
                  rows={3}
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  These notes are searchable
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Mode Selection */}
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <CreditCard className="h-5 w-5" />
                Billing Mode
              </CardTitle>
              <CardDescription className="text-neutral-400">
                How would you like to bill this client?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={billingMode}
                onValueChange={(value) => setBillingMode(value as BillingMode)}
                className="grid gap-4"
              >
                <div className="flex items-start space-x-3 p-4 border border-white/10 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                  <RadioGroupItem value="all_in_one" id="all_in_one" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="all_in_one" className="font-medium cursor-pointer text-neutral-100">
                      All-In-One Invoice (Recommended)
                    </Label>
                    <p className="text-sm text-neutral-400 mt-1">
                      Client receives one invoice combining your shoot fee + storage.
                      They see a single total - clean and professional.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border border-white/10 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                  <RadioGroupItem value="storage_only" id="storage_only" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="storage_only" className="font-medium cursor-pointer text-neutral-100">
                      Storage Only (I Bill Separately)
                    </Label>
                    <p className="text-sm text-neutral-400 mt-1">
                      PhotoVault only handles the storage subscription.
                      You invoice your shoot fee through your own system.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-100">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {billingMode === 'all_in_one'
                  ? 'Set your shoot fee and select a storage package'
                  : 'Select a storage package for your client'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shoot Fee - only show for all_in_one mode */}
              {billingMode === 'all_in_one' && (
                <div>
                  <Label htmlFor="shootFee" className="text-neutral-300">Your Shoot Fee *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
                    <Input
                      id="shootFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={shootFee}
                      onChange={(e) => setShootFee(e.target.value)}
                      placeholder="0.00"
                      className="pl-7 bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Your photography fee - you keep 100% (minus ~3% Stripe fees)
                  </p>
                </div>
              )}

              {/* Storage Package */}
              <div>
                <Label htmlFor="package" className="text-neutral-300">Storage Package *</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                    <SelectValue placeholder="Choose a package..." />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-white/10">
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id} className="text-white hover:bg-white/5">
                        <div className="flex flex-col py-1">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-xs text-neutral-400">
                            {getPaymentOptionSummary(option.id)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shoot Only Info */}
              {selectedPackageId === 'shoot_only' && (
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Shoot Only:</strong> No storage fee - gallery access until all photos are downloaded OR 90 days (whichever comes first).
                    Client can upgrade to a storage package anytime.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
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
                    <p className="text-neutral-400">
                      {billingMode === 'all_in_one' ? 'Client Will Pay:' : 'Storage Fee:'}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      ${pricingSummary.totalAmount.toFixed(2)}
                    </p>
                    {billingMode === 'all_in_one' && pricingSummary.shootFee > 0 && (
                      <p className="text-xs text-neutral-400">
                        (${pricingSummary.shootFee.toFixed(2)} shoot + ${pricingSummary.storageFee.toFixed(2)} storage)
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-neutral-400">You Will Receive:</p>
                    <p className="text-2xl font-bold text-green-400">
                      ~${(pricingSummary.photographerPayout - pricingSummary.stripeFees).toFixed(2)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      (after ~${pricingSummary.stripeFees.toFixed(2)} Stripe fees)
                    </p>
                  </div>
                </div>

                {/* Monthly billing info for non-trial packages */}
                {(selectedPackageId === 'year_package' || selectedPackageId === 'six_month_package') && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      After the prepaid period, client will be billed $8/month automatically.
                      You'll earn <strong>$4/month</strong> passive income.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Trial info */}
                {selectedPackageId === 'six_month_trial' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This is a 6-month trial. Gallery will become inactive after 6 months.
                      No automatic billing - client must reactivate or upgrade if they want to continue.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-t border-white/10 pt-3 text-xs text-neutral-400 space-y-1">
                  <p>• Package: {selectedPackage?.name}</p>
                  <p>• PhotoVault revenue: ${pricingSummary.photovaultRevenue.toFixed(2)}</p>
                  {billingMode === 'all_in_one' && (
                    <p>• Client invoice shows: "Photography Services - ${pricingSummary.totalAmount.toFixed(2)}"</p>
                  )}
                  {pricingSummary.isShootOnly && (
                    <p>• Gallery expires: {getExpiryDate()?.toLocaleDateString() || 'After all downloads'}</p>
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

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/photographer/dashboard')}
              disabled={creating}
              className="border-white/10 text-neutral-300 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGallery}
              disabled={
                creating ||
                !selectedClientId ||
                !galleryName ||
                !selectedPackageId ||
                (billingMode === 'all_in_one' && shootFee === '')
              }
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
          </div>
        </div>
      </main>
    </div>
  )
}
