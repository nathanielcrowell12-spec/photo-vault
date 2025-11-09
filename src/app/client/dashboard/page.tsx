'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Download,
  Share2,
  Camera,
  Star,
  Calendar,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'
import GalleryGrid from '@/components/GalleryGrid'

export default function ClientDashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessClientDashboard">
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="/images/logos/photovault logo.png" 
                  alt="PhotoVault" 
                  className="h-10 w-auto"
                />
                <div>
                  <p className="text-sm text-gray-600">Your Personal Photo Gallery</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-pink-50 text-pink-700">
                  Family Account
                </Badge>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Welcome back, {user?.email}</h2>
              <p className="text-lg text-gray-600">
                Access all your professional photos in one beautiful, organized place
              </p>
            </div>

            {/* Gallery Grid - Moved to top */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-pink-600" />
                    Your Photo Galleries
                  </CardTitle>
                  <CardDescription>Browse and download all your professional photos</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/client/deleted">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Recently Deleted
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {user && <GalleryGrid userId={user.id} />}
              </CardContent>
            </Card>

            {/* Quick Actions - Moved below galleries */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Upload Photos</CardTitle>
                  <CardDescription>
                    Upload photos from your device or desktop
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/upload">
                      Upload Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>Import Photos</CardTitle>
                  <CardDescription>
                    Import photos from other photography platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/upload">
                      Import Photos
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>Download Photos</CardTitle>
                  <CardDescription>
                    Download your favorite photos in high resolution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/download">
                      Download All
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle>Contact Photographer</CardTitle>
                  <CardDescription>
                    Get in touch with your photographer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/contact">
                      Send Message
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats - Removed fake data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Photos</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Photo Sessions</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Downloaded</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <Download className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Favorites</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity - Removed fake data */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-pink-600" />
                    Recent Photo Sessions
                  </CardTitle>
                  <CardDescription>Your most recent photo sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent sessions found</p>
                    <p className="text-sm">Your photo sessions will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Photographer Messages
                  </CardTitle>
                  <CardDescription>Updates from your photographer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages found</p>
                    <p className="text-sm">Messages from your photographer will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}
