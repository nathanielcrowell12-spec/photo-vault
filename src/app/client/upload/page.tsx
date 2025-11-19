'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Download,
  CheckCircle,
  Heart,
  Star,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import PaymentGuard from '@/components/PaymentGuard'

export default function PhotoImportPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (userType !== 'client') {
    return null
  }


  return (
    <PaymentGuard requireActivePayment={true}>
      <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-slate-900">
        <div className="container-pixieset py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Download className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold tracking-tight">Upload Your Photos</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Secure Import
          </Badge>
        </div>
      </header>

      <main className="container-pixieset py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <Card className="mb-12 card-shadow border border-border bg-gradient-to-br from-primary/10 to-secondary/30">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Heart className="h-10 w-10 text-red-500" />
                <Star className="h-10 w-10 text-yellow-500" />
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
                Upload Your Photos
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Choose the best upload method for your photos. Upload directly from your computer or use our convenient web interface.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Organized Timeline</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Unlimited Access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Options */}
          <Card className="card-shadow border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Your Photos
              </CardTitle>
              <CardDescription>
                Choose the best upload method for your photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Desktop App Upload */}
                <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => {
                  // Try to launch the desktop app, fallback to download
                  try {
                    window.open('photovault-desktop://upload', '_self');
                  } catch (error) {
                    // If desktop app not installed, redirect to download
                    window.open('/download-desktop-app', '_blank');
                  }
                }}>
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-semibold">
                    RECOMMENDED
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                      <Camera className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Desktop App Upload</CardTitle>
                    <CardDescription>
                      Launch the desktop app for large uploads and faster speed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">Up to 500MB per file</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">All formats including RAW</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">Up to 10,000 files</span>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Launch Desktop App
                    </Button>
                  </CardContent>
                </Card>

                {/* Web Upload */}
                <Card className="relative overflow-hidden border-2 hover:border-green-500 transition-colors cursor-pointer group" onClick={() => router.push('/client/upload')}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                      <Heart className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">Online Upload</CardTitle>
                    <CardDescription>
                      For convenient, smaller uploads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">Up to 25MB per file</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">No download required</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">Perfect for phone photos</span>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Start Web Upload
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      </div>
    </PaymentGuard>
  )
}

