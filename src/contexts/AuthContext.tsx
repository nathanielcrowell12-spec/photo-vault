'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userType: 'client' | 'photographer' | 'admin', fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  userType: 'client' | 'photographer' | 'admin' | null
  userFullName: string | null
  paymentStatus: string | null
  isPaymentActive: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'client' | 'photographer' | 'admin' | null>(null)
  const [userFullName, setUserFullName] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [isPaymentActive, setIsPaymentActive] = useState(false)
  
  // Development mode - bypass authentication (DISABLED - using real Supabase auth)
  const isDevMode = false // Set to true only for quick UI testing without Supabase

  useEffect(() => {
    if (isDevMode) {
      // Development mode - create mock user
      const mockUser = {
        id: 'dev-user-1',
        email: 'photographer@dev.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: new Date().toISOString(),
        recovery_sent_at: new Date().toISOString(),
        email_change_sent_at: new Date().toISOString(),
        new_email: '',
        invited_at: new Date().toISOString(),
        action_link: '',
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        email_change_confirm_status: 0,
        banned_until: new Date().toISOString(),
        is_sso_user: false,
        deleted_at: new Date().toISOString(),
        is_anonymous: false
      } as User

      const mockSession = {
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      setUserType('admin') // Default to admin for development
      setLoading(false)
      return
    }

    // Production mode - use Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Session error:', error)
        // Clear corrupted session
        supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setUserType(null)
        setUserFullName(null)
        setPaymentStatus(null)
        setIsPaymentActive(false)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserType(session.user.id)
        }
      }
      setLoading(false)
    }).catch((error) => {
      console.error('AuthContext: Session fetch error:', error)
      // Clear session on error
      supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setUserType(null)
      setUserFullName(null)
      setPaymentStatus(null)
      setIsPaymentActive(false)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Handle sign out or token refresh
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setUserType(null)
          setUserFullName(null)
          setPaymentStatus(null)
          setIsPaymentActive(false)
        } else if (session) {
          setSession(session)
          setUser(session.user)
          await fetchUserType(session.user.id)
        }
      } else if (session) {
        setSession(session)
        setUser(session.user)
        await fetchUserType(session.user.id)
      } else {
        setSession(null)
        setUser(null)
        setUserType(null)
        setUserFullName(null)
        setPaymentStatus(null)
        setIsPaymentActive(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isDevMode])

  const fetchUserType = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type, business_name, full_name, payment_status, last_payment_date')
        .eq('id', userId)
        .single()

      if (data) {
        setUserType(data.user_type)
        // Use full_name for clients, business_name for photographers
        setUserFullName(data.full_name || data.business_name || null)
        setPaymentStatus(data.payment_status)
        
        // Check if payment is active
        const isActive = data.payment_status === 'active' || 
                        data.payment_status === 'admin_bypass' || 
                        data.user_type === 'photographer' ||
                        data.user_type === 'admin'
        setIsPaymentActive(isActive)
      }
    } catch (error) {
      console.error('Error fetching user type:', error)
    }
  }

  const signUp = async (email: string, password: string, userType: 'client' | 'photographer' | 'admin', fullName?: string) => {
    if (isDevMode) {
      // Development mode - simulate successful signup
      const mockUser = {
        id: `dev-user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: new Date().toISOString(),
        recovery_sent_at: new Date().toISOString(),
        email_change_sent_at: new Date().toISOString(),
        new_email: '',
        invited_at: new Date().toISOString(),
        action_link: '',
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        email_change_confirm_status: 0,
        banned_until: new Date().toISOString(),
        is_sso_user: false,
        deleted_at: new Date().toISOString(),
        is_anonymous: false
      } as User

      const mockSession = {
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      setUserType(userType)
      return { error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`,
        data: {
          full_name: fullName,
          user_type: userType
        }
      }
    })

    if (data.user && !error) {
      // Create user profile
      const profileData: any = {
        id: data.user.id,
        user_type: userType,
        payment_status: 'pending' // New users start as pending payment
      }
      
      // Use full_name for clients, business_name for photographers
      if (userType === 'client') {
        profileData.full_name = fullName
      } else {
        profileData.business_name = fullName
      }
      
      const { error: profileError } = await supabase.from('user_profiles').insert(profileData)
      
      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Still return success but log the error
        // The user is created in auth, just missing profile
      }

      // If photographer, create photographer profile
      if (userType === 'photographer') {
        const { error: photographerError } = await supabase.from('photographers').insert({
          id: data.user.id,
          business_name: fullName || 'My Photography Business',
        })
        
        if (photographerError) {
          console.error('Error creating photographer profile:', photographerError)
        }
      }
      
      // Manually set the user data since profile creation might have failed
      setUser(data.user)
      setUserType(userType)
      setUserFullName(fullName || null)
      setPaymentStatus('pending')
      setIsPaymentActive(false)
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    if (isDevMode) {
      // Development mode - simulate successful signin
      const mockUser = {
        id: `dev-user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: new Date().toISOString(),
        recovery_sent_at: new Date().toISOString(),
        email_change_sent_at: new Date().toISOString(),
        new_email: '',
        invited_at: new Date().toISOString(),
        action_link: '',
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        email_change_confirm_status: 0,
        banned_until: new Date().toISOString(),
        is_sso_user: false,
        deleted_at: new Date().toISOString(),
        is_anonymous: false
      } as User

      const mockSession = {
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      setUserType(email.includes('photo') ? 'photographer' : 'client')
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signOut = async () => {
    console.log('AuthContext: Starting sign out...')
    
    if (isDevMode) {
      console.log('AuthContext: Development mode sign out')
      // Development mode - clear mock data
      setUser(null)
      setSession(null)
      setUserType(null)
      setUserFullName(null)
      setPaymentStatus(null)
      setIsPaymentActive(false)
      console.log('AuthContext: Development mode sign out complete')
      return
    }

    console.log('AuthContext: Real Supabase sign out')
    // Real Supabase sign out
    const { error } = await supabase.auth.signOut()
    
    if (!error) {
      console.log('AuthContext: Supabase sign out successful, clearing state')
      // Clear all user state
      setUser(null)
      setSession(null)
      setUserType(null)
      setUserFullName(null)
      setPaymentStatus(null)
      setIsPaymentActive(false)
      console.log('AuthContext: State cleared successfully')
    } else {
      console.error('AuthContext: Error signing out:', error)
      // Still clear state even if Supabase sign out failed
      setUser(null)
      setSession(null)
      setUserType(null)
      setUserFullName(null)
      setPaymentStatus(null)
      setIsPaymentActive(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    userType,
    userFullName,
    paymentStatus,
    isPaymentActive,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
