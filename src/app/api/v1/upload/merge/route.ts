import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { storagePath, totalChunks } = await request.json()

    if (!storagePath || !totalChunks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Download all chunks and combine them
    const chunks: Buffer[] = []
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${storagePath}.part${i}`
      
      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('gallery-imports')
        .download(chunkPath)

      if (downloadError || !chunkData) {
        logger.error(`[UploadMerge] Error downloading chunk ${i}:`, downloadError)
        return NextResponse.json(
          { error: `Failed to download chunk ${i}` },
          { status: 500 }
        )
      }

      chunks.push(Buffer.from(await chunkData.arrayBuffer()))
    }

    // Combine all chunks into one buffer
    const completeFile = Buffer.concat(chunks)

    // Upload the complete file
    const { error: uploadError } = await supabase.storage
      .from('gallery-imports')
      .upload(storagePath, completeFile, {
        upsert: true
      })

    if (uploadError) {
      logger.error('[UploadMerge] Error uploading merged file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload merged file' },
        { status: 500 }
      )
    }

    // Clean up chunk files
    const filesToRemove = []
    for (let i = 0; i < totalChunks; i++) {
      filesToRemove.push(`${storagePath}.part${i}`)
    }

    await supabase.storage
      .from('gallery-imports')
      .remove(filesToRemove)

    return NextResponse.json({
      success: true,
      storagePath,
      message: 'File merged successfully'
    })

  } catch (error) {
    logger.error('[UploadMerge] Merge error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

