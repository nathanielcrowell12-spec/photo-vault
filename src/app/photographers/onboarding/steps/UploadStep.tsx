'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { FileUpload } from '@/components/photovault'
import { Camera, AlertCircle, CheckCircle, X } from 'lucide-react'
import type { OnboardingData } from '../page'

interface UploadStepProps {
  data: OnboardingData
  onNext: (data: Partial<OnboardingData>) => void
}

export default function UploadStep({ data, onNext }: UploadStepProps) {
  const [files, setFiles] = useState<File[]>(data.portfolioImages || [])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const handleFileSelect = (selectedFiles: File[]) => {
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)

    // Create preview URLs
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls([...previewUrls, ...newPreviews])
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)

    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(previewUrls[index])

    setFiles(newFiles)
    setPreviewUrls(newPreviews)
  }

  const handleSubmit = () => {
    onNext({ portfolioImages: files })
  }

  const handleSkip = () => {
    onNext({ portfolioImages: [] })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Camera className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">
              Portfolio Samples
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Upload 5-10 of your best photos (optional)
            </p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <div className="ml-2">
          <p className="text-sm text-purple-900 dark:text-purple-100">
            Portfolio samples help clients understand your photography style. You can add more later from your dashboard.
          </p>
        </div>
      </Alert>

      {/* File Upload */}
      <div>
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/jpeg,image/png,image/webp"
          multiple
          maxSize={10 * 1024 * 1024} // 10MB
          label="Drop your portfolio images here"
        />
        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
          Accepted formats: JPEG, PNG, WebP. Max 10MB per file.
        </p>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-foreground">
              Selected Images ({files.length})
            </h3>
            {files.length >= 5 && files.length <= 10 && (
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Great selection!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
              >
                <img
                  src={previewUrls[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-red-500"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {files.length > 0 && files.length < 5 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm text-slate-700 dark:text-foreground">
              We recommend uploading at least 5 images to showcase your work
            </p>
          </div>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-muted-foreground dark:text-muted-foreground"
        >
          Skip for now
        </Button>

        <Button
          onClick={handleSubmit}
          size="lg"
          className="px-8"
          disabled={files.length === 0}
        >
          {files.length > 0 ? `Continue with ${files.length} image${files.length > 1 ? 's' : ''}` : 'Continue'}
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 dark:text-foreground text-sm mb-2">
          Tips for great portfolio images:
        </h4>
        <ul className="text-sm text-muted-foreground dark:text-muted-foreground space-y-1">
          <li>• Choose images that represent your best work</li>
          <li>• Include variety in subjects, lighting, and composition</li>
          <li>• Use high-resolution images (at least 1920px wide)</li>
          <li>• Showcase your unique photography style</li>
        </ul>
      </div>
    </div>
  )
}
