'use client'

import { useState, useEffect } from 'react'
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
import CompetitorLogos from '@/components/CompetitorLogos'
import PlatformConnectionModal from '@/components/PlatformConnectionModal'
import PaymentGuard from '@/components/PaymentGuard'

export default function PhotoImportPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)

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

  const handlePlatformConnect = async (credentials: any) => {
    // TODO: Implement actual API connection
    console.log('Connecting to platform:', credentials)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Connected successfully!')
    
    // TODO: Save connection to Supabase
    // TODO: Start import process
    // TODO: Redirect to galleries page
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
              <span className="text-xl font-semibold tracking-tight">Import Your Photos</span>
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
                Bring All Your Photos Together
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Connect your existing photo galleries from photographers all over the city. 
                Access all your memories in one beautiful, organized timeline.
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

          {/* Platform Selection Grid */}
          <Card className="card-shadow border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">
                Select Your Photo Platform
              </CardTitle>
              <CardDescription>
                Click on any platform to connect and import your photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorLogos 
                onPlatformClick={(platform) => setSelectedPlatform(platform)}
                showOtherOption={true}
                showImportButton={false}
                showUpdateButton={false}
              />
              
              <div className="mt-8 p-4 bg-secondary/30 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">💡 How It Works</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click on your photographer&apos;s platform</li>
                  <li>Enter your login credentials</li>
                  <li>We&apos;ll securely import all your galleries</li>
                  <li>View and organize your photos in PhotoVault</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Platform Connection Modal */}
      <PlatformConnectionModal
        platform={selectedPlatform}
        isOpen={!!selectedPlatform}
        onClose={() => setSelectedPlatform(null)}
        onConnect={handlePlatformConnect}
      />
      </div>
    </PaymentGuard>
  )
}

