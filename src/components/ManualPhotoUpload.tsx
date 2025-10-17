'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react'

interface ManualPhotoUploadProps {
  galleryId: string
  userId: string
  onUploadComplete: () => void
}

interface UploadingFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function ManualPhotoUpload({ galleryId, userId, onUploadComplete }: ManualPhotoUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadingFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

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

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('galleryId', galleryId)
    formData.append('userId', userId)

    files.forEach(f => {
      formData.append('photos', f.file)
    })

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })))

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()

      // Mark all as success
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' as const })))
      setUploadProgress(100)

      // Clear files after a delay
      setTimeout(() => {
        setFiles([])
        setUploadProgress(0)
        onUploadComplete()
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const,
        error: 'Upload failed'
      })))
    } finally {
      setIsUploading(false)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Manual Photo Upload</span>
        </CardTitle>
        <CardDescription>
          Upload photos directly from your device. Supports JPG, PNG, and other image formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">
            Drag and drop photos here
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
        </div>

        {/* Selected Files Preview */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {files.length} photo{files.length !== 1 ? 's' : ''} selected ({formatSize(totalSize)})
              </p>
              {!isUploading && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    files.forEach(f => URL.revokeObjectURL(f.preview))
                    setFiles([])
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {files.map(file => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Overlay */}
                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    {file.status === 'success' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isUploading && file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-center mt-1 truncate" title={file.file.name}>
                    {file.file.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Upload Button */}
            {!isUploading && files.some(f => f.status === 'pending') && (
              <Button
                onClick={uploadFiles}
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} Photo{files.length !== 1 ? 's' : ''} to Gallery
              </Button>
            )}

            {/* Success Message */}
            {files.every(f => f.status === 'success') && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All photos uploaded successfully! Refreshing gallery...
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

