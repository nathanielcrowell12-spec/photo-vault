/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NearbyLocations } from '../NearbyLocations'

describe('NearbyLocations', () => {
  it('renders nothing when locations array is empty', () => {
    const { container } = render(<NearbyLocations locations={[]} citySlug="madison" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when locations is undefined', () => {
    // @ts-expect-error testing undefined
    const { container } = render(<NearbyLocations locations={undefined} citySlug="madison" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders 1 card when 1 location provided', () => {
    const locations = [
      { name: 'Picnic Point', slug: 'picnic-point', city: 'Madison', state: 'WI', permit_status: 'No' },
    ]

    render(<NearbyLocations locations={locations} citySlug="madison" />)

    expect(screen.getByText('Picnic Point')).toBeInTheDocument()
  })

  it('renders 3 cards when 3 locations provided', () => {
    const locations = [
      { name: 'Picnic Point', slug: 'picnic-point', city: 'Madison', state: 'WI', permit_status: 'No' },
      { name: 'Tenney Park', slug: 'tenney-park', city: 'Madison', state: 'WI', permit_status: 'Varies' },
      { name: 'Vilas Park', slug: 'vilas-park-zoo-area', city: 'Madison', state: 'WI', permit_status: 'Varies' },
    ]

    render(<NearbyLocations locations={locations} citySlug="madison" />)

    expect(screen.getByText('Picnic Point')).toBeInTheDocument()
    expect(screen.getByText('Tenney Park')).toBeInTheDocument()
    expect(screen.getByText('Vilas Park')).toBeInTheDocument()
  })

  it('renders clickable links to location pages', () => {
    const locations = [
      { name: 'Picnic Point', slug: 'picnic-point', city: 'Madison', state: 'WI', permit_status: 'No' },
    ]

    render(<NearbyLocations locations={locations} citySlug="madison" />)

    const link = screen.getByRole('link', { name: /Picnic Point/ })
    expect(link).toHaveAttribute('href', '/directory/madison/picnic-point')
  })
})
