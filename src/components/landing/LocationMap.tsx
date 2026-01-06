'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { Compass, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Location data for Madison, WI
const locations = [
  { name: 'Wisconsin State Capitol', lat: 43.0747, lng: -89.3842 },
  { name: 'UW-Madison Arboretum', lat: 43.0444, lng: -89.4286 },
  { name: 'Memorial Union Terrace', lat: 43.0766, lng: -89.3989 },
  { name: 'Olbrich Botanical Gardens', lat: 43.1008, lng: -89.3395 },
  { name: 'Picnic Point', lat: 43.0892, lng: -89.4261 },
  { name: 'Tenney Park', lat: 43.0892, lng: -89.3661 },
  { name: 'Vilas Park + Zoo', lat: 43.0536, lng: -89.4147 },
  { name: 'Olin Park', lat: 43.0614, lng: -89.3906 },
  { name: 'James Madison Park', lat: 43.0842, lng: -89.3753 },
  { name: 'Monona Terrace', lat: 43.0722, lng: -89.3831 },
  { name: 'Law Park', lat: 43.07, lng: -89.38 },
  { name: 'Garver Feed Mill', lat: 43.1039, lng: -89.3381 },
  { name: 'Henry Vilas Beach', lat: 43.0508, lng: -89.4169 },
  { name: 'Capitol Square', lat: 43.0747, lng: -89.3842 },
  { name: 'Warner Park', lat: 43.1186, lng: -89.3475 },
  { name: 'B.B. Clarke Beach', lat: 43.0708, lng: -89.3758 },
  { name: 'Goodman Community Center', lat: 43.0922, lng: -89.345 },
  { name: 'Yahara Place Park', lat: 43.0711, lng: -89.3742 },
  { name: 'Burrows Park', lat: 43.0939, lng: -89.4056 },
  { name: 'Alliant Energy Center', lat: 43.0483, lng: -89.3628 },
  { name: 'Madison Central Library', lat: 43.0789, lng: -89.3803 },
  { name: 'Hilldale Shopping Center', lat: 43.0864, lng: -89.4339 },
  { name: 'Hoyt Park', lat: 43.0772, lng: -89.4519 },
  { name: 'Frautschi Point', lat: 43.0886, lng: -89.4303 },
  { name: 'Elver Park', lat: 43.0603, lng: -89.4686 },
  { name: 'Monona Bay Boardwalk', lat: 43.0692, lng: -89.3825 },
  { name: 'Pope Farm Conservancy', lat: 43.1094, lng: -89.5292 },
  { name: 'Pheasant Branch Conservancy', lat: 43.1194, lng: -89.5231 },
  { name: 'Warehouse District', lat: 43.0761, lng: -89.3819 },
  { name: 'Willow Island', lat: 43.0508, lng: -89.3614 },
]

// Dynamically import react-leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Static fallback when map fails
function MapFallback() {
  return (
    <div className="rounded-lg bg-slate-100 h-[400px] w-full flex flex-col items-center justify-center text-center p-6">
      <MapPin className="h-12 w-12 text-amber-500 mb-4" />
      <h4 className="text-lg font-semibold text-[#1a365d] mb-2">
        30+ Photo Locations in Madison
      </h4>
      <p className="text-sm text-gray-600 mb-4 max-w-md">
        Explore curated photography spots including the State Capitol, UW Arboretum,
        Memorial Union Terrace, and more.
      </p>
      <Button asChild variant="outline" className="border-[#1a365d] text-[#1a365d]">
        <Link href="/directory">
          <Compass className="h-4 w-4 mr-2" />
          Browse All Locations
        </Link>
      </Button>
    </div>
  )
}

// Interactive map component
function InteractiveMap() {
  const [L, setL] = useState<typeof import('leaflet') | null>(null)

  useEffect(() => {
    // Import leaflet and its CSS on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
    // Add leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  if (!L) {
    return <MapFallback />
  }

  // Custom marker icon
  const customIcon = L.icon({
    iconUrl:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDYuOSAxMi41IDI4LjUgMTIuNSAyOC41UzI1IDE5LjQgMjUgMTIuNUMyNSA1LjYgMTkuNCA0IDEyLjUgMHptMCAxN2MtMi41IDAtNC41LTItNC41LTQuNXMyLTQuNSA0LjUtNC41IDQuNSAyIDQuNSA0LjUtMiA0LjUtNC41IDQuNXoiIGZpbGw9IiNmNTllMGIiLz48L3N2Zz4=',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

  return (
    <MapContainer
      center={[43.0731, -89.4012]}
      zoom={11}
      className="rounded-lg h-[400px] w-full z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc, index) => (
        <Marker key={index} position={[loc.lat, loc.lng]} icon={customIcon}>
          <Popup>
            <strong>{loc.name}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export function LocationMap() {
  const [mapError, setMapError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <MapFallback />
  }

  if (mapError) {
    return <MapFallback />
  }

  return (
    <div className="mt-2">
      <ErrorBoundary onError={() => setMapError(true)}>
        <InteractiveMap />
      </ErrorBoundary>
    </div>
  )
}

// Simple error boundary for map
function ErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode
  onError: () => void
}) {
  useEffect(() => {
    const handleError = () => onError()
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [onError])

  return <>{children}</>
}
