'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SUPPORTED_PLATFORMS, connectPlatform } from '@/lib/platforms'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle, 
  ExternalLink, 
  Loader2,
  Plus,
  Users,
  Image as ImageIcon,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export default function ImportPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [importedGalleries, setImportedGalleries] = useState<any[]>([])

  if (userType !== 'photographer') {
    router.push('/dashboard')
    return null
  }

  const handleConnectPlatform = async (platformName: string) => {
    setConnecting(platformName)
    
    try {
      // In a real implementation, you would:
      // 1. Redirect to OAuth flow
      // 2. Handle callback with access token
      // 3. Import galleries
      
      // For demo purposes, simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConnectedPlatforms(prev => [...prev, platformName])
      
      // Simulate importing galleries
      const mockGalleries = [
        {
          id: `${platformName}-1`,
          name: `Wedding Gallery - ${platformName}`,
          photo_count: 245,
          platform: platformName
        },
        {
          id: `${platformName}-2`, 
          name: `Family Session - ${platformName}`,
          photo_count: 89,
          platform: platformName
        }
      ]
      
      setImportedGalleries(prev => [...prev, ...mockGalleries])
      
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setConnecting(null)
    }
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
              <span className="text-xl font-bold">Import Galleries</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Import Your Existing Galleries</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            Connect your photography platforms to automatically import all your client galleries into PhotoVault. 
            Your clients will get permanent access while you earn referral revenue.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Client Retention</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Keep clients engaged with permanent gallery access
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Automatic Import</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Import all existing galleries with one click
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold mb-2">Secure & Branded</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your branding stays with your clients forever
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Connections */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Connect Your Photography Platforms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(SUPPORTED_PLATFORMS).map(([key, platform]) => (
              <Card key={key} className="relative">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                      {platform.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                      <CardDescription className="text-sm">{platform.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {platform.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {connectedPlatforms.includes(key) ? (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleConnectPlatform(key)}
                      disabled={connecting === key}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {connecting === key ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Imported Galleries */}
        {importedGalleries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Imported Galleries</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {importedGalleries.map((gallery) => (
                <Card key={gallery.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline">
                        {gallery.platform}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{gallery.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {gallery.photo_count} photos imported
                    </p>
                    <div className="flex items-center justify-between">
                      <Button size="sm" variant="outline">
                        View Gallery
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Invite Clients
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Once you&apos;ve connected your platforms, here&apos;s what happens next
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Import Complete</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  All your galleries are automatically imported and organized
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Invite Clients</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Send branded invitations to your existing clients
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Earn Revenue</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Get $2-5/month for every client who renews storage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
