'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { DollarSign, Lock, AlertCircle, CreditCard } from 'lucide-react'
import type { OnboardingData } from '../page'

interface PaymentStepProps {
  data: OnboardingData
  onNext: (data: Partial<OnboardingData>) => void
}

export default function PaymentStep({ data, onNext }: PaymentStepProps) {
  const [formData, setFormData] = useState({
    bankName: data.bankName || '',
    accountNumber: data.accountNumber || '',
    routingNumber: data.routingNumber || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required'
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required'
    } else if (formData.accountNumber.length < 8) {
      newErrors.accountNumber = 'Account number must be at least 8 digits'
    }

    if (!formData.routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required'
    } else if (!formData.routingNumber.match(/^\d{9}$/)) {
      newErrors.routingNumber = 'Routing number must be exactly 9 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext(formData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">
              Payment Information
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Set up your bank account for payouts
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Info Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              How You Earn with PhotoVault
            </h3>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">$100</span>
                <span>Upfront payment per new client gallery</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">$8/mo</span>
                <span>Recurring revenue per active gallery</span>
              </div>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-3">
              Payments are processed monthly via direct deposit
            </p>
          </div>
        </div>
      </Card>

      {/* Security Notice */}
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div className="ml-2">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Your banking information is encrypted and securely stored. We use bank-level security to protect your data.
          </p>
        </div>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="bankName">
            Bank Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bankName"
            placeholder="e.g., Chase Bank"
            value={formData.bankName}
            onChange={(e) => handleChange('bankName', e.target.value)}
            className={errors.bankName ? 'border-red-500' : ''}
          />
          {errors.bankName && (
            <p className="text-sm text-red-500">{errors.bankName}</p>
          )}
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="accountNumber" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Account Number <span className="text-red-500">*</span></span>
          </Label>
          <Input
            id="accountNumber"
            type="text"
            placeholder="••••••••••1234"
            value={formData.accountNumber}
            onChange={(e) => handleChange('accountNumber', e.target.value)}
            className={errors.accountNumber ? 'border-red-500' : ''}
          />
          {errors.accountNumber && (
            <p className="text-sm text-red-500">{errors.accountNumber}</p>
          )}
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            Your checking or savings account number
          </p>
        </div>

        {/* Routing Number */}
        <div className="space-y-2">
          <Label htmlFor="routingNumber">
            Routing Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="routingNumber"
            type="text"
            placeholder="123456789"
            maxLength={9}
            value={formData.routingNumber}
            onChange={(e) => handleChange('routingNumber', e.target.value.replace(/\D/g, ''))}
            className={errors.routingNumber ? 'border-red-500' : ''}
          />
          {errors.routingNumber && (
            <p className="text-sm text-red-500">{errors.routingNumber}</p>
          )}
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            9-digit number found on your checks
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm text-slate-700 dark:text-foreground">
              You can update your payment information anytime from your account settings
            </p>
          </div>
        </Alert>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-8">
            Continue to Portfolio
          </Button>
        </div>
      </form>
    </div>
  )
}
