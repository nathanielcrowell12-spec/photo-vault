'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminTestPage() {
  const { user, userType, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Test</CardTitle>
            <CardDescription>Check if you have admin access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Email:</strong> {user?.email || 'Not logged in'}
            </div>
            <div>
              <strong>User Type:</strong> <Badge>{userType || 'Unknown'}</Badge>
            </div>
            <div>
              <strong>Is Admin:</strong> {user?.email === 'nathaniel.crowell12@gmail.com' ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Expected:</strong> nathaniel.crowell12@gmail.com with admin privileges
            </div>
            {user?.email !== 'nathaniel.crowell12@gmail.com' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  <strong>Note:</strong> You need to be logged in as nathaniel.crowell12@gmail.com to access admin features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
