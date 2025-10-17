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

interface EnhancedZipUploadModalProps {
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
  method?: 'standard' | 'streaming'
}

export default function EnhancedZipUploadModal({
  platform = 'ZIP Upload',
  isOpen,
  onClose,
  onSuccess
}: EnhancedZipUploadModalProps) {
  const { user } = useAuth()
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [galleryName, setGalleryName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'upload',
    progress: 0,
    message: '',
    method: 'streaming'
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadAborted, setUploadAborted] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<'streaming' | 'standard' | 'super-fast'>('super-fast')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const uploadControllerRef = useRef<AbortController | null>(null)
  const processingControllerRef = useRef<AbortController | null>(null)

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

    // Validate file size (5GB limit for streaming, 2GB for others)
    const maxSize = processingMethod === 'streaming' ? 5 * 1024 * 1024 * 1024 : 2 * 1024 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${processingMethod === 'streaming' ? '5GB' : '2GB'}. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB.`)
      return
    }

    setZipFile(file)
    setError(null)
    
    // Auto-generate gallery name from filename
    if (!galleryName) {
      const nameWithoutExt = file.name.replace(/\.(zip|ZIP)$/, '')
      setGalleryName(nameWithoutExt)
    }

    console.log('=== FILE SELECTED ===')
    console.log('File name:', file.name)
    console.log('File size:', file.size)
    console.log('File size in MB:', (file.size / 1024 / 1024).toFixed(2))
    console.log('Processing method:', processingMethod)
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
      console.log('=== STARTING ENHANCED UPLOAD ===')
      console.log('File:', zipFile.name, zipFile.size)
      console.log('User:', user.id)
      console.log('Method:', processingMethod)

      // Step 1: Prepare upload (get signed URL and create gallery)
      console.log('Step 1: Preparing upload...')
      const prepareResponse = await fetch('/api/v1/upload/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: zipFile.name,
          fileSize: zipFile.size,
          userId: user.id,
          galleryName: galleryName.trim(),
          platform: platform
        })
      })

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json()
        throw new Error(errorData.error || 'Failed to prepare upload')
      }

      const { uploadUrl, token, path, galleryId } = await prepareResponse.json()
      console.log('Step 1 complete. Gallery ID:', galleryId)

      // Step 2: Direct upload to Supabase (with progress tracking)
      console.log('Step 2: Uploading directly to Supabase...')
      setUploadProgress({
        phase: 'upload',
        progress: 0,
        message: 'Uploading ZIP file...',
        method: processingMethod
      })

      uploadControllerRef.current = new AbortController()
      
      await uploadWithProgress(zipFile, uploadUrl, token)

      console.log('Step 2 complete. Upload successful.')

      // Step 3: Process ZIP file (extract and upload photos)
      console.log('Step 3: Processing ZIP file...')
      setUploadProgress({
        phase: 'processing',
        progress: 0,
        message: `Processing ZIP file using ${processingMethod} method...`,
        method: processingMethod
      })

      processingControllerRef.current = new AbortController()
      
      await processZipFile(galleryId, path, processingMethod)

      console.log('Step 3 complete. Processing successful.')
      
      setSuccess(true)
      setUploading(false)
      
      // Close modal and refresh after a short delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed')
      setUploading(false)
    }
  }

  const uploadWithProgress = async (file: File, uploadUrl: string, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(prev => ({
            ...prev,
            progress: Math.min(progress, 95), // Cap at 95% during upload
            message: `Uploading ZIP file... ${progress}%`
          }))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'))
      })

      // Set up abort controller
      uploadControllerRef.current?.signal.addEventListener('abort', () => {
        xhr.abort()
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(file)
    })
  }

  const processZipFile = async (galleryId: string, storagePath: string, method: 'streaming' | 'standard' | 'super-fast'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const endpoint = method === 'streaming' ? '/api/v1/upload/process-streaming' : 
                      method === 'super-fast' ? '/api/v1/upload/process-fast' : 
                      '/api/v1/upload/process'
      
      fetch(endpoint, {
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
                    progress: data.progress,
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
            Import from {platform} - Enhanced Upload
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

          {/* Advanced Settings */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Processing Method
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="super-fast"
                    name="method"
                    checked={processingMethod === 'super-fast'}
                    onChange={() => setProcessingMethod('super-fast')}
                    className="text-purple-600"
                  />
                  <Label htmlFor="super-fast" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">SUPER FAST Processing</span>
                    <span className="text-sm text-gray-600">(BEST FOR LARGE FILES)</span>
                  </Label>
                </div>
                <div className="ml-6 text-sm text-gray-600">
                  • Processes up to 20 photos simultaneously<br/>
                  • Optimized for large ZIP files<br/>
                  • Maximum parallelization<br/>
                  • Best performance for your 1.6GB file
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="streaming"
                    name="method"
                    checked={processingMethod === 'streaming'}
                    onChange={() => setProcessingMethod('streaming')}
                    className="text-blue-600"
                  />
                  <Label htmlFor="streaming" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Streaming Processing</span>
                    <span className="text-sm text-gray-600">(Memory Efficient)</span>
                  </Label>
                </div>
                <div className="ml-6 text-sm text-gray-600">
                  • Better memory efficiency for large files<br/>
                  • Supports files up to 5GB<br/>
                  • May be slower than Super Fast
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="standard"
                    name="method"
                    checked={processingMethod === 'standard'}
                    onChange={() => setProcessingMethod('standard')}
                    className="text-green-600"
                  />
                  <Label htmlFor="standard" className="flex items-center gap-2 cursor-pointer">
                    <FileArchive className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Standard Processing</span>
                    <span className="text-sm text-gray-600">(Fallback)</span>
                  </Label>
                </div>
                <div className="ml-6 text-sm text-gray-600">
                  • Traditional method (current working system)<br/>
                  • Supports files up to 2GB<br/>
                  • More compatible with all file types
                </div>
              </div>
            )}
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
                    Processing: {processingMethod === 'super-fast' ? 'SUPER FAST' : processingMethod === 'streaming' ? 'Streaming' : 'Standard'}
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
                    Max size: {processingMethod === 'streaming' ? '5GB' : '2GB'}
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
                  {uploadProgress.phase === 'upload' ? 'Uploading ZIP...' : 'Processing Photos...'}
                  {uploadProgress.method === 'super-fast' && (
                    <Zap className="h-3 w-3 text-purple-600" />
                  )}
                  {uploadProgress.method === 'streaming' && (
                    <Zap className="h-3 w-3 text-blue-600" />
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress}%
                </span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
              <p className="text-sm text-gray-600">{uploadProgress.message}</p>
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
                uploadProgress.phase === 'upload' ? 'Uploading...' : 'Processing...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Enhanced Upload
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
