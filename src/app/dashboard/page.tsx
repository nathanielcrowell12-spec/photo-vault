'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useView } from '@/contexts/ViewContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Camera, 
  Users, 
  Image as ImageIcon,
  Plus,
  Search,
  Download,
  Share2,
  Settings,
  LogOut,
  ArrowRight,
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  Crown,
  CreditCard,
  HelpCircle,
  Upload,
  Smartphone,
  Cloud
} from 'lucide-react'
import Link from 'next/link'
import CompetitorLogos from '@/components/CompetitorLogos'
import PlatformConnectionModal, { PlatformCredentials } from '@/components/PlatformConnectionModal'
import UnifiedPlatformModal from '@/components/UnifiedPlatformModal'
import GalleryGrid from '@/components/GalleryGrid'
import PaymentGuard from '@/components/PaymentGuard'
import { HelmProjectStatus } from '@/components/HelmProjectStatus'

export default function DashboardPage() {
  const { user, userType, loading, signOut, userFullName } = useAuth()
  const { viewMode, setViewMode, isAdminView, isCustomerView, isPhotographerView } = useView()
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showUnifiedModal, setShowUnifiedModal] = useState(false)
  const [unifiedPlatform, setUnifiedPlatform] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleDirectImport = async (credentials: PlatformCredentials) => {
    try {
      console.log('=== DIRECT IMPORT START ===')
      console.log('Credentials received:', JSON.stringify(credentials, null, 2))
      
      if (!user) {
        console.error('No user logged in')
        alert('Error: No user logged in')
        return
      }

      console.log('User ID:', user.id)

      // Extract gallery name and photographer from URL
      const galleryName = credentials.galleryUrl ? extractGalleryNameFromUrl(credentials.galleryUrl) : 'Unknown Gallery'
      const photographerName = credentials.galleryUrl ? extractPhotographerNameFromUrl(credentials.galleryUrl) : 'Unknown Photographer'

      console.log('Extracted gallery name:', galleryName)
      console.log('Extracted photographer:', photographerName)

      const requestBody = {
        platform: credentials.platform,
        galleryUrl: credentials.galleryUrl,
        password: credentials.password || credentials.galleryPassword,
        accessType: 'guest',
        galleryMetadata: {
          galleryName: galleryName,
          photographerName: photographerName
        }
      }

      console.log('Making API call to /api/v1/import/gallery')
      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      // Call the unified API to start import
      const response = await fetch('/api/v1/import/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(requestBody)
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to start import')
      }

      const result = await response.json()
      console.log('Import started successfully:', result)
      console.log('=== DIRECT IMPORT SUCCESS ===')

      // Show success message
      alert(`${credentials.platform} import started! Gallery ID: ${result.galleryId}\n\nYou can navigate away - the import will continue in the background.`)

      // Refresh the page to show the new gallery
      setTimeout(() => {
        console.log('Refreshing page...')
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('=== DIRECT IMPORT ERROR ===')
      console.error('Error details:', error)
      alert(`Failed to start import: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePlatformConnect = async (credentials: PlatformCredentials) => {
    console.log('=== HANDLE PLATFORM CONNECT CALLED ===')
    console.log('Raw credentials:', credentials)
    console.log('Platform value:', credentials.platform)
    console.log('Platform toLowerCase:', credentials.platform?.toLowerCase())
    
    try {
      console.log('Connecting to platform:', credentials)
      
      if (!user) {
        console.error('No user logged in')
        return
      }
      
      // Special handling for supported platforms - use the unified import system
      const supportedPlatforms = ['pixieset', 'smugmug']
      const platformLower = credentials.platform?.toLowerCase()
      console.log('Checking if platform is supported:', platformLower, 'in', supportedPlatforms)
      console.log('Is supported?', supportedPlatforms.includes(platformLower))
      
      if (supportedPlatforms.includes(platformLower)) {
        // Start import immediately with provided credentials
        console.log('✅ PLATFORM IS SUPPORTED - Starting direct import for:', credentials.platform)
        await handleDirectImport(credentials)
        setSelectedPlatform(null)
        return
      }
      
      console.log('❌ Platform NOT in supported list, using old flow')
      
      // For other platforms, use the old gallery URL connections
      if (credentials.platform && credentials.galleryUrl) {
        // Extract gallery name from URL or use a default
        const galleryName = extractGalleryNameFromUrl(credentials.galleryUrl)
        
        // Extract photographer name from URL
        const photographerName = extractPhotographerNameFromUrl(credentials.galleryUrl)
        
        // Create gallery data
        const galleryData = {
          user_id: user.id,
          gallery_name: galleryName,
          gallery_description: `Connected from ${credentials.platform}`,
          platform: credentials.platform,
          gallery_url: credentials.galleryUrl,
          gallery_password: credentials.password || credentials.galleryPassword,
          photo_count: 0, // Will be updated when we fetch actual data
          session_date: new Date().toISOString().split('T')[0],
          is_imported: false,
          photographer_name: photographerName,
          cover_image_url: '/images/placeholder-family.svg'
        }
        
        console.log('Saving gallery to database:', galleryData)
        
        // Save to Supabase database
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data, error } = await supabase
          .from('galleries')
          .insert(galleryData)
          .select()
          .single()
        
        if (error) {
          console.error('Error saving gallery:', error)
          throw error
        }
        
        console.log('Gallery created successfully!', data)
      }
      
      console.log('Connected successfully!')
      
      // Close the modal
      setSelectedPlatform(null)
      
      // Refresh the page to show new gallery
      window.location.reload()
      
    } catch (error) {
      console.error('Error connecting to platform:', error)
      alert('Failed to connect gallery. Please try again.')
    }
  }
  
  const extractGalleryNameFromUrl = (url: string) => {
    // Extract gallery name from Pixieset URL
    // https://meadowlanemedia.pixieset.com/guestlogin/crowellcountryliving/?return=%2Fcrowellcountryliving%2F
    const match = url.match(/\/guestlogin\/([^\/\?]+)/)
    if (match) {
      return match[1].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
    return 'Connected Gallery'
  }

  const extractPhotographerNameFromUrl = (url: string) => {
    // Extract photographer/business name from Pixieset URL subdomain
    // https://meadowlanemedia.pixieset.com/...
    try {
      const urlObj = new URL(url)
      const subdomain = urlObj.hostname.split('.')[0]
      // Convert "meadowlanemedia" to "Meadow Lane Media"
      return subdomain
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim() || 'Unknown Photographer'
    } catch {
      return 'Unknown Photographer'
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      console.log('Dashboard: Starting sign out...')
      
      // Clear any stored view mode first
      localStorage.removeItem('admin-view-mode')
      
      // Set a timeout fallback in case signOut hangs
      const timeoutId = setTimeout(() => {
        console.log('Dashboard: Sign out timeout - forcing redirect')
        window.location.replace('/')
      }, 3000) // 3 second timeout
      
      // Sign out from Supabase
      await signOut()
      console.log('Dashboard: Sign out complete')
      
      // Clear the timeout since we completed successfully
      clearTimeout(timeoutId)
      
      // Force a complete page reload to homepage (more aggressive than href)
      window.location.replace('/')
      
    } catch (error) {
      console.error('Dashboard: Error signing out:', error)
      // Even if error, force redirect with replace (can't go back)
      window.location.replace('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isAdminView ? (
              <Settings className="h-6 w-6 text-orange-600" />
            ) : isPhotographerView ? (
              <Camera className="h-6 w-6 text-blue-600" />
            ) : (
              <Heart className="h-6 w-6 text-pink-600" />
            )}
            <span className="text-xl font-bold">
              {isAdminView ? 'Admin Dashboard' : isPhotographerView ? 'Photographer Dashboard' : 'My PhotoVault'}
            </span>
            {!isAdminView && (
              <Badge variant="outline" className={`ml-2 ${isPhotographerView ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-pink-100 text-pink-700 border-pink-300'}`}>
                {isPhotographerView ? 'Photographer' : 'Customer'} View
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {((userType === 'photographer' && !isCustomerView) || (userType === 'admin' && isPhotographerView)) && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/photographers/clients">
                    <Users className="h-4 w-4 mr-2" />
                    Clients
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/photographers/sessions">
                    <Calendar className="h-4 w-4 mr-2" />
                    Sessions
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/photographers/revenue">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Revenue
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/photographers/reports">
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/photographers/subscription">
                    <Crown className="h-4 w-4 mr-2" />
                    Subscription
                  </Link>
                </Button>
              </>
            )}
            {(userType === 'client' || (userType === 'photographer' && isCustomerView) || (userType === 'admin' && isCustomerView)) && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/timeline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Phone
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/import">
                    <Download className="h-4 w-4 mr-2" />
                    Import Photos
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/payment">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payment
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/client/support">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Support
                  </Link>
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {userFullName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {((userType === 'photographer' && !isCustomerView) || (userType === 'admin' && isPhotographerView))
              ? 'Manage your client galleries and grow your photography business.'
              : isAdminView
              ? 'Admin control center - switch views to experience the platform as different user types.'
              : 'Your family photos are safe and organized here forever.'
            }
          </p>
        </div>

        {/* Admin View Switcher - Only visible to admin users */}
        {userType === 'admin' && isAdminView && (
          <Card className="mb-8 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <span>Admin View Controls</span>
              </CardTitle>
              <CardDescription>
                Switch views to see what photographers and customers experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => setViewMode('photographer')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  View as Photographer
                </Button>
                <Button 
                  onClick={() => setViewMode('customer')}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  size="lg"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  View as Customer
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                💡 <strong>Tip:</strong> When you switch views, you&apos;ll see exactly what that user type sees. Use the &quot;Back to Admin&quot; button in the navigation to return to admin view.
              </p>
            </CardContent>
          </Card>
        )}

        {(userType === 'client' || (userType === 'photographer' && isCustomerView) || (userType === 'admin' && isCustomerView)) ? (
          /* Client Dashboard - Gallery Focus */
          <PaymentGuard showGracePeriodWarning={true}>
            <div className="space-y-8">
            {/* Gallery Grid - Connected Galleries (MOVED TO TOP) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                  <span>Your Photo Galleries</span>
                </CardTitle>
                <CardDescription>
                  View and organize all your photo galleries from different photographers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <GalleryGrid userId={user.id} />
                )}
              </CardContent>
            </Card>

            {/* Connect More Galleries Section */}
            <Card className="border-2 border-teal-200 dark:border-teal-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-teal-600" />
                  <span>Connect More Photo Galleries</span>
                </CardTitle>
                <CardDescription>
                  Add galleries from other photographers or platforms to your collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitorLogos 
                  showUpdateButton={userType === 'admin' && isAdminView}
                  onPlatformClick={(platform) => {
                    console.log('=== PLATFORM LOGO CLICKED ===', platform)
                    console.log('Platform type:', typeof platform)
                    console.log('Platform length:', platform?.length)
                    console.log('Platform exact match:', JSON.stringify(platform))
                    
                    const supportedPlatforms = ['Pixieset', 'SmugMug', 'Pic-Time', 'ShootProof']
                    console.log('Supported platforms:', supportedPlatforms)
                    console.log('Is platform in supported list?', supportedPlatforms.includes(platform))
                    console.log('Index of platform:', supportedPlatforms.indexOf(platform))
                    
                    if (supportedPlatforms.includes(platform)) {
                      // Open unified modal directly
                      console.log('✅ Platform is supported, opening unified modal')
                      setUnifiedPlatform(platform)
                      setShowUnifiedModal(true)
                    } else {
                      // Use old modal for other platforms
                      console.log('❌ Platform not supported, using old modal')
                      setSelectedPlatform(platform)
                    }
                  }}
                />
                <div className="mt-6 text-center space-x-4">
                  <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Link href="/client/import">
                      <Download className="h-4 w-4 mr-2" />
                      Browse All Platforms
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/client/timeline">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Timeline
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Platform Connection Modal - for non-unified platforms */}
            <PlatformConnectionModal
              platform={selectedPlatform}
              isOpen={!!selectedPlatform && !showUnifiedModal}
              onClose={() => setSelectedPlatform(null)}
              onConnect={handlePlatformConnect}
            />
            
            {/* Unified Platform Import Modal - for Pixieset, SmugMug, etc. */}
            <UnifiedPlatformModal
              platform={unifiedPlatform}
              isOpen={showUnifiedModal}
              onClose={() => {
                setShowUnifiedModal(false)
                setUnifiedPlatform(null)
              }}
            />

            {/* Smartphone Upload */}
            <Card className="mb-8 border-2 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <span>Dump Your Phone Photos</span>
                </CardTitle>
                <CardDescription>
                  Upload all your smartphone photos for automatic organization and backup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">One-Click Upload</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Drag & drop or select all your phone photos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Auto-Organization</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Photos automatically sorted by date and location
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <Cloud className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Smart Backup</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Never lose your phone photos again
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Recent Uploads</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">iPhone Photos - Dec 2024</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          245 photos
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Screenshot Collection</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          89 photos
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Family Moments</span>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          156 photos
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center space-x-4">
                  <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/client/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Phone Photos
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/client/mobile-upload">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile Upload
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Simple steps to organize all your photos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: "1",
                      title: "Connect Your Galleries",
                      description: "Link your existing photo galleries from any photographer or platform.",
                      icon: <Download className="h-8 w-8" />
                    },
                    {
                      step: "2",
                      title: "Upload Phone Photos",
                      description: "Dump all your smartphone photos for automatic organization.",
                      icon: <Smartphone className="h-8 w-8" />
                    },
                    {
                      step: "3",
                      title: "Enjoy Your Timeline",
                      description: "View all your photos in one beautiful, chronological timeline.",
                      icon: <Heart className="h-8 w-8" />
                    }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                        {item.step}
                      </div>
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <div className="text-pink-600 dark:text-pink-400">
                          {item.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            </div>
          </PaymentGuard>
        ) : (userType === 'photographer' || (userType === 'admin' && isPhotographerView)) ? (
          /* Photographer Dashboard */
          <div className="space-y-8">
            {/* Business Overview */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
                      <p className="text-2xl font-bold">$320</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Camera className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Active Galleries</p>
                      <p className="text-2xl font-bold">18</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Crown className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Subscription</p>
                      <p className="text-sm font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your photography business efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button asChild className="h-20 flex-col space-y-2">
                    <Link href="/photographers/clients">
                      <Users className="h-6 w-6" />
                      <span>Manage Clients</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/photographers/sessions">
                      <Calendar className="h-6 w-6" />
                      <span>New Session</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/photographers/revenue">
                      <DollarSign className="h-6 w-6" />
                      <span>View Revenue</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                    <Link href="/photographers/reports">
                      <FileText className="h-6 w-6" />
                      <span>Generate Reports</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest client interactions and gallery updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">New client gallery uploaded</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Sarah & Mike Wedding - 150 photos</p>
                    </div>
                    <span className="text-sm text-slate-500">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Commission earned</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">$50 from Jessica&apos;s gallery renewal</p>
                    </div>
                    <span className="text-sm text-slate-500">1 day ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <Camera className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Gallery shared</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Family portraits with the Johnsons</p>
                    </div>
                    <span className="text-sm text-slate-500">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Admin Dashboard - Default View */
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-8 text-center">
                <Settings className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4 text-orange-800 dark:text-orange-200">
                  Admin Control Center
                </h2>
                <p className="text-lg text-orange-700 dark:text-orange-300 mb-6 max-w-2xl mx-auto">
                  Use the view switcher above to experience the platform as a photographer or customer. 
                  Access admin tools from the navigation menu.
                </p>
              </CardContent>
            </Card>

            {/* Helm Project Status - Only for Admin */}
            <HelmProjectStatus className="mb-8" />

            {/* Admin Quick Links */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span>Business Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    View profitability, projections, and valuation metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/admin/business-analytics">
                      Open Analytics Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span>Photo Upload Center</span>
                  </CardTitle>
                  <CardDescription>
                    Drag & drop photos to beautify your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/admin/photo-upload">
                      Upload Photos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Test Dashboard</span>
                  </CardTitle>
                  <CardDescription>
                    Test all features and verify functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/test-dashboard">
                      Run Tests
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <span>Developer Tools</span>
                  </CardTitle>
                  <CardDescription>
                    Access development utilities and tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dev-dashboard">
                      Open Dev Tools
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}