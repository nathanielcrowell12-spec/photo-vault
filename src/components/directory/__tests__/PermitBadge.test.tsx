/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermitBadge } from '../PermitBadge'

describe('PermitBadge', () => {
  it('renders "Permit Required" for Yes status', () => {
    render(<PermitBadge status="Yes" />)
    expect(screen.getByText('Permit Required')).toBeInTheDocument()
  })

  it('renders "No Permit Needed" for No status', () => {
    render(<PermitBadge status="No" />)
    expect(screen.getByText('No Permit Needed')).toBeInTheDocument()
  })

  it('renders "Permit Varies" for Varies status', () => {
    render(<PermitBadge status="Varies" />)
    expect(screen.getByText('Permit Varies')).toBeInTheDocument()
  })

  it('renders "No Commercial Photography" for Prohibited status', () => {
    render(<PermitBadge status="Prohibited" />)
    expect(screen.getByText('No Commercial Photography')).toBeInTheDocument()
  })

  it('renders null when status is null', () => {
    const { container } = render(<PermitBadge status={null} />)
    expect(container.firstChild).toBeNull()
  })
})
