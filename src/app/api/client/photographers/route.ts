import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/client/photographers
 * Get all photographers that this client is associated with
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user type to verify they're a client
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (userProfile?.user_type !== 'client') {
      return NextResponse.json({ error: 'Only clients can access this endpoint' }, { status: 403 })
    }

    // Get ALL client records for this user (could be multiple if different photographers created them)
    // FK chain: auth.users.id -> clients.user_id -> clients.id
    const { data: clientRecords, error: clientLookupError } = await supabase
      .from('clients')
      .select('id, photographer_id')
      .eq('user_id', user.id)

    if (clientLookupError) {
      logger.error('[ClientPhotographers] Error fetching client records:', clientLookupError)
      return NextResponse.json({ photographers: [] })
    }

    if (!clientRecords || clientRecords.length === 0) {
      logger.warn('[ClientPhotographers] No client records found for user_id:', user.id)
      return NextResponse.json({ photographers: [] })
    }

    logger.info('[ClientPhotographers] Found client records:', {
      userId: user.id,
      clientCount: clientRecords.length,
      clientIds: clientRecords.map(c => c.id)
    })

    const clientIds = clientRecords.map(c => c.id)

    // Find photographers this client is associated with
    // Method 1: Through the clients table (photographers who created client records)
    const photographerIds = new Set<string>()
    clientRecords.forEach(client => {
      if (client.photographer_id) {
        photographerIds.add(client.photographer_id)
      }
    })

    // Method 2: Through galleries (find photographers who have galleries assigned to ANY of these client records)
    const { data: galleries, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('photographer_id')
      .in('client_id', clientIds)

    // Add photographer IDs from galleries
    galleries?.forEach((gallery) => {
      if (gallery.photographer_id) {
        photographerIds.add(gallery.photographer_id)
      }
    })

    // Get photographer details
    const { data: photographers, error: photographersError } = await supabase
      .from('photographers')
      .select(`
        id,
        user_profiles (
          id,
          full_name,
          business_name,
          profile_image_url
        )
      `)
      .in('id', Array.from(photographerIds))

    if (photographersError) {
      logger.error('[ClientPhotographers] Error fetching photographers:', photographersError)
      return NextResponse.json({ error: photographersError.message }, { status: 500 })
    }

    // Get emails from auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap = new Map()
    authUsers?.users.forEach((authUser: any) => {
      emailMap.set(authUser.id, authUser.email)
    })

    // Format the response
    const formattedPhotographers = photographers?.map((photographer: any) => ({
      id: photographer.id,
      name: photographer.user_profiles?.full_name || photographer.user_profiles?.business_name || emailMap.get(photographer.id) || 'Unknown Photographer',
      business_name: photographer.user_profiles?.business_name,
      full_name: photographer.user_profiles?.full_name,
      email: emailMap.get(photographer.id),
      profile_image_url: photographer.user_profiles?.profile_image_url,
    })) || []

    return NextResponse.json({ photographers: formattedPhotographers })
  } catch (error: any) {
    logger.error('[ClientPhotographers] Error in GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
