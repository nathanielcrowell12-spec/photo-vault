'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  Users, 
  DollarSign,
  Settings,
  BarChart3,
  Upload,
  Share2,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'
import GalleryGrid from '@/components/GalleryGrid'
import Messages from '@/components/Messages'
import MessagesButton from '@/components/MessagesButton'

export default function PhotographerDashboardPage() {
  const { user, userType, loading, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    activeClients: 0,
    totalGalleries: 0,
    monthlyEarnings: 0,
    clientRating: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/photographer/stats')
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessPhotographerDashboard">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Camera className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold">PhotoVault Pro</h1>
                  <p className="text-sm text-gray-600">Photographer Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Professional Account
                </Badge>
                <MessagesButton variant="icon" />
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
                Manage your clients, galleries, and grow your photography business
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Clients</p>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : stats.activeClients}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Galleries</p>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : stats.totalGalleries}
                      </p>
                    </div>
                    <Camera className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : `$${stats.monthlyEarnings.toFixed(2)}`}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Client Rating</p>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '...' : stats.clientRating.toFixed(1)}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                <CardHeader className="flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Manage Clients</CardTitle>
                  <CardDescription>
                    View and manage your client relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/photographer/clients">
                      View Clients
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                <CardHeader className="flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>Upload Photos</CardTitle>
                  <CardDescription>
                    Upload new photos to client galleries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/photographer/upload">
                      Upload Photos
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                <CardHeader className="flex-1">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Share2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>Share Galleries</CardTitle>
                  <CardDescription>
                    Share galleries with clients and social media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/photographer/share">
                      Share Options
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                <CardHeader className="flex-1">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    View your business analytics and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/photographers/analytics">
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Client Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Client Messages
                </CardTitle>
                <CardDescription>Recent client communications</CardDescription>
              </CardHeader>
              <CardContent>
                <Messages limit={5} showFullInterface={false} />
              </CardContent>
            </Card>

            {/* Gallery Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-purple-600" />
                  Your Galleries
                </CardTitle>
                <CardDescription>Manage and view all your client galleries</CardDescription>
              </CardHeader>
              <CardContent>
                {user && <GalleryGrid userId={user.id} />}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}
