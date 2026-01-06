import Image from 'next/image'
import Link from 'next/link'
import { XCircle, CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a365d] text-balance">
            Get Your Nights and Weekends Back
          </h2>
          <p className="mt-3 text-lg text-gray-700">
            Stop worrying about your pipeline and start automating income.
          </p>

          {/* Before/After Comparison */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
            <div>
              <h3 className="font-semibold text-[#1a365d]">Before PhotoVault</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center text-gray-700">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  Lost revenue on past work
                </li>
                <li className="flex items-center text-gray-700">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  Manual client follow-ups
                </li>
                <li className="flex items-center text-gray-700">
                  <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  Inconsistent income
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1a365d]">After PhotoVault</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                  Passive income activated
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                  Automated client portals
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
                  Predictable cash flow
                </li>
              </ul>
            </div>

            {/* Feature Checklist */}
            <div className="sm:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              {['Reloads', 'Releases', 'Renews', 'Forever'].map((feature) => (
                <div key={feature} className="flex items-center text-sm text-gray-700">
                  <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial + CTA */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-[#1a365d]">
              The Shift: Upload once. We handle storage...
            </h3>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex -space-x-4">
                <Image
                  src="/images/landing/avatar-testimonial-1.jpg"
                  alt="Photographer testimonial"
                  width={48}
                  height={48}
                  className="inline-block h-12 w-12 rounded-full ring-2 ring-white object-cover"
                />
                <Image
                  src="/images/landing/avatar-testimonial-2.jpg"
                  alt="Photographer testimonial"
                  width={48}
                  height={48}
                  className="inline-block h-12 w-12 rounded-full ring-2 ring-white object-cover"
                />
              </div>
              <p className="text-sm text-gray-700 flex-1">
                &quot;I used to spend hours managing old galleries. Now PhotoVault does it
                for me and I get paid for it.&quot;
              </p>
            </div>
            <Button
              asChild
              className="mt-6 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-6 py-3"
            >
              <Link href="#pricing">Start Protecting Memories - $22/Month</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
