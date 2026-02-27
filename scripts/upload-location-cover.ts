/**
 * One-time script to upload a location cover image to Supabase storage.
 * Usage: npx tsx scripts/upload-location-cover.ts <image-path> <location-slug>
 *
 * Uploads to gallery-photos bucket under directory/covers/<slug>.<ext>
 * Then updates the locations table cover_image_url.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const [imagePath, slug] = process.argv.slice(2)

if (!imagePath || !slug) {
  console.error('Usage: npx tsx scripts/upload-location-cover.ts <image-path> <location-slug>')
  process.exit(1)
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

  // Read the image file
  const fileBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).toLowerCase().replace('.', '')
  const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp'
  const storagePath = `directory/covers/${slug}.${ext}`

  console.log(`Uploading ${imagePath} → gallery-photos/${storagePath}`)

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gallery-photos')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload failed:', uploadError.message)
    process.exit(1)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('gallery-photos')
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl
  console.log(`Public URL: ${publicUrl}`)

  // Update the location record
  const { data: updateData, error: updateError } = await supabase
    .from('locations')
    .update({ cover_image_url: publicUrl })
    .eq('slug', slug)
    .select('name, cover_image_url')

  if (updateError) {
    console.error('DB update failed:', updateError.message)
    process.exit(1)
  }

  console.log(`Updated:`, updateData)
  console.log('Done!')
}

main()
