'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Search,
  Clock,
  CreditCard,
  Upload,
  Users,
  DollarSign,
  Settings,
  Loader2,
  ExternalLink,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: 'stripe' | 'upload' | 'clients' | 'billing' | 'general'
}

const faqItems: FAQItem[] = [
  {
    question: "How do I connect my Stripe account?",
    answer: "Go to Settings in your dashboard and click 'Connect Stripe Account'. You'll be redirected to Stripe's secure signup where you'll enter your business and banking details.",
    category: "stripe"
  },
  {
    question: "When do I get paid?",
    answer: "Commissions are deposited within 2-3 business days of client payment. Funds go directly to your connected Stripe account - no invoicing required.",
    category: "stripe"
  },
  {
    question: "How much do I earn per client?",
    answer: "Year Package: $50 upfront commission. 6-Month Package: $25 upfront. After the initial package, you earn $4/month for each active client paying $8/month.",
    category: "stripe"
  },
  {
    question: "How do I upload photos?",
    answer: "For large uploads (ZIP files), use the Desktop App - it handles large files reliably. For smaller batches (under 100 photos), you can upload directly in your browser from the gallery page.",
    category: "upload"
  },
  {
    question: "What file formats are supported?",
    answer: "JPEG/JPG, PNG, and HEIC are supported. HEIC files are converted automatically. RAW file support is coming soon.",
    category: "upload"
  },
  {
    question: "My upload is stuck or failing. What do I do?",
    answer: "For large uploads, use the Desktop App - it handles interruptions gracefully. Check your internet connection, try a smaller batch, and make sure files are under 100MB each for web upload.",
    category: "upload"
  },
  {
    question: "How do I invite a client to their gallery?",
    answer: "Open the gallery, click 'Share' or 'Invite Client', and copy the unique gallery link. Send it via email, text, or your booking software.",
    category: "clients"
  },
  {
    question: "What happens when a client clicks the gallery link?",
    answer: "They can preview a few teaser photos, choose their package (Year or 6-Month), create an account and pay, then instantly access all photos.",
    category: "clients"
  },
  {
    question: "How much is the platform fee?",
    answer: "PhotoVault charges $22/month for the platform. This covers unlimited galleries, unlimited photo storage, client management tools, commission payouts, and customer support.",
    category: "billing"
  },
  {
    question: "How do I cancel my subscription?",
    answer: "Go to Settings > Subscription and click 'Cancel Subscription'. Your galleries remain accessible to clients even if you cancel, and you'll continue earning commissions from existing clients.",
    category: "billing"
  }
]

export default function PhotographerSupportPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && userType !== 'photographer') {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (userType !== 'photographer') {
    return null
  }

  const filteredFAQs = faqItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Support ticket submitted successfully! We\'ll get back to you within 24 hours.')
      setSupportForm({ subject: '', category: '', message: '', priority: 'normal' })
    } catch (error) {
      console.error('Support submission error:', error)
      alert('Failed to submit support ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stripe': return <DollarSign className="h-4 w-4" />
      case 'upload': return <Upload className="h-4 w-4" />
      case 'clients': return <Users className="h-4 w-4" />
      case 'billing': return <CreditCard className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stripe': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'upload': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'clients': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'billing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-foreground">Help & Support</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href="/download-desktop-app" className="flex items-center space-x-3">
                  <Upload className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">Desktop App</h3>
                    <p className="text-sm text-muted-foreground">For large uploads</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href="/photographers/settings" className="flex items-center space-x-3">
                  <Settings className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">Settings</h3>
                    <p className="text-sm text-muted-foreground">Stripe & billing</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href="/photographers/revenue" className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">Revenue</h3>
                    <p className="text-sm text-muted-foreground">Track earnings</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="mb-8 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-green-600" />
                <span>Frequently Asked Questions</span>
              </CardTitle>
              <CardDescription>
                Find answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="stripe">Stripe & Payments</SelectItem>
                    <SelectItem value="upload">Uploading</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredFAQs.map((item, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground">
                        {item.question}
                      </h3>
                      <Badge className={`${getCategoryColor(item.category)} flex items-center space-x-1 ml-2 shrink-0`}>
                        {getCategoryIcon(item.category)}
                        <span className="capitalize">{item.category}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="mb-8 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6 text-purple-600" />
                <span>Contact Support</span>
              </CardTitle>
              <CardDescription>
                Can&apos;t find what you&apos;re looking for? Send us a message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSupportSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={supportForm.category}
                      onValueChange={(value) => setSupportForm({...supportForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe & Payments</SelectItem>
                        <SelectItem value="upload">Uploading Issues</SelectItem>
                        <SelectItem value="clients">Client Management</SelectItem>
                        <SelectItem value="billing">Platform Billing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={supportForm.priority}
                    onValueChange={(value) => setSupportForm({...supportForm, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="normal">Normal - Need help</SelectItem>
                      <SelectItem value="high">High - Urgent issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue in detail..."
                    rows={6}
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Support Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2 text-foreground">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get help via email within 24 hours
                </p>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  support@photovault.photo
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2 text-foreground">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Call us for immediate assistance
                </p>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  (608) 571-7532
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
