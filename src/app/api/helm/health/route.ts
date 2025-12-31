import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Check if Helm Project is available on localhost:3001
    const helmUrl = process.env.NEXT_PUBLIC_HELM_PROJECT_URL || 'http://localhost:3001'
    
    const response = await fetch(`${helmUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'connected',
        helmProject: data,
        message: 'Helm Project is running and accessible'
      })
    } else {
      return NextResponse.json({
        status: 'error',
        message: `Helm Project responded with status ${response.status}`,
        helmUrl
      }, { status: response.status })
    }
  } catch (error) {
    logger.error('[HelmHealth] Helm Project health check failed:', error)
    return NextResponse.json({
      status: 'disconnected',
      message: `Helm Project is not available: ${error instanceof Error ? error.message : 'Unknown error'}`,
      helmUrl: process.env.NEXT_PUBLIC_HELM_PROJECT_URL || 'http://localhost:3001'
    }, { status: 503 })
  }
}
