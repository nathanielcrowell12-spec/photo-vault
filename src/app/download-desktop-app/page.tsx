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

export default function DownloadDesktopAppPage() {
  const handleDownload = () => {
    // In production, this would download the actual installer
    // For now, we'll show a message
    alert('Desktop app installer will be available soon! The installer is currently being built.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-slate-900">
        <div className="container-pixieset py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/client/import">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload Options
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Download className="h-6 w-6 text-primary" />
                <span className="text-xl font-semibold tracking-tight">Download Desktop App</span>
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
          {/* Hero Section */}
          <Card className="mb-8 card-shadow border border-border bg-gradient-to-br from-primary/10 to-secondary/30">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Monitor className="h-12 w-12 text-blue-600" />
                <Download className="h-12 w-12 text-purple-600" />
                <HardDrive className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground tracking-tight">
                Download PhotoVault Desktop
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light mb-8">
                Upload large photo files reliably with our professional desktop application. 
                Perfect for photographers and clients with large galleries.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download for Windows
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/client/import">
                    Try Web Upload Instead
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Why Desktop App */}
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-6 w-6 text-blue-600" />
                  <span>Why Use Desktop App?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Large File Support</h4>
                      <p className="text-sm text-muted-foreground">Upload files up to 10GB+ without browser limitations</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Automatic Resume</h4>
                      <p className="text-sm text-muted-foreground">Uploads resume automatically if interrupted</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Background Uploads</h4>
                      <p className="text-sm text-muted-foreground">Upload while doing other work - runs in system tray</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Professional Grade</h4>
                      <p className="text-sm text-muted-foreground">Same technology used by Dropbox and Google Drive</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Requirements */}
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-6 w-6 text-purple-600" />
                  <span>System Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Windows 10 or later</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">100 MB free disk space</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Internet connection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Administrator privileges (for installation)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card className="card-shadow border border-border">
            <CardHeader>
              <CardTitle>Desktop App vs Web Upload</CardTitle>
              <CardDescription>
                Compare the features and limitations of each upload method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">Desktop App</th>
                      <th className="text-center py-3 px-4 font-semibold text-green-600">Web Upload</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="py-3 px-4">Maximum file size</td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">10GB+</td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">25MB</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Upload resume</td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">✅ Automatic</td>
                      <td className="text-center py-3 px-4 text-red-600 font-medium">❌ Starts over</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Background uploads</td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">✅ Yes</td>
                      <td className="text-center py-3 px-4 text-red-600 font-medium">❌ Must keep tab open</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Connection drops</td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">✅ Auto-retry</td>
                      <td className="text-center py-3 px-4 text-red-600 font-medium">❌ Fails</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Installation required</td>
                      <td className="text-center py-3 px-4 text-orange-600 font-medium">⚠️ One-time</td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">✅ None</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Perfect for</td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">Large galleries, RAW files</td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">Quick uploads, phone photos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Installation Instructions */}
          <Card className="mt-8 card-shadow border border-border">
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
              <CardDescription>
                Simple steps to get PhotoVault Desktop up and running
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Download</h4>
                  <p className="text-sm text-muted-foreground">Click the download button above</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">2. Install</h4>
                  <p className="text-sm text-muted-foreground">Run the installer with admin privileges</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Monitor className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">3. Sign In</h4>
                  <p className="text-sm text-muted-foreground">Authenticate with your PhotoVault account</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">4. Upload</h4>
                  <p className="text-sm text-muted-foreground">Drag & drop your photos to upload</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Options */}
          <Card className="mt-8 card-shadow border border-border">
            <CardHeader>
              <CardTitle>Alternative Upload Options</CardTitle>
              <CardDescription>
                Don't need the desktop app? Try these alternatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Web Upload</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Perfect for smaller files and quick uploads. Works directly in your browser.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/client/upload">Try Web Upload</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Import from Platforms</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect your existing photo galleries from other photography platforms.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/client/import">Import Photos</Link>
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
