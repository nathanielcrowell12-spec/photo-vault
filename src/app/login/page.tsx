'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, Camera, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      // Redirect based on user type will be handled by AuthProvider
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-5">
            <Heart className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold tracking-tight">PhotoVault</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to access your photos</p>
        </div>

        {/* Login Form */}
        <Card className="border border-border card-shadow">
          <CardHeader>
            <CardTitle className="text-foreground">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email and password to access your PhotoVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
              
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Links */}
        <div className="mt-10 text-center">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/signup?type=consumer">
              <Card className="cursor-pointer card-shadow-hover border border-border">
                <CardContent className="p-5 text-center">
                  <Heart className="h-6 w-6 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-semibold text-foreground">For Families</p>
                  <p className="text-xs text-muted-foreground">Find your photos</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/signup?type=photographer">
              <Card className="cursor-pointer card-shadow-hover border border-border">
                <CardContent className="p-5 text-center">
                  <Camera className="h-6 w-6 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-semibold text-foreground">For Photographers</p>
                  <p className="text-xs text-muted-foreground">Manage clients</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
