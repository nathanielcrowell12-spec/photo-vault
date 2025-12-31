import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { LeaderboardEntry, LeaderboardResponse } from '@/types/admin'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest): Promise<NextResponse<LeaderboardResponse>> {
  const supabase = createServiceRoleClient()

  // Get query params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'all' // month, year, all

  try {
    // Build date filters
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (period === 'month') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    } else if (period === 'year') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))
    }

    // Build query for commissions
    let query = supabase
      .from('commissions')
      .select('photographer_id, photovault_commission_cents, amount_cents')
      .eq('status', 'paid')

    // Apply date filters
    if (startDate && endDate) {
      query = query
        .gte('paid_at', startDate.toISOString())
        .lte('paid_at', endDate.toISOString())
    }

    const { data: commissions, error } = await query

    if (error) throw error

    // Aggregate by photographer
    const photographerStats = new Map<string, {
      photovaultRevenue: number
      photographerEarnings: number
      transactionCount: number
    }>()

    for (const comm of commissions || []) {
      if (comm.photographer_id) {
        const current = photographerStats.get(comm.photographer_id) || {
          photovaultRevenue: 0,
          photographerEarnings: 0,
          transactionCount: 0,
        }
        photographerStats.set(comm.photographer_id, {
          photovaultRevenue: current.photovaultRevenue + (comm.photovault_commission_cents || 0),
          photographerEarnings: current.photographerEarnings + (comm.amount_cents || 0),
          transactionCount: current.transactionCount + 1,
        })
      }
    }

    // Sort by PhotoVault revenue (what they generate for us) and get all
    const sortedPhotographers = Array.from(photographerStats.entries())
      .sort((a, b) => b[1].photovaultRevenue - a[1].photovaultRevenue)

    // Fetch photographer details for all
    const photographerIds = sortedPhotographers.map(([id]) => id)

    // Get names
    const photographerNames = new Map<string, string>()
    if (photographerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, business_name, full_name')
        .in('id', photographerIds)

      profiles?.forEach((p) => {
        photographerNames.set(p.id, p.business_name || p.full_name || 'Unknown')
      })
    }

    // Get gallery counts
    const galleryCounts = new Map<string, number>()
    if (photographerIds.length > 0) {
      const { data: galleries } = await supabase
        .from('photo_galleries')
        .select('photographer_id')
        .in('photographer_id', photographerIds)

      // Count galleries per photographer
      for (const gallery of galleries || []) {
        const current = galleryCounts.get(gallery.photographer_id) || 0
        galleryCounts.set(gallery.photographer_id, current + 1)
      }
    }

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = sortedPhotographers.map(([photographerId, stats], index) => ({
      rank: index + 1,
      photographerId,
      photographerName: photographerNames.get(photographerId) || 'Unknown',
      galleryCount: galleryCounts.get(photographerId) || 0,
      photovaultRevenueCents: stats.photovaultRevenue,
      photographerEarningsCents: stats.photographerEarnings,
      transactionCount: stats.transactionCount,
    }))

    // Get period label
    const periodLabel = period === 'month'
      ? now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : period === 'year'
      ? now.getFullYear().toString()
      : 'All Time'

    return NextResponse.json({
      success: true,
      data: {
        entries,
        period: periodLabel,
      },
    })
  } catch (error) {
    logger.error('[AdminLeaderboard] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
