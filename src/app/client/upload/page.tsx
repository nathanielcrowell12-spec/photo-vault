'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Download,
  CheckCircle,
  Heart,
  Star,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  FileUp,
  Calendar,
  MapPin,
  Users,
  Tag,
  StickyNote
} from 'lucide-react'
import Link from 'next/link'
import PaymentGuard from '@/components/PaymentGuard'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export default function PhotoImportPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  // Upload form state
  const [galleryName, setGalleryName] = useState('')
  const [galleryDescription, setGalleryDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [peopleInPhotos, setPeopleInPhotos] = useState('')
  const [eventType, setEventType] = useState('')
  const [photographerName, setPhotographerName] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [showDesktopAppHelp, setShowDesktopAppHelp] = useState(false)

  useEffect(() => {
    if (!loading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userType])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (userType !== 'client') {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleDesktopAppClick = () => {
    // Track if window loses focus (app opened)
    let appOpened = false

    const handleBlur = () => {
      appOpened = true
      window.removeEventListener('blur', handleBlur)
    }

    window.addEventListener('blur', handleBlur)

    // Use hidden iframe to launch protocol (doesn't navigate away)
    // Protocol is 'photovault://' as registered in desktop app's main.ts
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = 'photovault://upload'
    document.body.appendChild(iframe)

    // Clean up iframe after a moment
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 100)

    // Check if app opened after 2 seconds
    setTimeout(() => {
      window.removeEventListener('blur', handleBlur)
      if (!appOpened) {
        // Also check if document is still visible (user might have switched to app)
        if (document.visibilityState === 'visible') {
          setShowDesktopAppHelp(true)
        }
      }
    }, 2000)
  }

  const handleUpload = async () => {
    if (!galleryName || files.length === 0) {
      alert('Please enter a gallery name and select files to upload')
      return
    }

    if (!user) {
      alert('You must be logged in to upload photos')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadStatus('Creating gallery...')

      // Build metadata object with only non-empty values
      const metadata: Record<string, string> = {}
      if (eventDate) metadata.event_date = eventDate
      if (location) metadata.location = location
      if (peopleInPhotos) metadata.people_in_photos = peopleInPhotos
      if (eventType) metadata.event_type = eventType
      if (photographerName) metadata.photographer_name = photographerName
      if (notes) metadata.notes = notes

      // Create gallery directly via Supabase (RLS policy now allows this)
      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: null,
          client_id: null,
          user_id: user.id,  // Required by RLS policy
          gallery_name: galleryName,
          gallery_description: galleryDescription || null,
          photo_count: files.length,
          session_date: eventDate || new Date().toISOString(),
          platform: 'photovault',
          gallery_status: 'draft',
          metadata: Object.keys(metadata).length > 0 ? metadata : null
        })
        .select()
        .single()

      if (galleryError) {
        console.error('Error creating gallery:', galleryError)
        alert(`Failed to create gallery: ${galleryError.message}`)
        return
      }

      if (!gallery) {
        alert('Failed to create gallery. No data returned.')
        return
      }

      setUploadProgress(10)

      // Upload files to Supabase Storage
      setUploadStatus(`Uploading ${files.length} photos...`)
      const uploadedFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${gallery.id}/${fileName}`

        setUploadStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath)

        uploadedFiles.push({
          fileName: file.name,
          filePath,
          publicUrl,
          fileSize: file.size
        })

        const progress = 10 + ((i + 1) / files.length) * 80
        setUploadProgress(Math.round(progress))
      }

      // Create photo records in database
      setUploadStatus('Creating photo records...')
      setUploadProgress(95)

      const photoRecords = uploadedFiles.map(file => ({
        gallery_id: gallery.id,
        photo_url: file.publicUrl,
        thumbnail_url: file.publicUrl,
        original_filename: file.fileName,
        file_size: file.fileSize,
        is_favorite: false,
        is_private: false
      }))

      const { error: photosError } = await supabase
        .from('gallery_photos')
        .insert(photoRecords)

      if (photosError) {
        console.error('Error creating photo records:', photosError)
        alert(`Photos uploaded but failed to create records: ${photosError.message}`)
        return
      }

      // Update gallery to mark as imported and set cover image
      await supabase
        .from('photo_galleries')
        .update({
          is_imported: true,
          import_completed_at: new Date().toISOString(),
          cover_image_url: uploadedFiles[0]?.publicUrl || null
        })
        .eq('id', gallery.id)

      setUploadStatus('Complete!')
      setUploadProgress(100)

      alert(`Gallery "${galleryName}" created successfully with ${files.length} photos!`)
      router.push('/client/dashboard')
    } catch (error: unknown) {
      console.error('Error uploading:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Upload failed: ${errorMessage}`)
    } finally {
      setUploading(false)
      setUploadStatus('')
      setUploadProgress(0)
    }
  }

  return (
    <PaymentGuard requireActivePayment={true}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 border-border">
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
              <span className="text-xl font-semibold tracking-tight text-foreground">Upload Your Photos</span>
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
          <Card className="mb-12 card-shadow bg-card/50 border-border">
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
          <Card className="card-shadow bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-2xl">
                Choose Upload Method
              </CardTitle>
              <CardDescription>
                Select the best upload method for your photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Desktop App Upload */}
                <Card className="relative overflow-hidden border-2 border-border hover:border-blue-500 transition-colors cursor-pointer group" onClick={handleDesktopAppClick}>
                  <div className="absolute top-0 right-0 bg-blue-600 text-foreground px-3 py-1 text-xs font-semibold">
                    RECOMMENDED
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                      <Camera className="h-8 w-8 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl text-foreground">Desktop App Upload</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Launch the desktop app for large uploads and faster speed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Up to 500MB per file</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">All formats including RAW</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Up to 10,000 files</span>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-foreground">
                      Launch Desktop App
                    </Button>
                    <p className="text-xs text-blue-400 mt-2 text-center">
                      First time? Click above to download the app
                    </p>
                  </CardContent>
                </Card>

                {/* Web Upload - scrolls to form below */}
                <Card className="relative overflow-hidden border-2 border-border hover:border-green-500 transition-colors cursor-pointer group" onClick={() => document.getElementById('web-upload-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                      <Upload className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-xl text-foreground">Online Upload</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      For convenient, smaller uploads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Up to 25MB per file</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">No download required</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Perfect for phone photos</span>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-foreground">
                      Use Web Upload Below
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Web Upload Form */}
          <Card id="web-upload-form" className="card-shadow bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Web Upload - Create New Gallery</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload your photos and organize them into a gallery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gallery Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Gallery Details
                  </h3>

                  {/* Gallery Name */}
                  <div>
                    <Label htmlFor="gallery-name" className="text-muted-foreground">Gallery Name *</Label>
                    <Input
                      id="gallery-name"
                      value={galleryName}
                      onChange={(e) => setGalleryName(e.target.value)}
                      placeholder="e.g., Summer Vacation 2024, Wedding Day, Family Portraits"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Gallery Description */}
                  <div>
                    <Label htmlFor="gallery-description" className="text-muted-foreground">Description (Optional)</Label>
                    <Textarea
                      id="gallery-description"
                      value={galleryDescription}
                      onChange={(e) => setGalleryDescription(e.target.value)}
                      placeholder="Add details about these photos..."
                      rows={2}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Metadata Fields - All Optional */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Photo Details (All Optional)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add metadata to help organize and search your photos later
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Event Date */}
                    <div>
                      <Label htmlFor="event-date" className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Event Date
                      </Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <Label htmlFor="location" className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Paris, France"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* People in Photos */}
                    <div>
                      <Label htmlFor="people" className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        People in Photos
                      </Label>
                      <Input
                        id="people"
                        value={peopleInPhotos}
                        onChange={(e) => setPeopleInPhotos(e.target.value)}
                        placeholder="e.g., John, Sarah, Kids"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Event Type */}
                    <div>
                      <Label htmlFor="event-type" className="text-muted-foreground">Event Type</Label>
                      <select
                        id="event-type"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full mt-1 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">Select type...</option>
                        <option value="wedding">Wedding</option>
                        <option value="birthday">Birthday</option>
                        <option value="family">Family</option>
                        <option value="portrait">Portrait</option>
                        <option value="graduation">Graduation</option>
                        <option value="corporate">Corporate</option>
                        <option value="vacation">Vacation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Photographer Name */}
                    <div>
                      <Label htmlFor="photographer-name" className="text-muted-foreground flex items-center gap-2">
                        <Camera className="h-3 w-3" />
                        Photographer Name
                      </Label>
                      <Input
                        id="photographer-name"
                        value={photographerName}
                        onChange={(e) => setPhotographerName(e.target.value)}
                        placeholder="Credit the photographer"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes" className="text-muted-foreground">Notes</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* File Upload */}
                <div>
                  <Label className="text-muted-foreground mb-2 block">Select Photos *</Label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md hover:border-green-500/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-green-400 hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 25MB each</p>
                    </div>
                  </div>
                </div>

                {/* Selected Files Preview */}
                {files.length > 0 && (
                  <div className="bg-background border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2 text-foreground">Selected Files ({files.length}):</h3>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center">
                          <ImageIcon className="h-3 w-3 mr-2" />
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{uploadStatus}</span>
                      <span className="font-medium text-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Upload Button */}
                <div className="space-y-2">
                  {uploading ? (
                    <Button
                      disabled
                      className="w-full bg-green-500/50"
                      size="lg"
                    >
                      <FileUp className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpload}
                      disabled={files.length === 0 || !galleryName}
                      className="w-full bg-green-600 hover:bg-green-700 text-foreground"
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {files.length === 0
                        ? 'Select Photos to Upload'
                        : !galleryName
                        ? 'Enter Gallery Name'
                        : `Create Gallery with ${files.length} ${files.length === 1 ? 'photo' : 'photos'}`
                      }
                    </Button>
                  )}
                  {!uploading && (files.length === 0 || !galleryName) && (
                    <p className="text-sm text-green-400 mt-2 text-center">
                      {!galleryName && files.length > 0 && 'Please enter a gallery name'}
                      {galleryName && files.length === 0 && 'Please select photos to upload'}
                      {!galleryName && files.length === 0 && 'Enter a gallery name and select photos'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Desktop App Not Found Modal */}
      {showDesktopAppHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Desktop App Not Found</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDesktopAppHelp(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The PhotoVault Desktop app is not installed on your computer.
              </p>
              <p className="text-sm text-muted-foreground">
                Download the desktop app to upload large files (up to 500MB per file) and RAW photos.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDesktopAppHelp(false)} className="flex-1 border-border text-muted-foreground hover:bg-muted">
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-foreground"
                  onClick={() => {
                    window.open('https://github.com/nathanielcrowell12-spec/Photovault-Uploader/releases/download/v1.0.2/PhotoVault.Desktop.Setup.1.0.2.exe', '_blank')
                    setShowDesktopAppHelp(false)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download App
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                If the download doesn&apos;t start, scroll to the bottom of the page and click &quot;PhotoVault.Desktop.Setup&quot;
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      </div>
    </PaymentGuard>
  )
}

