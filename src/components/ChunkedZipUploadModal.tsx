'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, X, FileArchive, CheckCircle, AlertCircle, Zap, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ChunkedZipUploadModalProps {
  platform?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UploadProgress {
  phase: 'upload' | 'processing'
  progress: number
  message: string
  currentPhoto?: number
  totalPhotos?: number
  uploadedChunks?: number
  totalChunks?: number
}

export default function ChunkedZipUploadModal({
  platform = 'ZIP Upload',
  isOpen,
  onClose,
  onSuccess
}: ChunkedZipUploadModalProps) {
  const { user } = useAuth()
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [galleryName, setGalleryName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'upload',
    progress: 0,
    message: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadAborted, setUploadAborted] = useState(false)
  
  const uploadControllerRef = useRef<AbortController | null>(null)
  const processingControllerRef = useRef<AbortController | null>(null)
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const maxConcurrentChunks = 4 // Upload 4 chunks in parallel

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

    // Validate file size (10GB limit for chunked upload)
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

    console.log('=== CHUNKED FILE SELECTED ===')
    console.log('File name:', file.name)
    console.log('File size:', file.size)
    console.log('File size in MB:', (file.size / 1024 / 1024).toFixed(2))
    console.log('Chunk size:', chunkSize / 1024 / 1024, 'MB')
    console.log('Total chunks:', Math.ceil(file.size / chunkSize))
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
    setUploadAborted(false)

    try {
      console.log('=== STARTING DROPBOX-STYLE CHUNKED UPLOAD ===')
      console.log('File:', zipFile.name, zipFile.size)
      console.log('User:', user.id)

      // Step 1: Initiate chunked upload session
      console.log('Step 1: Initiating chunked upload session...')
      const totalChunks = Math.ceil(zipFile.size / chunkSize)
      
      const initiateResponse = await fetch('/api/v1/upload/chunked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          fileName: zipFile.name,
          fileSize: zipFile.size,
          totalChunks,
          userId: user.id,
          galleryName: galleryName.trim(),
          platform: platform
        })
      })

      if (!initiateResponse.ok) {
        const errorData = await initiateResponse.json()
        throw new Error(errorData.error || 'Failed to initiate upload session')
      }

      const { sessionId, galleryId } = await initiateResponse.json()
      console.log('Step 1 complete. Session ID:', sessionId)

      // Step 2: Upload chunks in parallel
      console.log('Step 2: Uploading chunks in parallel...')
      setUploadProgress({
        phase: 'upload',
        progress: 0,
        message: 'Uploading chunks in parallel...'
      })

      uploadControllerRef.current = new AbortController()
      
      await uploadChunksInParallel(zipFile, sessionId, totalChunks)

      console.log('Step 2 complete. All chunks uploaded.')

      // Step 3: Complete upload (reassemble file)
      console.log('Step 3: Completing upload...')
      setUploadProgress({
        phase: 'upload',
        progress: 95,
        message: 'Reassembling file...'
      })

      const completeResponse = await fetch('/api/v1/upload/chunked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          sessionId
        })
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Failed to complete upload')
      }

      const { finalPath } = await completeResponse.json()
      console.log('Step 3 complete. File reassembled.')

      // Step 4: Process ZIP file
      console.log('Step 4: Processing ZIP file...')
      setUploadProgress({
        phase: 'processing',
        progress: 0,
        message: 'Processing ZIP file...'
      })

      processingControllerRef.current = new AbortController()
      
      await processZipFile(galleryId, finalPath)

      console.log('Step 4 complete. Processing successful.')
      
      setSuccess(true)
      setUploading(false)
      
      // Close modal and refresh after a short delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err: unknown) {
      console.error('Chunked upload failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      setUploading(false)
    }
  }

  const uploadChunksInParallel = async (file: File, sessionId: string, totalChunks: number): Promise<void> => {
    const chunks: Array<{ index: number; data: Blob }> = []
    
    // Split file into chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunkData = file.slice(start, end)
      chunks.push({ index: i, data: chunkData })
    }

    console.log(`Created ${chunks.length} chunks for parallel upload`)

    // Upload chunks in parallel batches
    for (let i = 0; i < chunks.length; i += maxConcurrentChunks) {
      const batch = chunks.slice(i, i + maxConcurrentChunks)
      
      await Promise.all(
        batch.map(async ({ index, data }) => {
          const formData = new FormData()
          formData.append('chunk', data)
          formData.append('action', 'upload_chunk')
          formData.append('sessionId', sessionId)
          formData.append('chunkIndex', index.toString())
          formData.append('totalChunks', totalChunks.toString())
          
          const response = await fetch('/api/v1/upload/chunked', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Failed to upload chunk ${index}`)
          }

          const result = await response.json()
          
          // Update progress
          const progress = Math.round((result.uploadedChunks / result.totalChunks) * 90) // Cap at 90% for upload phase
          setUploadProgress(prev => ({
            ...prev,
            progress,
            message: `Uploading chunks: ${result.uploadedChunks}/${result.totalChunks}`,
            uploadedChunks: result.uploadedChunks,
            totalChunks: result.totalChunks
          }))
        })
      )
    }
  }

  const processZipFile = async (galleryId: string, storagePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      fetch('/api/v1/upload/process-fast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleryId,
          storagePath
        }),
        signal: processingControllerRef.current?.signal
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Processing failed')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.error) {
                  throw new Error(data.error)
                }

                if (data.progress !== undefined) {
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: 95 + Math.floor(data.progress * 0.05), // Scale processing to 95-100%
                    message: data.message,
                    currentPhoto: data.currentPhoto,
                    totalPhotos: data.totalPhotos
                  }))
                }

                if (data.complete) {
                  resolve()
                  return
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      }).catch(reject)
    })
  }

  const handleCancel = () => {
    setUploadAborted(true)
    
    // Abort upload if in progress
    uploadControllerRef.current?.abort()
    processingControllerRef.current?.abort()
    
    setUploading(false)
    setUploadProgress({
      phase: 'upload',
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
      phase: 'upload',
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
            Import from {platform} - Dropbox-Style Upload
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

          {/* Dropbox-Style Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Dropbox-Style Chunked Upload:
            </h4>
            <ul className="text-sm text-purple-800 space-y-1 ml-4">
              <li className="list-disc">Splits large files into 5MB chunks</li>
              <li className="list-disc">Uploads 4 chunks simultaneously</li>
              <li className="list-disc">Resumable if interrupted</li>
              <li className="list-disc">Optimized for large files like yours</li>
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
                    Will be split into {Math.ceil(zipFile.size / chunkSize)} chunks
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
                    Max size: 10GB (chunked upload)
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
                  {uploadProgress.phase === 'upload' ? 'Uploading Chunks...' : 'Processing Photos...'}
                  <Zap className="h-3 w-3 text-purple-600" />
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress}%
                </span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
              <p className="text-sm text-gray-600">{uploadProgress.message}</p>
              {uploadProgress.uploadedChunks && uploadProgress.totalChunks && (
                <p className="text-sm text-gray-500">
                  Chunks: {uploadProgress.uploadedChunks}/{uploadProgress.totalChunks}
                </p>
              )}
              {uploadProgress.currentPhoto && uploadProgress.totalPhotos && (
                <p className="text-sm text-gray-500">
                  Photo {uploadProgress.currentPhoto} of {uploadProgress.totalPhotos}
                </p>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Upload completed successfully! Your gallery is being created.
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

          {/* Cancel Message */}
          {uploadAborted && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Upload cancelled. No files were uploaded.
              </AlertDescription>
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
                uploadProgress.phase === 'upload' ? 'Uploading Chunks...' : 'Processing...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Dropbox-Style Upload
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
