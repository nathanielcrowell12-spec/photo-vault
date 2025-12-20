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
  AlertCircle,
  Users,
  CreditCard,
  Camera,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: string
  category: 'billing' | 'gallery' | 'technical' | 'account'
}

const faqItems: FAQItem[] = [
  {
    question: "How do I access my photo gallery?",
    answer: "Once you've made payment, you'll receive an email with a direct link to your gallery. You can also access it anytime from your PhotoVault dashboard.",
    category: "gallery"
  },
  {
    question: "Can I download all my photos?",
    answer: "Yes! With any paid plan, you get unlimited downloads in high resolution. You can download individual photos or entire galleries as ZIP files.",
    category: "gallery"
  },
  {
    question: "How long do I have access to my photos?",
    answer: "Access duration depends on your plan: Annual+Monthly (1 year + ongoing), 6-Month Trial (6 months), or Monthly (ongoing monthly access).",
    category: "billing"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through our payment processor.",
    category: "billing"
  },
  {
    question: "Can I share my gallery with family and friends?",
    answer: "Absolutely! You can share your gallery with anyone by sending them the gallery link. They can view and download photos without needing an account.",
    category: "gallery"
  },
  {
    question: "How do I update my payment method?",
    answer: "Go to your Billing & Payments page and click 'Update Payment Method'. You can change your card details anytime before your next billing date.",
    category: "billing"
  },
  {
    question: "What if I can't access my gallery?",
    answer: "First, check if your payment is up to date. If you're still having issues, try clearing your browser cache or using a different browser. Contact support if problems persist.",
    category: "technical"
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from your account settings. You'll keep access until your current billing period ends.",
    category: "account"
  },
  {
    question: "How do I contact my photographer?",
    answer: "Each gallery includes your photographer's contact information. You can also reach them directly through the messaging system in your gallery.",
    category: "gallery"
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes, we use industry-standard encryption and never store your full payment details. All transactions are processed securely through our payment processor.",
    category: "billing"
  }
]

export default function ClientSupportPage() {
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
    if (!loading && userType !== 'client') {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userType])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (userType !== 'client') {
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
      // Simulate support ticket submission
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
      case 'billing': return <CreditCard className="h-4 w-4" />
      case 'gallery': return <Camera className="h-4 w-4" />
      case 'technical': return <AlertCircle className="h-4 w-4" />
      case 'account': return <Users className="h-4 w-4" />
      default: return <HelpCircle className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'billing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'gallery': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'technical': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'account': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-foreground">Support & Help</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              24/7 Support
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Help */}
          <Card className="mb-8 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-green-600" />
                <span>Quick Help</span>
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
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="gallery">Gallery</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
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
                      <Badge className={`${getCategoryColor(item.category)} flex items-center space-x-1`}>
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
                        <SelectItem value="billing">Billing & Payments</SelectItem>
                        <SelectItem value="gallery">Gallery Access</SelectItem>
                        <SelectItem value="technical">Technical Issues</SelectItem>
                        <SelectItem value="account">Account Settings</SelectItem>
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
