'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WelcomeStep from './steps/WelcomeStep'
import ProfileStep from './steps/ProfileStep'
import PaymentStep from './steps/PaymentStep'
import UploadStep from './steps/UploadStep'
import SuccessStep from './steps/SuccessStep'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

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
  const [currentStep, setCurrentStep] = useState(0)
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
    // In production, this would save to database
    console.log('Onboarding completed:', onboardingData)
    router.push('/photographers/dashboard')
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="min-h-screen bg-neutral-900">
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
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    index === currentStep
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
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
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Step {currentStep + 1} of {steps.length}
          </p>
        )}
      </div>
    </div>
  )
}
