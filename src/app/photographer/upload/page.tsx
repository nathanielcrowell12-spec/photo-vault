'use client'

import { useState, useEffect } from 'react'
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
  Upload,
  Image as ImageIcon,
  FileUp,
  UserPlus,
  Download,
  Monitor
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
  }, [user?.id, userType, router])

  if (userType !== 'photographer') {
    return null
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleUpload = async () => {
    if (!selectedClientId || !galleryName || files.length === 0) {
      alert('Please select a client, enter a gallery name, and select files to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadStatus('Creating gallery...')
      console.log('Step 1: Creating gallery record in database...')

      // Create gallery in database
      const { data: gallery, error: galleryError } = await supabase
        .from('galleries')
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

      if (galleryError) {
        console.error('Error creating gallery:', galleryError)
        alert('Failed to create gallery. Please try again.')
        return
      }

      console.log('Gallery created:', gallery)
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
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name)

        // Upload to Supabase Storage
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

        console.log(`File uploaded successfully:`, uploadData)

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

        // Update progress
        const progress = 10 + ((i + 1) / files.length) * 80
        setUploadProgress(Math.round(progress))
      }

      // Create photo records in database
      setUploadStatus('Creating photo records...')
      setUploadProgress(95)

      const photoRecords = uploadedFiles.map(file => ({
        gallery_id: gallery.id,
        photo_url: file.publicUrl,
        thumbnail_url: file.publicUrl, // Using full image as thumbnail for now
        original_filename: file.fileName,
        file_size: file.fileSize,
        is_favorite: false,
        is_private: false
      }))

      // Insert photo records into gallery_photos table
      const { error: photosError } = await supabase
        .from('gallery_photos')
        .insert(photoRecords)

      if (photosError) {
        console.error('Error creating photo records:', photosError)
        alert(`⚠️ Photos uploaded to storage but failed to create database records.\n\nError: ${photosError.message}`)
        return
      }

      console.log('Photo records created successfully:', photoRecords.length)

      // Update gallery to mark as imported
      const { error: updateError } = await supabase
        .from('galleries')
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
              <Upload className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">Upload Photos</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
            Photographer
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Method Selection */}
          <Card className="border-2 border-purple-200 bg-purple-50/50">
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
                <div className="border-2 border-purple-300 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">PhotoVault Desktop Tool</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Recommended for bulk uploads, faster processing, and advanced features
                      </p>
                      <ul className="text-sm text-gray-600 mb-4 space-y-1">
                        <li>• Upload hundreds of photos at once</li>
                        <li>• Automatic image optimization</li>
                        <li>• Background uploads</li>
                        <li>• Offline queue support</li>
                      </ul>
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => {
                          // Try to launch the desktop app via custom protocol
                          window.location.href = 'photovault://upload'
                        }}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        Launch Desktop Tool
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Don't have it? <a href="https://photovault.com/downloads" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Download here</a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Web Upload Option */}
                <div className="border-2 border-green-300 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Web Upload</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Quick and convenient upload directly from your browser
                      </p>
                      <ul className="text-sm text-gray-600 mb-4 space-y-1">
                        <li>• No installation required</li>
                        <li>• Upload from any device</li>
                        <li>• Simple drag-and-drop</li>
                        <li>• Perfect for small batches</li>
                      </ul>
                      <Button className="w-full" variant="outline">
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
          <Card>
            <CardHeader>
              <CardTitle>Web Upload - Create New Gallery</CardTitle>
              <CardDescription>
                Upload photos to create a new gallery for your client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Client Selection */}
                <div>
                  <Label htmlFor="client">Select Client *</Label>
                  {loadingClients ? (
                    <p className="text-sm text-gray-500">Loading clients...</p>
                  ) : clients.length === 0 ? (
                    <div className="mt-2 p-4 border border-dashed rounded-md text-center">
                      <p className="text-sm text-gray-600 mb-3">No clients yet</p>
                      <Button size="sm" variant="outline" asChild>
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
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
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
                  <Label htmlFor="gallery-name">Gallery Name *</Label>
                  <Input
                    id="gallery-name"
                    value={galleryName}
                    onChange={(e) => setGalleryName(e.target.value)}
                    placeholder="e.g., Summer Wedding 2024, Family Portraits"
                  />
                </div>

                {/* Gallery Description */}
                <div>
                  <Label htmlFor="gallery-description">Description (Optional)</Label>
                  <Textarea
                    id="gallery-description"
                    value={galleryDescription}
                    onChange={(e) => setGalleryDescription(e.target.value)}
                    placeholder="Add details about this photo session..."
                    rows={3}
                  />
                </div>

                <Separator />

                {/* File Upload */}
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photos *
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
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
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </div>
                </div>

                {/* Selected Files Preview */}
                {files.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Selected Files ({files.length}):</h3>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
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
                      <span className="text-gray-600">{uploadStatus}</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Upload Button */}
                <div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0 || !selectedClientId || !galleryName}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <FileUp className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {files.length === 0
                          ? 'Select Photos to Upload'
                          : !selectedClientId
                          ? 'Select a Client First'
                          : !galleryName
                          ? 'Enter Gallery Name'
                          : `Create Gallery with ${files.length} ${files.length === 1 ? 'photo' : 'photos'}`
                        }
                      </>
                    )}
                  </Button>
                  {!uploading && (files.length === 0 || !selectedClientId || !galleryName) && (
                    <p className="text-sm text-orange-600 mt-2 text-center">
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
