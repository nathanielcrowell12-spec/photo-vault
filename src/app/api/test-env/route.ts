import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl ? 'Present' : 'Missing',
    supabaseAnonKey: supabaseAnonKey ? 'Present' : 'Missing',
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
    keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'undefined'
  })
}
