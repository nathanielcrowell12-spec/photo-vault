import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { HEALTH_CHECK_TIMEOUT_MS, HEALTH_CHECK_QUERY_LIMIT } from '@/lib/api-constants'

/**
 * Health Check Endpoint
 * Implements MBP v4.3 requirement for health-check endpoints
 * Provides system status and basic diagnostics
 */

/**
 * Check Supabase database health
 */
async function checkSupabaseHealth(): Promise<string> {
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(HEALTH_CHECK_QUERY_LIMIT)
    return error ? 'error' : 'connected'
  } catch (error) {
    return 'error'
  }
}

/**
 * Check Helm Project connection health
 */
async function checkHelmProjectHealth(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_HELM_PROJECT_URL) {
    return 'not_configured'
  }
  
  try {
    const helmUrl = process.env.NEXT_PUBLIC_HELM_PROJECT_URL
    const response = await fetch(`${helmUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS)
    })
    return response.ok ? 'connected' : 'error'
  } catch (error) {
    return 'disconnected'
  }
}

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
    
    // Check service health
    const supabaseStatus = await checkSupabaseHealth()
    const helmStatus = await checkHelmProjectHealth()
    
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
