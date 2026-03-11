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
import { createBrowserClient } from '@supabase/ssr'

// Re-export createClient for use in other files
export { createClient }

// Lazy env access — this file may be imported client-side for types,
// so we must not throw at module scope for server-only vars.
function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} environment variable is required`)
  return value
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * DEPRECATED: Use createServerSupabaseClient from '@/lib/supabase-server' for server-side,
 * or supabaseBrowser from '@/lib/supabase-browser' for client-side.
 *
 * This export is used by many legacy components. On the server it uses the service role key
 * (bypasses RLS). In the browser it uses createBrowserClient which handles cookies/sessions
 * and respects RLS.
 */
const isBrowser = typeof window !== 'undefined'
export const supabase = isBrowser
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    })

/**
 * DEPRECATED: Use createServerSupabaseClient from '@/lib/supabase-server' instead.
 * Create a Supabase client for server-side operations with service role key.
 * This bypasses RLS - use with caution!
 */
export function createServerSupabaseClient() {
  return createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
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
