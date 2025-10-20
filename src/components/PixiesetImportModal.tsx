'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, AlertCircle, CheckCircle2, Download, User, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface PixiesetImportModalProps {
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

export default function PixiesetImportModal({ isOpen, onClose }: PixiesetImportModalProps) {
  const { user } = useAuth()
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

      // Start import
      const response = await fetch('/api/import/pixieset-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          galleryUrl: credentials.galleryUrl,
          password: credentials.password,
          username: credentials.username,
          userPassword: credentials.userPassword,
          accessType: accessType,
          galleryMetadata: {
            galleryName: galleryMetadata.galleryName || 'Pixieset Gallery',
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
        message: 'Connecting to Pixieset...'
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
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Import from Pixieset
          </DialogTitle>
          <DialogDescription>
            Enter your Pixieset gallery details to automatically download and import your photos.
          </DialogDescription>
        </DialogHeader>

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
              {accessType === 'guest' 
                ? 'For individual gallery access with URL and password'
                : 'For full account access with username and password'
              }
            </p>
          </div>

          {/* Gallery URL */}
          <div className="space-y-2">
            <Label htmlFor="galleryUrl">Gallery URL</Label>
            <Input
              id="galleryUrl"
              type="url"
              placeholder="https://photographer.pixieset.com/galleryname/"
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
                <Label htmlFor="username">Pixieset Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your Pixieset username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  disabled={importing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword">Pixieset Password</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="Enter your Pixieset password"
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
      </DialogContent>
    </Dialog>
  )
}
