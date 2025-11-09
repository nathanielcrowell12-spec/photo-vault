'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Camera, Users, DollarSign, BarChart, ArrowRight } from 'lucide-react'
import type { OnboardingData } from '../page'

interface SuccessStepProps {
  data: OnboardingData
  onComplete: () => void
}

export default function SuccessStep({ data, onComplete }: SuccessStepProps) {
  const nextSteps = [
    {
      icon: Camera,
      title: 'Create Your First Gallery',
      description: 'Upload photos and create a beautiful gallery for your clients',
      action: 'Start now'
    },
    {
      icon: Users,
      title: 'Invite Clients',
      description: 'Send gallery access links to your clients via email',
      action: 'Invite clients'
    },
    {
      icon: DollarSign,
      title: 'Track Revenue',
      description: 'Monitor your earnings and client subscriptions',
      action: 'View analytics'
    }
  ]

  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-ping opacity-20" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Welcome to PhotoVault! 🎉
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Your photographer account is all set up. Let's start growing your business!
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-none p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Your Profile
        </h3>
        <div className="space-y-2 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Business:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {data.businessName || 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Phone:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {data.phone || 'Not provided'}
            </span>
          </div>
          {data.instagram && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Instagram:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {data.instagram}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Portfolio:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {data.portfolioImages.length} image{data.portfolioImages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          What's Next?
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {nextSteps.map((step, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Revenue Reminder */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-none p-6 text-white max-w-2xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <BarChart className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold mb-1">Start Earning Today</h3>
            <p className="text-sm text-green-50">
              Create your first gallery to earn $100 upfront + $8/month recurring revenue
            </p>
          </div>
        </div>
      </Card>

      {/* CTA Button */}
      <div className="pt-4">
        <Button
          onClick={onComplete}
          size="lg"
          className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Need help getting started?{' '}
        <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
          Check our guide
        </a>
        {' '}or{' '}
        <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
          contact support
        </a>
      </p>
    </div>
  )
}
