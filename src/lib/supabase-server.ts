import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gqmycgopitxpjkxzrnyv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk2NjIsImV4cCI6MjA3NjU3NTY2Mn0.mUgIQ7V9CmquKalZduYTbD__1ETt-zfaHRZVp0xdwLQ'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5OTY2MywiZXhwIjoyMDc2NTc1NjYzfQ.RzwmEr6SvpJmMJA2NTWNVT5ogQ7HYW65OS1gg6PUtCI'

/**
 * Create a Supabase client for use in Server Components and API Routes
 * This client uses cookies for auth state and respects RLS policies
 * Use this for authenticated operations
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Create a Supabase client with service role key
 * This client bypasses RLS policies - use with caution!
 * Only use for admin operations or when you need to bypass RLS
 */
export function createServiceRoleClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
