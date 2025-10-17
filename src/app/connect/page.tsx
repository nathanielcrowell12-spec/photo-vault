'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Heart, 
  Camera, 
  Search, 
  Link as LinkIcon,
  CheckCircle, 
  Loader2,
  Plus,
  Users,
  Image as ImageIcon,
  Shield,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function ConnectPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [galleryUrl, setGalleryUrl] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectedGalleries, setConnectedGalleries] = useState<Array<{
    id: string
    name: string
    platform: string
    url: string
  }>>([])
  const [searchMode, setSearchMode] = useState<'url' | 'search'>('url')

  if (!user) {
    router.push('/login')
    return null
  }

  const handleConnectGallery = async () => {
    if (!galleryUrl.trim()) return

    setConnecting(true)
    
    try {
      // Simulate gallery connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockGallery = {
        id: `gallery-${Date.now()}`,
        name: 'Wedding Photos - Sarah & John',
        photographer: 'Emma Photography',
        platform: 'Pixieset',
        photo_count: 245,
        date: '2024-10-15',
        connected_at: new Date().toISOString()
      }
      
      setConnectedGalleries(prev => [...prev, mockGallery])
      setGalleryUrl('')
      setAccessCode('')
      
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleSearchPhotographer = async () => {
    // In a real implementation, this would search for photographers
    console.log('Searching for photographer...')
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
              <Heart className="h-6 w-6 text-pink-600" />
              <span className="text-xl font-bold">Connect Your Photos</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200">
            Family
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Connect Your Photo Galleries</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            Link your photographer galleries to start building your PhotoVault. 
            Never lose access to your precious family memories again.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-pink-600" />
              <h3 className="text-lg font-semibold mb-2">Never Expires</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your photos stay accessible forever, even after gallery links expire
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">All in One Place</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                View all your professional photos from different photographers together
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Bank-level security keeps your family photos safe and private
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connection Methods */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Method 1: Direct Gallery Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <span>Connect Gallery Link</span>
              </CardTitle>
              <CardDescription>
                Paste your photographer&apos;s gallery link to connect it to PhotoVault
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-url">Gallery URL</Label>
                <Input
                  id="gallery-url"
                  placeholder="https://your-photographer.pixieset.com/gallery-name"
                  value={galleryUrl}
                  onChange={(e) => setGalleryUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-code">Access Code (if required)</Label>
                <Input
                  id="access-code"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleConnectGallery}
                disabled={connecting || !galleryUrl.trim()}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Gallery
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Method 2: Search for Photographer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-green-600" />
                <span>Find Your Photographer</span>
              </CardTitle>
              <CardDescription>
                Search for your photographer if you don&apos;t have the gallery link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photographer-search">Photographer Name or Business</Label>
                <Input
                  id="photographer-search"
                  placeholder="e.g., Emma Photography"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-type">Type of Event</Label>
                <Input
                  id="event-type"
                  placeholder="e.g., Wedding, Family Session, Newborn"
                />
              </div>
              <Button 
                onClick={handleSearchPhotographer}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Photographer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connected Galleries */}
        {connectedGalleries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Connected Galleries</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedGalleries.map((gallery) => (
                <Card key={gallery.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline">
                        {gallery.platform}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{gallery.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      by {gallery.photographer}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {gallery.photo_count} photos • {new Date(gallery.date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <Button size="sm" variant="outline">
                        View Photos
                      </Button>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Popular Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Photography Platforms</CardTitle>
            <CardDescription>
              Connect galleries from these popular photography platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { name: 'Pixieset', color: 'bg-blue-500', logo: '🎨' },
                { name: 'ShootProof', color: 'bg-green-500', logo: '📸' },
                { name: 'SmugMug', color: 'bg-purple-500', logo: '🖼️' },
                { name: 'Pic-Time', color: 'bg-orange-500', logo: '⏰' },
                { name: 'CloudSpot', color: 'bg-cyan-500', logo: '☁️' }
              ].map((platform, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${platform.color} rounded-lg mx-auto mb-3 flex items-center justify-center text-white text-2xl`}>
                    {platform.logo}
                  </div>
                  <p className="text-sm font-medium">{platform.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Connect Your Photos</CardTitle>
            <CardDescription>
              Follow these simple steps to start building your PhotoVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Find Your Gallery</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Look for gallery links in your email or photographer&apos;s website
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Connect to PhotoVault</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Paste the gallery link and we&apos;ll import all your photos
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Enjoy Forever Access</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your photos are now safe and accessible forever
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
