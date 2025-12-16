'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Wifi, 
  Shield,
  ArrowLeft,
  Monitor,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function DownloadDesktopAppPage() {
  const handleDownload = () => {
    // In production, this would download the actual installer
    // For now, we'll show a message
    alert('Desktop app installer will be available soon! The installer is currently being built.')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container-pixieset py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/client/upload">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload Options
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Download className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold tracking-tight text-foreground">Download Desktop App</span>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Windows Ready
            </Badge>
          </div>
        </div>
      </header>

      <main className="container-pixieset py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Banner Image */}
          <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-8 shadow-lg border border-border">
            <Image
              src="https://images.unsplash.com/photo-1655432370508-d97cdbe14328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDAwMzd8MHwxfHNlYXJjaHwxfHxjbG91ZCUyMHVwbG9hZCUyMGZpbGVzJTIwbGFwdG9wJTIwbW9kZXJuJTIwd29ya3NwYWNlJTIwbWluaW1hbHxlbnwwfDB8fHwxNzY1MDI1NDQxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Modern laptop workspace for seamless file uploads"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <p className="absolute bottom-3 right-3 text-xs text-foreground/70">
              Photo by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Unsplash</a>
            </p>
          </div>

          {/* Hero Section */}
          <Card className="mb-8 card-shadow border border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Monitor className="h-12 w-12 text-blue-400" />
                <Download className="h-12 w-12 text-purple-400" />
                <HardDrive className="h-12 w-12 text-green-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
                No More Zip Files. Ever.
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light mb-8">
                Remember when your photographer sent you a 4GB zip file? Remember trying to open it on your phone?
                We fixed that. PhotoVault delivers photos directly to your camera roll. One tap. Full resolution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-foreground px-8 py-3 text-lg"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download for Windows
                </Button>
                <Button variant="outline" size="lg" asChild className="border-border text-muted-foreground hover:bg-muted">
                  <Link href="/client/upload">
                    Try Web Upload Instead
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Why Desktop App */}
            <Card className="card-shadow border border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Monitor className="h-6 w-6 text-blue-400" />
                  <span>Why Photographers Love This</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">No More &quot;I can&apos;t open the zip file&quot;</h4>
                      <p className="text-sm text-muted-foreground">Photos go straight to your client&apos;s camera roll. Zero tech support calls.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Upload 10GB+ Galleries</h4>
                      <p className="text-sm text-muted-foreground">No browser crashes. No timeouts. No starting over.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Memory Insurance for Clients</h4>
                      <p className="text-sm text-muted-foreground">Their photos protected from hard drive crashes forever</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Earn $4/Month Per Client</h4>
                      <p className="text-sm text-muted-foreground">Passive income while you protect their memories</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Requirements */}
            <Card className="card-shadow border border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <HardDrive className="h-6 w-6 text-purple-400" />
                  <span>System Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-muted-foreground">Windows 10 or later</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-5 w-5 text-purple-400" />
                    <span className="font-medium text-muted-foreground">100 MB free disk space</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-green-400" />
                    <span className="font-medium text-muted-foreground">Internet connection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-orange-400" />
                    <span className="font-medium text-muted-foreground">Administrator privileges (for installation)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card className="card-shadow border border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Desktop App vs Web Upload</CardTitle>
              <CardDescription className="text-muted-foreground">
                Compare the features and limitations of each upload method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-400">Desktop App</th>
                      <th className="text-center py-3 px-4 font-semibold text-green-400">Web Upload</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-muted-foreground">Maximum file size</td>
                      <td className="text-center py-3 px-4 text-blue-400 font-medium">10GB+</td>
                      <td className="text-center py-3 px-4 text-green-400 font-medium">25MB</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-muted-foreground">Upload resume</td>
                      <td className="text-center py-3 px-4 text-blue-400 font-medium">✅ Automatic</td>
                      <td className="text-center py-3 px-4 text-red-400 font-medium">❌ Starts over</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-muted-foreground">Background uploads</td>
                      <td className="text-center py-3 px-4 text-blue-400 font-medium">✅ Yes</td>
                      <td className="text-center py-3 px-4 text-red-400 font-medium">❌ Must keep tab open</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-muted-foreground">Connection drops</td>
                      <td className="text-center py-3 px-4 text-blue-400 font-medium">✅ Auto-retry</td>
                      <td className="text-center py-3 px-4 text-red-400 font-medium">❌ Fails</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-muted-foreground">Installation required</td>
                      <td className="text-center py-3 px-4 text-orange-400 font-medium">⚠️ One-time</td>
                      <td className="text-center py-3 px-4 text-green-400 font-medium">✅ None</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-muted-foreground">Perfect for</td>
                      <td className="text-center py-3 px-4 text-blue-400 font-medium">Large galleries, RAW files</td>
                      <td className="text-center py-3 px-4 text-green-400 font-medium">Quick uploads, phone photos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Installation Instructions */}
          <Card className="mt-8 card-shadow border border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Installation Instructions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Simple steps to get PhotoVault Desktop up and running
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="h-6 w-6 text-blue-400" />
                  </div>
                  <h4 className="font-semibold mb-2 text-foreground">1. Download</h4>
                  <p className="text-sm text-muted-foreground">Click the download button above</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-2 text-foreground">2. Install</h4>
                  <p className="text-sm text-muted-foreground">Run the installer with admin privileges</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Monitor className="h-6 w-6 text-green-400" />
                  </div>
                  <h4 className="font-semibold mb-2 text-foreground">3. Sign In</h4>
                  <p className="text-sm text-muted-foreground">Authenticate with your PhotoVault account</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-400/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HardDrive className="h-6 w-6 text-orange-400" />
                  </div>
                  <h4 className="font-semibold mb-2 text-foreground">4. Upload</h4>
                  <p className="text-sm text-muted-foreground">Drag & drop your photos to upload</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Options */}
          <Card className="mt-8 card-shadow border border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Alternative Upload Options</CardTitle>
              <CardDescription className="text-muted-foreground">
                Don&apos;t need the desktop app? Try these alternatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Web Upload</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Perfect for smaller files and quick uploads. Works directly in your browser.
                    </p>
                    <Button variant="outline" size="sm" asChild className="border-border text-muted-foreground hover:bg-muted">
                      <Link href="/client/upload">Try Web Upload</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-foreground">Import from Platforms</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect your existing photo galleries from other photography platforms.
                    </p>
                    <Button variant="outline" size="sm" asChild className="border-border text-muted-foreground hover:bg-muted">
                      <Link href="/client/upload">Upload Photos</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
