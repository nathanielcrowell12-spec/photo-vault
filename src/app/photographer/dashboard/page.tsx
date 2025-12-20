'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Users,
  DollarSign,
  BarChart3,
  Upload,
  Share2,
  MessageSquare,
  Star,
  Image,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Edit,
  Calendar,
  Menu,
  X,
  Plus,
  FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'
import GalleryGrid from '@/components/GalleryGrid'
import MessagesButton from '@/components/MessagesButton'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

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

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const NavItem = ({ href, icon: Icon, label, active = false }: any) => (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-amber-500 text-black font-medium shadow-lg shadow-amber-500/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon size={20} className={active ? 'text-black' : 'text-muted-foreground group-hover:text-foreground'} />
      <span className="text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black"></div>}
    </Link>
  )

  return (
    <AccessGuard requiredAccess="canAccessPhotographerDashboard">
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide ALL global Navigation components from layout.tsx */
        body > div > div > nav { display: none !important; }
        body > div > div > footer { display: none !important; }
        body > div > div > main { padding: 0 !important; margin: 0 !important; }
        /* Make sure our dashboard header stays visible */
        header.sticky { display: block !important; }
      `}} />
      <div className="min-h-screen bg-background text-foreground font-sans">

        {/* Top Header - Navy Blue */}
        <header className="sticky top-0 z-50 bg-[#1a365d] backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/photovault-logo.jpg"
                    alt="PhotoVault"
                    className="h-10 w-auto"
                  />
                  <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 border text-xs">Pro</Badge>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-1">
                  <Link
                    href="/photographer/dashboard"
                    className="px-4 py-2 text-sm font-medium text-foreground bg-white/10 rounded-lg"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/photographer/clients"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Clients
                  </Link>
                  <Link
                    href="/photographer/galleries"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Galleries
                  </Link>
                  <Link
                    href="/photographers/revenue"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Revenue
                  </Link>
                  <Link
                    href="/photographers/reports"
                    className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Reports
                  </Link>
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-3">
                  <ThemeModeToggle variant="icon" className="text-foreground hover:text-foreground hover:bg-accent/50" />
                  <button className="p-2 text-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#f59e0b] rounded-full"></span>
                  </button>
                  <Link href="/photographers/settings" className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground font-medium">{user?.email?.split('@')[0]}</span>
                  </Link>
                  <Button
                    onClick={signOut}
                    className="bg-white/10 text-foreground hover:bg-white/20 border-0"
                  >
                    Sign Out
                  </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-foreground hover:text-foreground"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-[#1a365d] lg:hidden pt-20 px-6 space-y-2">
            <Link
              href="/photographer/dashboard"
              className="block px-4 py-3 rounded-lg bg-white/10 text-foreground font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/photographer/clients"
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Clients
            </Link>
            <Link
              href="/photographer/galleries"
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Galleries
            </Link>
            <Link
              href="/photographers/revenue"
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Revenue
            </Link>
            <Link
              href="/photographers/reports"
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Reports
            </Link>
            <div className="h-px bg-white/10 my-4" />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">Appearance</p>
              <ThemeModeToggle />
            </div>
            <Link
              href="/photographers/settings"
              className="block px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Settings
            </Link>
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-3 rounded-lg text-foreground hover:bg-muted"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="min-h-screen">

          <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl border border-border shadow-2xl">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(/images/hero/city-dawn-aerial.jpg)',
                }}
              >
                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-card/80 to-background/85"></div>
              </div>
              
              {/* Gradient Overlays for Depth */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-card/60 to-transparent z-10"></div>
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] z-10"></div>

              <div className="relative z-20 p-8 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                    <Star size={12} fill="currentColor" /> Premium Member
                  </div>
                  <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
                    {getGreeting()}, <br className="hidden lg:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
                      {user?.email?.split('@')[0] || 'Photographer'}.
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage your clients, galleries, and grow your business.
                  </p>
                </div>

                <Button
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  asChild
                >
                  <Link href="/photographer/galleries/create">
                    <Plus size={20} />
                    Create New Gallery
                  </Link>
                </Button>
              </div>
            </section>

            {/* Stats Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-foreground">Business Overview</h3>
                <select className="bg-card border border-border text-sm text-muted-foreground rounded-lg px-3 py-1 outline-none focus:border-primary/50">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Year</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Active Clients */}
                <Link href="/photographer/clients" className="group p-6 rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-border transition-all duration-300 backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className="p-3 rounded-xl bg-secondary text-blue-400 border border-border">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <TrendingUp size={12} className="mr-1" />
                      +1 this month
                    </span>
                  </div>
                  <div className="space-y-1 relative">
                    <h4 className="text-3xl font-semibold text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">
                      {statsLoading ? '...' : stats.activeClients}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Active Clients</p>
                  </div>
                </Link>

                {/* Total Galleries */}
                <Link href="/photographer/galleries" className="group p-6 rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-border transition-all duration-300 backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className="p-3 rounded-xl bg-secondary text-purple-400 border border-border">
                      <Camera size={20} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      Collections
                    </span>
                  </div>
                  <div className="space-y-1 relative">
                    <h4 className="text-3xl font-semibold text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">
                      {statsLoading ? '...' : stats.totalGalleries}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Galleries</p>
                  </div>
                </Link>

                {/* Monthly Revenue - Highlighted */}
                <Link href="/photographers/revenue" className="group p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                      <DollarSign size={20} className="text-primary" />
                    </div>
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Revenue
                    </span>
                  </div>
                  <div className="space-y-1 relative">
                    <h4 className="text-3xl font-semibold text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">
                      {statsLoading ? '...' : `$${stats.monthlyEarnings.toFixed(2)}`}
                    </h4>
                    <p className="text-sm text-primary/80 font-medium uppercase tracking-wide">Monthly Earnings</p>
                  </div>
                </Link>

                {/* Client Rating */}
                <Link href="/photographer/feedback" className="group p-6 rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-border transition-all duration-300 backdrop-blur-sm relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className="p-3 rounded-xl bg-secondary text-yellow-400 border border-border">
                      <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stats.clientRating >= 4.5
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : stats.clientRating > 0
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground bg-secondary'
                    }`}>
                      {stats.clientRating >= 4.5 ? 'Excellent' : stats.clientRating > 0 ? 'Reviews' : 'No reviews yet'}
                    </span>
                  </div>
                  <div className="space-y-1 relative">
                    <h4 className="text-3xl font-semibold text-foreground tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">
                      {statsLoading ? '...' : stats.clientRating > 0 ? stats.clientRating.toFixed(1) : '-'}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Client Rating</p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Client Messages */}
            <section className="p-6 lg:p-8 rounded-3xl bg-card border border-border mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">Client Messages</h3>
                </div>
                <MessagesButton variant="button" showLabel />
              </div>
              <p className="text-muted-foreground text-sm">Click the button above to view and respond to client messages.</p>
            </section>

            {/* Gallery Grid */}
            <section className="p-6 lg:p-8 rounded-3xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Camera className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium text-foreground">Your Galleries</h3>
              </div>
              {user && <GalleryGrid userId={user.id} />}
            </section>

          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a365d] border-t border-border flex justify-around p-3 z-50">
          <Link href="/photographer/dashboard" className="flex flex-col items-center gap-1 text-[#f59e0b]">
            <BarChart3 size={20} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/photographer/galleries" className="flex flex-col items-center gap-1 text-foreground">
            <Camera size={20} />
            <span className="text-[10px] font-medium">Gallery</span>
          </Link>
          <div className="relative -top-6">
            <Button className="w-12 h-12 bg-[#f59e0b] hover:bg-[#f59e0b]/90 rounded-full flex items-center justify-center text-black shadow-lg shadow-[#f59e0b]/30" asChild>
              <Link href="/photographer/galleries/create">
                <Plus size={20} />
              </Link>
            </Button>
          </div>
          <Link href="/photographer/clients" className="flex flex-col items-center gap-1 text-foreground">
            <Users size={20} />
            <span className="text-[10px] font-medium">Clients</span>
          </Link>
          <Link href="/photographers/settings" className="flex flex-col items-center gap-1 text-foreground">
            <Settings size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>

      </div>
    </AccessGuard>
  )
}
