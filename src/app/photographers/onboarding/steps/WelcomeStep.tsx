'use client'

import { Button } from '@/components/ui/button'
import { Camera, DollarSign, Users, TrendingUp } from 'lucide-react'
import type { OnboardingData } from '../page'

interface WelcomeStepProps {
  data: OnboardingData
  onNext: (data: Partial<OnboardingData>) => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8">
      {/* Hero Section */}
      <div>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
          <Camera className="h-10 w-10 text-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-foreground mb-4">
          Welcome to PhotoVault
        </h1>
        <p className="text-xl text-muted-foreground dark:text-foreground max-w-2xl mx-auto">
          Join the premier platform for professional photographers. Let's get you set up in just a few minutes.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 py-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-foreground">
            Client Management
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Organize clients, galleries, and sessions in one place
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-foreground">
            Recurring Revenue
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Earn $100 upfront + $8/month per client gallery
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-foreground">
            Analytics & Insights
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Track revenue, client growth, and business metrics
          </p>
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 text-left">
        <h3 className="font-semibold text-slate-900 dark:text-foreground mb-4">
          What to expect:
        </h3>
        <ul className="space-y-2 text-muted-foreground dark:text-foreground">
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">1.</span>
            <span>Complete your photographer profile</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">2.</span>
            <span>Set up payment information for payouts</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">3.</span>
            <span>Upload portfolio samples (optional)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 mr-2">4.</span>
            <span>Start creating client galleries</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <Button
          onClick={() => onNext({})}
          size="lg"
          className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Get Started
        </Button>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-4">
          Takes about 5 minutes to complete
        </p>
      </div>
    </div>
  )
}
