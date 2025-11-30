'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { validateUserType } from '@/lib/access-control'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userType: 'client' | 'photographer' | 'admin', fullName?: string) => Promise<{ error: unknown }>
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  changePassword: (newPassword: string) => Promise<{ error: unknown }>
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
  
  // Prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false)
  const initializedRef = useRef(false)
  
  // Development mode - bypass authentication (DISABLED - using real Supabase auth)
  const isDevMode = false

  const fetchUserType = async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[AuthContext] Fetch already in progress, skipping')
      return
    }

    isFetchingRef.current = true
    console.log('[AuthContext] Fetching user type for:', userId)

    try {
      // Get current session instead of calling getUser() which can return 403
      console.log('[AuthContext] Getting session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('[AuthContext] Session result:', { session: !!session, error: sessionError })

      const userEmail = session?.user?.email
      const isAdminUser = userEmail === 'nathaniel.crowell12@gmail.com'

      console.log('[AuthContext] User email:', userEmail, 'Is admin:', isAdminUser)

      if (isAdminUser) {
        console.log('[AuthContext] Setting admin user type')
        setUserType('admin')
        setUserFullName('Admin User')
        setPaymentStatus('admin_bypass')
        setIsPaymentActive(true)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type, business_name, full_name, payment_status, last_payment_date')
        .eq('id', userId)
        .maybeSingle()

      console.log('[AuthContext] Profile query result:', { data, error })

      if (error) {
        console.error('[AuthContext] Error fetching user profile:', error)
        setUserType('client')
        setUserFullName(null)
        setPaymentStatus('pending')
        setIsPaymentActive(false)
        return
      }

      if (data) {
        console.log('[AuthContext] Setting user type from profile:', data.user_type)
        setUserType(data.user_type)
        setUserFullName(data.full_name || data.business_name || null)
        setPaymentStatus(data.payment_status)
        setIsPaymentActive(true)
      } else {
        console.log('[AuthContext] No profile found, defaulting to client')
        setUserType('client')
        setUserFullName(null)
        setPaymentStatus('active')
        setIsPaymentActive(true)
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user type:', error)
      setUserType('client')
      setUserFullName(null)
      setPaymentStatus('active')
      setIsPaymentActive(true)
    } finally {
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    if (isDevMode) {
      // Dev mode setup (unchanged)
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
      setUserType('admin')
      setLoading(false)
      initializedRef.current = true
      return
    }

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('AuthContext: Session error:', error)
          // Don't sign out - just clear state
          setSession(null)
          setUser(null)
          setUserType(null)
          setUserFullName(null)
          setPaymentStatus(null)
          setIsPaymentActive(false)
        } else if (session?.user) {
          setSession(session)
          setUser(session.user)
          await fetchUserType(session.user.id)
        }
      } catch (error) {
        console.error('AuthContext: Session fetch error:', error)
        // Don't sign out - just clear state
        setSession(null)
        setUser(null)
        setUserType(null)
        setUserFullName(null)
        setPaymentStatus(null)
        setIsPaymentActive(false)
      } finally {
        setLoading(false)
        initializedRef.current = true
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event)
      
      // Skip initial session if we already initialized
      if (event === 'INITIAL_SESSION' && initializedRef.current) {
        return
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUserType(null)
        setUserFullName(null)
        setPaymentStatus(null)
        setIsPaymentActive(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Only update session, don't refetch user data
        setSession(session)
        setUser(session.user)
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
        // Only fetch user type if we don't already have it (prevents loops from multiple SIGNED_IN events)
        if (!initializedRef.current) {
          await fetchUserType(session.user.id)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, []) // Empty dependency array - only run once

  const signUp = async (email: string, password: string, userType: 'client' | 'photographer' | 'admin', fullName?: string) => {
    const actualUserType = email === 'nathaniel.crowell12@gmail.com' ? 'admin' : userType
    
    const validation = validateUserType(actualUserType, email)
    if (!validation.valid) {
      return { error: { message: validation.message } }
    }

    if (isDevMode) {
      // Dev mode implementation unchanged
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
      const profileData: Record<string, unknown> = {
        id: data.user.id,
        user_type: actualUserType,
        payment_status: 'active'
      }
      
      if (actualUserType === 'client') {
        profileData.full_name = fullName
      } else {
        profileData.business_name = fullName
      }
      
      const { error: profileError } = await supabase.from('user_profiles').insert(profileData)
      
      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }

      if (userType === 'photographer') {
        const { error: photographerError } = await supabase.from('photographers').insert({
          id: data.user.id,
          // business_name is stored in user_profiles table, not photographers table
          // photographers table has optional columns for CMS integration
        })

        if (photographerError) {
          console.error('Error creating photographer profile:', photographerError)
          console.error('Photographer error details:', JSON.stringify(photographerError, null, 2))
        }
      }
      
      setUser(data.user)
      setUserType(userType)
      setUserFullName(fullName || null)
      setPaymentStatus('pending')
      setIsPaymentActive(false)
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      if (isDevMode) {
        // Dev mode - create mock user based on email
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
        
        // Properly determine user type
        if (email === 'nathaniel.crowell12@gmail.com') {
          setUserType('admin')
        } else {
          // For dev mode, try to fetch user type from database or default to client
          await fetchUserType(mockUser.id)
        }
        
        setLoading(false)
        return { error: null }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[AuthContext] Sign in error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        })
        setLoading(false)
        return { error }
      }

      console.log('[AuthContext] Sign in SUCCESS:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        email: data.user?.email,
      })

      // Manually set the session to ensure it's stored
      if (data.session && data.user) {
        setSession(data.session)
        setUser(data.user)
        await fetchUserType(data.user.id)
      }

      // Mark loading as complete
      setLoading(false)

      // Success - the auth state change handler will handle the rest
      return { error: null }
    } catch (error) {
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...')
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[AuthContext] Supabase signOut error:', error)
      }

      console.log('[AuthContext] Clearing auth state...')
      setUser(null)
      setSession(null)
      setUserType(null)
      setUserFullName(null)
      setPaymentStatus(null)
      setIsPaymentActive(false)
      console.log('[AuthContext] Sign out complete, redirecting to login...')

      // Redirect to login page after sign out
      if (typeof window !== 'undefined') {
        console.log('[AuthContext] Performing redirect to /login')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error)
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const changePassword = async (newPassword: string) => {
    try {
      console.log('[AuthContext] Changing password...')
      
      if (!session) {
        return { error: { message: 'No active session. Please log in again.' } }
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('[AuthContext] Password change error:', error)
        return { error }
      }

      console.log('[AuthContext] Password changed successfully')
      return { error: null }
    } catch (error) {
      console.error('[AuthContext] Error changing password:', error)
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    changePassword,
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