'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, AlertCircle, CheckCircle2, Upload, FileArchive, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ZipUploadModalProps {
  platform: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ZipUploadModal({ platform, isOpen, onClose, onSuccess }: ZipUploadModalProps) {
  const { user } = useAuth()
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [galleryName, setGalleryName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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

    const files = Array.from(e.dataTransfer.files)
    console.log('=== DRAG AND DROP ===')
    console.log('Files dropped:', files.length)
    console.log('File names:', files.map(f => f.name))
    
    const zipFile = files.find(file => file.name.endsWith('.zip'))
    
    if (zipFile) {
      console.log('=== ZIP FILE DROPPED ===')
      console.log('File name:', zipFile.name)
      console.log('File size:', zipFile.size)
      console.log('File size in MB:', (zipFile.size / 1024 / 1024).toFixed(2))
      
      // Check file size (2GB limit)
      const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
      if (zipFile.size > maxSize) {
        setError(`File too large. Maximum size is 2GB. Your file is ${(zipFile.size / 1024 / 1024 / 1024).toFixed(2)}GB.`)
        setZipFile(null)
        return
      }
      
      setZipFile(zipFile)
      setError(null)
      // Auto-populate gallery name from ZIP filename
      const name = zipFile.name.replace('.zip', '').replace(/-|_/g, ' ')
      setGalleryName(name.charAt(0).toUpperCase() + name.slice(1))
    } else {
      setError('Please upload a ZIP file')
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      console.log('=== FILE SELECTED ===')
      console.log('File name:', file.name)
      console.log('File size:', file.size)
      console.log('File type:', file.type)
      console.log('File size in MB:', (file.size / 1024 / 1024).toFixed(2))
      
      if (file.name.endsWith('.zip')) {
        // Check file size (2GB limit)
        const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
        if (file.size > maxSize) {
          setError(`File too large. Maximum size is 2GB. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB.`)
          setZipFile(null)
          return
        }
        
        setZipFile(file)
        setError(null)
        // Auto-populate gallery name from ZIP filename
        const name = file.name.replace('.zip', '').replace(/-|_/g, ' ')
        setGalleryName(name.charAt(0).toUpperCase() + name.slice(1))
      } else {
        setError('Please select a ZIP file')
        setZipFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== ZIP UPLOAD SUBMIT STARTED ===')
    console.log('ZipFile:', zipFile)
    console.log('ZipFile name:', zipFile?.name)
    console.log('ZipFile size:', zipFile?.size)
    console.log('ZipFile type:', zipFile?.type)
    console.log('User:', user?.id)
    
    if (!zipFile) {
      setError('Please select a ZIP file')
      return
    }

    if (!user) {
      setError('User not authenticated')
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('zipFile', zipFile)
      formData.append('platform', platform || 'Unknown')
      formData.append('galleryName', galleryName || zipFile.name.replace('.zip', ''))
      formData.append('userId', user.id)

      // Upload and process ZIP file
      console.log('=== STARTING FETCH REQUEST ===')
      console.log('FormData entries:', Array.from(formData.entries()))
      
      const response = await fetch('/api/v1/import/zip', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': user.id
        }
      })
      
      console.log('=== FETCH RESPONSE ===')
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process ZIP file')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              
              if (data.progress !== undefined) {
                setProgress(data.progress)
              }

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.complete) {
                setSuccess(true)
                setProgress(100)
                
                // Close modal and refresh after success
                setTimeout(() => {
                  onSuccess?.()
                  onClose()
                  resetForm()
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }, 2000)
              }
            }
          }
        }
      }

    } catch (err) {
      console.error('ZIP upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload ZIP file')
      setUploading(false)
    }
  }

  const resetForm = () => {
    setZipFile(null)
    setGalleryName('')
    setError(null)
    setSuccess(false)
    setProgress(0)
    setUploading(false)
  }

  const handleClose = () => {
    if (!uploading) {
      resetForm()
      onClose()
    }
  }

  const getPlatformInstructions = () => {
    switch (platform?.toLowerCase()) {
      case 'pixieset':
        return {
          step1: 'Go to your Pixieset gallery and enter the password',
          step2: 'Click the Download button (usually in top right)',
          step3: 'Enter your email address when prompted',
          step4: 'Check your email and click the download link',
          step5: 'Click the ZIP file to download it, then upload it here'
        }
      case 'smugmug':
        return {
          step1: 'Go to your SmugMug gallery',
          step2: 'Click the Download button',
          step3: 'Select "Download All" and choose ZIP format',
          step4: 'Wait for the ZIP file to download',
          step5: 'Drag and drop the ZIP file here, or click to browse'
        }
      default:
        return {
          step1: `Go to your ${platform} gallery`,
          step2: 'Download all photos as a ZIP file',
          step3: 'Wait for the download to complete',
          step4: 'Drag and drop the ZIP file here, or click to browse'
        }
    }
  }

  if (!platform) return null

  const instructions = getPlatformInstructions()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Import from {platform} - ZIP Upload
          </DialogTitle>
          <DialogDescription>
            Download your gallery as a ZIP file from {platform}, then upload it here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Download className="h-4 w-4" />
              How to download from {platform}:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 ml-4">
              {Object.values(instructions).map((step, index) => (
                <li key={index} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : zipFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="zipFileInput"
              accept=".zip"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            
            {zipFile ? (
              <div className="space-y-2">
                <FileArchive className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-medium text-green-900">{zipFile.name}</p>
                <p className="text-sm text-green-700">
                  Size: {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZipFile(null)
                    setGalleryName('')
                  }}
                  disabled={uploading}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-medium">Drag and drop your ZIP file here</p>
                  <p className="text-sm text-gray-500">or</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('zipFileInput')?.click()}
                  disabled={uploading}
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          {/* Gallery Name */}
          <div className="space-y-2">
            <Label htmlFor="galleryName">Gallery Name</Label>
            <Input
              id="galleryName"
              type="text"
              placeholder="e.g., Wedding Day"
              value={galleryName}
              onChange={(e) => setGalleryName(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing ZIP file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Gallery imported successfully! Refreshing...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !zipFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Import
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

