import Link from 'next/link'
import { Camera, Lock } from 'lucide-react'

interface LandingFooterProps {
  betaEmail: string
}

export function LandingFooter({ betaEmail }: LandingFooterProps) {
  return (
    <footer className="bg-card border-t border-border text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info & Contact */}
          <div className="md:col-span-2">
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

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="#how-it-works" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#beta-program" className="hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">
                  Beta Program
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
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="font-semibold mb-4">Legal &amp; Security</h4>
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
