'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Image as ImageIcon, Folder, Trash2, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UploadedImage {
  id: string
  name: string
  url: string
  category: string
  size: number
  uploadedAt: string
}

export default function ImageUploadPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedCategory, setSelectedCategory] = useState('hero')
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [user, userType, loading, router])

  const categories = [
    { value: 'hero', label: 'Hero Backgrounds', description: 'Full-width hero section images' },
    { value: 'cards', label: 'Card Images', description: 'Hover effects and card illustrations' },
    { value: 'logos', label: 'Logos', description: 'Company and brand logos' },
    { value: 'icons', label: 'Icons', description: 'Custom icons and graphics' },
    { value: 'testimonials', label: 'Testimonials', description: 'Customer photos and quotes' },
    { value: 'galleries', label: 'Sample Galleries', description: 'Example photo galleries' },
    { value: 'backgrounds', label: 'Backgrounds', description: 'Patterns and textures' }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      uploadFiles(Array.from(files))
    }
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)
    
    try {
      const uploadPromises = files.map(async (file) => {
        // In a real implementation, you'd upload to Supabase Storage
        // For now, we'll simulate the upload process
        const reader = new FileReader()
        
        return new Promise<UploadedImage>((resolve) => {
          reader.onload = () => {
            const newImage: UploadedImage = {
              id: Math.random().toString(36).substring(7),
              name: file.name,
              url: reader.result as string,
              category: selectedCategory,
              size: file.size,
              uploadedAt: new Date().toISOString()
            }
            resolve(newImage)
          }
          reader.readAsDataURL(file)
        })
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...uploadedFiles])
      
      console.log('✅ Images uploaded successfully:', uploadedFiles.length)
    } catch (error) {
      console.error('❌ Error uploading images:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
    if (previewImage === imageId) {
      setPreviewImage(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || userType !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container-pixieset py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
            Website Image Manager
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Upload and manage images for website decoration and branding
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Upload Images</span>
                </CardTitle>
                <CardDescription>
                  Add new images to decorate your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="images">Images</Label>
                  <Input
                    ref={fileInputRef}
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Select multiple images to upload at once
                  </p>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full btn-primary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Choose Images'}
                </Button>

                {/* Category Info */}
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    {categories.find(c => c.value === selectedCategory)?.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {categories.find(c => c.value === selectedCategory)?.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span>Uploaded Images</span>
                  <Badge variant="secondary">
                    {uploadedImages.length} images
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage and organize your uploaded images
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No images uploaded yet
                    </h3>
                    <p className="text-muted-foreground">
                      Upload some images to get started
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group border border-border rounded-lg overflow-hidden card-shadow-hover"
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-32 object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewImage(image.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteImage(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Info */}
                        <div className="p-2 bg-card">
                          <p className="text-xs font-medium text-foreground truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {image.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-medium text-foreground">
                  {uploadedImages.find(img => img.id === previewImage)?.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewImage(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <img
                  src={uploadedImages.find(img => img.id === previewImage)?.url}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-8 card-shadow border border-border">
          <CardHeader>
            <CardTitle>📁 Folder Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Your images are stored in:</h4>
                <code className="bg-secondary p-2 rounded block">
                  public/images/[category]/
                </code>
              </div>
              <div>
                <h4 className="font-medium mb-2">Usage in components:</h4>
                <code className="bg-secondary p-2 rounded block">
                  /images/[category]/filename.jpg
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
