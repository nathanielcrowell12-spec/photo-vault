import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const version = {
      app: 'PhotoVault Hub',
      version: process.env.npm_package_version || '1.0.0',
      build: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }

    return NextResponse.json(version, { status: 200 })
  } catch (error) {
    console.error('Version check failed:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to get version information',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
