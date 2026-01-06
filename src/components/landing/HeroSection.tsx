import Image from 'next/image'
import { IncomeCalculator } from './IncomeCalculator'

export function HeroSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Main Message + Calculator */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a365d] leading-tight text-balance">
              Your memories deserve better than a failing hard drive.
            </h1>
            <p className="mt-4 text-lg text-gray-700 max-w-xl mx-auto lg:mx-0">
              PhotoVault is <strong>Memory Insurance</strong>—professional-grade protection
              for the photos that matter most. Photographers earn passive income. Families
              never lose another memory.
            </p>
            <p className="mt-3 text-sm text-red-600 font-medium">
              Hard drives have a 100% failure rate eventually. It&apos;s not{' '}
              <em>if</em>—it&apos;s <em>when</em>.
            </p>

            <div className="mt-8">
              <IncomeCalculator />
            </div>
          </div>

          {/* Right Column - Value Prop + Image + Risk/Solution */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1a365d]">
                You&apos;re Not Just a Photographer. You&apos;re the Guardian of Their
                Family History.
              </h2>
              <p className="mt-2 text-gray-700">
                Turn every photoshoot into passive income. Your clients pay $8/month to
                protect their memories—you earn $4/month forever.
              </p>
            </div>

            <div className="relative">
              <Image
                src="/images/landing/photographer-hero.jpg"
                alt="A professional photographer smiling while holding a camera"
                width={1080}
                height={720}
                className="rounded-lg w-full h-auto object-cover"
                priority
              />
            </div>

            <div>
              <p className="font-semibold text-[#1a365d]">The Fix:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="font-bold text-red-800">The Risk</p>
                  <p className="mt-1 text-sm text-red-600">
                    Hard drives fail. The cloud is someone else&apos;s computer.
                    Professional data recovery costs $500-$5,000.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="font-bold text-green-800">The Solution</p>
                  <p className="mt-1 text-sm text-green-600">
                    Memory Insurance for $8/month. A digital safety deposit box for the
                    images that can&apos;t be replaced.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
