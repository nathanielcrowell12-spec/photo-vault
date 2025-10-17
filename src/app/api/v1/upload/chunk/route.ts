import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get('chunk') as Blob
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const uploadId = formData.get('uploadId') as string
    const storagePath = formData.get('storagePath') as string

    if (!chunk || chunkIndex === undefined || !totalChunks || !uploadId || !storagePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await chunk.arrayBuffer())
    
    const chunkPath = `${storagePath}.part${chunkIndex}`
    
    const { error: uploadError } = await supabase.storage
      .from('gallery-imports')
      .upload(chunkPath, buffer, {
        upsert: true
      })

    if (uploadError) {
      console.error(`Error uploading chunk ${chunkIndex}:`, uploadError)
      return NextResponse.json(
        { error: `Failed to upload chunk ${chunkIndex}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      chunkIndex,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`
    })

  } catch (error) {
    console.error('Chunk upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

