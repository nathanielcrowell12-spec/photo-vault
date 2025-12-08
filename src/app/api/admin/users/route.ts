import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch auth users (contains real email addresses)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 200,
    })

    if (authError) {
      console.error('[api/admin/users] Auth error:', authError)
      throw authError
    }

    // Create a map of user ID -> email from auth data
    const emailMap = new Map<string, string>()
    for (const authUser of authData?.users ?? []) {
      emailMap.set(authUser.id, authUser.email ?? '')
    }

    // Fetch user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (profileError) {
      throw profileError
    }

    // Merge emails from auth into profiles
    const usersWithEmails = (profiles ?? []).map((profile) => ({
      ...profile,
      email: emailMap.get(profile.id) || profile.email || '',
    }))

    return NextResponse.json({
      success: true,
      data: usersWithEmails,
    })
  } catch (error) {
    console.error('[api/admin/users] Failed to fetch users', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      },
      { status: 500 },
    )
  }
}

