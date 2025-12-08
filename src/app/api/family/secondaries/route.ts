import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'
import { EmailService } from '@/lib/email/email-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/family/secondaries
 * Invite a new secondary (family member) to the account
 * 
 * Body: { email: string, name: string, relationship: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { email, name, relationship } = body

    // Validate required fields
    if (!email || !name || !relationship) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, relationship' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate relationship
    const validRelationships = ['spouse', 'child', 'parent', 'sibling', 'other']
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: `Invalid relationship. Must be one of: ${validRelationships.join(', ')}` },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // 3. Check user has family sharing enabled
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('family_sharing_enabled, max_secondaries, user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.family_sharing_enabled) {
      return NextResponse.json(
        { error: 'Family sharing is not enabled. Enable it first.' },
        { status: 400 }
      )
    }

    // 4. Check secondary limit
    const { count: currentCount } = await serviceSupabase
      .from('secondaries')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', user.id)
      .in('status', ['pending', 'accepted'])

    const maxSecondaries = profile.max_secondaries || 5
    if ((currentCount || 0) >= maxSecondaries) {
      return NextResponse.json(
        { error: `You've reached the maximum of ${maxSecondaries} secondaries` },
        { status: 400 }
      )
    }

    // 5. Check if this email is already a secondary
    const { data: existing } = await serviceSupabase
      .from('secondaries')
      .select('id, status')
      .eq('account_id', user.id)
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.status === 'revoked') {
        // Re-invite revoked secondary
        const invitationToken = nanoid(32)
        
        const { error: updateError } = await serviceSupabase
          .from('secondaries')
          .update({
            name,
            relationship,
            invitation_token: invitationToken,
            status: 'pending',
            invited_at: new Date().toISOString(),
            accepted_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('[Secondaries] Re-invite error:', updateError)
          return NextResponse.json(
            { error: 'Failed to re-invite secondary' },
            { status: 500 }
          )
        }

        // Get primary's name for email
        const { data: primaryProfile } = await serviceSupabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        // Send invitation email
        await EmailService.sendSecondaryInvitationEmail({
          secondaryName: name,
          secondaryEmail: email.toLowerCase(),
          primaryName: primaryProfile?.full_name || 'A PhotoVault user',
          relationship,
          invitationToken,
        })

        console.log(`[Secondaries] Re-invited ${email} as secondary for user ${user.id}`)

        return NextResponse.json({
          success: true,
          message: 'Secondary re-invited successfully',
          secondary_id: existing.id
        })
      }

      return NextResponse.json(
        { error: 'This email is already a secondary on your account' },
        { status: 400 }
      )
    }

    // 6. Create new secondary record
    const invitationToken = nanoid(32)

    const { data: newSecondary, error: insertError } = await serviceSupabase
      .from('secondaries')
      .insert({
        account_id: user.id,
        email: email.toLowerCase(),
        name,
        relationship,
        invitation_token: invitationToken,
        status: 'pending',
        invited_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[Secondaries] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create secondary invitation' },
        { status: 500 }
      )
    }

    // Get primary's name for email
    const { data: primaryProfile } = await serviceSupabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Send invitation email
    await EmailService.sendSecondaryInvitationEmail({
      secondaryName: name,
      secondaryEmail: email.toLowerCase(),
      primaryName: primaryProfile?.full_name || 'A PhotoVault user',
      relationship,
      invitationToken,
    })

    console.log(`[Secondaries] Invited ${email} as secondary for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      secondary_id: newSecondary.id
    })

  } catch (error) {
    console.error('[Secondaries POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/family/secondaries
 * List all secondaries for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: secondaries, error } = await serviceSupabase
      .from('secondaries')
      .select(`
        id,
        email,
        name,
        relationship,
        status,
        has_payment_method,
        is_billing_payer,
        invited_at,
        accepted_at,
        secondary_user_id
      `)
      .eq('account_id', user.id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Secondaries GET] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch secondaries' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      secondaries: secondaries || []
    })

  } catch (error) {
    console.error('[Secondaries GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/family/secondaries
 * Remove a secondary from the account
 * 
 * Query: ?id=<secondary_id>
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const secondaryId = searchParams.get('id')

    if (!secondaryId) {
      return NextResponse.json(
        { error: 'Missing secondary ID' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Verify the secondary belongs to this user's account
    const { data: secondary, error: fetchError } = await serviceSupabase
      .from('secondaries')
      .select('id, account_id, is_billing_payer')
      .eq('id', secondaryId)
      .single()

    if (fetchError || !secondary) {
      return NextResponse.json(
        { error: 'Secondary not found' },
        { status: 404 }
      )
    }

    if (secondary.account_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only remove secondaries from your own account' },
        { status: 403 }
      )
    }

    // Prevent removing the billing payer (they need to transfer billing first)
    if (secondary.is_billing_payer) {
      return NextResponse.json(
        { error: 'Cannot remove secondary who is currently paying the bills. Transfer billing first.' },
        { status: 400 }
      )
    }

    // Soft delete by setting status to 'revoked'
    const { error: updateError } = await serviceSupabase
      .from('secondaries')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', secondaryId)

    if (updateError) {
      console.error('[Secondaries DELETE] Error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove secondary' },
        { status: 500 }
      )
    }

    console.log(`[Secondaries] Removed secondary ${secondaryId} from user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Secondary removed successfully'
    })

  } catch (error) {
    console.error('[Secondaries DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

