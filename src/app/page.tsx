import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect root to the HTML landing page in public folder
  redirect('/landing-page.html')
}
