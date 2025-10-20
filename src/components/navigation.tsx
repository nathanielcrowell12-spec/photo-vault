'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useView } from '@/contexts/ViewContext'
import { isAdminUser } from '@/lib/access-control'
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
  EyeOff,
  Shield,
  Heart
} from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, userType } = useAuth()
  const { viewMode, setViewMode, isAdminView, isCustomerView, isPhotographerView } = useView()
  
  // Check if user is actually admin (restricted to nathaniel.crowell12@gmail.com)
  const isActuallyAdmin = isAdminUser(user?.email, userType)

  const isActive = (path: string) => pathname === path
  const isPhotographerSite = pathname.startsWith('/photographers') || pathname.startsWith('/dashboard')
  const isCustomerSite = !isPhotographerSite
  const isInDashboard = pathname === '/dashboard'
  const isInDashboardArea = pathname.startsWith('/dashboard') || pathname.startsWith('/photographers/')

  const clientLinks = [
    { href: '/client/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/client/timeline', icon: Calendar, label: 'Timeline' },
    { href: '/client/upload', icon: Upload, label: 'Upload Photos' },
    { href: '/client/import', icon: Download, label: 'Import Photos' },
    { href: '/client/billing', icon: CreditCard, label: 'Billing' },
    { href: '/client/support', icon: HelpCircle, label: 'Support' }
  ]

  const photographerLinks = [
    { href: '/photographer/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/photographer/clients', icon: Users, label: 'Clients' },
    { href: '/photographer/sessions', icon: Calendar, label: 'Sessions' },
    { href: '/photographer/revenue', icon: DollarSign, label: 'Revenue' },
    { href: '/photographer/reports', icon: FileText, label: 'Reports' },
    { href: '/photographer/subscription', icon: Crown, label: 'Subscription' }
  ]

  const adminLinks = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/settings', icon: Settings, label: 'System Settings' },
    { href: '/admin/database', icon: Shield, label: 'Database' },
    { href: '/admin/security', icon: Shield, label: 'Security' }
  ]

  const publicLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/photographers', icon: Camera, label: 'For Photographers' },
    { href: '/terms', icon: FileText, label: 'Terms & Pricing' }
  ]

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="border-b border-border bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container-pixieset">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={
              user 
                ? (isActuallyAdmin ? '/admin/dashboard' : 
                   userType === 'photographer' ? '/photographer/dashboard' : 
                   userType === 'client' ? '/client/dashboard' : '/')
                : '/'
            } className="flex items-center space-x-2">
              <Camera className="h-7 w-7 text-primary" />
              <span className="text-xl font-semibold tracking-tight">
                PhotoVault{isActuallyAdmin ? " Admin" : userType === 'photographer' ? " Pro" : ""}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {user ? (
                // Authenticated user navigation based on role
                <>
                  {isActuallyAdmin && (
                    // Admin navigation
                    <>
                      {adminLinks.slice(0, 4).map((link) => (
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
                    </>
                  )}

                  {userType === 'photographer' && (
                    // Photographer navigation
                    <>
                      {photographerLinks.slice(0, 4).map((link) => (
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
                    </>
                  )}

                  {userType === 'client' && (
                    // Client navigation
                    <>
                      {clientLinks.slice(0, 4).map((link) => (
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
                    </>
                  )}
                </>
              ) : (
                // Public navigation
                <>
                  <Button asChild variant="default" size="sm">
                    <Link href="/auth/signup">
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>

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
              {user ? (
                // Authenticated user mobile navigation
                <>
                  {isActuallyAdmin && adminLinks.map((link) => (
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
                  
                  {userType === 'photographer' && photographerLinks.map((link) => (
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
                  
                  {userType === 'client' && clientLinks.map((link) => (
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
                </>
              ) : (
                // Public mobile navigation
                publicLinks.map((link) => (
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
                ))
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Client Dashboard Navigation */}
      {userType === 'client' && pathname.startsWith('/client/') && (
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
      {userType === 'photographer' && pathname.startsWith('/photographer/') && (
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

      {/* Admin Dashboard Navigation */}
      {isActuallyAdmin && pathname.startsWith('/admin/') && (
        <div className="border-b bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-1 overflow-x-auto py-2">
              {adminLinks.map((link) => (
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
                    Import from Platforms
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
                  Import from Platforms
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
