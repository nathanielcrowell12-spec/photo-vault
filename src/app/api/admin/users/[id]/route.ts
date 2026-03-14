import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabase as supabaseServiceRole } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user from auth and their profile (cascade)
 * Admin-only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const authClient = await createServerSupabaseClient()

    // Auth check - must be admin
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseServiceRole
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if user has active subscriptions
    const { data: activeSubs } = await supabaseServiceRole
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])

    if (activeSubs && activeSubs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with active subscriptions. Cancel their subscriptions first.' },
        { status: 400 }
      )
    }

    // Delete from auth (cascades to user_profiles via FK)
    const { error: deleteError } = await supabaseServiceRole.auth.admin.deleteUser(userId)

    if (deleteError) {
      logger.error('[AdminUsers] Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    logger.info(`[AdminUsers] User ${userId} deleted by admin ${user.id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[AdminUsers] Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
