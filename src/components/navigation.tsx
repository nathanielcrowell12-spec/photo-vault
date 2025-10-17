'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useView } from '@/contexts/ViewContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Users,
  Home,
  Calendar,
  Download,
  Upload,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  Settings,
  Menu,
  X,
  Crown,
  Smartphone,
  BarChart3,
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [devMode, setDevMode] = useState(true) // Set to true for development
  const { viewMode, setViewMode, isAdminView, isCustomerView, isPhotographerView } = useView()

  const isActive = (path: string) => pathname === path
  const isPhotographerSite = pathname.startsWith('/photographers') || pathname.startsWith('/dashboard')
  const isCustomerSite = !isPhotographerSite
  const isInDashboard = pathname === '/dashboard'
  const isInDashboardArea = pathname.startsWith('/dashboard') || pathname.startsWith('/photographers/')

  const clientLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/client/timeline', icon: Calendar, label: 'Timeline' },
    { href: '/client/upload', icon: Upload, label: 'Upload Photos' },
    { href: '/client/import', icon: Download, label: 'Import Photos' },
    { href: '/client/billing', icon: CreditCard, label: 'Billing' },
    { href: '/client/support', icon: HelpCircle, label: 'Support' }
  ]

  const photographerLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/photographers/clients', icon: Users, label: 'Clients' },
    { href: '/photographers/sessions', icon: Calendar, label: 'Sessions' },
    { href: '/photographers/revenue', icon: DollarSign, label: 'Revenue' },
    { href: '/photographers/reports', icon: FileText, label: 'Reports' },
    { href: '/photographers/subscription', icon: Crown, label: 'Subscription' }
  ]

  const publicLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/photographers', icon: Camera, label: 'For Photographers' },
    { href: '/terms', icon: FileText, label: 'Terms & Pricing' }
  ]

  // Dev mode toggle function
  const toggleDevMode = () => {
    setDevMode(!devMode)
  }

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="border-b border-border bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container-pixieset">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={isInDashboardArea ? "/dashboard" : (isPhotographerSite ? "/photographers" : "/")} className="flex items-center space-x-2">
              <Camera className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold tracking-tight">
                PhotoVault{isPhotographerSite ? " Pro" : ""}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Admin/Photographer View Mode Indicators */}
              {isInDashboardArea && !isAdminView && (
                <Button 
                  onClick={() => setViewMode('admin')}
                  variant="outline" 
                  size="sm"
                  className="bg-secondary border-border text-foreground hover:bg-secondary/80"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              )}

              {isPhotographerSite ? (
                // Photographer/Admin navigation
                <>
                  {isInDashboardArea ? (
                    // Show navigation links when in dashboard area
                    <>
                      {photographerLinks.slice(0, 5).map((link) => (
                        <Button
                          key={link.href}
                          asChild
                          variant={isActive(link.href) ? "default" : "ghost"}
                          size="sm"
                        >
                          <Link href={link.href}>
                            <link.icon className="h-4 w-4 mr-2" />
                            {link.label}
                          </Link>
                        </Button>
                      ))}
                      {isInDashboard && isAdminView && (
                        <>
                          <Button 
                            onClick={() => setViewMode('photographer')}
                            variant="outline" 
                            size="sm"
                            className="bg-primary/100 border-blue-300 text-blue-700"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            View as Photographer
                          </Button>
                          <Button 
                            onClick={() => setViewMode('customer')}
                            variant="outline" 
                            size="sm"
                            className="bg-pink-100 border-pink-300 text-pink-700"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View as Customer
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    // Show "Join as Partner" on photographer landing page
                    <Button asChild variant="default" size="sm">
                      <Link href="/dashboard">
                        Join as Partner
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                // Customer navigation
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">
                      <Users className="h-4 w-4 mr-2" />
                      Find My Photos
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Dev Mode Button (Desktop) */}
            {devMode && (
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  DEV MODE
                </Badge>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Link href="/dev-dashboard">
                    <Wrench className="h-4 w-4 mr-2" />
                    Admin Access
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {publicLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              ))}

              {/* Dev Mode Button (Mobile) */}
              {devMode && (
                <>
                  <div className="pt-4 pb-2">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      DEV MODE
                    </Badge>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start border-orange-500 text-orange-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/dev-dashboard">
                      <Wrench className="h-4 w-4 mr-2" />
                      Admin Access
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Client Dashboard Navigation */}
      {pathname.startsWith('/client/') && (
        <div className="border-b bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-1 overflow-x-auto py-2">
              {clientLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  size="sm"
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Photographer Dashboard Navigation */}
      {pathname.startsWith('/photographers/') && (
        <div className="border-b bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-1 overflow-x-auto py-2">
              {photographerLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  size="sm"
                >
                  <Link href={link.href}>
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function Footer() {
  const pathname = usePathname()
  const isPhotographerSite = pathname.startsWith('/photographers')
  const isCustomerSite = !isPhotographerSite

  if (isCustomerSite) {
    // Customer footer - clean and focused
    return (
      <footer className="border-t border-border bg-secondary/30 dark:bg-slate-900 mt-auto">
        <div className="container-pixieset py-12">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold tracking-tight">PhotoVault</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Find and keep every photo you love — forever.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">For Families</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/client/timeline" className="text-muted-foreground hover:text-primary transition-colors">
                    Photo Timeline
                  </Link>
                </li>
                <li>
                  <Link href="/client/upload" className="text-muted-foreground hover:text-primary transition-colors">
                    Upload Photos
                  </Link>
                </li>
                <li>
                  <Link href="/client/import" className="text-muted-foreground hover:text-primary transition-colors">
                    Import Photos
                  </Link>
                </li>
                <li>
                  <Link href="/client/support" className="text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/photographers" className="text-muted-foreground hover:text-primary transition-colors">
                    Are you a photographer?
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} PhotoVault. Your memories, safe forever.</p>
          </div>
        </div>
      </footer>
    )
  }

  // Photographer footer - full feature set
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-900 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">PhotoVault Pro</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your local photo network. Access all your memories from every photographer in one place.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Clients</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/client/timeline" className="text-muted-foreground hover:text-primary transition-colors">
                  Photo Timeline
                </Link>
              </li>
              <li>
                <Link href="/client/upload" className="text-muted-foreground hover:text-primary transition-colors">
                  Upload Photos
                </Link>
              </li>
              <li>
                <Link href="/client/import" className="text-muted-foreground hover:text-primary transition-colors">
                  Import Photos
                </Link>
              </li>
              <li>
                <Link href="/client/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Photographers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/photographers" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing & Commission
                </Link>
              </li>
              <li>
                <Link href="/photographers/revenue" className="text-muted-foreground hover:text-primary transition-colors">
                  Revenue Dashboard
                </Link>
              </li>
              <li>
                <Link href="/photographers/reports" className="text-muted-foreground hover:text-primary transition-colors">
                  Reports & Analytics
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} PhotoVault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
