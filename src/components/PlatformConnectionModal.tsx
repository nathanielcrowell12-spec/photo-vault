'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PlatformConnectionModalProps {
  platform: string | null
  isOpen: boolean
  onClose: () => void
  onConnect: (credentials: PlatformCredentials) => Promise<void>
}

interface PlatformCredentials {
  platform: string
  platformUrl?: string
  username?: string
  password: string
  galleryUrl?: string
  connectionType: 'gallery_link' | 'account_login'
}

export default function PlatformConnectionModal({ 
  platform, 
  isOpen, 
  onClose, 
  onConnect 
}: PlatformConnectionModalProps) {
  const [credentials, setCredentials] = useState<PlatformCredentials>({
    platform: platform || '',
    username: '',
    password: '',
    galleryUrl: '',
    platformUrl: '',
    connectionType: 'gallery_link'
  })
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAccountLogin, setShowAccountLogin] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== MODAL FORM SUBMITTED ===')
    console.log('Platform:', platform)
    console.log('Credentials:', credentials)
    setError(null)
    setConnecting(true)

    try {
      console.log('Calling onConnect with credentials:', {
        ...credentials,
        platform: platform || credentials.platform
      })
      await onConnect({
        ...credentials,
        platform: platform || credentials.platform
      })
      console.log('onConnect completed successfully')
      setSuccess(true)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please check your credentials.')
    } finally {
      setConnecting(false)
    }
  }

  const resetForm = () => {
    setCredentials({
      platform: '',
      username: '',
      password: '',
      galleryUrl: '',
      platformUrl: '',
      connectionType: 'gallery_link'
    })
    setError(null)
    setSuccess(false)
    setShowAccountLogin(false)
  }

  const handleClose = () => {
    if (!connecting) {
      resetForm()
      onClose()
    }
  }

  if (!platform) return null

  const isOtherPlatform = platform.toLowerCase() === 'other'
  const isKnownPlatform = ['pixieset', 'shootproof', 'smugmug', 'pic-time'].includes(platform.toLowerCase())

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOtherPlatform ? (
              <>
                🔗 Connect Other Platform
              </>
            ) : (
              <>
                Connect to {platform}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isOtherPlatform
              ? "Connect to any photo platform by providing your login credentials"
              : `Import your photos from ${platform} to PhotoVault`
            }
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Successfully connected to {isOtherPlatform ? credentials.platform : platform}!
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Other Platform - Custom URL */}
            {isOtherPlatform && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    placeholder="e.g., ABC Photography"
                    value={credentials.platform}
                    onChange={(e) => setCredentials({...credentials, platform: e.target.value})}
                    required
                    disabled={connecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform-url">Website URL</Label>
                  <Input
                    id="platform-url"
                    type="url"
                    placeholder="https://myphotographer.com"
                    value={credentials.platformUrl}
                    onChange={(e) => setCredentials({...credentials, platformUrl: e.target.value})}
                    required
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the main website URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    required
                    disabled={connecting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                    disabled={connecting}
                  />
                </div>
              </>
            )}

            {/* Known Platforms - Gallery Link (Primary) */}
            {isKnownPlatform && !showAccountLogin && (
              <>
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground font-medium mb-1">
                    📸 Most customers use this method
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your photographer sent you a gallery link and password
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gallery-url">Gallery Link from Your Photographer</Label>
                  <Input
                    id="gallery-url"
                    type="url"
                    placeholder={`https://yourphotographer.${platform.toLowerCase()}.com/yourgallery`}
                    value={credentials.galleryUrl}
                    onChange={(e) => setCredentials({...credentials, galleryUrl: e.target.value, connectionType: 'gallery_link'})}
                    required
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the full gallery URL your photographer shared with you
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gallery-password">Gallery Password</Label>
                  <Input
                    id="gallery-password"
                    type="password"
                    placeholder="Gallery password (if provided)"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank if the gallery is not password-protected
                  </p>
                </div>

                {/* Toggle to Account Login */}
                <div className="pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAccountLogin(true)}
                    className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    Do you have a {platform} account? Click here
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Most customers don't need this - only if you created your own account
                  </p>
                </div>
              </>
            )}

            {/* Known Platforms - Account Login (Secondary) */}
            {isKnownPlatform && showAccountLogin && (
              <>
                <div className="mb-4 p-3 bg-secondary/30 border border-border rounded-lg">
                  <p className="text-sm text-foreground font-medium mb-1">
                    🔐 Account Login
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For customers who have their own {platform} account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Your {platform} Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={`Your ${platform} username`}
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value, connectionType: 'account_login'})}
                    required
                    disabled={connecting}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Your {platform} Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your account password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                    disabled={connecting}
                    autoComplete="current-password"
                  />
                </div>

                {/* Toggle back to Gallery Link */}
                <div className="pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAccountLogin(false)}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    ← Back to Gallery Link Login
                  </Button>
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={connecting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={connecting}
                className="flex-1 btn-primary"
              >
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {isKnownPlatform && !showAccountLogin ? 'Import Gallery' : 'Connect'}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              🔒 Your credentials are encrypted and stored securely
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

