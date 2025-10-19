'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  user_type: 'client' | 'photographer' | 'admin'
  business_name?: string
  full_name?: string
  payment_status: string
  last_payment_date?: string
  created_at: string
  updated_at: string
}

interface PhotographerProfile {
  id: string
  business_license?: string
  commission_rate: number
  total_commission_earned: number
  monthly_commission: number
  created_at: string
}

interface ClientProfile {
  id: string
  photographer_id?: string
  email: string
  name: string
  status: string
  created_at: string
}

export default function UserProfileDebugPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [photographerProfile, setPhotographerProfile] = useState<PhotographerProfile | null>(null)
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)

        if (profileError) {
          throw new Error(`Profile error: ${profileError.message}`)
        }

        if (!profileData || profileData.length === 0) {
          throw new Error(`No user profile found for user ID: ${user.id}. This user may not have a profile in the user_profiles table.`)
        }

        if (profileData.length > 1) {
          throw new Error(`Multiple profiles found for user ID: ${user.id}. This is unexpected.`)
        }

        const profile = profileData[0]

        setUserProfile(profile)

        // Fetch photographer profile if user is photographer
        if (profile.user_type === 'photographer') {
          const { data: photographerData, error: photographerError } = await supabase
            .from('photographers')
            .select('*')
            .eq('id', user.id)
            .single()

          if (photographerError && photographerError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw new Error(`Photographer profile error: ${photographerError.message}`)
          }

          setPhotographerProfile(photographerData)
        }

        // Fetch client profile if user is client
        if (profile.user_type === 'client') {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('email', user.email)
            .single()

          if (clientError && clientError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw new Error(`Client profile error: ${clientError.message}`)
          }

          setClientProfile(clientData)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Profile Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your profile information.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Profile...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Fetching user profile data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600">{error}</p>
            
            {/* Basic Auth Info Even on Error */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Basic Auth Info</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Possible issues:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>User profile not created in user_profiles table</li>
                <li>Database connection issue</li>
                <li>Row Level Security (RLS) blocking access</li>
                <li>User ID mismatch between auth.users and user_profiles</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Profile Debug - {user.email}</CardTitle>
            <CardDescription>Complete profile information for debugging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth User Info */}
            <div>
              <h3 className="font-semibold mb-2">Auth User Info</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
              </div>
            </div>

            {/* User Profile */}
            {userProfile && (
              <div>
                <h3 className="font-semibold mb-2">User Profile</h3>
                <div className="bg-blue-100 p-3 rounded text-sm space-y-1">
                  <div><strong>User Type:</strong> 
                    <Badge className="ml-2" variant={userProfile.user_type === 'photographer' ? 'default' : 'secondary'}>
                      {userProfile.user_type}
                    </Badge>
                  </div>
                  <div><strong>Full Name:</strong> {userProfile.full_name || 'Not set'}</div>
                  <div><strong>Business Name:</strong> {userProfile.business_name || 'Not set'}</div>
                  <div><strong>Payment Status:</strong> 
                    <Badge className="ml-2" variant={userProfile.payment_status === 'active' ? 'default' : 'destructive'}>
                      {userProfile.payment_status}
                    </Badge>
                  </div>
                  <div><strong>Last Payment:</strong> {userProfile.last_payment_date || 'Never'}</div>
                  <div><strong>Profile Created:</strong> {new Date(userProfile.created_at).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Photographer Profile */}
            {photographerProfile && (
              <div>
                <h3 className="font-semibold mb-2">Photographer Profile</h3>
                <div className="bg-green-100 p-3 rounded text-sm space-y-1">
                  <div><strong>Commission Rate:</strong> {photographerProfile.commission_rate}%</div>
                  <div><strong>Total Commission Earned:</strong> ${photographerProfile.total_commission_earned}</div>
                  <div><strong>Monthly Commission:</strong> ${photographerProfile.monthly_commission}</div>
                  <div><strong>Business License:</strong> {photographerProfile.business_license || 'Not set'}</div>
                  <div><strong>Created:</strong> {new Date(photographerProfile.created_at).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Client Profile */}
            {clientProfile && (
              <div>
                <h3 className="font-semibold mb-2">Client Profile</h3>
                <div className="bg-purple-100 p-3 rounded text-sm space-y-1">
                  <div><strong>Name:</strong> {clientProfile.name}</div>
                  <div><strong>Email:</strong> {clientProfile.email}</div>
                  <div><strong>Status:</strong> 
                    <Badge className="ml-2" variant={clientProfile.status === 'active' ? 'default' : 'secondary'}>
                      {clientProfile.status}
                    </Badge>
                  </div>
                  <div><strong>Photographer ID:</strong> {clientProfile.photographer_id || 'Not assigned'}</div>
                  <div><strong>Created:</strong> {new Date(clientProfile.created_at).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="bg-yellow-100 p-3 rounded text-sm">
                <div><strong>Account Type:</strong> {userProfile?.user_type}</div>
                <div><strong>Display Name:</strong> {userProfile?.full_name || userProfile?.business_name || 'Not set'}</div>
                <div><strong>Has Photographer Profile:</strong> {photographerProfile ? 'Yes' : 'No'}</div>
                <div><strong>Has Client Profile:</strong> {clientProfile ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
