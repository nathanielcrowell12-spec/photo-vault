import { NextRequest, NextResponse } from 'next/server'
import { forceUpdateLogos } from '@/lib/competitor-logos'

// This endpoint can be called by a cron service like Vercel Cron, GitHub Actions, or external cron services
// Example cron expression for every 2 months: 0 0 1 */2 * (1st day of every 2nd month)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting automatic competitor logo update...')
    
    const logos = await forceUpdateLogos()
    
    console.log('✅ Automatic competitor logo update completed successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Competitor logos updated automatically',
      logosCount: logos.length,
      updatedAt: new Date().toISOString(),
      logos: logos.map(logo => ({
        id: logo.id,
        name: logo.name,
        lastUpdated: logo.lastUpdated
      }))
    })
  } catch (error) {
    console.error('❌ Error in automatic logo update:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update competitor logos automatically',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
