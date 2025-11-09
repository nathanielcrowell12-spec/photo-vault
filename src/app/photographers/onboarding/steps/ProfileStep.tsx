'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { User, Globe, Instagram, Phone, AlertCircle } from 'lucide-react'
import type { OnboardingData } from '../page'

interface ProfileStepProps {
  data: OnboardingData
  onNext: (data: Partial<OnboardingData>) => void
}

export default function ProfileStep({ data, onNext }: ProfileStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    bio: data.bio || '',
    website: data.website || '',
    instagram: data.instagram || '',
    phone: data.phone || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required'
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters'
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must be a valid URL (include http:// or https://)'
    }

    if (formData.instagram && !formData.instagram.match(/^@?[\w.]+$/)) {
      newErrors.instagram = 'Instagram handle must be valid (letters, numbers, underscores)'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!formData.phone.match(/^[\d\s\-\(\)]+$/)) {
      newErrors.phone = 'Phone number must be valid'
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
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create Your Profile
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Tell us about your photography business
            </p>
          </div>
        </div>
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div className="ml-2">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This information will be visible to your clients
          </p>
        </div>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="e.g., John Smith Photography"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            className={errors.businessName ? 'border-red-500' : ''}
          />
          {errors.businessName && (
            <p className="text-sm text-red-500">{errors.businessName}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">
            Professional Bio <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="bio"
            placeholder="Tell clients about your photography style, experience, and what makes your work unique..."
            rows={5}
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className={errors.bio ? 'border-red-500' : ''}
          />
          <div className="flex items-center justify-between">
            {errors.bio ? (
              <p className="text-sm text-red-500">{errors.bio}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formData.bio.length} / 50 minimum characters
              </p>
            )}
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Website</span>
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://www.yourwebsite.com"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className={errors.website ? 'border-red-500' : ''}
          />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website}</p>
          )}
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center space-x-2">
            <Instagram className="h-4 w-4" />
            <span>Instagram Handle</span>
          </Label>
          <Input
            id="instagram"
            placeholder="@yourusername"
            value={formData.instagram}
            onChange={(e) => handleChange('instagram', e.target.value)}
            className={errors.instagram ? 'border-red-500' : ''}
          />
          {errors.instagram && (
            <p className="text-sm text-red-500">{errors.instagram}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Phone Number <span className="text-red-500">*</span></span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-8">
            Continue to Payment
          </Button>
        </div>
      </form>
    </div>
  )
}
