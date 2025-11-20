'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Share2,
  Link as LinkIcon,
  Mail,
  Copy
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export default function SharePage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedGallery, setSelectedGallery] = useState('your-gallery-url')

  if (userType !== 'photographer') {
    router.push('/dashboard')
    return null
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`http://localhost:3000/gallery/${selectedGallery}`)
    toast({
      title: "Copied to clipboard!",
      description: "Gallery link has been copied to your clipboard.",
      variant: "default",
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
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
              <Share2 className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold">Share Galleries</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Share a Gallery</CardTitle>
              <CardDescription>
                Select a gallery and share it with your clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="gallery-select" className="block text-sm font-medium text-gray-700">
                  Select Gallery
                </label>
                {/* This would be a dropdown with the photographer's galleries */}
                <Input id="gallery-select" value={selectedGallery} onChange={(e) => setSelectedGallery(e.target.value)} />
              </div>
              <div className="flex space-x-2">
                <Input readOnly value={`http://localhost:3000/gallery/${selectedGallery}`} />
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              <Separator />
              <div className="flex justify-around">
                <Button variant="ghost">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                {/* Add other sharing options here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
