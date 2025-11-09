/**
 * DEPRECATED: This file is being phased out.
 *
 * For new code, use:
 * - Client-side: import { supabaseBrowser } from '@/lib/supabase-browser'
 * - Server-side (API routes, Server Components): import { createServerSupabaseClient } from '@/lib/supabase-server'
 *
 * This file remains for backward compatibility with existing API routes.
 */

import { createClient } from '@supabase/supabase-js'

// Re-export createClient for use in other files
export { createClient }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gqmycgopitxpjkxzrnyv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk2NjIsImV4cCI6MjA3NjU3NTY2Mn0.mUgIQ7V9CmquKalZduYTbD__1ETt-zfaHRZVp0xdwLQ'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpreHpybnl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5OTY2MywiZXhwIjoyMDc2NTc1NjYzfQ.RzwmEr6SvpJmMJA2NTWNVT5ogQ7HYW65OS1gg6PUtCI'

/**
 * DEPRECATED: Server-side client with service role - bypasses RLS!
 * For new code, use createServerSupabaseClient from '@/lib/supabase-server' instead.
 * This uses service role key which bypasses Row Level Security.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * DEPRECATED: Use createServerSupabaseClient from '@/lib/supabase-server' instead.
 * Create a Supabase client for server-side operations with service role key.
 * This bypasses RLS - use with caution!
 */
export function createServerSupabaseClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for server-side operations')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          user_type: 'consumer' | 'photographer'
          created_at: string
          updated_at: string
          full_name: string | null
          phone: string | null
          profile_image_url: string | null
        }
        Insert: {
          id: string
          email: string
          user_type: 'consumer' | 'photographer'
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone?: string | null
          profile_image_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          user_type?: 'consumer' | 'photographer'
          created_at?: string
          updated_at?: string
          full_name?: string | null
          phone?: string | null
          profile_image_url?: string | null
        }
      }
      photographers: {
        Row: {
          id: string
          user_id: string
          business_name: string
          website_url: string | null
          bio: string | null
          profile_image_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          website_url?: string | null
          bio?: string | null
          profile_image_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          website_url?: string | null
          bio?: string | null
          profile_image_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      photo_galleries: {
        Row: {
          id: string
          photographer_id: string
          consumer_id: string | null
          platform: 'pixieset' | 'shootproof' | 'smugmug' | 'pic_time' | 'cloudspot' | 'zenfolio' | 'lightfolio' | 'picflow' | 'samaro' | 'photoshelter' | 'passgallery' | 'slickpic' | 'pixpa' | 'format' | 'squarespace' | 'adobe_portfolio' | 'fotomerchant' | 'photobiz' | 'wix'
          platform_gallery_id: string
          gallery_name: string
          gallery_description: string | null
          gallery_url: string
          access_code: string | null
          cover_image_url: string | null
          photo_count: number
          session_date: string | null
          is_imported: boolean
          imported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          consumer_id?: string | null
          platform: 'pixieset' | 'shootproof' | 'smugmug' | 'pic_time' | 'cloudspot' | 'zenfolio' | 'lightfolio' | 'picflow' | 'samaro' | 'photoshelter' | 'passgallery' | 'slickpic' | 'pixpa' | 'format' | 'squarespace' | 'adobe_portfolio' | 'fotomerchant' | 'photobiz' | 'wix'
          platform_gallery_id: string
          gallery_name: string
          gallery_description?: string | null
          gallery_url: string
          access_code?: string | null
          cover_image_url?: string | null
          photo_count: number
          session_date?: string | null
          is_imported?: boolean
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          consumer_id?: string | null
          platform?: 'pixieset' | 'shootproof' | 'smugmug' | 'pic_time' | 'cloudspot' | 'zenfolio' | 'lightfolio' | 'picflow' | 'samaro' | 'photoshelter' | 'passgallery' | 'slickpic' | 'pixpa' | 'format' | 'squarespace' | 'adobe_portfolio' | 'fotomerchant' | 'photobiz' | 'wix'
          platform_gallery_id?: string
          gallery_name?: string
          gallery_description?: string | null
          gallery_url?: string
          access_code?: string | null
          cover_image_url?: string | null
          photo_count?: number
          session_date?: string | null
          is_imported?: boolean
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          gallery_id: string
          platform_photo_id: string
          filename: string
          original_url: string
          thumbnail_url: string | null
          medium_url: string | null
          full_url: string | null
          file_size: number
          width: number
          height: number
          alt_text: string | null
          is_favorite: boolean
          download_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          platform_photo_id: string
          filename: string
          original_url: string
          thumbnail_url?: string | null
          medium_url?: string | null
          full_url?: string | null
          file_size: number
          width: number
          height: number
          alt_text?: string | null
          is_favorite?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          platform_photo_id?: string
          filename?: string
          original_url?: string
          thumbnail_url?: string | null
          medium_url?: string | null
          full_url?: string | null
          file_size?: number
          width?: number
          height?: number
          alt_text?: string | null
          is_favorite?: boolean
          download_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
