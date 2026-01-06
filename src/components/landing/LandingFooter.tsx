import Link from 'next/link'
import { Camera, Lock } from 'lucide-react'

export function LandingFooter() {
  return (
    <footer className="bg-[#1a365d] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info & Contact */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <Camera className="h-8 w-8 text-amber-500 mr-2" />
              <span className="font-bold text-xl">PhotoVault</span>
            </div>
            <p className="text-sm text-slate-300 mb-6 max-w-md">
              Memory Insurance for families. Professional-grade protection for the photos
              that matter most.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Business Address</h4>
                <p className="text-sm text-slate-300">
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
                <p className="text-sm text-slate-300">
                  <strong>Phone:</strong>{' '}
                  <a
                    href="tel:+16085717532"
                    className="text-blue-400 hover:underline"
                  >
                    (608) 571-7532
                  </a>
                  <br />
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:support@photovault.photo"
                    className="text-blue-400 hover:underline"
                  >
                    support@photovault.photo
                  </a>
                  <br />
                  <strong>Support Hours:</strong> Mon-Fri, 9am-6pm CST
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#community" className="hover:text-white transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:text-white transition-colors">
                  Photo Locations
                </Link>
              </li>
              <li>
                <Link
                  href="/photographers/signup"
                  className="hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="font-semibold mb-4">Legal & Security</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li className="pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Secure payments via Stripe</span>
                </div>
              </li>
            </ul>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-slate-700 rounded text-xs font-semibold">
                VISA
              </span>
              <span className="px-2 py-1 bg-slate-700 rounded text-xs font-semibold">
                MC
              </span>
              <span className="px-2 py-1 bg-slate-700 rounded text-xs font-semibold">
                AMEX
              </span>
              <span className="px-2 py-1 bg-slate-700 rounded text-xs font-semibold">
                DISCOVER
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation Policy - Stripe Requirement */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h4 className="font-semibold mb-3 text-center">Cancellation & Refund Policy</h4>
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              <strong>Photographers:</strong> Cancel anytime. Billing stops immediately.
              Your galleries remain accessible to clients for 6 months. Export all data
              before canceling.
            </p>
            <p>
              <strong>Clients:</strong> Cancel anytime. Billing stops immediately. You have
              6 months to download your photos after cancellation.
            </p>
            <p>
              <strong>Billing Disputes:</strong> Contact{' '}
              <a
                href="mailto:support@photovault.photo"
                className="text-blue-400 hover:underline"
              >
                support@photovault.photo
              </a>{' '}
              within 60 days.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
          <p className="mb-2">© 2025 PhotoVault LLC. All rights reserved.</p>
          <p className="text-xs">
            PhotoVault is a registered trademark. Unauthorized use is prohibited.
          </p>
          <p className="text-xs mt-4">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Beta Tester Access
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
