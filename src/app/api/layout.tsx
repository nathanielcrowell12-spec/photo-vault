/**
 * API Routes Layout
 *
 * Forces all API routes to be dynamically rendered at request time.
 * This prevents Next.js from trying to statically analyze routes during build,
 * which would cause modules with runtime dependencies (like Resend, Stripe)
 * to be evaluated before environment variables are available.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function APILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
