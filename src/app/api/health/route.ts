import { NextRequest, NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 * Implements MBP v4.3 requirement for health-check endpoints
 * Provides system status and basic diagnostics
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Basic system checks
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    }
    
    // Check Supabase connection
    let supabaseStatus = 'unknown'
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('users').select('count').limit(1)
      supabaseStatus = error ? 'error' : 'connected'
    } catch (error) {
      supabaseStatus = 'error'
    }
    
    // Check Helm Project connection (if configured)
    let helmStatus = 'not_configured'
    if (process.env.NEXT_PUBLIC_HELM_PROJECT_URL) {
      try {
        const helmUrl = process.env.NEXT_PUBLIC_HELM_PROJECT_URL
        const response = await fetch(`${helmUrl}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        helmStatus = response.ok ? 'connected' : 'error'
      } catch (error) {
        helmStatus = 'disconnected'
      }
    }
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: 'healthy',
      timestamp: checks.timestamp,
      responseTime: `${responseTime}ms`,
      environment: checks.environment,
      version: checks.version,
      uptime: `${Math.floor(checks.uptime)}s`,
      services: {
        database: supabaseStatus,
        helmProject: helmStatus,
      },
      // Helm Signals (MBP v4.3 requirement)
      signals: {
        prompt_version: process.env.PROMPT_VERSION || '4.3',
        prompt_hash: process.env.PROMPT_HASH || 'not_set',
        tenant_id: 'photovault-hub',
        service: 'photovault-hub',
        timestamp: checks.timestamp,
      }
    }
    
    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'error',
        helmProject: 'error',
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
