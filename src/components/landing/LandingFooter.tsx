import Link from 'next/link'
import { Camera, Lock } from 'lucide-react'

interface LandingFooterProps {
  betaEmail: string
}

export function LandingFooter({ betaEmail }: LandingFooterProps) {
  return (
    <footer className="bg-card border-t border-border text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info & Contact */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <Camera className="h-8 w-8 text-primary mr-2" aria-hidden="true" />
              <span className="font-bold text-xl">PhotoVault</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              PhotoVault helps professional photographers turn completed work into
              recurring revenue.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Business Address</h4>
                <p className="text-sm text-muted-foreground">
                  PhotoVault LLC
                  <br />
                  3639 Old Stage Road
                  <br />
                  Brooklyn, WI 53521
                  <br />
                  United States
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Contact Information</h4>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Phone:</strong>{' '}
                  <a
                    href="tel:+16085717532"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    (608) 571-7532
                  </a>
                  <br />
                  <strong className="text-foreground">Email:</strong>{' '}
                  <a
                    href="mailto:support@photovault.photo"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    support@photovault.photo
                  </a>
                  <br />
                  <strong className="text-foreground">Support Hours:</strong> Mon-Fri, 9am-6pm CST
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Questions about the beta?{' '}
                  <a
                    href={`mailto:${betaEmail}`}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    {betaEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/photographers" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  For Photographers
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Photo Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/resources/photo-storage-guide" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Photo Storage Guide
                </Link>
              </li>
              <li>
                <Link href="/resources/google-photos-alternatives" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Google Photos Alternatives
                </Link>
              </li>
              <li>
                <Link href="/resources/photo-storage-comparison" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Storage Comparison
                </Link>
              </li>
              <li>
                <Link href="/resources/photovault-vs-pixieset" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  PhotoVault vs Pixieset
                </Link>
              </li>
              <li>
                <Link href="/resources/photovault-vs-pictime" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  PhotoVault vs Pic-Time
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div>
            <h4 className="font-semibold mb-4">Legal &amp; Account</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Log In
                </Link>
              </li>
              <li className="pt-2">
                <div className="flex items-center gap-2 text-xs min-h-[44px]">
                  <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Secure payments via Stripe</span>
                </div>
              </li>
            </ul>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">
                VISA
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">
                MC
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">
                AMEX
              </span>
              <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold">
                DISCOVER
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation Policy - Stripe Requirement */}
        <div className="mt-8 pt-8 border-t border-border">
          <h4 className="font-semibold mb-3 text-center">Cancellation &amp; Refund Policy</h4>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Photographers:</strong> Cancel anytime. Billing stops immediately.
              Your galleries remain accessible to clients for 6 months. Export all data
              before canceling.
            </p>
            <p>
              <strong className="text-foreground">Clients:</strong> Cancel anytime. Billing stops immediately. You have
              6 months to download your photos after cancellation.
            </p>
            <p>
              <strong className="text-foreground">Billing Disputes:</strong> Contact{' '}
              <a
                href="mailto:support@photovault.photo"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                support@photovault.photo
              </a>{' '}
              within 60 days.
            </p>
          </div>
        </div>

        {/* Client Redirect + Copyright */}
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p className="mb-4">
            <Link
              href="/login"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Are you a client looking for your photos? Log in here.
            </Link>
          </p>
          <p className="mb-2">&copy; 2026 PhotoVault LLC. All rights reserved.</p>
          <p className="text-xs">
            PhotoVault is a registered trademark. Unauthorized use is prohibited.
          </p>
        </div>
      </div>
    </footer>
  )
}
