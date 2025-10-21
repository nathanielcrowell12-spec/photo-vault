import { createClient } from '@supabase/supabase-js'

// TEMPORARY TEST: Hardcoded values to bypass environment variables
const supabaseUrl = 'https://gqmycgopitxpjkxzrnyv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpleHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk2NjIsImV4cCI6MjA3NjU3NTY2Mn0.mUgIQ7V9CmquKalZduYTbD__1ETt-zfaHRZVp0xdwLQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'photovault-auth',
  }
})

/**
 * Create a Supabase client for server-side operations
 * Uses service role key for elevated permissions
 */
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
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
