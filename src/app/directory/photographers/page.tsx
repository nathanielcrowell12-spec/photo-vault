// src/app/directory/photographers/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find a Photographer | PhotoVault Directory',
  description:
    'Browse professional photographers in our network. Find wedding, portrait, and family photographers near you with verified profiles and portfolio galleries.',
  openGraph: {
    type: 'website',
    title: 'Find a Photographer | PhotoVault Directory',
    description:
      'Browse professional photographers with verified profiles and portfolio galleries.',
    url: 'https://photovault.photo/directory/photographers',
    siteName: 'PhotoVault',
  },
  alternates: {
    canonical: 'https://photovault.photo/directory/photographers',
  },
}

export default function PhotographersPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            PhotoVault
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/directory" className="text-gray-600 hover:text-gray-900">
              Locations
            </Link>
            <Link href="/directory/photographers" className="text-blue-600 hover:text-blue-700 font-medium">
              Photographers
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center">Find a Photographer</h1>
        <p className="text-center mt-4 text-lg text-gray-600">
          Browse our directory of professional photographers.
        </p>
        {/* Search and filter options will be added here */}
      </div>
    </div>
  );
}
