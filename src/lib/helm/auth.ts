import { NextRequest, NextResponse } from 'next/server'
import { HelmApiErrorResponse, HelmErrorCode } from './types'

/**
 * Verify Helm API authorization
 * Uses x-helm-api-key header per Helm spec
 * Returns null if authorized, NextResponse with error if not
 */
export function verifyHelmAuth(request: NextRequest): NextResponse<HelmApiErrorResponse> | null {
  const apiKey = request.headers.get('x-helm-api-key')
  const expectedKey = process.env.HELM_API_KEY

  // Check if HELM_API_KEY is configured
  if (!expectedKey) {
    console.error('[HelmAuth] HELM_API_KEY environment variable not configured')
    return NextResponse.json(
      { error: 'Server configuration error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  // Check if x-helm-api-key header is present
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Verify API key value
  if (apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  return null // Authorized
}

/**
 * Create error response matching Helm's expected format
 */
export function helmErrorResponse(
  error: string,
  status: number = 500,
  code?: HelmErrorCode
): NextResponse<HelmApiErrorResponse> {
  // Infer error code from status if not provided
  const errorCode: HelmErrorCode = code || (
    status === 400 ? 'MISSING_PARAMETER' :
    status === 401 ? 'UNAUTHORIZED' :
    status === 404 ? 'NO_DATA' :
    'INTERNAL_ERROR'
  )

  return NextResponse.json({ error, code: errorCode }, { status })
}
