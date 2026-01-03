'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Download,
  Camera,
  Calendar,
  MessageSquare,
  Trash2,
  CreditCard,
  Users,
  Settings,
  Image,
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'
import GalleryGrid from '@/components/GalleryGrid'
import MessagesButton from '@/components/MessagesButton'
import MessagingPanel from '@/components/MessagingPanel'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'

interface ClientStats {
  totalPhotos: number
  photoSessions: number
  favorites: number
}

interface RecentGallery {
  id: string
  name: string
  created_at: string
  cover_image_url: string | null
  photo_count: number | null
}

export default function ClientDashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [showMessages, setShowMessages] = useState(false)
  const [stats, setStats] = useState<ClientStats>({ totalPhotos: 0, photoSessions: 0, favorites: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [recentGalleries, setRecentGalleries] = useState<RecentGallery[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  // Fetch client stats
  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      try {
        const response = await fetch('/api/client/stats')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStats(data.stats)
            setRecentGalleries(data.recentGalleries || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch client stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  const scrollToGalleries = () => {
    const galleriesSection = document.getElementById('galleries-section')
    if (galleriesSection) {
      galleriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessClientDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card border-border backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src="/images/logos/photovault logo.png"
                  alt="PhotoVault"
                  className="h-10 w-auto"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Your Personal Photo Gallery</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-secondary text-muted-foreground border-border">
                  Family Account
                </Badge>
                <ThemeModeToggle variant="icon" />
                <MessagesButton variant="icon" onClick={() => setShowMessages(true)} />
                <Button variant="ghost" size="icon" asChild title="Settings">
                  <Link href="/client/settings">
                    <Settings className="h-5 w-5" />
                  </Link>
                </Button>
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
              <h2 className="text-3xl font-bold mb-4 text-foreground">Welcome back, {user?.email}</h2>
              <p className="text-lg text-muted-foreground">
                Access all your professional photos in one beautiful, organized place
              </p>
            </div>

            {/* Gallery Grid - Moved to top */}
            <Card id="galleries-section" className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Camera className="h-5 w-5 text-primary" />
                    Your Photo Galleries
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Browse and download all your professional photos</CardDescription>
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
              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-foreground">Upload Photos</CardTitle>
                  <CardDescription className="text-muted-foreground">
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

              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Download className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-foreground">Download Photos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Download your photos from your galleries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={scrollToGalleries}>
                    View Galleries
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-green-400" />
                  </div>
                  <CardTitle className="text-foreground">Billing & Subscription</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage your subscription and payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/billing">
                      Manage Billing
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-foreground">Contact Photographer</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Get in touch with your photographer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setShowMessages(true)}>
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-pink-400" />
                  </div>
                  <CardTitle className="text-foreground">Family Galleries</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    View galleries shared by family members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/family/galleries">
                      View Shared
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Settings className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-foreground">Settings</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage family sharing and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/client/settings/family">
                      Family Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Messaging Panel Modal */}
            {showMessages && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                  // Close when clicking the backdrop (not the panel itself)
                  if (e.target === e.currentTarget) {
                    setShowMessages(false)
                  }
                }}
              >
                <div className="w-full max-w-4xl max-h-[calc(100vh-2rem)]">
                  <MessagingPanel onClose={() => setShowMessages(false)} />
                </div>
              </div>
            )}

            {/* Quick Stats - Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Photos</p>
                      <p className="text-2xl font-bold text-foreground">
                        {statsLoading ? '...' : stats.totalPhotos.toLocaleString()}
                      </p>
                    </div>
                    <Camera className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Photo Sessions</p>
                      <p className="text-2xl font-bold text-foreground">
                        {statsLoading ? '...' : stats.photoSessions.toLocaleString()}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Link href="/client/favorites">
                <Card className="bg-card border-border hover:bg-accent/10 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Favorites</p>
                        <p className="text-2xl font-bold text-foreground">
                          {statsLoading ? '...' : stats.favorites.toLocaleString()}
                        </p>
                      </div>
                      <Heart className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Activity - Real Data */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    Recent Photo Sessions
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Your most recent photo sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted animate-pulse">
                          <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                            <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentGalleries.length > 0 ? (
                    <div className="space-y-4">
                      {recentGalleries.map((gallery) => (
                        <Link
                          key={gallery.id}
                          href={`/gallery/${gallery.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted hover:bg-accent/20 transition-colors"
                        >
                          <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                            {gallery.cover_image_url ? (
                              <img
                                src={gallery.cover_image_url}
                                alt={gallery.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{gallery.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {gallery.photo_count || 0} photos • {new Date(gallery.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                      {stats.photoSessions > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground hover:text-foreground"
                          onClick={scrollToGalleries}
                        >
                          View all {stats.photoSessions} galleries
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No recent sessions found</p>
                      <p className="text-sm text-muted-foreground/70">Your photo sessions will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Photographer Messages
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Updates from your photographer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No messages found</p>
                    <p className="text-sm text-muted-foreground/70">Messages from your photographer will appear here</p>
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
