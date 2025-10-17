import { NextRequest, NextResponse } from 'next/server'
import { getCompetitorLogos, forceUpdateLogos } from '@/lib/competitor-logos'

// GET /api/competitor-logos - Get competitor logos (with auto-update check)
export async function GET() {
  try {
    const logos = await getCompetitorLogos()
    return NextResponse.json({ 
      success: true, 
      logos,
      message: 'Competitor logos retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching competitor logos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch competitor logos',
        logos: []
      },
      { status: 500 }
    )
  }
}

// POST /api/competitor-logos - Force update competitor logos (admin only)
export async function POST(request: NextRequest) {
  try {
    // In a real implementation, you'd check for admin authentication here
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const logos = await forceUpdateLogos()
    return NextResponse.json({ 
      success: true, 
      logos,
      message: 'Competitor logos updated successfully',
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating competitor logos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update competitor logos'
      },
      { status: 500 }
    )
  }
}
