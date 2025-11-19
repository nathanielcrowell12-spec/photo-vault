import { NextRequest, NextResponse } from 'next/server'
import { generateRandomId } from '@/lib/api-constants'
import { createClient } from '@supabase/supabase-js'

// Runtime configuration for upload handling
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large uploads

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Store upload sessions in memory (in production, use Redis or database)
const uploadSessions = new Map<string, {
  userId: string
  galleryId: string
  fileName: string
  fileSize: number
  totalChunks: number
  uploadedChunks: number
  chunks: Map<number, string> // chunk index -> storage path
  createdAt: number
}>()

export async function POST(request: NextRequest) {
  try {
    // Check if this is a FormData request (upload_chunk) or JSON request
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // This is an upload_chunk request
      const formData = await request.formData()
      const action = formData.get('action') as string
      const sessionId = formData.get('sessionId') as string
      const chunkIndex = parseInt(formData.get('chunkIndex') as string)
      const totalChunks = parseInt(formData.get('totalChunks') as string)
      
      if (action === 'upload_chunk') {
        // Pass the FormData directly instead of the request
        return await uploadChunk({ sessionId, chunkIndex, totalChunks, formData })
      } else {
        return NextResponse.json({ error: 'Invalid action for FormData request' }, { status: 400 })
      }
    } else {
      // This is a JSON request
      const { action, sessionId, chunkIndex, totalChunks, fileName, fileSize, userId, galleryName, platform } = await request.json()

      switch (action) {
        case 'initiate':
          return await initiateUpload({ fileName, fileSize, totalChunks, userId, galleryName, platform })
        
        case 'complete':
          return await completeUpload({ sessionId })
        
        case 'status':
          return await getUploadStatus({ sessionId })
        
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Chunked upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface UploadParams {
  fileName: string
  fileSize: number
  totalChunks: number
  userId: string
  galleryName: string
  platform: string
}

async function initiateUpload({ fileName, fileSize, totalChunks, userId, galleryName, platform }: UploadParams) {
  // Create gallery record
  const { data: gallery, error: galleryError } = await supabase
    .from('photo_galleries')
    .insert({
      user_id: userId,
      gallery_name: galleryName,
      gallery_description: `Imported from ${platform} ZIP file (chunked upload)`,
      platform: platform || 'ZIP Upload',
      photo_count: 0,
      is_imported: false,
      cover_image_url: '/images/placeholder-family.svg',
      import_started_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (galleryError || !gallery) {
    return NextResponse.json({ error: 'Failed to create gallery record' }, { status: 500 })
  }

  // Create upload session
  const sessionId = `${userId}-${Date.now()}-${generateRandomId()}`
  
  uploadSessions.set(sessionId, {
    userId,
    galleryId: gallery.id,
    fileName,
    fileSize,
    totalChunks,
    uploadedChunks: 0,
    chunks: new Map(),
    createdAt: Date.now()
  })

  return NextResponse.json({
    sessionId,
    galleryId: gallery.id,
    chunkSize: Math.ceil(fileSize / totalChunks)
  })
}

interface ChunkUploadParams {
  sessionId: string
  chunkIndex: number
  totalChunks: number
  formData: FormData
}

async function uploadChunk({ sessionId, chunkIndex, totalChunks, formData }: ChunkUploadParams) {
  console.log(`[CHUNK UPLOAD] Starting chunk ${chunkIndex} for session ${sessionId}`)
  
  const session = uploadSessions.get(sessionId)
  if (!session) {
    console.error(`[CHUNK UPLOAD] Session not found: ${sessionId}`)
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
  }

  try {
    // Get chunk data from FormData (already parsed)
    const chunkFile = formData.get('chunk') as File
    
    console.log(`[CHUNK UPLOAD] Chunk file received:`, {
      name: chunkFile?.name,
      size: chunkFile?.size,
      type: chunkFile?.type
    })
    
    if (!chunkFile) {
      console.error(`[CHUNK UPLOAD] No chunk data received`)
      return NextResponse.json({ error: 'No chunk data received' }, { status: 400 })
    }
    
    // Generate unique path for this chunk
    const chunkPath = `temp-chunks/${session.userId}/${session.galleryId}/chunk-${chunkIndex}`
    
    console.log(`[CHUNK UPLOAD] Uploading to path: ${chunkPath}`)
    
    // Upload chunk to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(chunkPath, chunkFile, {
        contentType: 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error(`[CHUNK UPLOAD] Failed to upload chunk ${chunkIndex}:`, uploadError)
      return NextResponse.json({ error: `Failed to upload chunk ${chunkIndex}: ${uploadError.message}` }, { status: 500 })
    }
    
    console.log(`[CHUNK UPLOAD] Successfully uploaded chunk ${chunkIndex}`)

    // Store chunk info
    session.chunks.set(chunkIndex, chunkPath)
    session.uploadedChunks++

    // Clean up old sessions (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [id, sess] of uploadSessions.entries()) {
      if (sess.createdAt < oneHourAgo) {
        uploadSessions.delete(id)
      }
    }

    return NextResponse.json({
      success: true,
      uploadedChunks: session.uploadedChunks,
      totalChunks: session.totalChunks,
      progress: Math.round((session.uploadedChunks / session.totalChunks) * 100)
    })

  } catch (error) {
    console.error(`Error uploading chunk ${chunkIndex}:`, error)
    return NextResponse.json({ error: `Failed to upload chunk ${chunkIndex}` }, { status: 500 })
  }
}

async function completeUpload({ sessionId }: { sessionId: string }) {
  const session = uploadSessions.get(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
  }

  if (session.uploadedChunks !== session.totalChunks) {
    return NextResponse.json({ error: 'Not all chunks uploaded' }, { status: 400 })
  }

  try {
    // Download all chunks and reassemble
    const chunks: Buffer[] = []
    
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = session.chunks.get(i)
      if (!chunkPath) {
        throw new Error(`Missing chunk ${i}`)
      }

      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('photos')
        .download(chunkPath)

      if (downloadError || !chunkData) {
        throw new Error(`Failed to download chunk ${i}`)
      }

      const chunkBuffer = Buffer.from(await chunkData.arrayBuffer())
      chunks.push(chunkBuffer)
    }

    // Reassemble the file
    const completeFile = Buffer.concat(chunks)
    
    // Upload complete file to final location
    const finalPath = `temp-uploads/${session.userId}/${session.galleryId}/${session.fileName}`
    const { error: finalUploadError } = await supabase.storage
      .from('photos')
      .upload(finalPath, completeFile, {
        contentType: 'application/zip',
        cacheControl: '3600',
        upsert: false
      })

    if (finalUploadError) {
      throw new Error('Failed to upload complete file')
    }

    // Clean up chunks
    const chunkPaths = Array.from(session.chunks.values())
    await supabase.storage
      .from('photos')
      .remove(chunkPaths)

    // Clean up session
    uploadSessions.delete(sessionId)

    return NextResponse.json({
      success: true,
      finalPath,
      galleryId: session.galleryId
    })

  } catch (error) {
    console.error('Error completing upload:', error)
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 })
  }
}

async function getUploadStatus({ sessionId }: { sessionId: string }) {
  const session = uploadSessions.get(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
  }

  return NextResponse.json({
    uploadedChunks: session.uploadedChunks,
    totalChunks: session.totalChunks,
    progress: Math.round((session.uploadedChunks / session.totalChunks) * 100),
    fileName: session.fileName
  })
}
