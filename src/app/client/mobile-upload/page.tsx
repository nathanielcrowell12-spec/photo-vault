'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Calendar,
  MapPin,
  Heart,
  Star,
  Download,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface MobilePhoto {
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

interface MobileUploadSession {
  id: string
  name: string
  photos: MobilePhoto[]
  total_size: number
  upload_started: boolean
  upload_completed: boolean
}

export default function MobileUploadPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploadSession, setUploadSession] = useState<MobileUploadSession | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [autoOrganize, setAutoOrganize] = useState(true)
  const [connectionStatus] = useState({
    wifi: true,
    battery: 85,
    signal: 4
  })

  const handleFileSelect = useCallback((files: FileList) => {
    const newPhotos: MobilePhoto[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        size: file.size,
        date_taken: new Date(file.lastModified),
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
        name: `Mobile Upload ${new Date().toLocaleDateString()}`,
        photos: newPhotos,
        total_size: newPhotos.reduce((sum, photo) => sum + photo.size, 0),
        upload_started: false,
        upload_completed: false
      })
    }
  }, [uploadSession])

  // Handle auth redirect in useEffect to avoid SSR issues
  if (!loading && userType !== 'client') {
    if (typeof window !== 'undefined') {
      router.push('/dashboard')
    }
    return null
  }

  // Show loading state during auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Cloud className="h-8 w-8 animate-pulse text-blue-600" />
      </div>
    )
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Check connection status
    if (!connectionStatus.wifi) {
      alert('Please connect to WiFi for faster uploads')
      return
    }

    if (connectionStatus.battery < 20) {
      alert('Low battery! Please charge your device before uploading')
      return
    }

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
        await new Promise(resolve => setTimeout(resolve, 200))
        
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="border-b bg-card/50 border-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-foreground">Upload Photos</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {connectionStatus.wifi ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <Battery className={`h-4 w-4 ${connectionStatus.battery < 20 ? 'text-red-600' : 'text-green-600'}`} />
              <span className="text-xs text-muted-foreground">{connectionStatus.battery}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Mobile Upload Hero */}
          <Card className="mb-6 bg-card/50 border-border">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Smartphone className="h-8 w-8 text-blue-600" />
                <Cloud className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-foreground">Upload from Phone</h1>
              <p className="text-muted-foreground mb-4">
                Dump all your phone photos to PhotoVault for safe keeping
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Auto-organize</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Smart backup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Upload Options */}
          {!uploadSession && (
            <Card className="mb-6 bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                  >
                    <Smartphone className="h-6 w-6 mr-3" />
                    Choose Photos from Gallery
                  </Button>
                  <Button 
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    size="lg"
                    className="w-full text-lg py-6"
                  >
                    <Camera className="h-6 w-6 mr-3" />
                    Take New Photos
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
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Supports JPG, PNG, HEIC formats
                </p>
              </CardContent>
            </Card>
          )}

          {/* Mobile Upload Session */}
          {uploadSession && (
            <>
              {/* Session Header */}
              <Card className="mb-6 bg-card/50 border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{uploadSession.name}</CardTitle>
                      <CardDescription>
                        {uploadSession.photos.length} photos • {formatFileSize(uploadSession.total_size)}
                      </CardDescription>
                    </div>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Uploading...</span>
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Upload Controls */}
                  <div className="space-y-3">
                    <Button
                      onClick={startUpload}
                      disabled={isUploading || uploadSession.photos.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-4"
                    >
                      {isUploading ? (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Upload All Photos
                        </>
                      )}
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoOrganize}
                        onChange={(e) => setAutoOrganize(e.target.checked)}
                        className="rounded"
                      />
                      <span>Auto-organize by date</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Photo Grid */}
              <Card className="mb-6 bg-card/50 border-border">
                <CardContent className="p-4">
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'space-y-3'}`}>
                    {uploadSession.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative group border rounded-lg overflow-hidden ${
                          selectedPhotos.includes(photo.id) ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          // Mobile Grid View
                          <div className="aspect-square bg-slate-200 dark:bg-slate-700 relative">
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                            
                            {/* Upload Progress Overlay */}
                            {photo.upload_status === 'uploading' && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <div className="text-center text-foreground">
                                  <div className="text-xs font-medium">{photo.upload_progress}%</div>
                                  <Progress value={photo.upload_progress} className="w-12 h-1 mt-1" />
                                </div>
                              </div>
                            )}

                            {/* Status Badge */}
                            {photo.upload_status === 'completed' && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="h-4 w-4 text-green-600 bg-white rounded-full" />
                              </div>
                            )}

                            {/* Mobile Action Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toggleFavorite(photo.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Heart className={`h-3 w-3 ${photo.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => removePhoto(photo.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Favorites Indicator */}
                            {photo.is_favorite && (
                              <div className="absolute top-1 left-1">
                                <Heart className="h-3 w-3 text-red-500 fill-current" />
                              </div>
                            )}
                          </div>
                        ) : (
                          // Mobile List View
                          <div className="flex items-center space-x-3 p-3">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{photo.file.name}</h4>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {formatFileSize(photo.size)} • {formatDate(photo.date_taken!)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {photo.is_favorite && <Heart className="h-4 w-4 text-red-500 fill-current" />}
                              {photo.upload_status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePhoto(photo.id)}
                                className="h-8 w-8 p-0"
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
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2 text-foreground">Upload Complete!</h3>
                    <p className="text-muted-foreground mb-4">
                      {uploadSession.photos.length} photos uploaded
                    </p>
                    <div className="space-y-3">
                      <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                        <Link href="/client/timeline">
                          <Calendar className="h-4 w-4 mr-2" />
                          View in Timeline
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setUploadSession(null)}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload More
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
  )
}
