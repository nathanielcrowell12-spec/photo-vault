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
  Share2,
  Link as LinkIcon,
  Mail,
  Copy,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export default function SharePage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedGallery, setSelectedGallery] = useState('your-gallery-url')

  useEffect(() => {
    if (!loading && userType !== 'photographer') {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (userType !== 'photographer') {
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
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b border-white/5 bg-neutral-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/10" />
            <div className="flex items-center space-x-2">
              <Share2 className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-neutral-100">Share Galleries</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-neutral-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-neutral-100">Share a Gallery</CardTitle>
              <CardDescription className="text-neutral-400">
                Select a gallery and share it with your clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="gallery-select" className="block text-sm font-medium text-neutral-300">
                  Select Gallery
                </label>
                {/* This would be a dropdown with the photographer's galleries */}
                <Input
                  id="gallery-select"
                  value={selectedGallery}
                  onChange={(e) => setSelectedGallery(e.target.value)}
                  className="bg-neutral-900 border-white/10 text-white placeholder:text-neutral-500"
                />
              </div>
              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={`http://localhost:3000/gallery/${selectedGallery}`}
                  className="bg-neutral-900 border-white/10 text-white"
                />
                <Button onClick={copyToClipboard} variant="outline" className="border-white/10 text-neutral-300 hover:bg-white/5">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-around">
                <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5">
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
