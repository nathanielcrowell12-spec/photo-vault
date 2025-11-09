'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, Users, Heart, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function UserTypeSelectionPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<'photographer' | 'customer' | null>(null)

  const handleContinue = () => {
    if (selectedType === 'photographer') {
      router.push('/photographers/signup')
    } else if (selectedType === 'customer') {
      router.push('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">PhotoVault</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">Already have an account?</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Choose Your Account Type
            </Badge>
            <h1 className="text-4xl font-bold mb-4">How will you use PhotoVault?</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Select the option that best describes how you&apos;ll use PhotoVault to get started with the right experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Customer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === 'customer' 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedType('customer')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">I&apos;m a Customer</CardTitle>
                <CardDescription className="text-base">
                  I want to find and organize my photos from photographers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Find all your photos</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">From every photographer in your area</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Never lose access</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Permanent storage, no expiring links</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Organize everything</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Import from other platforms & upload phone photos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photographer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === 'photographer' 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-blue-300'
              }`}
              onClick={() => setSelectedType('photographer')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">I&apos;m a Photographer</CardTitle>
                <CardDescription className="text-base">
                  I want to manage and deliver photos to my clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Professional dashboard</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Manage clients, galleries, and payments</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Bulk upload tools</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Optimized, resumable uploads for large galleries without babysitting progress
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Client delivery</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Beautiful galleries with download controls</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={handleContinue}
              disabled={!selectedType}
            >
              Continue as {selectedType === 'photographer' ? 'Photographer' : selectedType === 'customer' ? 'Customer' : '...'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              You can always change your account type later in settings
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
