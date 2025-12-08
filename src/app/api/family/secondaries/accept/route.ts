import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/family/secondaries/accept
 * Accept a secondary invitation via magic link token
 * 
 * Body: { token: string, createAccount?: boolean, password?: string }
 * 
 * Two flows:
 * 1. User already logged in → link their account as secondary
 * 2. User not logged in → can access via magic link or create account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // 1. Find the invitation by token
    const { data: invitation, error: inviteError } = await serviceSupabase
      .from('secondaries')
      .select(`
        id,
        account_id,
        email,
        name,
        relationship,
        status,
        secondary_user_id
      `)
      .eq('invitation_token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // 2. Check invitation status
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { error: 'This invitation has been revoked' },
        { status: 400 }
      )
    }

    // 3. Check if user is authenticated
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    let secondaryUserId = invitation.secondary_user_id

    if (user) {
      // User is logged in - link their account
      secondaryUserId = user.id

      // Verify email matches (optional security check)
      const { data: userData } = await serviceSupabase.auth.admin.getUserById(user.id)
      if (userData?.user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        // Email mismatch - warn but allow (they might have multiple emails)
        console.warn(`[Accept] Email mismatch: invitation for ${invitation.email}, logged in as ${userData?.user?.email}`)
      }
    } else {
      // User not logged in - check if account exists with this email
      const { data: existingUser } = await serviceSupabase
        .from('user_profiles')
        .select('id')
        .eq('email', invitation.email.toLowerCase())
        .single()

      if (existingUser) {
        // Account exists but not logged in
        return NextResponse.json({
          success: false,
          requiresLogin: true,
          email: invitation.email,
          message: 'Please log in to accept this invitation'
        })
      }

      // No account exists - they can view without account (magic link access)
      // But for full features, they should create an account
    }

    // 4. Accept the invitation
    const { error: updateError } = await serviceSupabase
      .from('secondaries')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        secondary_user_id: secondaryUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('[Accept] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      )
    }

    // 5. Get primary account holder's name for response
    const { data: primaryProfile } = await serviceSupabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', invitation.account_id)
      .single()

    // 6. Get shared galleries count
    const { count: sharedGalleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', invitation.account_id)
      .eq('is_family_shared', true)

    console.log(`[Accept] Secondary ${invitation.email} accepted invitation for account ${invitation.account_id}`)

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      invitation: {
        id: invitation.id,
        primaryName: primaryProfile?.full_name || 'PhotoVault User',
        relationship: invitation.relationship,
        sharedGalleryCount: sharedGalleryCount || 0
      },
      isLinked: !!secondaryUserId,
      redirectUrl: secondaryUserId 
        ? '/family/galleries' 
        : `/family/galleries?token=${token}` // Magic link access
    })

  } catch (error) {
    console.error('[Accept] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/family/secondaries/accept
 * Validate an invitation token and get invitation details (for the accept page)
 * 
 * Query: ?token=<invitation_token>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Find invitation
    const { data: invitation, error } = await serviceSupabase
      .from('secondaries')
      .select(`
        id,
        account_id,
        email,
        name,
        relationship,
        status,
        invited_at
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check status
    if (invitation.status !== 'pending') {
      return NextResponse.json({
        valid: false,
        status: invitation.status,
        error: invitation.status === 'accepted' 
          ? 'This invitation has already been accepted'
          : 'This invitation is no longer valid'
      })
    }

    // Get primary's info
    const { data: primaryProfile } = await serviceSupabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', invitation.account_id)
      .single()

    // Get shared gallery count
    const { count: sharedGalleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', invitation.account_id)
      .eq('is_family_shared', true)

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        relationship: invitation.relationship,
        primaryName: primaryProfile?.full_name || 'PhotoVault User',
        sharedGalleryCount: sharedGalleryCount || 0,
        invitedAt: invitation.invited_at
      }
    })

  } catch (error) {
    console.error('[Accept GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

