'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Home,
  Camera,
  Users,
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
  ArrowRight,
  RefreshCcw
} from 'lucide-react'

interface TestItem {
  id: string
  category: string
  page: string
  url: string
  feature: string
  status: 'pending' | 'testing' | 'passed' | 'failed'
  notes?: string
}

export default function TestDashboard() {
  const [tests, setTests] = useState<TestItem[]>([
    // Customer Site (Public Pages)
    { id: 'home-1', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'Hero section displays', status: 'pending' },
    { id: 'home-2', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'CTA buttons work', status: 'passed' },
    { id: 'home-3', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'No photographer links visible', status: 'passed' },
    { id: 'home-4', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'Clean customer navigation', status: 'passed' },
    { id: 'home-5', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'How It Works scroll button', status: 'passed' },
    { id: 'home-6', category: 'Customer Site', page: 'Customer Homepage', url: '/', feature: 'Single Get Started CTA', status: 'passed' },
    
    // Photographer Site
    { id: 'photo-1', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'PhotoVault Pro branding displays', status: 'pending' },
    { id: 'photo-2', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'Pricing displays ($22/month)', status: 'pending' },
    { id: 'photo-3', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'Commission structure clear', status: 'pending' },
    { id: 'photo-4', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'View as Customer button works', status: 'pending' },
    { id: 'photo-5', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'Free trial CTA works', status: 'pending' },
    { id: 'photo-6', category: 'Photographer Site', page: 'Photographer Landing', url: '/photographers', feature: 'FAQ accordion works', status: 'pending' },
    
    // Terms & Pricing (Shared)
    { id: 'terms-1', category: 'Terms & Pricing', page: 'Terms & Pricing', url: '/terms', feature: 'Commission rules display', status: 'pending' },
    { id: 'terms-2', category: 'Terms & Pricing', page: 'Terms & Pricing', url: '/terms', feature: 'Payment model clear', status: 'pending' },
    { id: 'terms-3', category: 'Terms & Pricing', page: 'Terms & Pricing', url: '/terms', feature: 'Cross-photographer commission explained', status: 'pending' },
    
    // Footer Links (Company Pages)
    { id: 'about-1', category: 'Footer Links', page: 'About Us', url: '/about', feature: 'Page loads correctly', status: 'pending' },
    { id: 'about-2', category: 'Footer Links', page: 'About Us', url: '/about', feature: 'Mission statement displays', status: 'pending' },
    { id: 'about-3', category: 'Footer Links', page: 'About Us', url: '/about', feature: 'Value propositions clear', status: 'pending' },
    { id: 'about-4', category: 'Footer Links', page: 'About Us', url: '/about', feature: 'CTA buttons work', status: 'pending' },
    
    { id: 'contact-1', category: 'Footer Links', page: 'Contact', url: '/contact', feature: 'Page loads correctly', status: 'pending' },
    { id: 'contact-2', category: 'Footer Links', page: 'Contact', url: '/contact', feature: 'Contact form works', status: 'pending' },
    { id: 'contact-3', category: 'Footer Links', page: 'Contact', url: '/contact', feature: 'Email/phone links work', status: 'pending' },
    { id: 'contact-4', category: 'Footer Links', page: 'Contact', url: '/contact', feature: 'Form submission works', status: 'pending' },
    
    { id: 'privacy-1', category: 'Footer Links', page: 'Privacy Policy', url: '/privacy', feature: 'Page loads correctly', status: 'pending' },
    { id: 'privacy-2', category: 'Footer Links', page: 'Privacy Policy', url: '/privacy', feature: 'Privacy sections display', status: 'pending' },
    { id: 'privacy-3', category: 'Footer Links', page: 'Privacy Policy', url: '/privacy', feature: 'Data protection info clear', status: 'pending' },
    { id: 'privacy-4', category: 'Footer Links', page: 'Privacy Policy', url: '/privacy', feature: 'Contact privacy team link works', status: 'pending' },
    
    // Main Dashboard (Admin/Dev Access)
    { id: 'dash-1', category: 'Admin Dashboard', page: 'Main Dashboard', url: '/dashboard', feature: 'Client view displays', status: 'pending' },
    { id: 'dash-2', category: 'Admin Dashboard', page: 'Main Dashboard', url: '/dashboard', feature: 'Photographer view displays', status: 'pending' },
    { id: 'dash-3', category: 'Admin Dashboard', page: 'Main Dashboard', url: '/dashboard', feature: 'Context-aware navigation', status: 'pending' },
    { id: 'dash-4', category: 'Admin Dashboard', page: 'Dev Dashboard', url: '/dev-dashboard', feature: 'Admin access to all features', status: 'pending' },
    
    // Client Features
    { id: 'timeline-1', category: 'Client Features', page: 'Timeline', url: '/client/timeline', feature: 'Photo timeline displays', status: 'pending' },
    { id: 'timeline-2', category: 'Client Features', page: 'Timeline', url: '/client/timeline', feature: 'Filters work (photographer, type)', status: 'pending' },
    { id: 'timeline-3', category: 'Client Features', page: 'Timeline', url: '/client/timeline', feature: 'Search functionality', status: 'pending' },
    { id: 'timeline-4', category: 'Client Features', page: 'Timeline', url: '/client/timeline', feature: 'Photo actions (favorite, download)', status: 'pending' },
    
    { id: 'upload-1', category: 'Client Features', page: 'Upload Photos', url: '/client/upload', feature: 'File selection works', status: 'pending' },
    { id: 'upload-2', category: 'Client Features', page: 'Upload Photos', url: '/client/upload', feature: 'Drag & drop works', status: 'pending' },
    { id: 'upload-3', category: 'Client Features', page: 'Upload Photos', url: '/client/upload', feature: 'Upload progress displays', status: 'pending' },
    { id: 'upload-4', category: 'Client Features', page: 'Upload Photos', url: '/client/upload', feature: 'Auto-organization works', status: 'pending' },
    
    { id: 'import-1', category: 'Client Features', page: 'Import Photos', url: '/client/import', feature: 'Platform selection works', status: 'pending' },
    { id: 'import-2', category: 'Client Features', page: 'Import Photos', url: '/client/import', feature: 'Connection forms work', status: 'pending' },
    { id: 'import-3', category: 'Client Features', page: 'Import Photos', url: '/client/import', feature: 'Import progress displays', status: 'pending' },
    
    { id: 'billing-1', category: 'Client Features', page: 'Billing', url: '/client/billing', feature: 'Payment history displays', status: 'pending' },
    { id: 'billing-2', category: 'Client Features', page: 'Billing', url: '/client/billing', feature: 'Active galleries show', status: 'pending' },
    { id: 'billing-3', category: 'Client Features', page: 'Billing', url: '/client/billing', feature: 'Download receipts work', status: 'pending' },
    
    { id: 'payment-1', category: 'Client Features', page: 'Payment', url: '/client/payment', feature: 'Payment plans display', status: 'pending' },
    { id: 'payment-2', category: 'Client Features', page: 'Payment', url: '/client/payment', feature: 'Plan selection works', status: 'pending' },
    { id: 'payment-3', category: 'Client Features', page: 'Payment', url: '/client/payment', feature: 'Payment form functional', status: 'pending' },
    
    { id: 'support-1', category: 'Client Features', page: 'Support', url: '/client/support', feature: 'FAQ search works', status: 'pending' },
    { id: 'support-2', category: 'Client Features', page: 'Support', url: '/client/support', feature: 'Category filters work', status: 'pending' },
    { id: 'support-3', category: 'Client Features', page: 'Support', url: '/client/support', feature: 'Contact form works', status: 'pending' },
    
    // Photographer Features
    { id: 'clients-1', category: 'Photographer Features', page: 'Clients', url: '/photographers/clients', feature: 'Client list displays', status: 'pending' },
    { id: 'clients-2', category: 'Photographer Features', page: 'Clients', url: '/photographers/clients', feature: 'Send invitations works', status: 'pending' },
    { id: 'clients-3', category: 'Photographer Features', page: 'Clients', url: '/photographers/clients', feature: 'Payment reminders work', status: 'pending' },
    
    { id: 'sessions-1', category: 'Photographer Features', page: 'Sessions', url: '/photographers/sessions', feature: 'New session form works', status: 'pending' },
    { id: 'sessions-2', category: 'Photographer Features', page: 'Sessions', url: '/photographers/sessions', feature: 'Session list displays', status: 'pending' },
    
    { id: 'revenue-1', category: 'Photographer Features', page: 'Revenue', url: '/photographers/revenue', feature: 'Summary cards display', status: 'pending' },
    { id: 'revenue-2', category: 'Photographer Features', page: 'Revenue', url: '/photographers/revenue', feature: 'Revenue breakdown shows', status: 'pending' },
    { id: 'revenue-3', category: 'Photographer Features', page: 'Revenue', url: '/photographers/revenue', feature: 'Transaction history displays', status: 'pending' },
    
    { id: 'reports-1', category: 'Photographer Features', page: 'Reports', url: '/photographers/reports', feature: 'Report generation works', status: 'pending' },
    { id: 'reports-2', category: 'Photographer Features', page: 'Reports', url: '/photographers/reports', feature: 'PDF download works', status: 'pending' },
    { id: 'reports-3', category: 'Photographer Features', page: 'Reports', url: '/photographers/reports', feature: 'Email report works', status: 'pending' },
    
    { id: 'sub-1', category: 'Photographer Features', page: 'Subscription', url: '/photographers/subscription', feature: 'Plan details display', status: 'pending' },
    { id: 'sub-2', category: 'Photographer Features', page: 'Subscription', url: '/photographers/subscription', feature: 'Trial status shows', status: 'pending' },
    { id: 'sub-3', category: 'Photographer Features', page: 'Subscription', url: '/photographers/subscription', feature: 'Commission program info', status: 'pending' },
    
    { id: 'analytics-1', category: 'Photographer Features', page: 'Analytics', url: '/photographers/analytics', feature: 'Growth metrics display', status: 'pending' },
    { id: 'analytics-2', category: 'Photographer Features', page: 'Analytics', url: '/photographers/analytics', feature: 'Charts render properly', status: 'pending' },
    
    // Dual URL System
    { id: 'dual-1', category: 'Dual URL System', page: 'Customer Site', url: '/', feature: 'No photographer links visible', status: 'passed' },
    { id: 'dual-2', category: 'Dual URL System', page: 'Customer Site', url: '/', feature: 'Customer-focused branding', status: 'passed' },
    { id: 'dual-3', category: 'Dual URL System', page: 'Photographer Site', url: '/photographers', feature: 'PhotoVault Pro branding', status: 'pending' },
    { id: 'dual-4', category: 'Dual URL System', page: 'Photographer Site', url: '/photographers', feature: 'View as Customer button works', status: 'pending' },
    { id: 'dual-5', category: 'Dual URL System', page: 'Navigation', url: '/', feature: 'Context-aware navigation', status: 'pending' },
    { id: 'dual-6', category: 'Dual URL System', page: 'Navigation', url: '/photographers', feature: 'Photographer navigation', status: 'pending' },

    // Navigation
    { id: 'nav-1', category: 'Navigation', page: 'Global', url: '/', feature: 'Main navigation works', status: 'pending' },
    { id: 'nav-2', category: 'Navigation', page: 'Global', url: '/', feature: 'Sub-navigation appears', status: 'pending' },
    { id: 'nav-3', category: 'Navigation', page: 'Global', url: '/', feature: 'Footer links work', status: 'pending' },
    { id: 'nav-4', category: 'Navigation', page: 'Global', url: '/', feature: 'Dev mode button accessible', status: 'pending' },
    { id: 'nav-5', category: 'Navigation', page: 'Global', url: '/', feature: 'Mobile menu works', status: 'pending' },
  ])

  const updateTestStatus = (id: string, status: TestItem['status']) => {
    setTests(tests.map(test => test.id === id ? { ...test, status } : test))
  }

  const resetAllTests = () => {
    setTests(tests.map(test => ({ ...test, status: 'pending' })))
  }

  const categories = Array.from(new Set(tests.map(t => t.category)))
  
  const getStatusIcon = (status: TestItem['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />
      case 'testing': return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      default: return <AlertTriangle className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (status: TestItem['status']) => {
    switch (status) {
      case 'passed': return <Badge className="bg-green-100 text-green-800">Passed</Badge>
      case 'failed': return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'testing': return <Badge className="bg-blue-100 text-blue-800">Testing</Badge>
      default: return <Badge variant="outline">Pending</Badge>
    }
  }

  const totalTests = tests.length
  const passedTests = tests.filter(t => t.status === 'passed').length
  const failedTests = tests.filter(t => t.status === 'failed').length
  const testingTests = tests.filter(t => t.status === 'testing').length
  const pendingTests = tests.filter(t => t.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold">Interactive Test Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Test every feature systematically
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={resetAllTests} variant="outline" size="sm">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dev-dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Dev Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Progress Stats */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{totalTests}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{passedTests}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{failedTests}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{testingTests}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Testing</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-400">{pendingTests}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Pending</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                  <div 
                    className="bg-green-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(passedTests / totalTests) * 100}%` }}
                  />
                </div>
                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {Math.round((passedTests / totalTests) * 100)}% Complete
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Categories */}
          {categories.map(category => {
            const categoryTests = tests.filter(t => t.category === category)
            const categoryPassed = categoryTests.filter(t => t.status === 'passed').length
            
            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{category}</CardTitle>
                      <CardDescription>
                        {categoryTests.length} tests • {categoryPassed} passed
                      </CardDescription>
                    </div>
                    <div className="text-sm text-slate-600">
                      {Math.round((categoryPassed / categoryTests.length) * 100)}% Complete
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryTests.map(test => (
                      <div key={test.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              {getStatusIcon(test.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="font-medium">{test.page}</h3>
                                {getStatusBadge(test.status)}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{test.feature}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link href={test.url} target="_blank">
                                Test
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                            <Button
                              onClick={() => updateTestStatus(test.id, 'passed')}
                              variant={test.status === 'passed' ? 'default' : 'outline'}
                              size="sm"
                              className={test.status === 'passed' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => updateTestStatus(test.id, 'failed')}
                              variant={test.status === 'failed' ? 'default' : 'outline'}
                              size="sm"
                              className={test.status === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Known Issues */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <span>Known Issues & Fixes Applied</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Dual URL System</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Implemented: Separate customer and photographer experiences
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Customer Site Isolation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Fixed: Removed all photographer links from customer homepage
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Photographer Customer View</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Added: "View as Customer" button for photographers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Context-Aware Navigation</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Fixed: Navigation adapts based on site type (customer vs photographer)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Routing & Links</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Fixed: All pages now properly routed and accessible
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">User Types</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ✅ Fixed: Updated AuthContext to use 'client' instead of 'consumer'
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Mock Data</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ⏳ Next: All features have mock data for testing (no backend required yet)
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Responsive Design</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ⏳ Next: Test mobile responsiveness on all pages
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testing Instructions */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle>How to Use This Dashboard</CardTitle>
            </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start space-x-2">
                <span className="font-semibold">1.</span>
                <span>Click the "Test" button to open the page in a new tab</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold">2.</span>
                <span>Test the specific feature described</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold">3.</span>
                <span>Click the green checkmark if it works, red X if it fails</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold">4.</span>
                <span>Track progress with the stats at the top</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-semibold">5.</span>
                <span>Report any failures to me and I'll fix them immediately!</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Dual URL System Testing:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>Customer Site:</strong> Test <code>/</code> - should have NO photographer links</li>
                <li>• <strong>Photographer Site:</strong> Test <code>/photographers</code> - should have full compensation details</li>
                <li>• <strong>Customer View Button:</strong> From photographer site, click "View as Customer"</li>
                <li>• <strong>Navigation:</strong> Should show different branding and buttons based on site type</li>
              </ul>
            </div>
          </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
