import Image from 'next/image'
import Link from 'next/link'
import { Users, ArrowLeftRight, GraduationCap, Briefcase, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationMap } from './LocationMap'

const communityFeatures = [
  { icon: Users, text: 'Connect with local photographers' },
  { icon: ArrowLeftRight, text: 'Referral sharing for busy seasons' },
  { icon: GraduationCap, text: 'Access to community-shared knowledge' },
  { icon: Briefcase, text: 'Find second shooters fast' },
]

export function CommunitySection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50" id="community">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-50 p-4 sm:p-6 md:p-8 rounded-lg">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a365d] text-balance">
            Stop Competing. Start Collaborating.
          </h2>
          <p className="mt-3 text-lg text-gray-700">
            Join a network of photographers sharing referrals and resources.
          </p>

          {/* Feature Grid */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {communityFeatures.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white/50 p-3 sm:p-4 rounded flex sm:block items-center gap-3">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 flex-shrink-0" />
                <p className="sm:mt-2 font-semibold text-[#1a365d] text-sm">{text}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mt-8 space-y-4">
            <blockquote className="bg-white/50 p-4 rounded flex items-start gap-4">
              <span className="text-4xl font-bold text-emerald-500/50 -mt-2">&ldquo;</span>
              <p className="text-gray-700 text-sm flex-1">
                <span className="font-semibold text-[#1a365d]">
                  &ldquo;So lovely our Clients! We sent them 2 times!&rdquo;
                </span>
                <br />
                Hannah, Wedding Photographer
              </p>
              <Image
                src="/images/landing/avatar-hannah.jpg"
                alt="Hannah, Wedding Photographer"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            </blockquote>
            <blockquote className="bg-white/50 p-4 rounded flex items-start gap-4">
              <span className="text-4xl font-bold text-emerald-500/50 -mt-2">&ldquo;</span>
              <p className="text-gray-700 text-sm flex-1">
                <span className="font-semibold text-[#1a365d]">
                  &ldquo;The work I love the best is to follow up work!&rdquo;
                </span>
                <br />
                Sarah, Portrait Photographer
              </p>
              <Image
                src="/images/landing/avatar-sarah.jpg"
                alt="Sarah, Portrait Photographer"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            </blockquote>
          </div>

          {/* Location Map */}
          <div className="mt-8">
            <h3 className="font-semibold text-[#1a365d]">
              30+ Photoshoot Locations in Madison Metro
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Explore our curated directory of the best photo locations
            </p>
            <LocationMap />
            <Button
              asChild
              className="mt-4 bg-[#1a365d] hover:bg-[#2d4a6f] text-white"
            >
              <Link href="/directory">
                <Compass className="h-4 w-4 mr-2" />
                View All Locations
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
