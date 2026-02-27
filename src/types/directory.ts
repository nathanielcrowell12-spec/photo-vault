// Directory feature type definitions

export interface Location {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  state: string
  country: string
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface LocationAttribute {
  id: string
  location_id: string
  attribute_type: string // 'Location Type' | 'Vibe/Style'
  value: string
}

export interface LocationBusinessIntelligence {
  id: string
  location_id: string
  // Legacy fields (kept as fallback)
  permit_status: string | null
  permit_cost: string | null
  permit_details: string | null
  rules_and_restrictions: string | null
  seasonal_availability: string | null
  insider_tips: string | null
  // Extended fields
  crowd_level: string | null
  accessibility: string | null
  parking: string | null
  drone_policy: string | null
  amenities: string | null
  permit_personal: string | null
  permit_pro: string | null
  admission_notes: string | null
  booking_info: string | null
  last_verified_at: string | null
  nearby_location_slugs: string[] | null
}

export interface NearbyLocation {
  name: string
  slug: string
  city: string
  state: string
  location_business_intelligence: { permit_status: string | null } | null
}

export interface LocationWithDetails extends Location {
  location_attributes: LocationAttribute[]
  location_business_intelligence: LocationBusinessIntelligence | null
  _nearbyLocations?: NearbyLocation[]
}

export interface FilterState {
  locationType: string[]
  vibeStyle: string[]
  permitStatus: string | null
  searchQuery: string
}

export type PermitStatus = 'Yes' | 'No' | 'Varies' | 'Prohibited'
