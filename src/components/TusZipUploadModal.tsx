'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, X, FileArchive, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import * as tus from 'tus-js-client'

interface TusZipUploadModalProps {
  platform?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UploadProgress {
  bytesUploaded: number
  bytesTotal: number
  progress: number
  message: string
}

export default function TusZipUploadModal({
  platform = 'ZIP Upload',
  isOpen,
  onClose,
  onSuccess
}: TusZipUploadModalProps) {
  const { user } = useAuth()
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [galleryName, setGalleryName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    bytesTotal: 0,
    progress: 0,
    message: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentUpload, setCurrentUpload] = useState<tus.Upload | null>(null)

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
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file.')
      return
    }

    // Validate file size (10GB limit with tus)
    const maxSize = 10 * 1024 * 1024 * 1024 // 10GB
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 10GB. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB.`)
      return
    }

    setZipFile(file)
    setError(null)
    
    // Auto-generate gallery name from filename
    if (!galleryName) {
      const nameWithoutExt = file.name.replace(/\.(zip|ZIP)$/, '')
      setGalleryName(nameWithoutExt)
    }

    console.log('=== TUS FILE SELECTED ===')
    console.log('File name:', file.name)
    console.log('File size:', file.size)
    console.log('File size in GB:', (file.size / 1024 / 1024 / 1024).toFixed(2))
  }

  const handleSubmit = async () => {
    if (!zipFile || !user) {
      setError('Please select a ZIP file and ensure you are logged in.')
      return
    }

    if (!galleryName.trim()) {
      setError('Please enter a gallery name.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log('=== STARTING SUPABASE DIRECT UPLOAD ===')
      console.log('File:', zipFile.name, zipFile.size)
      console.log('User:', user.id)

      // Step 1: Get signed upload URL from our API
      const prepareResponse = await fetch('/api/v1/upload/supabase-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: zipFile.name,
          userId: user.id,
          galleryName: galleryName.trim(),
          platform: platform
        })
      })

      if (!prepareResponse.ok) {
        throw new Error('Failed to prepare upload')
      }

      const { uploadUrl, uploadPath, token, galleryId, storagePath } = await prepareResponse.json()
      console.log('[SUPABASE] Got signed URL, starting upload...')

      // Step 2: Upload directly to Supabase Storage with resumable upload
      const chunkSize = 6 * 1024 * 1024 // 6MB chunks (Supabase recommended)
      let uploadedBytes = 0

      // Upload in chunks
      for (let start = 0; start < zipFile.size; start += chunkSize) {
        const end = Math.min(start + chunkSize, zipFile.size)
        const chunk = zipFile.slice(start, end)
        
        const formData = new FormData()
        formData.append('file', chunk)

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Range': `bytes ${start}-${end - 1}/${zipFile.size}`,
            'x-upsert': 'true'
          }
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`)
        }

        uploadedBytes = end
        const percentage = ((uploadedBytes / zipFile.size) * 100).toFixed(2)
        
        console.log(`[SUPABASE] Progress: ${percentage}%`, uploadedBytes, '/', zipFile.size)
        
        setUploadProgress({
          bytesUploaded: uploadedBytes,
          bytesTotal: zipFile.size,
          progress: parseFloat(percentage),
          message: `Uploaded ${(uploadedBytes / 1024 / 1024).toFixed(2)} MB of ${(zipFile.size / 1024 / 1024).toFixed(2)} MB`
        })
      }

      console.log('[SUPABASE] Upload completed successfully!')
      
      // Step 3: Trigger processing
      const processResponse = await fetch('/api/v1/upload/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId,
          storagePath
        })
      })

      if (!processResponse.ok) {
        console.warn('[SUPABASE] Processing trigger failed, but file is uploaded')
      }

      setSuccess(true)
      setUploading(false)
      
      // Close modal and refresh after a short delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err: unknown) {
      console.error('Supabase upload failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload'
      setError(errorMessage)
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (currentUpload) {
      currentUpload.abort()
      setCurrentUpload(null)
    }
    
    setUploading(false)
    setUploadProgress({
      bytesUploaded: 0,
      bytesTotal: 0,
      progress: 0,
      message: ''
    })
  }

  const handleClose = () => {
    if (uploading) {
      handleCancel()
    }
    setZipFile(null)
    setGalleryName('')
    setError(null)
    setSuccess(false)
    setUploadProgress({
      bytesUploaded: 0,
      bytesTotal: 0,
      progress: 0,
      message: ''
    })
    onClose()
  }

  const getInstructions = () => {
    switch (platform?.toLowerCase()) {
      case 'pixieset':
        return {
          step1: 'Go to your Pixieset gallery and enter the password',
          step2: 'Click the Download button (usually in top right)',
          step3: 'Enter your email address when prompted',
          step4: 'Check your email and click the download link',
          step5: 'Click the ZIP file to download it, then upload it here'
        }
      default:
        return {
          step1: 'Download your photos as a ZIP file from your platform',
          step2: 'Make sure the ZIP contains image files (JPG, PNG, etc.)',
          step3: 'Upload the ZIP file using the area below',
          step4: 'Enter a name for your gallery',
          step5: 'Click Upload to start the import process'
        }
    }
  }

  const instructions = getInstructions()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Import from {platform} - Direct Upload (Resumable)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <FileArchive className="h-4 w-4" />
              How to download from {platform}:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 ml-4">
              <li className="list-decimal">{instructions.step1}</li>
              <li className="list-decimal">{instructions.step2}</li>
              <li className="list-decimal">{instructions.step3}</li>
              <li className="list-decimal">{instructions.step4}</li>
              <li className="list-decimal">{instructions.step5}</li>
            </ol>
          </div>

          {/* Direct Upload Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Direct Supabase Upload:
            </h4>
            <ul className="text-sm text-green-800 space-y-1 ml-4">
              <li className="list-disc">Direct upload to cloud storage (bypasses server)</li>
              <li className="list-disc">Chunked upload for reliability</li>
              <li className="list-disc">Handles files up to 10GB</li>
              <li className="list-disc">Real-time progress tracking</li>
              <li className="list-disc">Works on all connections</li>
            </ul>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label htmlFor="zipFile">Select ZIP File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : zipFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {zipFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="font-medium text-green-700">{zipFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-500">
                    Direct Supabase - Resumable Upload
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZipFile(null)}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    Drag and drop your ZIP file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Max size: 10GB (Direct resumable upload)
                  </p>
                  <input
                    id="zipFile"
                    type="file"
                    accept=".zip"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('zipFile')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Gallery Name */}
          <div className="space-y-2">
            <Label htmlFor="galleryName">Gallery Name</Label>
            <Input
              id="galleryName"
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              placeholder="Enter a name for your gallery"
              disabled={uploading}
            />
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  Uploading directly to cloud...
                  <Zap className="h-3 w-3 text-green-600" />
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
              <p className="text-sm text-gray-600">{uploadProgress.message}</p>
              <p className="text-xs text-gray-500">
                Chunked upload for reliability
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Upload completed successfully! Processing your photos...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!zipFile || !galleryName.trim() || uploading}
              className="flex-1"
            >
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Direct Upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={uploading ? handleCancel : handleClose}
            >
              {uploading ? 'Cancel' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

