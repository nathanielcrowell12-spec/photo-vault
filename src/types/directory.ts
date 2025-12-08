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
  permit_status: string | null
  permit_cost: string | null
  permit_details: string | null
  rules_and_restrictions: string | null
  seasonal_availability: string | null
  insider_tips: string | null
}

export interface LocationWithDetails extends Location {
  location_attributes: LocationAttribute[]
  location_business_intelligence: LocationBusinessIntelligence | null
}

export interface FilterState {
  locationType: string[]
  vibeStyle: string[]
  permitStatus: string | null
  searchQuery: string
}

export type PermitStatus = 'Yes' | 'No' | 'Varies'
