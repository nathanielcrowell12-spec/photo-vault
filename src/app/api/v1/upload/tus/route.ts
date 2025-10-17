import { Server } from '@tus/server'
import { FileStore } from '@tus/file-store'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads', 'tus-temp')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Create tus server instance
const tusServer = new Server({
  path: '/api/v1/upload/tus',
  datastore: new FileStore({ directory: uploadDir }),
  // Allow large files - up to 10GB
  maxSize: 10 * 1024 * 1024 * 1024,
  respectForwardedHeaders: true,
})

// Hook: When upload is complete, process the ZIP
tusServer.on('POST_FINISH', async (req: any, res: any, upload: any) => {
  console.log('[TUS] Upload completed:', upload.id)
  
  try {
    // Get file path
    const filePath = path.join(uploadDir, upload.id)
    
    // Extract metadata from upload
    const metadata = upload.metadata
    const userId = metadata?.userId
    const galleryName = metadata?.galleryName
    const platform = metadata?.platform || 'ZIP Upload'
    
    console.log('[TUS] Processing file for user:', userId)
    console.log('[TUS] File path:', filePath)
    console.log('[TUS] Metadata:', metadata)
    
    // TODO: Move file to Supabase and process ZIP
    // For now, just log success
    console.log('[TUS] File ready for processing')
    
  } catch (error) {
    console.error('[TUS] Error in POST_FINISH hook:', error)
  }
})

// Handle all HTTP methods for TUS protocol
export async function GET(request: NextRequest) {
  return handleTusRequest(request)
}

export async function POST(request: NextRequest) {
  return handleTusRequest(request)
}

export async function PATCH(request: NextRequest) {
  return handleTusRequest(request)
}

export async function DELETE(request: NextRequest) {
  return handleTusRequest(request)
}

export async function HEAD(request: NextRequest) {
  return handleTusRequest(request)
}

export async function OPTIONS(request: NextRequest) {
  return handleTusRequest(request)
}

async function handleTusRequest(request: NextRequest) {
  console.log(`[TUS] ${request.method} request to ${request.url}`)
  
  return new Promise<NextResponse>((resolve) => {
    // Convert Next.js request to Node.js-like request for tus
    const url = new URL(request.url)
    const req: any = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      on: (event: string, handler: any) => {
        // Handle request events if needed
      },
    }

    // Handle request body for POST/PATCH
    if (request.body && (request.method === 'POST' || request.method === 'PATCH')) {
      const reader = request.body.getReader()
      const chunks: Uint8Array[] = []
      
      const readStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            // Convert chunks to Buffer and attach to request
            const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)))
            req.body = buffer
            
            // Create a readable stream from the buffer
            const { Readable } = require('stream')
            const stream = Readable.from(buffer)
            Object.assign(req, stream)
            
            handleRequest()
            return
          }
          if (value) {
            chunks.push(value)
          }
          readStream()
        }).catch((error) => {
          console.error('[TUS] Error reading request body:', error)
          resolve(NextResponse.json({ error: 'Failed to read request body' }, { status: 500 }))
        })
      }
      
      readStream()
    } else {
      handleRequest()
    }

    function handleRequest() {
      const res: any = {
        statusCode: 200,
        headers: {} as Record<string, string>,
        body: [] as Buffer[],
        
        setHeader: (key: string, value: string | number) => {
          res.headers[key] = String(value)
        },
        
        getHeader: (key: string) => res.headers[key],
        
        removeHeader: (key: string) => {
          delete res.headers[key]
        },
        
        writeHead: (status: number, headers?: Record<string, string>) => {
          res.statusCode = status
          if (headers) {
            Object.assign(res.headers, headers)
          }
        },
        
        write: (data: any) => {
          if (data) {
            res.body.push(Buffer.from(data))
          }
        },
        
        end: (data?: any) => {
          if (data) {
            res.body.push(Buffer.from(data))
          }
          
          const responseBody = res.body.length > 0 ? Buffer.concat(res.body) : undefined
          
          console.log(`[TUS] Response: ${res.statusCode} with ${res.body.length} chunks`)
          
          resolve(new NextResponse(responseBody, {
            status: res.statusCode,
            headers: res.headers,
          }))
        },
      }

      try {
        tusServer.handle(req, res)
      } catch (error) {
        console.error('[TUS] Error handling request:', error)
        resolve(NextResponse.json({ 
          error: 'TUS server error',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 }))
      }
    }
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300,
}

