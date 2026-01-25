'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#community', label: 'Community' },
    { href: '/directory', label: 'Locations' },
    { href: '/login', label: 'Login' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-[#1a365d]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Camera className="h-8 w-8 text-amber-500 mr-2" />
            <span className="font-bold text-xl text-white">PhotoVault</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button + Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="hidden md:block bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-sm font-semibold"
            >
              <Link href="/auth/signup">Protect My Photos</Link>
            </Button>

            <button
              className="md:hidden p-2 rounded-md text-slate-300 hover:bg-slate-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors min-h-[44px] flex items-center px-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                asChild
                className="bg-amber-500 hover:bg-amber-600 text-white mt-2 min-h-[44px]"
              >
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  Protect My Photos
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
