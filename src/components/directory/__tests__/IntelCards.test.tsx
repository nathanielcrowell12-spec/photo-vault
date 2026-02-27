/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermitCard, InsiderTipsCard } from '../IntelCards'
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

describe('PermitCard', () => {
  it('falls back to legacy permit_status/permit_cost/permit_details when new fields are NULL', () => {
    const intel = makeIntel({
      permit_status: 'No',
      permit_cost: '$35 per session',
      permit_details: 'Permit REQUIRED for ALL photography.',
      permit_personal: null,
      permit_pro: null,
    })

    render(<PermitCard intel={intel} />)

    expect(screen.getByText(/\$35 per session/)).toBeInTheDocument()
    expect(screen.getByText(/Permit REQUIRED/)).toBeInTheDocument()
  })

  it('uses new permit_personal and permit_pro fields when available', () => {
    const intel = makeIntel({
      permit_status: 'No',
      permit_personal: 'Required - $35/session',
      permit_pro: 'Required - $350/year',
      permit_cost: '$35 per session',
    })

    render(<PermitCard intel={intel} />)

    expect(screen.getByText(/Required - \$35\/session/)).toBeInTheDocument()
    expect(screen.getByText(/Required - \$350\/year/)).toBeInTheDocument()
  })

  it('renders nothing when intel is null', () => {
    const { container } = render(<PermitCard intel={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows admission_notes when provided', () => {
    const intel = makeIntel({
      permit_status: 'Yes',
      admission_notes: '$6 per adult admission',
    })

    render(<PermitCard intel={intel} />)

    expect(screen.getByText(/\$6 per adult/)).toBeInTheDocument()
  })

  it('shows booking_info when provided', () => {
    const intel = makeIntel({
      permit_status: 'Yes',
      booking_info: 'Book 2 weeks in advance at (608) 246-4550',
    })

    render(<PermitCard intel={intel} />)

    expect(screen.getByText(/Book 2 weeks in advance/)).toBeInTheDocument()
  })
})

describe('InsiderTipsCard', () => {
  it('splits tips into list items', () => {
    const intel = makeIntel({
      insider_tips: 'Tip one here. Tip two here. Tip three here.',
    })

    render(<InsiderTipsCard intel={intel} />)

    expect(screen.getByText(/Tip one here/)).toBeInTheDocument()
    expect(screen.getByText(/Tip two here/)).toBeInTheDocument()
    expect(screen.getByText(/Tip three here/)).toBeInTheDocument()
  })

  it('renders nothing when insider_tips is null', () => {
    const intel = makeIntel({ insider_tips: null })
    const { container } = render(<InsiderTipsCard intel={intel} />)
    expect(container.firstChild).toBeNull()
  })
})
