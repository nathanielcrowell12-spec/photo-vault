import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export async function GET(_req: NextRequest) {
  try {
    const manifestPath = resolve(process.cwd(), 'src/prompt/manifest.json')
    const promptPath = resolve(process.cwd(), 'src/prompt/PROMPT.md')

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as any
    const prompt = readFileSync(promptPath, 'utf8')

    return NextResponse.json({
      success: true,
      data: {
        version: manifest.version,
        hash: manifest.hash,
        updated_at: manifest.updated ?? manifest.updated_at,
        source: manifest.source ?? 'photovault',
        prompt
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read prompt',
        code: 'READ_ERROR',
        details: error?.message
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}


