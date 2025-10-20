import { NextRequest, NextResponse } from 'next/server'
import { helmClient } from '@/lib/helm-client'
import { supabase } from '@/lib/supabase'
import { 
  DEFAULT_UPTIME_PERCENTAGE, 
  DEFAULT_RESPONSE_TIME_MS, 
  MAX_PHOTOS_THRESHOLD,
  ERROR_CODES 
} from '@/lib/api-constants'

/**
 * Send Photo Vault metrics to Helm Project
 * This endpoint collects Photo Vault data and sends it to the Mission Control dashboard
 */
export async function POST(_request: NextRequest) {
  try {
    // Collect Photo Vault metrics
    const metrics = await collectPhotoVaultMetrics()
    
    // Send metrics to Helm Project
    await helmClient.sendPhotoVaultMetrics(metrics)
    
    // Send health status to Helm Project
    await helmClient.sendHealthStatus({
      service: 'photovault',
      status: 'healthy',
      uptime: DEFAULT_UPTIME_PERCENTAGE,
      response_time: DEFAULT_RESPONSE_TIME_MS
    })

    return NextResponse.json({
      success: true,
      message: 'Metrics sent to Helm Project successfully',
      metrics
    })

  } catch (error) {
    console.error('Failed to send metrics to Helm Project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to send metrics to Helm Project',
        details: errorMessage,
        code: ERROR_CODES.HELM_METRICS_SEND_FAILED
      },
      { status: 500 }
    )
  }
}

/**
 * Get Photo Vault metrics for Helm Project
 */
export async function GET() {
  try {
    const metrics = await collectPhotoVaultMetrics()
    
    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('Failed to collect Photo Vault metrics:', error)
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    )
  }
}

/**
 * Collect comprehensive Photo Vault metrics
 */
async function collectPhotoVaultMetrics() {
  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: photographers } = await supabase
      .from('photographers')
      .select('*', { count: 'exact', head: true })

    // Get gallery counts
    const { count: totalGalleries } = await supabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })

    // Get photo counts
    const { count: totalPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })

    // Get revenue data
    const { data: revenueData } = await supabase
      .from('commission_payments')
      .select('commission_amount')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.commission_amount, 0) || 0

    // Calculate system load (mock calculation)
    const systemLoad = Math.min(100, (totalPhotos || 0) / MAX_PHOTOS_THRESHOLD * 100)

    return {
      revenue: totalRevenue,
      activeUsers: totalUsers || 0,
      photographers: photographers || 0,
      galleriesCount: totalGalleries || 0,
      photosCount: totalPhotos || 0,
      systemLoad: Math.round(systemLoad),
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error collecting Photo Vault metrics:', error)
    throw error
  }
}
