import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const pricingFeatures = [
  'Turnkey client portals',
  'Unlimited storage',
  'Automated billing and subscription management',
]

const faqs = [
  {
    question: 'How much can I earn?',
    answer:
      'Our calculator shows potential based on your past work. Many earn back the fee in the first month.',
  },
  {
    question: 'Is it easy to set up?',
    answer:
      'Yes! Connect your cloud storage, and we handle the rest. It takes less than 15 minutes.',
  },
  {
    question: 'Do my clients have to pay?',
    answer:
      'Clients subscribe to access their private, secure gallery for a small monthly fee, creating your passive income.',
  },
]

export function PricingSection() {
  return (
    <section className="py-16 md:py-24 bg-emerald-50" id="pricing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a365d]">
            Simple Pricing. Real Results.
          </h2>
          <p className="mt-3 text-lg text-gray-700">
            See what you could be earning in just a few clicks.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="mt-8 md:mt-12 max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-12 rounded-xl shadow-lg border border-slate-200">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Stats Badge */}
            <div className="flex flex-col items-center justify-center text-center bg-amber-100 p-6 md:p-8 rounded-lg">
              <p className="text-4xl sm:text-5xl md:text-7xl font-bold text-amber-500">247</p>
              <p className="mt-2 font-medium text-[#1a365d] text-sm md:text-base">
                photographers earning passive income
              </p>
            </div>

            {/* Pricing + FAQ */}
            <div className="md:col-span-2">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Pricing */}
                <div>
                  <h3 className="font-bold text-lg text-[#1a365d]">PHOTOGRAPHER PLAN</h3>
                  <p className="mt-2">
                    <span className="text-4xl font-bold text-[#1a365d]">$22</span>
                    <span className="text-slate-500">/month</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {pricingFeatures.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Link href="/photographers/signup">Protect My Photos</Link>
                  </Button>
                </div>

                {/* FAQ */}
                <div>
                  <h3 className="font-bold text-lg text-[#1a365d]">FAQ</h3>
                  <div className="mt-4 space-y-4 text-sm">
                    {faqs.map(({ question, answer }) => (
                      <div key={question}>
                        <p className="font-semibold text-[#1a365d]">{question}</p>
                        <p className="text-gray-700">{answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-[#1a365d]">
            Become a Guardian of Family Memories
          </h3>
          <p className="mt-2 text-gray-700">
            Join hundreds of photographers protecting their clients&apos; most precious
            moments—and earning passive income doing it.
          </p>
          <Button
            asChild
            className="mt-6 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 h-auto text-lg font-semibold"
          >
            <Link href="/photographers/signup">Start Protecting Memories - $22/Month</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
