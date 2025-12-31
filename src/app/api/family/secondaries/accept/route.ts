import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'

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
    let newAccountCreated = false // Track if we actually created a NEW auth user

    if (user) {
      // User is logged in - link their account
      secondaryUserId = user.id

      // Verify email matches (optional security check)
      const { data: userData } = await serviceSupabase.auth.admin.getUserById(user.id)
      if (userData?.user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        // Email mismatch - warn but allow (they might have multiple emails)
        logger.warn(`[Accept] Email mismatch: invitation for ${invitation.email}, logged in as ${userData?.user?.email}`)
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

      // No account exists in user_profiles - check if auth user exists
      logger.info(`[Accept] Checking for existing auth user: ${invitation.email}`)

      // First check if auth user already exists (they might have another account type)
      const { data: existingAuthUsers } = await serviceSupabase.auth.admin.listUsers()
      const existingAuthUser = existingAuthUsers?.users?.find(
        u => u.email?.toLowerCase() === invitation.email.toLowerCase()
      )

      if (existingAuthUser) {
        // Auth user exists - link their existing account as secondary
        logger.info(`[Accept] Found existing auth user ${existingAuthUser.id} for ${invitation.email}, linking as secondary`)
        secondaryUserId = existingAuthUser.id

        // Check if they have a user_profile, create one if not
        const { data: existingProfile } = await serviceSupabase
          .from('user_profiles')
          .select('id')
          .eq('id', existingAuthUser.id)
          .single()

        if (!existingProfile) {
          // Create user_profile for existing auth user (id is the user_id, references auth.users)
          await serviceSupabase
            .from('user_profiles')
            .insert({
              id: existingAuthUser.id,
              full_name: invitation.name || existingAuthUser.user_metadata?.full_name,
              user_type: 'secondary',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
      } else {
        // No auth user exists - CREATE a new secondary user account
        logger.info(`[Accept] Creating secondary user account for ${invitation.email}`)

        // Generate a temporary password
        const tempPassword = `Welcome${Math.random().toString(36).slice(-8)}!`

        // Create auth user
        const { data: authUser, error: createUserError } = await serviceSupabase.auth.admin.createUser({
          email: invitation.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email since they clicked the invite link
          user_metadata: {
            full_name: invitation.name,
            user_type: 'secondary',
            invited_by: invitation.account_id
          }
        })

        if (createUserError || !authUser.user) {
          logger.error('[Accept] Error creating user:', createUserError)
          return NextResponse.json(
            { error: 'Failed to create your account. Please try again.' },
            { status: 500 }
          )
        }

        secondaryUserId = authUser.user.id
        newAccountCreated = true // We actually created a new auth user

        // Create user_profile for the secondary (only id is required, it references auth.users)
        const { error: profileError } = await serviceSupabase
          .from('user_profiles')
          .insert({
            id: secondaryUserId,
            full_name: invitation.name,
            user_type: 'secondary',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          logger.error('[Accept] Error creating profile:', profileError)
          // Don't fail - auth user was created, profile can be fixed later
        }

        // Generate password reset link using generateLink (doesn't send email)
        // Then send via our Resend email service with proper PhotoVault branding
        const { data: linkData, error: linkError } = await serviceSupabase.auth.admin.generateLink({
          type: 'recovery',
          email: invitation.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`
          }
        })

        if (linkError || !linkData?.properties?.action_link) {
          logger.error('[Accept] Could not generate password reset link:', linkError)
          // Don't fail - they can use "Forgot Password" later
        } else {
          // Get primary's name for the email
          const { data: primaryProfileForEmail } = await serviceSupabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', invitation.account_id)
            .single()

          // Send welcome email via Resend with the password setup link
          const emailResult = await EmailService.sendSecondaryWelcomeEmail({
            secondaryName: invitation.name || 'there',
            secondaryEmail: invitation.email,
            primaryName: primaryProfileForEmail?.full_name || 'Your family member',
            relationship: invitation.relationship || 'family member',
            setPasswordLink: linkData.properties.action_link
          })

          if (emailResult.success) {
            logger.info(`[Accept] Welcome email with password link sent to ${invitation.email} via Resend`)
          } else {
            logger.warn(`[Accept] Failed to send welcome email via Resend: ${emailResult.error}`)
          }
        }

        logger.info(`[Accept] Created secondary user ${secondaryUserId} for ${invitation.email}`)
      }
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
      logger.error('[Accept] Update error:', updateError)
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

    // 6. Get shared galleries count (check user_id for client self-uploads)
    const { count: sharedGalleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', invitation.account_id)
      .eq('is_family_shared', true)

    // Use the tracked flag for whether we created a new account (vs linked existing)
    const accountCreated = newAccountCreated

    logger.info(`[Accept] Secondary ${invitation.email} accepted invitation for account ${invitation.account_id}${accountCreated ? ' (new account created)' : ' (existing account linked)'}`)

    return NextResponse.json({
      success: true,
      message: accountCreated
        ? 'Account created! Check your email to set your password.'
        : 'Invitation accepted successfully',
      accountCreated,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        primaryName: primaryProfile?.full_name || 'PhotoVault User',
        relationship: invitation.relationship,
        sharedGalleryCount: sharedGalleryCount || 0
      },
      isLinked: !!secondaryUserId,
      redirectUrl: accountCreated
        ? '/login' // New users need to log in after setting password
        : '/family/galleries'
    })

  } catch (error) {
    logger.error('[Accept] Error:', error)
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
    logger.error('[Accept GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

