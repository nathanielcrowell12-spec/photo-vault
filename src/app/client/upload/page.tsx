'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Upload,
  Smartphone,
  Camera,
  Image,
  Cloud,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  MapPin,
  Heart,
  Star,
  Download,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import PaymentGuard from '@/components/PaymentGuard'

interface UploadedPhoto {
  id: string
  file: File
  preview: string
  size: number
  date_taken?: Date
  location?: string
  is_favorite: boolean
  is_private: boolean
  upload_progress: number
  upload_status: 'pending' | 'uploading' | 'completed' | 'error'
  error_message?: string
}

interface UploadSession {
  id: string
  name: string
  photos: UploadedPhoto[]
  total_size: number
  upload_started: boolean
  upload_completed: boolean
}

export default function SmartphoneUploadPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [autoOrganize, setAutoOrganize] = useState(true)
  const { loading } = useAuth()

  useEffect(() => {
    if (!loading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  const handleFileSelect = useCallback((files: FileList) => {
    const newPhotos: UploadedPhoto[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        size: file.size,
        date_taken: new Date(file.lastModified), // Fallback to file modification date
        is_favorite: false,
        is_private: false,
        upload_progress: 0,
        upload_status: 'pending'
      }))

    if (uploadSession) {
      setUploadSession({
        ...uploadSession,
        photos: [...uploadSession.photos, ...newPhotos],
        total_size: uploadSession.total_size + newPhotos.reduce((sum, photo) => sum + photo.size, 0)
      })
    } else {
      setUploadSession({
        id: Math.random().toString(36).substr(2, 9),
        name: `Upload Session ${new Date().toLocaleDateString()}`,
        photos: newPhotos,
        total_size: newPhotos.reduce((sum, photo) => sum + photo.size, 0),
        upload_started: false,
        upload_completed: false
      })
    }
  }, [uploadSession])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files)
    }
  }

  const removePhoto = (photoId: string) => {
    if (uploadSession) {
      const photo = uploadSession.photos.find(p => p.id === photoId)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
        setUploadSession({
          ...uploadSession,
          photos: uploadSession.photos.filter(p => p.id !== photoId),
          total_size: uploadSession.total_size - photo.size
        })
      }
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const toggleFavorite = (photoId: string) => {
    if (uploadSession) {
      setUploadSession({
        ...uploadSession,
        photos: uploadSession.photos.map(photo =>
          photo.id === photoId 
            ? { ...photo, is_favorite: !photo.is_favorite }
            : photo
        )
      })
    }
  }

  const togglePrivate = (photoId: string) => {
    if (uploadSession) {
      setUploadSession({
        ...uploadSession,
        photos: uploadSession.photos.map(photo =>
          photo.id === photoId 
            ? { ...photo, is_private: !photo.is_private }
            : photo
        )
      })
    }
  }

  const startUpload = async () => {
    if (!uploadSession || uploadSession.photos.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload process
    const totalPhotos = uploadSession.photos.length
    let completedPhotos = 0

    for (let i = 0; i < totalPhotos; i++) {
      const photo = uploadSession.photos[i]
      
      // Update photo status to uploading
      setUploadSession(prev => prev ? {
        ...prev,
        photos: prev.photos.map(p =>
          p.id === photo.id ? { ...p, upload_status: 'uploading' } : p
        )
      } : null)

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        setUploadSession(prev => prev ? {
          ...prev,
          photos: prev.photos.map(p =>
            p.id === photo.id ? { ...p, upload_progress: progress } : p
          )
        } : null)
      }

      // Mark as completed
      setUploadSession(prev => prev ? {
        ...prev,
        photos: prev.photos.map(p =>
          p.id === photo.id ? { ...p, upload_status: 'completed', upload_progress: 100 } : p
        )
      } : null)

      completedPhotos++
      setUploadProgress((completedPhotos / totalPhotos) * 100)
    }

    setIsUploading(false)
    setUploadSession(prev => prev ? { ...prev, upload_completed: true } : null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PaymentGuard requireActivePayment={true}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">Upload from Phone</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              Smart Upload
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Upload Hero */}
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Smartphone className="h-8 w-8 text-blue-600" />
                <Cloud className="h-8 w-8 text-green-600" />
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Dump Your Phone Photos</h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-3xl mx-auto">
                Seamlessly upload all your phone photos to PhotoVault. Smart organization, 
                automatic backup, and forever access to your memories.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Drag & Drop</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Smart Organization</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Automatic Backup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          {!uploadSession && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {dragActive ? 'Drop your photos here' : 'Upload your phone photos'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Drag and drop photos from your phone, or click to browse
                  </p>
                  <div className="space-x-4">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Smartphone className="h-5 w-5 mr-2" />
                      Choose Photos
                    </Button>
                    <Button variant="outline" size="lg">
                      <Camera className="h-5 w-5 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500 mt-4">
                    Supports JPG, PNG, HEIC, and other common formats
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Session */}
          {uploadSession && (
            <>
              {/* Session Header */}
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Upload className="h-6 w-6 text-blue-600" />
                        <span>{uploadSession.name}</span>
                      </CardTitle>
                      <CardDescription>
                        {uploadSession.photos.length} photos • {formatFileSize(uploadSession.total_size)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Uploading photos...</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Upload Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={startUpload}
                        disabled={isUploading || uploadSession.photos.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUploading ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload All Photos
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={autoOrganize}
                          onChange={(e) => setAutoOrganize(e.target.checked)}
                        />
                        <span>Auto-organize by date</span>
                      </label>
                    </div>
                  </div>

                  {/* Photo Grid/List */}
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-4'}`}>
                    {uploadSession.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative group border rounded-lg overflow-hidden ${
                          selectedPhotos.includes(photo.id) ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          // Grid View
                          <div className="aspect-square bg-slate-200 dark:bg-slate-700 relative">
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-8 w-8 text-slate-400" />
                            </div>
                            
                            {/* Upload Progress Overlay */}
                            {photo.upload_status === 'uploading' && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <div className="text-sm font-medium">{photo.upload_progress}%</div>
                                  <Progress value={photo.upload_progress} className="w-16 h-1 mt-1" />
                                </div>
                              </div>
                            )}

                            {/* Status Badge */}
                            {photo.upload_status === 'completed' && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                              </div>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toggleFavorite(photo.id)}
                                >
                                  <Heart className={`h-4 w-4 ${photo.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => togglePrivate(photo.id)}
                                >
                                  {photo.is_private ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => removePhoto(photo.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Favorites Indicator */}
                            {photo.is_favorite && (
                              <div className="absolute top-2 left-2">
                                <Heart className="h-4 w-4 text-red-500 fill-current" />
                              </div>
                            )}
                          </div>
                        ) : (
                          // List View
                          <div className="flex items-center space-x-4 p-4">
                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                              <Image className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{photo.file.name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {formatFileSize(photo.size)} • {formatDate(photo.date_taken!)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {photo.is_favorite && <Heart className="h-4 w-4 text-red-500 fill-current" />}
                              {photo.is_private && <EyeOff className="h-4 w-4 text-slate-400" />}
                              {photo.upload_status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePhoto(photo.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upload Complete */}
              {uploadSession.upload_completed && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      {uploadSession.photos.length} photos have been uploaded to your PhotoVault
                    </p>
                    <div className="space-x-4">
                      <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link href="/client/timeline">
                          <Calendar className="h-4 w-4 mr-2" />
                          View in Timeline
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => setUploadSession(null)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload More Photos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      </div>
    </PaymentGuard>
  )
}
