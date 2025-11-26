import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect root to the landing page HTML file for Stripe integration
  // The landing page is a static HTML file in public/landing-page.html
  redirect('/landing-page.html')
}
