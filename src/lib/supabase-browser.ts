import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gqmycgopitxpjkxzrnyv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk2NjIsImV4cCI6MjA3NjU3NTY2Mn0.mUgIQ7V9CmquKalZduYTbD__1ETt-zfaHRZVp0xdwLQ'

// Create a browser client that properly uses cookies
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for convenience
export const supabaseBrowser = createClient()
