// Image management utilities for website decoration

export interface WebsiteImage {
  id: string
  name: string
  url: string
  category: 'hero' | 'cards' | 'logos' | 'icons' | 'testimonials' | 'galleries' | 'backgrounds'
  alt: string
  width?: number
  height?: number
  description?: string
}

// Pre-defined image categories with their usage
export const IMAGE_CATEGORIES = {
  hero: {
    name: 'Hero Backgrounds',
    description: 'Full-width hero section images',
    recommendedSize: '1920x1080px',
    usage: 'Background images for hero sections on landing pages',
    examples: ['family-photos-hero.jpg', 'photography-studio-hero.jpg']
  },
  cards: {
    name: 'Card Images',
    description: 'Hover effects and card illustrations',
    recommendedSize: '400x300px',
    usage: 'Interactive card hover effects and illustrations',
    examples: ['photography-business-card.jpg', 'family-memories-card.jpg']
  },
  logos: {
    name: 'Logos',
    description: 'Company and brand logos',
    recommendedSize: '200x60px',
    usage: 'Brand recognition and trust building',
    examples: ['photovault-logo.png', 'partner-logos/']
  },
  icons: {
    name: 'Icons',
    description: 'Custom icons and graphics',
    recommendedSize: '64x64px',
    usage: 'UI icons and decorative elements',
    examples: ['camera-icon.svg', 'heart-icon.svg']
  },
  testimonials: {
    name: 'Testimonials',
    description: 'Customer photos and quotes',
    recommendedSize: '300x300px',
    usage: 'Customer testimonials and social proof',
    examples: ['happy-family-1.jpg', 'wedding-couple.jpg']
  },
  galleries: {
    name: 'Sample Galleries',
    description: 'Example photo galleries',
    recommendedSize: '400x300px',
    usage: 'Showcase example galleries and photography',
    examples: ['wedding-gallery-preview.jpg', 'family-session-preview.jpg']
  },
  backgrounds: {
    name: 'Backgrounds',
    description: 'Patterns and textures',
    recommendedSize: '1920x1080px',
    usage: 'Background patterns and textures',
    examples: ['subtle-pattern.png', 'texture-overlay.jpg']
  }
} as const

// Helper function to get image URL
export function getImageUrl(category: string, filename: string): string {
  return `/images/${category}/${filename}`
}

// Helper function to get all images in a category
export async function getImagesByCategory(category: string): Promise<WebsiteImage[]> {
  // In a real implementation, this would fetch from Supabase Storage or file system
  // For now, return empty array - images will be managed through the admin interface
  return []
}

// Helper function to validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, WebP, or SVG files.' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Please upload files smaller than 10MB.' }
  }
  
  return { valid: true }
}

// Helper function to optimize image filename
export function optimizeFilename(originalName: string, category: string): string {
  // Convert to lowercase, replace spaces with hyphens, remove special characters
  const cleanName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  // Add category prefix if not already present
  const categoryPrefix = category === 'hero' ? 'hero-' : 
                        category === 'cards' ? 'card-' : 
                        category === 'logos' ? 'logo-' : 
                        category === 'icons' ? 'icon-' : 
                        category === 'testimonials' ? 'testimonial-' : 
                        category === 'galleries' ? 'gallery-' : 
                        category === 'backgrounds' ? 'bg-' : ''
  
  return categoryPrefix + cleanName
}

// Helper function to get image dimensions from URL
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = url
  })
}

// Helper function to generate responsive image srcset
export function generateSrcSet(baseUrl: string, sizes: number[] = [400, 800, 1200, 1600]): string {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ')
}

// Default placeholder images for each category
export const PLACEHOLDER_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1920&h=1080&fit=crop',
  cards: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  logos: 'https://via.placeholder.com/200x60/00B3A4/FFFFFF?text=LOGO',
  icons: 'https://via.placeholder.com/64x64/00B3A4/FFFFFF?text=ICON',
  testimonials: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  galleries: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop',
  backgrounds: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop'
}

// Helper function to get placeholder image for category
export function getPlaceholderImage(category: string): string {
  return PLACEHOLDER_IMAGES[category as keyof typeof PLACEHOLDER_IMAGES] || PLACEHOLDER_IMAGES.cards
}
