'use client'

import Link from 'next/link'
import { MapPin, Camera, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DirectoryHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/directory" className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-amber-400" />
            <span className="text-xl font-semibold text-white">PhotoVault Directory</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/directory"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Locations
            </Link>
            <Link
              href="/directory/photographers"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Photographers
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
