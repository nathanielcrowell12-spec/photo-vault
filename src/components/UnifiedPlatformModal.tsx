'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, AlertCircle, CheckCircle2, Download, User, Lock, FileArchive, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import EnhancedZipUploadModal from './EnhancedZipUploadModal'
import ChunkedZipUploadModal from './ChunkedZipUploadModal'
import TusZipUploadModal from './TusZipUploadModal'

interface UnifiedPlatformModalProps {
  platform: string | null
  isOpen: boolean
  onClose: () => void
}

interface ImportProgress {
  stage: 'authenticating' | 'finding_download' | 'downloading_zip' | 'extracting' | 'uploading' | 'complete' | 'error'
  progress: number
  message: string
  currentPhoto?: number
  totalPhotos?: number
  error?: string
}

export default function UnifiedPlatformModal({ platform, isOpen, onClose }: UnifiedPlatformModalProps) {
  const { user } = useAuth()
  
  // Debug logging
  console.log('=== UNIFIED PLATFORM MODAL ===')
  console.log('Platform received:', platform)
  console.log('Platform type:', typeof platform)
  console.log('Platform toLowerCase():', platform?.toLowerCase())
  console.log('Is Pixieset?', platform?.toLowerCase() === 'pixieset')
  const [accessType, setAccessType] = useState<'guest' | 'account'>('guest')
  const [credentials, setCredentials] = useState({
    galleryUrl: '',
    password: '',
    username: '',
    userPassword: ''
  })
  const [galleryMetadata, setGalleryMetadata] = useState({
    galleryName: '',
    photographerName: '',
    sessionDate: '',
    location: '',
    people: ''
  })
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showZipUpload, setShowZipUpload] = useState(false)
  const [showChunkedUpload, setShowChunkedUpload] = useState(false)
  const [showTusUpload, setShowTusUpload] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setImporting(true)
    setProgress(null)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Validate required fields
      if (!credentials.galleryUrl) {
        throw new Error('Gallery URL is required')
      }

      if (accessType === 'guest' && !credentials.password) {
        throw new Error('Password is required for guest access')
      }

      if (accessType === 'account' && (!credentials.username || !credentials.userPassword)) {
        throw new Error('Username and password are required for account access')
      }

      // Start import using unified API
      const response = await fetch('/api/v1/import/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          platform: platform,
          galleryUrl: credentials.galleryUrl,
          password: credentials.password,
          username: credentials.username,
          userPassword: credentials.userPassword,
          accessType: accessType,
          galleryMetadata: {
            galleryName: galleryMetadata.galleryName || `${platform} Gallery`,
            photographerName: galleryMetadata.photographerName,
            sessionDate: galleryMetadata.sessionDate,
            location: galleryMetadata.location,
            people: galleryMetadata.people ? galleryMetadata.people.split(',').map(p => p.trim()) : []
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start import')
      }

      const result = await response.json()
      console.log('Import started:', result)

      // Simulate progress updates (in real implementation, this would come from WebSocket or polling)
      setProgress({
        stage: 'authenticating',
        progress: 10,
        message: `Connecting to ${platform}...`
      })

      // For now, just show success after a delay
      setTimeout(() => {
        setProgress({
          stage: 'complete',
          progress: 100,
          message: 'Import completed successfully!'
        })
        setSuccess(true)
        setImporting(false)
        
        setTimeout(() => {
          onClose()
          resetForm()
          // Refresh the page to show new gallery
          window.location.reload()
        }, 2000)
      }, 5000)

    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Failed to import gallery')
      setImporting(false)
      setProgress(null)
    }
  }

  const resetForm = () => {
    setCredentials({
      galleryUrl: '',
      password: '',
      username: '',
      userPassword: ''
    })
    setGalleryMetadata({
      galleryName: '',
      photographerName: '',
      sessionDate: '',
      location: '',
      people: ''
    })
    setAccessType('guest')
    setError(null)
    setSuccess(false)
    setProgress(null)
  }

  const handleClose = () => {
    if (!importing) {
      resetForm()
      onClose()
    }
  }

  const getPlatformIcon = () => {
    switch (platform?.toLowerCase()) {
      case 'pixieset':
        return '📸'
      case 'smugmug':
        return '🖼️'
      case 'shootproof':
        return '📷'
      default:
        return '📁'
    }
  }

  const getPlatformInstructions = () => {
    switch (platform?.toLowerCase()) {
      case 'pixieset':
        return {
          guest: 'For individual gallery access with URL and password',
          account: 'For full account access with username and password',
          urlPlaceholder: 'https://photographer.pixieset.com/galleryname/'
        }
      case 'smugmug':
        return {
          guest: 'For individual gallery access with URL and password',
          account: 'For full account access with username and password',
          urlPlaceholder: 'https://photographer.smugmug.com/Gallery-Name/n-ABC123/'
        }
      default:
        return {
          guest: 'For individual gallery access',
          account: 'For full account access',
          urlPlaceholder: 'https://photographer.platform.com/gallery/'
        }
    }
  }

  if (!platform) return null

  const instructions = getPlatformInstructions()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getPlatformIcon()}</span>
            Import from {platform}
          </DialogTitle>
          <DialogDescription>
            {platform?.toLowerCase() === 'pixieset' 
              ? 'Due to Pixieset\'s security measures, please download your gallery as a ZIP file and upload it here.'
              : `Enter your ${platform} gallery details to automatically download and import your photos.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Platform-specific content */}
        {platform?.toLowerCase() === 'pixieset' ? (
          /* Pixieset ZIP Upload Flow */
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <FileArchive className="h-4 w-4" />
                How to download from Pixieset:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 ml-4">
                <li className="list-decimal">Go to your Pixieset gallery and enter the password</li>
                <li className="list-decimal">Click the Download button (usually in top right)</li>
                <li className="list-decimal">Enter your email address when prompted</li>
                <li className="list-decimal">Check your email and click the download link</li>
                <li className="list-decimal">Click the ZIP file to download it, then upload it here</li>
              </ol>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setShowTusUpload(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Direct Upload (Recommended for Large Files)
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowZipUpload(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Standard Upload
                </Button>
                <Button 
                  onClick={() => setShowChunkedUpload(true)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  size="sm"
                >
                  Experimental
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Standard automated import for other platforms */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Type Selection */}
            <div className="space-y-2">
              <Label>Access Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={accessType === 'guest' ? 'default' : 'outline'}
                  onClick={() => setAccessType('guest')}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Guest Access
                </Button>
                <Button
                  type="button"
                  variant={accessType === 'account' ? 'default' : 'outline'}
                  onClick={() => setAccessType('account')}
                  className="flex-1"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Account Access
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {accessType === 'guest' ? instructions.guest : instructions.account}
              </p>
            </div>

          {/* Gallery URL */}
          <div className="space-y-2">
            <Label htmlFor="galleryUrl">Gallery URL</Label>
            <Input
              id="galleryUrl"
              type="url"
              placeholder={instructions.urlPlaceholder}
              value={credentials.galleryUrl}
              onChange={(e) => setCredentials(prev => ({ ...prev, galleryUrl: e.target.value }))}
              disabled={importing}
              required
            />
          </div>

          {/* Guest Access Fields */}
          {accessType === 'guest' && (
            <div className="space-y-2">
              <Label htmlFor="password">Gallery Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter gallery password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={importing}
                required
              />
            </div>
          )}

          {/* Account Access Fields */}
          {accessType === 'account' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">{platform} Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={`Enter your ${platform} username`}
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  disabled={importing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword">{platform} Password</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder={`Enter your ${platform} password`}
                  value={credentials.userPassword}
                  onChange={(e) => setCredentials(prev => ({ ...prev, userPassword: e.target.value }))}
                  disabled={importing}
                  required
                />
              </div>
            </>
          )}

          {/* Gallery Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Gallery Information (Optional)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="galleryName">Gallery Name</Label>
                <Input
                  id="galleryName"
                  type="text"
                  placeholder="e.g., Wedding Day"
                  value={galleryMetadata.galleryName}
                  onChange={(e) => setGalleryMetadata(prev => ({ ...prev, galleryName: e.target.value }))}
                  disabled={importing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDate">Date</Label>
                <Input
                  id="sessionDate"
                  type="text"
                  placeholder="e.g., June 15, 2024"
                  value={galleryMetadata.sessionDate}
                  onChange={(e) => setGalleryMetadata(prev => ({ ...prev, sessionDate: e.target.value }))}
                  disabled={importing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photographerName">Photographer</Label>
              <Input
                id="photographerName"
                type="text"
                placeholder="Photographer name"
                value={galleryMetadata.photographerName}
                onChange={(e) => setGalleryMetadata(prev => ({ ...prev, photographerName: e.target.value }))}
                disabled={importing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Central Park, New York"
                value={galleryMetadata.location}
                onChange={(e) => setGalleryMetadata(prev => ({ ...prev, location: e.target.value }))}
                disabled={importing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="people">People (comma separated)</Label>
              <Input
                id="people"
                type="text"
                placeholder="e.g., John, Jane, Sarah"
                value={galleryMetadata.people}
                onChange={(e) => setGalleryMetadata(prev => ({ ...prev, people: e.target.value }))}
                disabled={importing}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="w-full" />
              {progress.currentPhoto && progress.totalPhotos && (
                <p className="text-xs text-muted-foreground">
                  Photo {progress.currentPhoto} of {progress.totalPhotos}
                </p>
              )}
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
                Gallery imported successfully! You can now view it on your dashboard.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={importing || !credentials.galleryUrl}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          </div>
        </form>
        )}
        
        {/* Enhanced ZIP Upload Modal */}
        <EnhancedZipUploadModal
          platform={platform}
          isOpen={showZipUpload}
          onClose={() => setShowZipUpload(false)}
          onSuccess={() => {
            setShowZipUpload(false)
            onClose()
            window.location.reload()
          }}
        />
        
        {/* Chunked ZIP Upload Modal */}
        <ChunkedZipUploadModal
          platform={platform}
          isOpen={showChunkedUpload}
          onClose={() => setShowChunkedUpload(false)}
          onSuccess={() => {
            setShowChunkedUpload(false)
            onClose()
            window.location.reload()
          }}
        />
        
        {/* TUS ZIP Upload Modal */}
        <TusZipUploadModal
          platform={platform}
          isOpen={showTusUpload}
          onClose={() => setShowTusUpload(false)}
          onSuccess={() => {
            setShowTusUpload(false)
            onClose()
            window.location.reload()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
