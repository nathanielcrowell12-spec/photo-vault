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
  Send
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

  const { user, userType } = useAuth()
  const router = useRouter()

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')

  // Fetch gallery details
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
    if (!user || userType !== 'photographer') {
      router.push('/login')
      return
    }

    fetchGallery()
  }, [galleryId, user, userType, router])

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
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

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
      const { error: insertError } = await supabase
        .from('photos')
        .insert(uploadedPhotos)

      if (insertError) throw insertError

      // Update gallery photo count
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
      setError(err.message || 'Upload failed')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !gallery) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
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
                <p className="text-slate-600 dark:text-slate-400">
                  {gallery?.clients?.name} • ${gallery?.total_amount?.toFixed(2)}
                </p>
              </div>
            </div>
            {photos.length > 0 && gallery?.gallery_status === 'draft' && (
              <Button onClick={handleMarkAsReady}>
                <Send className="h-4 w-4 mr-2" />
                Mark as Ready
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Photos</CardTitle>
              <CardDescription>
                Add photos to this gallery. You can continue uploading incrementally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-slate-500 mb-4">
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
                        <span className="text-xs text-slate-500 mx-2">
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
                  <p className="text-sm text-center text-slate-600">
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
                  Photos in this gallery. Click "Mark as Ready" when you're done uploading.
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
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
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
                <ImageIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                <p className="text-slate-500 mb-4">
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
