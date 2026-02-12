import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/conversations/contacts
 * Returns available contacts the authenticated user can message.
 * - Always includes admin users (labeled "PhotoVault Support")
 * - Clients also see their photographers
 * - Photographers also see their clients
 * - Secondary users only see admin (no messaging of other users)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const currentUserType = userProfile.user_type

    // Build email lookup map (with pagination to handle >50 users)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map<string, string>()
    authUsers?.users.forEach((authUser: any) => {
      emailMap.set(authUser.id, authUser.email)
    })

    // --- Always include admin users ---
    const { data: adminProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, business_name, user_type')
      .eq('user_type', 'admin')
      .neq('id', user.id) // Don't show yourself if you're admin

    const adminContacts = (adminProfiles || []).map(profile => ({
      id: profile.id,
      name: 'PhotoVault Support',
      email: emailMap.get(profile.id) || '',
      user_type: 'admin' as const,
      is_admin: true,
    }))

    // --- Role-specific contacts ---
    let roleContacts: Array<{
      id: string
      name: string
      email: string
      user_type: string
      is_admin: boolean
    }> = []

    if (currentUserType === 'client') {
      // Clients see their photographers
      const { data: clientRecords } = await supabase
        .from('clients')
        .select('id, photographer_id')
        .eq('user_id', user.id)

      if (clientRecords && clientRecords.length > 0) {
        const photographerIds = new Set<string>()
        clientRecords.forEach(client => {
          if (client.photographer_id) {
            photographerIds.add(client.photographer_id)
          }
        })

        // Also check galleries for additional photographer associations
        const clientIds = clientRecords.map(c => c.id)
        const { data: galleries } = await supabase
          .from('photo_galleries')
          .select('photographer_id')
          .in('client_id', clientIds)

        galleries?.forEach(gallery => {
          if (gallery.photographer_id) {
            photographerIds.add(gallery.photographer_id)
          }
        })

        if (photographerIds.size > 0) {
          const { data: photographers } = await supabase
            .from('photographers')
            .select(`
              id,
              user_profiles (
                id,
                full_name,
                business_name
              )
            `)
            .in('id', Array.from(photographerIds))

          roleContacts = (photographers || []).map((photographer: any) => ({
            id: photographer.id,
            name: photographer.user_profiles?.full_name
              || photographer.user_profiles?.business_name
              || emailMap.get(photographer.id)
              || 'Unknown Photographer',
            email: emailMap.get(photographer.id) || '',
            user_type: 'photographer',
            is_admin: false,
          }))
        }
      }
    } else if (currentUserType === 'photographer') {
      // Photographers see their clients
      const { data: clientRecords } = await supabase
        .from('clients')
        .select('user_id')
        .eq('photographer_id', user.id)
        .not('user_id', 'is', null)

      if (clientRecords && clientRecords.length > 0) {
        const clientUserIds = [...new Set(clientRecords.map(c => c.user_id).filter(Boolean))]

        if (clientUserIds.length > 0) {
          const { data: clientProfiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, business_name, user_type')
            .in('id', clientUserIds)

          roleContacts = (clientProfiles || []).map(profile => ({
            id: profile.id,
            name: profile.full_name || profile.business_name || emailMap.get(profile.id) || 'Unknown Client',
            email: emailMap.get(profile.id) || '',
            user_type: profile.user_type || 'client',
            is_admin: false,
          }))
        }
      }
    }
    // Secondary and admin users: only see admin contacts (already handled above)

    // Combine: admin first, then role contacts
    const contacts = [...adminContacts, ...roleContacts]

    logger.info('[Contacts] Returning contacts', {
      userId: user.id,
      userType: currentUserType,
      adminCount: adminContacts.length,
      roleContactCount: roleContacts.length,
    })

    return NextResponse.json({ contacts })
  } catch (error: any) {
    logger.error('[Contacts] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
