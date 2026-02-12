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
    { href: '#beta-program', label: 'Beta Program' },
    { href: '/login', label: 'Log In' },
  ]

  return (
    <>
      {/* Skip to content - accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Camera className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl text-foreground">PhotoVault</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + Client Link + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden lg:inline-block text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Looking for your photos?
              </Link>

              <Button
                asChild
                className="hidden md:inline-flex"
              >
                <Link href="/auth/signup">Join the Beta</Link>
              </Button>

              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-secondary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
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
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[44px] flex items-center px-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 min-h-[44px] flex items-center px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Looking for your photos? Log in here
                </Link>
                <Button
                  asChild
                  className="mt-2 min-h-[44px]"
                >
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    Join the Beta
                  </Link>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
