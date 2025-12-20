'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useTrackFlowTime } from '@/hooks/useAnalytics'
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
  Upload,
  Image as ImageIcon,
  FileUp,
  UserPlus,
  Download,
  Monitor,
  X
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface Client {
  id: string
  name: string
  email: string
}

export default function UploadPage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [galleryName, setGalleryName] = useState('')
  const [galleryDescription, setGalleryDescription] = useState('')
  const [uploadCancelled, setUploadCancelled] = useState(false)

  // Analytics: Track upload abandonment (Story 6.3)
  const endFlow = useTrackFlowTime('upload')
  const uploadStartedRef = useRef(false)
  const uploadCompletedRef = useRef(false)
  const filesUploadedRef = useRef(0)
  const totalFilesRef = useRef(0)

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      // Only track abandonment if upload was started but not completed
      if (uploadStartedRef.current && !uploadCompletedRef.current) {
        endFlow('abandoned', {
          gallery_id: undefined,
          photos_uploaded: filesUploadedRef.current,
          photos_remaining: totalFilesRef.current - filesUploadedRef.current,
        })
      }
    }
  }, [endFlow])

  const fetchClients = async () => {
    console.log('[Upload] fetchClients called, user.id:', user?.id)
    if (!user?.id) {
      console.log('[Upload] No user ID, skipping fetch')
      setLoadingClients(false)
      return
    }

    try {
      setLoadingClients(true)
      console.log('[Upload] Fetching clients via API')

      // Use API endpoint instead of direct database query to avoid RLS issues
      const response = await fetch('/api/photographer/clients')

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Upload] API error:', errorData)
        setClients([])
        return
      }

      const data = await response.json()
      console.log('[Upload] Fetched clients:', data)
      setClients(data.clients || [])
    } catch (error) {
      console.error('[Upload] Error fetching clients:', error)
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    if (userType && userType !== 'photographer') {
      router.push('/dashboard')
    } else if (user?.id && userType === 'photographer') {
      fetchClients()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userType])

  if (userType !== 'photographer') {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleCancelUpload = () => {
    setUploadCancelled(true)
    setUploadStatus('Cancelling upload...')
  }

  const handleUpload = async () => {
    if (!selectedClientId || !galleryName || files.length === 0) {
      alert('Please select a client, enter a gallery name, and select files to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadCancelled(false)

    // Analytics: Mark upload as started
    uploadStartedRef.current = true
    totalFilesRef.current = files.length
    filesUploadedRef.current = 0

    try {
      setUploadStatus('Creating gallery...')
      console.log('Step 1: Creating gallery record in database...')
      console.log('User ID:', user?.id)
      console.log('Client ID:', selectedClientId)
      console.log('Gallery Name:', galleryName)

      // Create gallery in database
      const { data: gallery, error: galleryError } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: user?.id,
          client_id: selectedClientId,
          gallery_name: galleryName,
          gallery_description: galleryDescription || null,
          photo_count: files.length,
          session_date: new Date().toISOString()
        })
        .select()
        .single()

      console.log('Gallery creation response:', { data: gallery, error: galleryError })

      if (galleryError) {
        console.error('❌ Error creating gallery:', galleryError)
        console.error('Error code:', galleryError.code)
        console.error('Error message:', galleryError.message)
        console.error('Error details:', galleryError.details)
        alert(`Failed to create gallery: ${galleryError.message}`)
        return
      }

      if (!gallery) {
        console.error('❌ No gallery returned from insert')
        alert('Failed to create gallery. No data returned.')
        return
      }

      console.log('✅ Gallery created successfully:', gallery)
      setUploadProgress(10)

      // Upload files to Supabase Storage
      setUploadStatus(`Uploading ${files.length} photos...`)
      const uploadedFiles = []

      for (let i = 0; i < files.length; i++) {
        // Check if upload was cancelled
        if (uploadCancelled) {
          console.log('Upload cancelled by user')
          throw new Error('Upload cancelled by user')
        }

        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${gallery.id}/${fileName}`

        setUploadStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`)
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name)
        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        console.log(`Upload path: ${filePath}`)
        console.log(`Starting upload to 'photos' bucket...`)

        // Upload to Supabase Storage with timeout
        const uploadStartTime = Date.now()
        const uploadTimeout = 120000 // 2 minutes timeout

        const uploadPromise = supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout after 2 minutes')), uploadTimeout)
        )

        const { data: uploadData, error: uploadError } = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]).catch(err => {
          console.error('Upload error or timeout:', err)
          return { data: null, error: err }
        }) as { data: any, error: any }

        const uploadDuration = Date.now() - uploadStartTime

        console.log(`Upload completed in ${uploadDuration}ms (${(uploadDuration / 1000).toFixed(1)}s)`)

        if (uploadError) {
          console.error(`❌ Error uploading ${file.name}:`, uploadError)
          console.error('Upload error details:', uploadError)
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        console.log(`✅ File uploaded successfully:`, uploadData)

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

        // Update progress and track uploaded count for analytics
        filesUploadedRef.current = i + 1
        const progress = 10 + ((i + 1) / files.length) * 80
        setUploadProgress(Math.round(progress))
      }

      // Create photo records in database
      setUploadStatus('Creating photo records...')
      setUploadProgress(95)
      console.log('Step 2: Creating photo records in database...')

      const photoRecords = uploadedFiles.map(file => ({
        gallery_id: gallery.id,
        photo_url: file.publicUrl,
        thumbnail_url: file.publicUrl, // Using full image as thumbnail for now
        original_filename: file.fileName,
        file_size: file.fileSize,
        is_favorite: false,
        is_private: false
      }))

      console.log('Photo records to insert:', photoRecords)

      // Insert photo records into gallery_photos table with timeout
      const insertStartTime = Date.now()
      const insertPromise = supabase
        .from('gallery_photos')
        .insert(photoRecords)

      const insertTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database insert timeout after 30 seconds')), 30000)
      )

      const { error: photosError } = await Promise.race([
        insertPromise,
        insertTimeoutPromise
      ]).catch(err => {
        console.error('Database insert error or timeout:', err)
        return { error: err }
      }) as { error: any }

      const insertDuration = Date.now() - insertStartTime
      console.log(`Photo records insert completed in ${insertDuration}ms (${(insertDuration / 1000).toFixed(1)}s)`)
      console.log('Photo records insert response:', photosError ? `Error: ${photosError.message}` : 'Success')

      if (photosError) {
        console.error('❌ Error creating photo records:', photosError)
        console.error('Error details:', photosError)
        alert(`⚠️ Photos uploaded to storage but failed to create database records.\n\nError: ${photosError.message}`)
        return
      }

      console.log('Photo records created successfully:', photoRecords.length)

      // Update gallery to mark as imported
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({
          is_imported: true,
          import_completed_at: new Date().toISOString()
        })
        .eq('id', gallery.id)

      if (updateError) {
        console.error('Error updating gallery:', updateError)
      }

      setUploadStatus('Complete!')
      setUploadProgress(100)

      // Analytics: Mark upload as completed (prevents false abandonment tracking)
      uploadCompletedRef.current = true
      endFlow('completed', { gallery_id: gallery.id })

      alert(`✅ Gallery "${galleryName}" created successfully!\n\n${files.length} photos uploaded.`)
      router.push('/photographer/clients')
    } catch (error: any) {
      console.error('Error uploading:', error)
      alert(`Upload failed: ${error.message || 'Please try again.'}`)
    } finally {
      setUploading(false)
      setUploadStatus('')
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/photographer/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/10" />
            <div className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-amber-500" />
              <span className="text-xl font-bold text-foreground">Upload Photos</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Method Selection */}
          <Card className="border-2 border-purple-500/30 bg-purple-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Monitor className="h-5 w-5 text-purple-400" />
                Choose Your Upload Method
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Select between our desktop tool for bulk uploads or web-based upload for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Desktop Tool Option */}
                <div className="border-2 border-purple-500/30 rounded-lg p-6 bg-card/50 hover:bg-card/70 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">PhotoVault Desktop Tool</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Recommended for bulk uploads, faster processing, and advanced features
                      </p>
                      <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                        <li>• Upload hundreds of photos at once</li>
                        <li>• Automatic image optimization</li>
                        <li>• Background uploads</li>
                        <li>• Offline queue support</li>
                      </ul>
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600 text-foreground"
                        variant="default"
                        disabled={!selectedClientId}
                        onClick={async () => {
                          if (!selectedClientId) {
                            alert('Please select a client first')
                            return
                          }

                          // Get current session and pass to desktop app
                          const { data: { session } } = await supabase.auth.getSession()
                          if (session?.access_token && user?.id) {
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
                                  clientId: selectedClientId
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
                            window.location.href = `photovault://auth?token=${encodeURIComponent(session.access_token)}&userId=${encodeURIComponent(user.id)}&clientId=${encodeURIComponent(selectedClientId)}`
                          } else {
                            // Fallback to just opening the app
                            window.location.href = 'photovault://upload'
                          }
                        }}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        {selectedClientId ? 'Launch Desktop Tool' : 'Select Client First'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Don't have it? <Link href="/download-desktop-app" className="text-purple-400 hover:underline">Download here</Link>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Web Upload Option */}
                <div className="border-2 border-green-500/30 rounded-lg p-6 bg-card/50 hover:bg-card/70 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-foreground">Web Upload</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Quick and convenient upload directly from your browser
                      </p>
                      <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                        <li>• No installation required</li>
                        <li>• Upload from any device</li>
                        <li>• Simple drag-and-drop</li>
                        <li>• Perfect for small batches</li>
                      </ul>
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-foreground" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Use Web Upload Below
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web Upload Form */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Web Upload - Create New Gallery</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload photos to create a new gallery for your client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Client Selection */}
                <div>
                  <Label htmlFor="client" className="text-muted-foreground">Select Client *</Label>
                  {loadingClients ? (
                    <p className="text-sm text-muted-foreground">Loading clients...</p>
                  ) : clients.length === 0 ? (
                    <div className="mt-2 p-4 border border-dashed border-border rounded-md text-center">
                      <p className="text-sm text-muted-foreground mb-3">No clients yet</p>
                      <Button size="sm" variant="outline" asChild className="border-border text-muted-foreground hover:bg-muted">
                        <Link href="/photographer/clients">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Your First Client
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <select
                      id="client"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Gallery Name */}
                <div>
                  <Label htmlFor="gallery-name" className="text-muted-foreground">Gallery Name *</Label>
                  <Input
                    id="gallery-name"
                    value={galleryName}
                    onChange={(e) => setGalleryName(e.target.value)}
                    placeholder="e.g., Summer Wedding 2024, Family Portraits"
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
                    placeholder="Add details about this photo session..."
                    rows={3}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Separator className="bg-white/10" />

                {/* File Upload */}
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-muted-foreground mb-2">
                    Select Photos *
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md hover:border-amber-500/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-amber-400 hover:text-amber-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500"
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
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
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
                    <div className="flex gap-2">
                      <Button
                        disabled
                        className="flex-1 bg-amber-500/50"
                        size="lg"
                      >
                        <FileUp className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </Button>
                      <Button
                        onClick={handleCancelUpload}
                        variant="destructive"
                        size="lg"
                        className="px-6"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleUpload}
                      disabled={files.length === 0 || !selectedClientId || !galleryName}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {files.length === 0
                        ? 'Select Photos to Upload'
                        : !selectedClientId
                        ? 'Select a Client First'
                        : !galleryName
                        ? 'Enter Gallery Name'
                        : `Create Gallery with ${files.length} ${files.length === 1 ? 'photo' : 'photos'}`
                      }
                    </Button>
                  )}
                  {!uploading && (files.length === 0 || !selectedClientId || !galleryName) && (
                    <p className="text-sm text-amber-400 mt-2 text-center">
                      {!selectedClientId && '⚠️ Please select a client'}
                      {selectedClientId && !galleryName && '⚠️ Please enter a gallery name'}
                      {selectedClientId && galleryName && files.length === 0 && '⚠️ Please select photos to upload'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
