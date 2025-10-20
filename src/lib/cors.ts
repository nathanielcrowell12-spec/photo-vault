/**
 * CORS Configuration
 * Implements MBP v4.3 requirement for proper CORS configuration
 */

import { NextRequest, NextResponse } from 'next/server'

export interface CorsOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const defaultOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL || 'https://photovault-hub.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
}

export function corsHandler(options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return (request: NextRequest) => {
    const origin = request.headers.get('origin')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      
      // Set CORS headers
      if (origin && isOriginAllowed(origin, config.origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      if (config.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }
      
      if (config.methods) {
        response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
      }
      
      if (config.allowedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '))
      }
      
      if (config.maxAge) {
        response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
      }
      
      return response
    }
    
    return null
  }
}

export function addCorsHeaders(response: NextResponse, origin: string | null, options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options }
  
  if (origin && isOriginAllowed(origin, config.origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

function isOriginAllowed(origin: string, allowedOrigins: string | string[] | boolean): boolean {
  if (allowedOrigins === true) return true
  if (allowedOrigins === false) return false
  
  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins
  }
  
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin)
  }
  
  return false
}

// Pre-configured CORS handlers for common use cases
export const apiCors = corsHandler({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.NEXT_PUBLIC_APP_URL || 'https://photovault-hub.vercel.app']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

export const webhookCors = corsHandler({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://api.stripe.com', 'https://hooks.stripe.com']
    : true,
  methods: ['POST', 'OPTIONS'],
})
