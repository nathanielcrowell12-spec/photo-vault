'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  Eye,
  Sparkles,
  ExternalLink,
  Wand2,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface UploadedImage {
  id: string
  file: File
  preview: string
  category: string
  customName: string
  effect: string
  uploaded: boolean
}

export default function PhotoUploadPage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedCategory, setSelectedCategory] = useState('cards')
  const [selectedEffect, setSelectedEffect] = useState('none')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [user, userType, loading, router])

  const categories = [
    { value: 'hero', label: 'Hero Backgrounds', description: 'Full-width 1920x1080' },
    { value: 'cards', label: 'Card Images', description: 'Hover effects 400x300' },
    { value: 'logos', label: 'Logos', description: 'Brand logos 200x60' },
    { value: 'icons', label: 'Icons', description: 'UI icons 64x64' },
    { value: 'testimonials', label: 'Testimonials', description: 'Customer photos 300x300' },
    { value: 'galleries', label: 'Sample Galleries', description: 'Portfolio 400x300' },
    { value: 'backgrounds', label: 'Backgrounds', description: 'Patterns 1920x1080' }
  ]

  const imageEffects = [
    { value: 'none', label: 'None', description: 'No effects applied' },
    { value: 'hover-zoom', label: 'Hover Zoom', description: 'Scales up on hover' },
    { value: 'hover-slide', label: 'Hover Slide', description: 'Text slides up on hover' },
    { value: 'parallax', label: 'Parallax', description: 'Background moves on scroll' },
    { value: 'ken-burns', label: 'Ken Burns', description: 'Slow zoom animation' },
    { value: 'grayscale-color', label: 'Grayscale → Color', description: 'Color appears on hover' },
    { value: 'overlay-fade', label: 'Overlay Fade', description: 'Dark overlay on hover' },
    { value: 'blur-focus', label: 'Blur → Focus', description: 'Sharpens on hover' },
    { value: 'tilt-3d', label: '3D Tilt', description: 'Tilts based on mouse position' },
    { value: 'flip-card', label: 'Flip Card', description: 'Flips to reveal content' },
    { value: 'reveal-text', label: 'Reveal Text', description: 'Text appears from edges' },
    { value: 'border-glow', label: 'Border Glow', description: 'Glowing border on hover' }
  ]

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )

    if (files.length > 0) {
      addFiles(files)
    }
  }, [selectedCategory, selectedEffect])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const addFiles = (files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      category: selectedCategory,
      customName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      effect: selectedEffect,
      uploaded: false
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const updateImageCategory = (id: string, category: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, category } : img
    ))
  }

  const updateImageName = (id: string, name: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, customName: name } : img
    ))
  }

  const updateImageEffect = (id: string, effect: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, effect } : img
    ))
  }

  const uploadImages = async () => {
    setUploading(true)
    
    // Simulate upload process
    for (const image of images) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploaded: true } : img
      ))
    }
    
    setUploading(false)
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2">
                📸 Photo Upload Center
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Drag & drop photos to beautify your website
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="btn-outline">
                <Link href="/test-images">
                  <Eye className="h-4 w-4 mr-2" />
                  View Image Gallery
                </Link>
              </Button>
              <Button asChild variant="outline" className="btn-outline">
                <Link href="/admin/image-upload">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Effects Preview
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <Card className="mb-8 card-shadow border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Default Settings
            </CardTitle>
            <CardDescription>
              These settings will apply to all new uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Default Category</Label>
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

              <div className="space-y-2">
                <Label>Default Effect</Label>
                <Select value={selectedEffect} onValueChange={setSelectedEffect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageEffects.map((effect) => (
                      <SelectItem key={effect.value} value={effect.value}>
                        <div>
                          <div className="font-medium">{effect.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {effect.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Drop Zone */}
          <div className="lg:col-span-2">
            <Card 
              className={`card-shadow border-2 transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-dashed border-border'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-foreground mb-3">
                    Drop your photos here
                  </h3>
                  
                  <p className="text-muted-foreground mb-6">
                    or click to browse from your computer
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                    size="lg"
                  >
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Choose Photos
                  </Button>

                  <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Supports: JPG, PNG, WebP, SVG • Max 10MB per file
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Images List */}
            {images.length > 0 && (
              <Card className="mt-8 card-shadow border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Ready to Upload
                        <Badge variant="secondary">{images.length} photos</Badge>
                      </CardTitle>
                      <CardDescription>
                        Review and customize before uploading
                      </CardDescription>
                    </div>
                    <Button
                      onClick={uploadImages}
                      disabled={uploading || images.every(img => img.uploaded)}
                      className="btn-primary"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload All
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card"
                      >
                        {/* Preview */}
                        <img
                          src={image.preview}
                          alt={image.customName}
                          loading="lazy"
                          className="w-24 h-24 object-cover rounded-lg"
                        />

                        {/* Details */}
                        <div className="flex-1 space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Custom Name</Label>
                              <Input
                                value={image.customName}
                                onChange={(e) => updateImageName(image.id, e.target.value)}
                                className="mt-1"
                                placeholder="my-image-name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Category</Label>
                              <Select
                                value={image.category}
                                onValueChange={(val) => updateImageCategory(image.id, val)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Effect</Label>
                            <Select
                              value={image.effect}
                              onValueChange={(val) => updateImageEffect(image.id, val)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {imageEffects.map((effect) => (
                                  <SelectItem key={effect.value} value={effect.value}>
                                    {effect.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(image.file.size)}</span>
                            <span>•</span>
                            <span>{image.file.type}</span>
                            {image.uploaded && (
                              <>
                                <span>•</span>
                                <Badge variant="default" className="bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Uploaded
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Popular Effects */}
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Popular Image Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {imageEffects.filter(e => e.value !== 'none').slice(0, 5).map((effect) => (
                  <div key={effect.value} className="p-3 bg-secondary/30 rounded-lg">
                    <h4 className="font-medium text-sm text-foreground mb-1">
                      {effect.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {effect.description}
                    </p>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full btn-outline" size="sm">
                  <Link href="/admin/image-upload">
                    View All Effects
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="text-base">💡 Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  • Upload high-quality images for best results
                </p>
                <p>
                  • Use descriptive file names for better organization
                </p>
                <p>
                  • Hero images work best at 1920x1080px
                </p>
                <p>
                  • Card images should be 400x300px minimum
                </p>
                <p>
                  • After uploading, message me to place them on your site
                </p>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="card-shadow border border-border bg-gradient-to-br from-primary/10 to-secondary/30">
              <CardHeader>
                <CardTitle className="text-base">📝 After Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-foreground font-medium">
                  Your photos will be saved to:
                </p>
                <code className="block bg-secondary p-2 rounded text-xs">
                  public/images/{selectedCategory}/
                </code>
                <p className="text-muted-foreground text-xs">
                  Let me know where you want to use them, and I&apos;ll add them to your website with the effects you selected!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

