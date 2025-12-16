'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, Database, UserCheck, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Privacy Policy
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Privacy Matters
            </h1>
            <p className="text-xl text-muted-foreground dark:text-foreground">
              How we protect and handle your data
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-4">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Your Data is Safe</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Enterprise-grade encryption and security
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Full Transparency</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Clear about what we collect and why
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">You&apos;re in Control</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Manage your data preferences anytime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Information We Collect</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <li>Name and email address</li>
                    <li>Phone number (optional)</li>
                    <li>Payment information (processed securely via Stripe)</li>
                    <li>Account preferences and settings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Photos and Content</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <li>Photos uploaded by you or your photographers</li>
                    <li>Photo metadata (date, location if provided)</li>
                    <li>Gallery names and organization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <li>How you interact with our platform</li>
                    <li>Features you use most often</li>
                    <li>Device and browser information</li>
                    <li>IP address and location data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-green-600" />
                  <span>How We Use Your Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">To Provide Our Services</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    We use your information to operate PhotoVault, including storing your photos, managing your account, processing payments, and connecting you with photographers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">To Improve Our Platform</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    We analyze usage patterns to enhance features, fix bugs, and develop new capabilities that better serve your needs.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">To Communicate With You</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    We send important updates about your account, payment reminders, new gallery notifications, and optional marketing communications (which you can opt out of).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>How We Protect Your Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Encryption</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    All photos and data are encrypted in transit (TLS/SSL) and at rest using AES-256 encryption.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Access Controls</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Strict authentication, role-based access, and regular security audits ensure only authorized users can access your data.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Secure Infrastructure</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    We use enterprise-grade cloud infrastructure with automatic backups, disaster recovery, and 99.9% uptime guarantee.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>Data Sharing and Third Parties</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">We DO NOT:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <li>Sell your photos or personal information to third parties</li>
                    <li>Use your photos for advertising or training AI models</li>
                    <li>Share your data with anyone without your consent</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">We DO Share With:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <li><strong>Your Photographers:</strong> Only the photos they upload for you</li>
                    <li><strong>Payment Processors:</strong> Stripe (for secure payment processing)</li>
                    <li><strong>Cloud Storage:</strong> AWS S3 (encrypted photo storage)</li>
                    <li><strong>Analytics:</strong> Anonymized usage data to improve our service</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                  <span>Your Rights and Choices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground dark:text-muted-foreground">
                  <li>
                    <strong>Access Your Data:</strong> Download all your photos and information anytime
                  </li>
                  <li>
                    <strong>Delete Your Data:</strong> Request account deletion with complete data removal
                  </li>
                  <li>
                    <strong>Correct Errors:</strong> Update or correct your personal information
                  </li>
                  <li>
                    <strong>Opt Out of Marketing:</strong> Unsubscribe from promotional emails
                  </li>
                  <li>
                    <strong>Export Your Photos:</strong> Download all your photos in original quality
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Children&apos;s Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  PhotoVault is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at privacy@photovault.com.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through our platform. Your continued use of PhotoVault after changes constitutes acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-center">Questions About Privacy?</h3>
                <p className="text-center text-muted-foreground dark:text-muted-foreground mb-4">
                  We&apos;re here to help. Contact our privacy team anytime.
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild variant="outline">
                    <Link href="/contact">
                      Contact Us
                    </Link>
                  </Button>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <a href="mailto:privacy@photovault.com">
                      Email Privacy Team
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

