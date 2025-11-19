'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
}

interface PaymentOption {
  id: string
  name: string
  description: string
  price: number
  duration_months: number
  photographer_commission_rate: number
  package_type: string
  free_months: number
  is_first_gallery_only: boolean
}

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

  // Pricing
  const [shootFee, setShootFee] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

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

  // Fetch payment options
  const fetchPaymentOptions = async () => {
    try {
      setLoadingPackages(true)
      const { data, error } = await supabase
        .from('payment_options')
        .select('*')
        .eq('is_active', true)
        .in('package_type', ['service_fee', 'prepaid'])
        .order('price')

      if (error) throw error
      setPaymentOptions(data || [])
    } catch (err) {
      console.error('Error fetching payment options:', err)
    } finally {
      setLoadingPackages(false)
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
    fetchPaymentOptions()
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

  // Calculate pricing summary
  const calculateSummary = () => {
    const shootFeeNum = parseFloat(shootFee) || 0
    const selectedPackage = paymentOptions.find(p => p.id === selectedPackageId)
    const storageFee = selectedPackage?.price || 0
    const totalAmount = shootFeeNum + storageFee

    // Commission calculation
    const shootFeeToPhotographer = shootFeeNum // 100% pass-through
    const storageCommission = storageFee * (selectedPackage?.photographer_commission_rate || 50) / 100
    const photographerPayout = shootFeeToPhotographer + storageCommission

    // Monthly billing start date (if applicable)
    let monthlyBillingStarts = null
    if (selectedPackage && selectedPackage.free_months > 0) {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() + selectedPackage.free_months)
      monthlyBillingStarts = startDate
    }

    return {
      totalAmount,
      photographerPayout,
      photovaultRevenue: totalAmount - photographerPayout,
      monthlyBillingStarts,
      packageName: selectedPackage?.name || '',
      freeMonths: selectedPackage?.free_months || 0
    }
  }

  const summary = calculateSummary()

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
    if (!shootFee || parseFloat(shootFee) < 0) {
      setError('Please enter a valid shoot fee (minimum $0)')
      return
    }
    if (!selectedPackageId) {
      setError('Please select a storage package')
      return
    }

    setCreating(true)
    setError('')

    try {
      const selectedPackage = paymentOptions.find(p => p.id === selectedPackageId)
      const shootFeeNum = parseFloat(shootFee) || 0

      // Create gallery with status = 'draft'
      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: user?.id,
          client_id: selectedClientId,
          gallery_name: galleryName,
          gallery_description: galleryDescription || null,
          session_date: sessionDate || null,
          shoot_fee: shootFeeNum,
          payment_option_id: selectedPackageId,
          total_amount: summary.totalAmount,
          gallery_status: 'draft',
          photo_count: 0,
          platform: 'photovault'
        })
        .select()
        .single()

      if (galleryError) throw galleryError

      console.log('[CreateGallery] Gallery created:', gallery)

      // Redirect to upload page for this gallery
      router.push(`/photographer/galleries/${gallery.id}/upload`)

    } catch (err: any) {
      console.error('Error creating gallery:', err)
      setError(err.message || 'Failed to create gallery. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Loading states
  if (authLoading || loadingClients || loadingPackages) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth check
  if (userType !== 'photographer') {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Create New Gallery
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Set up your client gallery with pricing
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Client Selection
              </CardTitle>
              <CardDescription>
                Choose an existing client or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showAddClient ? (
                <>
                  <div>
                    <Label htmlFor="client">Select Client *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </>
              ) : (
                <div className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Add New Client</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddClient(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="newClientName">Name *</Label>
                      <Input
                        id="newClientName"
                        value={newClientForm.name}
                        onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newClientEmail">Email *</Label>
                      <Input
                        id="newClientEmail"
                        type="email"
                        value={newClientForm.email}
                        onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                        placeholder="client@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newClientPhone">Phone</Label>
                      <Input
                        id="newClientPhone"
                        value={newClientForm.phone}
                        onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <Button onClick={handleAddClient}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Gallery Details
              </CardTitle>
              <CardDescription>
                Basic information about this photo session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="galleryName">Gallery Name *</Label>
                <Input
                  id="galleryName"
                  value={galleryName}
                  onChange={(e) => setGalleryName(e.target.value)}
                  placeholder="e.g., Smith Wedding, Family Session 2025"
                />
              </div>
              <div>
                <Label htmlFor="galleryDescription">Description</Label>
                <Textarea
                  id="galleryDescription"
                  value={galleryDescription}
                  onChange={(e) => setGalleryDescription(e.target.value)}
                  placeholder="Optional description for this gallery"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="sessionDate">Session Date</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>
                Set your shoot fee and select a storage package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shootFee">My Shoot Fee *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <Input
                    id="shootFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shootFee}
                    onChange={(e) => setShootFee(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your photography fee (you receive 100% after Stripe fees)
                </p>
              </div>

              <div>
                <Label htmlFor="package">Storage Package *</Label>
                <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a package..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-xs text-slate-500">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {shootFee && selectedPackageId && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Package className="h-5 w-5" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Client Will Be Charged:</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ${summary.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">You Will Receive:</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${summary.photographerPayout.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      (in 2 weeks after payment)
                    </p>
                  </div>
                </div>

                {summary.monthlyBillingStarts && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Client's monthly billing ($8/month) will start on{' '}
                      <strong>{summary.monthlyBillingStarts.toLocaleDateString()}</strong>
                      {' '}after their {summary.freeMonths}-month free period.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border-t pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Package: {summary.packageName}</p>
                  <p>• PhotoVault revenue: ${summary.photovaultRevenue.toFixed(2)}</p>
                  <p>• Client invoice will show: "Photography Services & Gallery Publishing - ${summary.totalAmount.toFixed(2)}"</p>
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGallery}
              disabled={creating || !selectedClientId || !galleryName || !shootFee || !selectedPackageId}
              className="flex-1"
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
