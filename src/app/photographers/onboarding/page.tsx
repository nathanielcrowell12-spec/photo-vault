'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import WelcomeStep from './steps/WelcomeStep'
import ProfileStep from './steps/ProfileStep'
import PaymentStep from './steps/PaymentStep'
import UploadStep from './steps/UploadStep'
import SuccessStep from './steps/SuccessStep'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'
import { useAuth } from '@/contexts/AuthContext'
import { calculateTimeFromSignup } from '@/lib/analytics/client-helpers'

export interface OnboardingData {
  // Profile data
  businessName: string
  bio: string
  website: string
  instagram: string
  phone: string

  // Payment data
  bankName: string
  accountNumber: string
  routingNumber: string

  // Upload data
  portfolioImages: File[]

  // Metadata
  currentStep: number
  completedSteps: number[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const track = useTrackEvent()
  const hasTrackedStartRef = useRef(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Abandonment tracking refs (Story 6.3)
  const onboardingStartTimeRef = useRef<number>(Date.now())
  const onboardingCompletedRef = useRef(false)
  const currentStepRef = useRef(0) // Track step in ref to avoid stale closure
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessName: '',
    bio: '',
    website: '',
    instagram: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    portfolioImages: [],
    currentStep: 0,
    completedSteps: []
  })

  const steps = [
    { id: 0, title: 'Welcome', component: WelcomeStep },
    { id: 1, title: 'Profile', component: ProfileStep },
    { id: 2, title: 'Payment', component: PaymentStep },
    { id: 3, title: 'Portfolio', component: UploadStep },
    { id: 4, title: 'Success', component: SuccessStep }
  ]

  // Track onboarding started (once per page load)
  useEffect(() => {
    if (!user || hasTrackedStartRef.current) return

    const timeFromSignup = calculateTimeFromSignup(user.created_at)

    track(EVENTS.PHOTOGRAPHER_STARTED_ONBOARDING, {
      time_from_signup_seconds: timeFromSignup ?? 0,
    })

    hasTrackedStartRef.current = true
  }, [user, track])

  // Keep ref in sync with state for abandonment tracking
  useEffect(() => {
    currentStepRef.current = currentStep
  }, [currentStep])

  // Track abandonment on unmount (Story 6.3)
  // CRITICAL: Empty dependency array - only runs on actual unmount, not step changes
  useEffect(() => {
    return () => {
      // Only track if user started (step > 0) but didn't complete
      if (!onboardingCompletedRef.current && currentStepRef.current > 0 && currentStepRef.current < steps.length - 1) {
        const timeSpent = Math.round((Date.now() - onboardingStartTimeRef.current) / 1000)

        track(EVENTS.ONBOARDING_ABANDONED, {
          step_abandoned_at: steps[currentStepRef.current]?.title || `Step ${currentStepRef.current}`,
          time_spent_seconds: timeSpent,
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - intentional, uses refs for current values

  const handleNext = (stepData: Partial<OnboardingData>) => {
    const updatedData = {
      ...onboardingData,
      ...stepData,
      completedSteps: [...onboardingData.completedSteps, currentStep]
    }
    setOnboardingData(updatedData)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Mark as completed to prevent abandonment tracking
    onboardingCompletedRef.current = true

    // Track onboarding completion
    const timeFromSignup = calculateTimeFromSignup(user?.created_at)
    track(EVENTS.PHOTOGRAPHER_COMPLETED_ONBOARDING, {
      time_from_signup_seconds: timeFromSignup ?? 0,
      steps_completed: onboardingData.completedSteps.length,
    })

    // In production, this would save to database
    console.log('Onboarding completed:', onboardingData)
    router.push('/photographers/dashboard')
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index < currentStep
                      ? 'bg-green-500 text-foreground'
                      : index === currentStep
                      ? 'bg-blue-600 text-foreground'
                      : 'bg-slate-200 text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    index === currentStep
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-muted-foreground dark:text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="max-w-3xl mx-auto p-8">
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          <CurrentStepComponent
            data={onboardingData}
            onNext={handleNext}
            onComplete={handleComplete}
          />
        </Card>

        {/* Help Text */}
        {currentStep < steps.length - 1 && (
          <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-6">
            Step {currentStep + 1} of {steps.length}
          </p>
        )}
      </div>
    </div>
  )
}
