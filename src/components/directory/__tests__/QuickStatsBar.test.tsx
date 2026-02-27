/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickStatsBar } from '../QuickStatsBar'
import type { LocationBusinessIntelligence } from '@/types/directory'

function makeIntel(overrides: Partial<LocationBusinessIntelligence> = {}): LocationBusinessIntelligence {
  return {
    id: '1',
    location_id: '1',
    permit_status: null,
    permit_cost: null,
    permit_details: null,
    rules_and_restrictions: null,
    seasonal_availability: null,
    insider_tips: null,
    crowd_level: null,
    accessibility: null,
    parking: null,
    drone_policy: null,
    amenities: null,
    permit_personal: null,
    permit_pro: null,
    admission_notes: null,
    booking_info: null,
    last_verified_at: null,
    nearby_location_slugs: null,
    ...overrides,
  }
}

describe('QuickStatsBar', () => {
  it('renders all 5 stat items when data provided', () => {
    const intel = makeIntel({
      crowd_level: 'Low on weekdays',
      accessibility: 'Wheelchair accessible',
      parking: 'Free lot',
      drone_policy: 'Prohibited',
      amenities: 'Restrooms, water',
    })

    render(<QuickStatsBar intel={intel} />)

    expect(screen.getByText(/Low on weekdays/)).toBeInTheDocument()
    expect(screen.getByText(/Wheelchair accessible/)).toBeInTheDocument()
    expect(screen.getByText(/Free lot/)).toBeInTheDocument()
    expect(screen.getByText(/Prohibited/)).toBeInTheDocument()
    expect(screen.getByText(/Restrooms, water/)).toBeInTheDocument()
  })

  it('renders nothing when all fields are null', () => {
    const intel = makeIntel()
    const { container } = render(<QuickStatsBar intel={intel} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when intel is null', () => {
    const { container } = render(<QuickStatsBar intel={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders only populated stats, skipping nulls', () => {
    const intel = makeIntel({
      crowd_level: 'Moderate',
      parking: 'Street only',
    })

    render(<QuickStatsBar intel={intel} />)

    expect(screen.getByText(/Moderate/)).toBeInTheDocument()
    expect(screen.getByText(/Street only/)).toBeInTheDocument()
    // Should not render labels for null fields
    expect(screen.queryByText(/Accessibility/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Drones/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Amenities/i)).not.toBeInTheDocument()
  })
})
