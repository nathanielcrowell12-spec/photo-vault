'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Eye,
  Send,
  Monitor,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  shoot_fee: number
  total_amount: number
  gallery_status: string
  email_sent_at: string | null  // Track if client email was sent
  photo_count: number
  client_id: string
  clients?: {
    name: string
    email: string
  }
}

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string
}

export default function GalleryUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const galleryId = resolvedParams.id

  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')

  // Fetch gallery details from photo_galleries (canonical table)
  const fetchGallery = async () => {
    if (!galleryId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('photo_galleries')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .eq('id', galleryId)
        .single()

      if (error) throw error

      // Verify photographer owns this gallery
      if (data.photographer_id !== user?.id) {
        setError('You do not have permission to access this gallery')
        return
      }

      setGallery(data)
      fetchPhotos()
    } catch (err: any) {
      console.error('Error fetching gallery:', err)
      setError(err.message || 'Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  // Fetch photos
  const fetchPhotos = async () => {
    if (!galleryId) return

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (err) {
      console.error('Error fetching photos:', err)
    }
  }

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return
    }

    // Only redirect if auth is done loading AND user is not authenticated
    if (!user || userType !== 'photographer') {
      router.push('/login')
      return
    }

    fetchGallery()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId, user, userType, authLoading])

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setFiles([...files, ...newFiles])
    }
  }

  // Remove file from queue
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  // Upload photos
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      const uploadedPhotos = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${galleryId}/${fileName}`

        setUploadStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`)

        // Upload to storage
        console.log('[Upload] Uploading to storage:', filePath)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('[Upload] Storage upload error:', JSON.stringify(uploadError, null, 2))
          throw new Error(uploadError.message || 'Storage upload failed')
        }
        console.log('[Upload] Storage upload success:', uploadData)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        uploadedPhotos.push({
          gallery_id: galleryId,
          filename: file.name,
          original_url: publicUrl,
          thumbnail_url: publicUrl,
          full_url: publicUrl,
          file_size: file.size
        })

        setUploadProgress(((i + 1) / files.length) * 90)
      }

      // Insert photo records
      setUploadStatus('Creating photo records...')
      console.log('[Upload] Inserting photo records:', uploadedPhotos)
      const { error: insertError } = await supabase
        .from('photos')
        .insert(uploadedPhotos)

      if (insertError) {
        console.error('[Upload] Insert error:', JSON.stringify(insertError, null, 2))
        throw new Error(insertError.message || 'Failed to create photo records')
      }
      console.log('[Upload] Photo records created successfully')

      // Update gallery photo count in photo_galleries (canonical table)
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({ photo_count: photos.length + files.length })
        .eq('id', galleryId)

      if (updateError) throw updateError

      setUploadProgress(100)
      setUploadStatus('Upload complete!')

      // Refresh photos and clear file queue
      await fetchPhotos()
      setFiles([])

      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setUploadStatus('')
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      console.error('Upload error details:', JSON.stringify(err, null, 2))
      const errorMessage = err?.message || err?.error?.message || 'Upload failed - check console for details'
      setError(errorMessage)
      setUploading(false)
    }
  }

  // Mark as Ready (will trigger sneak peek selection in next phase)
  const handleMarkAsReady = () => {
    if (photos.length === 0) {
      setError('Please upload at least one photo before marking as ready')
      return
    }

    // For now, navigate to sneak peek selection
    // In next phase, this will open a modal
    router.push(`/photographer/galleries/${galleryId}/sneak-peek-select`)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/photographer/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {gallery?.gallery_name}
                  </h1>
                  <Badge variant={gallery?.gallery_status === 'draft' ? 'secondary' : 'default'}>
                    {gallery?.gallery_status}
                  </Badge>
                </div>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {gallery?.clients?.name} • ${((gallery?.total_amount || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
            {photos.length > 0 &&
              (gallery?.gallery_status === 'draft' ||
                (gallery?.gallery_status === 'ready' && !gallery?.email_sent_at)) && (
              <Button onClick={handleMarkAsReady}>
                <Send className="h-4 w-4 mr-2" />
                {gallery?.gallery_status === 'ready' && !gallery?.email_sent_at
                  ? 'Resend to Client'
                  : 'Complete & Send to Client'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8">
          {/* Upload Method Selection */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                Choose Your Upload Method
              </CardTitle>
              <CardDescription>
                Select between our desktop tool for bulk uploads or web-based upload for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Desktop Tool Option */}
                <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-6 bg-background hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">PhotoVault Desktop Tool</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Recommended for bulk uploads, faster processing, and advanced features
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                        <li>• Upload hundreds of photos at once</li>
                        <li>• Automatic image optimization</li>
                        <li>• Background uploads</li>
                        <li>• Offline queue support</li>
                      </ul>
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={async () => {
                          // Get current session and pass to desktop app
                          const { data: { session } } = await supabase.auth.getSession()
                          if (session?.access_token && user?.id && gallery?.client_id) {
                            // Try local API first (for dev testing)
                            try {
                              const response = await fetch('http://localhost:57123/auth', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  token: session.access_token,
                                  userId: user.id,
                                  clientId: gallery.client_id,
                                  galleryId: galleryId
                                })
                              })

                              if (response.ok) {
                                console.log('Desktop app launched via local API')
                                return
                              }
                            } catch (error) {
                              console.log('Local API not available, trying protocol handler')
                            }

                            // Fallback to protocol handler (for production)
                            window.location.href = `photovault://auth?token=${encodeURIComponent(session.access_token)}&userId=${encodeURIComponent(user.id)}&clientId=${encodeURIComponent(gallery.client_id)}&galleryId=${encodeURIComponent(galleryId)}`
                          } else {
                            // Fallback to just opening the app
                            window.location.href = `photovault://upload?galleryId=${encodeURIComponent(galleryId)}`
                          }
                        }}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        Launch Desktop Tool
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Don't have it? <Link href="/download-desktop-app" className="text-purple-600 hover:underline">Download here</Link>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Web Upload Option */}
                <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-6 bg-background hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Web Upload</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Quick and convenient upload directly from your browser
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                        <li>• No installation required</li>
                        <li>• Upload from any device</li>
                        <li>• Simple drag-and-drop</li>
                        <li>• Perfect for small batches</li>
                      </ul>
                      <Button className="w-full" variant="outline" asChild>
                        <a href="#web-upload">
                          <Upload className="h-4 w-4 mr-2" />
                          Use Web Upload Below
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card id="web-upload">
            <CardHeader>
              <CardTitle>Web Upload</CardTitle>
              <CardDescription>
                Add photos to this gallery. You can continue uploading incrementally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports JPG, PNG, HEIC (max 50MB per file)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>Select Files</span>
                  </Button>
                </label>
              </div>

              {/* File Queue */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Selected Files ({files.length})</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground mx-2">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploadStatus}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {files.length} {files.length === 1 ? 'Photo' : 'Photos'}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {uploadStatus}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Uploaded Photos */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Uploaded Photos ({photos.length})</span>
                  {gallery?.gallery_status === 'draft' && (
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      Draft - Not visible to client
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Photos in this gallery. When ready, click &quot;Complete &amp; Send to Client&quot; to notify{' '}
                  <span className="font-medium">{gallery?.clients?.name || 'your client'}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={photo.thumbnail_url || photo.original_url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-foreground text-xs p-2 truncate">
                        {photo.filename}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {photos.length === 0 && !uploading && (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="h-16 w-16 text-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your edited photos to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
