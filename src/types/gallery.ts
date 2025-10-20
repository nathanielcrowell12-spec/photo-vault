export interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  cover_image_url?: string
  platform: string
  photographer_name?: string
  session_date?: string
  photo_count: number
  gallery_url?: string
  created_at: string
  user_id?: string
  client_id?: string
  metadata?: {
    location?: string
    people?: string[]
  }
}

export interface Client {
  id: string
  name: string
}
