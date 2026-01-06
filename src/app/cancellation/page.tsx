import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cancellation Policy | PhotoVault',
  description:
    'PhotoVault cancellation policy. Cancel at any time with a six month grace period after cancellation.',
  alternates: {
    canonical: 'https://photovault.photo/cancellation',
  },
}

export default function CancellationPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-foreground mb-8">Cancellation Policy</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          <strong>Cancel at any time. Six month grace period after cancellation.</strong>
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            For Photographers
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>Cancel your subscription anytime from your dashboard</li>
            <li>Billing stops immediately upon cancellation</li>
            <li>Your galleries remain accessible to clients for 6 months</li>
            <li>After the grace period, galleries are archived</li>
            <li>Export all your data before the grace period ends</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">For Clients</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>Cancel your subscription anytime from your dashboard</li>
            <li>Billing stops immediately upon cancellation</li>
            <li>You have 6 months to download your photos</li>
            <li>After the grace period, access is removed</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Billing Disputes
          </h2>
          <p className="text-muted-foreground">
            If you have any billing concerns or disputes, please contact us within 60
            days at{' '}
            <a
              href="mailto:support@photovault.photo"
              className="text-primary hover:underline"
            >
              support@photovault.photo
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Questions?</h2>
          <p className="text-muted-foreground">
            Contact us at{' '}
            <a
              href="mailto:support@photovault.photo"
              className="text-primary hover:underline"
            >
              support@photovault.photo
            </a>{' '}
            or call{' '}
            <a href="tel:+16085717532" className="text-primary hover:underline">
              (608) 571-7532
            </a>
            .
          </p>
          <p className="text-muted-foreground mt-2">
            Support hours: Monday - Friday, 9am - 6pm CST
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            See also:{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            |{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
