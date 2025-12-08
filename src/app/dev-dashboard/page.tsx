'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Crown,
  Smartphone,
  BarChart3,
  Settings,
  Wrench,
  ArrowRight,
  CheckCircle,
  Heart,
  Star,
  MapPin,
  Cloud
} from 'lucide-react'

export default function DevDashboard() {
  const clientFeatures = [
    {
      title: 'Photo Timeline',
      description: 'View all photos from all photographers in chronological order',
      href: '/client/timeline',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Upload Phone Photos',
      description: 'Dump all smartphone photos for automatic organization',
      href: '/client/upload',
      icon: Upload,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Desktop Upload',
      description: 'Launch the desktop app for large batch uploads.',
      href: '/client/upload',
      icon: Download,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Billing & Payments',
      description: 'View payment history and manage billing',
      href: '/client/billing',
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Make Payment',
      description: 'Pay for gallery access and unlock photos',
      href: '/client/payment',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Support & Help',
      description: 'Get help, FAQs, and contact support',
      href: '/client/support',
      icon: HelpCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Mobile Upload',
      description: 'Mobile-optimized photo upload interface',
      href: '/client/mobile-upload',
      icon: Smartphone,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    }
  ]

  const photographerFeatures = [
    {
      title: 'Client Management',
      description: 'Manage clients, send invites, track payments',
      href: '/photographers/clients',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Revenue Dashboard',
      description: 'Track earnings, commissions, and revenue breakdown',
      href: '/photographers/revenue',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate PDF reports, email reports, view analytics',
      href: '/photographers/reports',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Subscription Management',
      description: 'Manage $22/month subscription and billing',
      href: '/photographers/subscription',
      icon: Crown,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      title: 'Client Invitations',
      description: 'Invite clients with payment options',
      href: '/photographers/invite',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20'
    },
    {
      title: 'Gallery Import',
      description: 'Import galleries from other platforms',
      href: '/photographers/import',
      icon: Download,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Advanced revenue analytics and projections',
      href: '/photographers/analytics',
      icon: BarChart3,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20'
    }
  ]

  const publicPages = [
    {
      title: 'Home Page (B2C)',
      description: 'Consumer-facing homepage with SEO',
      href: '/',
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Photographer Landing (B2B)',
      description: 'Photographer-facing landing page with pricing',
      href: '/photographers',
      icon: Camera,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Terms & Pricing',
      description: 'Commission structure, payment terms, disclaimers',
      href: '/terms',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Main Dashboard',
      description: 'Unified dashboard for all users',
      href: '/dashboard',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Business Analytics',
      description: 'Profitability calculator, projections, and valuation metrics',
      href: '/admin/business-analytics',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b bg-neutral-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold">Dev Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Quick access to all PhotoVault features
                </p>
              </div>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link href="/test-dashboard">
                <CheckCircle className="h-4 w-4 mr-2" />
                Start Testing
              </Link>
            </Button>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              DEV MODE
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Quick Stats */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">7</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Client Features</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">8</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Photographer Features</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">4</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Public Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">100%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Features Built</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Pages */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Public Pages</h2>
              <Badge variant="outline">4 Pages</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {publicPages.map((feature) => (
                <Card key={feature.href} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={feature.href}>
                        Open Page
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Client Features */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Client Features</h2>
              <Badge variant="outline">7 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientFeatures.map((feature) => (
                <Card key={feature.href} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={feature.href}>
                        Open Feature
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Photographer Features */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Photographer Features</h2>
              <Badge variant="outline">8 Features</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {photographerFeatures.map((feature) => (
                <Card key={feature.href} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={feature.href}>
                        Open Feature
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Development Info */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-6 w-6 text-orange-600" />
                <span>Development Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">🎯 Current Status:</h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>✅ All features built and UI complete</li>
                    <li>✅ Navigation system implemented</li>
                    <li>✅ Dev dashboard for easy access</li>
                    <li>⏳ Backend integration pending</li>
                    <li>⏳ Authentication system pending</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">📊 Business Model:</h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>• Photographers: $22/month subscription</li>
                    <li>• Clients: $100 upfront + $8/month ongoing</li>
                    <li>• Commission: 50% split ($50 + $4/month)</li>
                    <li>• LTV/CAC: 19.9x (exceptional)</li>
                    <li>• Gross Margin: 84.6%</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🚀 Next Steps:</h3>
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <li>1. Connect to Supabase backend</li>
                    <li>2. Implement authentication</li>
                    <li>3. Test all features end-to-end</li>
                    <li>4. Deploy to Vercel</li>
                    <li>5. Launch MVP</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/financial-model.md" target="_blank">
                      <FileText className="h-4 w-4 mr-2" />
                      View Financial Model
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
