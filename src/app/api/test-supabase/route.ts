import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Test with hardcoded keys
    const supabaseUrl = 'https://gqmycgopitxpjkxzrnyv.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbXljZ29waXR4cGpleHpybnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTk2NjIsImV4cCI6MjA3NjU3NTY2Mn0.mUgIQ7V9CmquKalZduYTbD__1ETt-zfaHRZVp0xdwLQ'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    return NextResponse.json({
      success: !error,
      error: error?.message,
      data: data,
      connection: 'Supabase client created successfully',
      url: supabaseUrl,
      keyPreview: supabaseAnonKey.substring(0, 30) + '...'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      connection: 'Failed to create Supabase client'
    })
  }
}

