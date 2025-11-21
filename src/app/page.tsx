import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect root to the landing page for Stripe integration
  redirect('/landing-page')
}
