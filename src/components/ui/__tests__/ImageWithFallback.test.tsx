/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ImageWithFallback } from '../ImageWithFallback'

// Mock IntersectionObserver as a proper class
let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    intersectionCallback = callback
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
}

// Helper to trigger intersection
function triggerIntersection(isIntersecting: boolean) {
  if (intersectionCallback) {
    intersectionCallback([{ isIntersecting } as IntersectionObserverEntry])
  }
}

beforeEach(() => {
  intersectionCallback = null
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  mockObserve.mockClear()
  mockDisconnect.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ImageWithFallback', () => {
  describe('priority loading', () => {
    it('sets fetchPriority="high" and loading="eager" when priority={true}', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('fetchPriority', 'high')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('sets fetchPriority="auto" and loading="lazy" when priority={false}', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={false}
        />
      )

      // Trigger intersection
      triggerIntersection(true)

      await waitFor(() => {
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('fetchPriority', 'auto')
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('loads immediately when priority={true} without waiting for intersection', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      // Should render img immediately
      expect(screen.getByRole('img')).toBeInTheDocument()
      // Should NOT set up intersection observer for priority images
      expect(mockObserve).not.toHaveBeenCalled()
    })
  })

  describe('lazy loading', () => {
    it('does not render img initially for non-priority images', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={false}
        />
      )

      // Image should not be rendered until intersection
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      // Observer should be set up
      expect(mockObserve).toHaveBeenCalled()
    })

    it('renders img after intersection observed', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={false}
        />
      )

      // Trigger intersection
      triggerIntersection(true)

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument()
      })
    })

    it('disconnects observer after intersection', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={false}
        />
      )

      // Trigger intersection
      triggerIntersection(true)

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled()
      })
    })
  })

  describe('placeholder and fade-in', () => {
    it('shows placeholder while loading', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      // Placeholder should be visible
      const placeholder = document.querySelector('[aria-hidden="true"]')
      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveClass('bg-muted')
    })

    it('hides placeholder after image loads', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      const img = screen.getByRole('img')
      fireEvent.load(img)

      await waitFor(() => {
        const placeholder = document.querySelector('[aria-hidden="true"]')
        expect(placeholder).not.toBeInTheDocument()
      })
    })

    it('applies opacity transition class to image', () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveClass('transition-opacity', 'duration-300')
    })

    it('starts with opacity-0 and changes to opacity-100 after load', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      const img = screen.getByRole('img')
      expect(img).toHaveClass('opacity-0')

      fireEvent.load(img)

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100')
      })
    })
  })

  describe('fallback handling', () => {
    it('shows fallback camera icon when src is undefined', () => {
      render(
        <ImageWithFallback
          src={undefined}
          alt="Test image"
        />
      )

      // Should not render img
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      // Should render fallback container
      const fallback = document.querySelector('.flex.items-center.justify-center')
      expect(fallback).toBeInTheDocument()
    })

    it('shows fallback camera icon on image error', async () => {
      render(
        <ImageWithFallback
          src="https://example.com/broken-image.jpg"
          alt="Test image"
          priority={true}
        />
      )

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        // Image should be replaced with fallback
        expect(screen.queryByRole('img')).not.toBeInTheDocument()
        const fallback = document.querySelector('.flex.items-center.justify-center')
        expect(fallback).toBeInTheDocument()
      })
    })

    it('calls onError callback when image fails to load', async () => {
      const onError = vi.fn()
      render(
        <ImageWithFallback
          src="https://example.com/broken-image.jpg"
          alt="Test image"
          priority={true}
          onError={onError}
        />
      )

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1)
      })
    })

    it('renders custom fallback icon when provided', () => {
      render(
        <ImageWithFallback
          src={undefined}
          alt="Test image"
          fallbackIcon={<span data-testid="custom-icon">Custom</span>}
        />
      )

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('calls onLoad callback when image loads successfully', async () => {
      const onLoad = vi.fn()
      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={true}
          onLoad={onLoad}
        />
      )

      const img = screen.getByRole('img')
      fireEvent.load(img)

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('SSR safety', () => {
    it('falls back to loading image when IntersectionObserver is undefined', () => {
      // Temporarily remove IntersectionObserver
      vi.stubGlobal('IntersectionObserver', undefined)

      render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="Test image"
          priority={false}
        />
      )

      // Should still render the image (fallback behavior)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })
})
