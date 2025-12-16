'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ImageEffectsPage() {
  const effects = [
    {
      name: 'Hover Zoom',
      popularity: 'Very Popular',
      difficulty: 'Easy',
      description: 'Image scales up smoothly when hovered',
      useCases: ['Product galleries', 'Portfolio items', 'Card images'],
      code: `/* CSS */
.hover-zoom {
  transition: transform 0.3s ease;
}
.hover-zoom:hover {
  transform: scale(1.1);
}`,
      example: '/images/cards/elegant-accessories-bejeweled-sandals.jpg'
    },
    {
      name: 'Hover Slide-Up Text',
      popularity: 'Very Popular',
      difficulty: 'Easy',
      description: 'Text content slides up from bottom on hover',
      useCases: ['Feature cards', 'Team members', 'Service offerings'],
      code: `/* Already implemented! */
.image-card:hover .image-card-content {
  transform: translateY(0);
}`,
      example: '/images/cards/hands-close-up.jpg'
    },
    {
      name: 'Grayscale to Color',
      popularity: 'Popular',
      difficulty: 'Easy',
      description: 'Image transitions from grayscale to full color on hover',
      useCases: ['Team pages', 'Before/after', 'Historical photos'],
      code: `/* CSS */
.grayscale-hover {
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}
.grayscale-hover:hover {
  filter: grayscale(0%);
}`,
      example: '/images/galleries/elegant-statue-botanical.jpg'
    },
    {
      name: 'Overlay Fade-In',
      popularity: 'Very Popular',
      difficulty: 'Easy',
      description: 'Dark overlay with text fades in on hover',
      useCases: ['Galleries', 'Blog posts', 'Call-to-actions'],
      code: `/* CSS */
.overlay-fade::after {
  content: '';
  opacity: 0;
  transition: opacity 0.3s;
}
.overlay-fade:hover::after {
  opacity: 1;
}`,
      example: '/images/hero/city-dawn-aerial.jpg'
    },
    {
      name: 'Parallax Scroll',
      popularity: 'Trending',
      difficulty: 'Medium',
      description: 'Background images move at different speeds while scrolling',
      useCases: ['Hero sections', 'Landing pages', 'Storytelling'],
      code: `/* React + CSS */
const [scrollY, setScrollY] = useState(0);
<div style={{ 
  transform: \`translateY(\${scrollY * 0.5}px)\` 
}} />`,
      example: '/images/hero/landscape-cloudy-sky.jpg'
    },
    {
      name: 'Ken Burns Effect',
      popularity: 'Popular',
      difficulty: 'Medium',
      description: 'Slow, continuous zoom and pan animation',
      useCases: ['Hero backgrounds', 'Slideshows', 'Documentary style'],
      code: `/* CSS */
@keyframes kenburns {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.2) translate(-5%, -5%); }
}
.ken-burns {
  animation: kenburns 20s ease-in-out infinite alternate;
}`,
      example: '/images/hero/waterfront-city-sunset.jpg'
    },
    {
      name: 'Blur to Focus',
      popularity: 'Trending',
      difficulty: 'Easy',
      description: 'Image sharpens when hovered or scrolled into view',
      useCases: ['Attention grabbing', 'Interactive galleries', 'Reveals'],
      code: `/* CSS */
.blur-focus {
  filter: blur(4px);
  transition: filter 0.3s ease;
}
.blur-focus:hover {
  filter: blur(0);
}`,
      example: '/images/galleries/lighthouse-boats.jpg'
    },
    {
      name: '3D Tilt Effect',
      popularity: 'Trending',
      difficulty: 'Advanced',
      description: 'Card tilts in 3D based on mouse position',
      useCases: ['Product cards', 'Premium items', 'Interactive portfolios'],
      code: `/* JavaScript + CSS */
element.addEventListener('mousemove', (e) => {
  const xAxis = (e.offsetX / element.offsetWidth - 0.5) * 20;
  const yAxis = (e.offsetY / element.offsetHeight - 0.5) * -20;
  element.style.transform = \`rotateY(\${xAxis}deg) rotateX(\${yAxis}deg)\`;
});`,
      example: '/images/cards/chess-piece.jpg'
    },
    {
      name: 'Flip Card',
      popularity: 'Popular',
      difficulty: 'Medium',
      description: 'Card flips to reveal content on back',
      useCases: ['Team bios', 'Product details', 'Info cards'],
      code: `/* CSS */
.flip-card {
  perspective: 1000px;
}
.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}`,
      example: '/images/galleries/capitol-painting.jpg'
    },
    {
      name: 'Border Glow',
      popularity: 'Trendy',
      difficulty: 'Easy',
      description: 'Animated glowing border appears on hover',
      useCases: ['Call-to-actions', 'Featured items', 'Premium content'],
      code: `/* CSS */
.border-glow {
  position: relative;
}
.border-glow::before {
  box-shadow: 0 0 20px rgba(0, 179, 164, 0.8);
  opacity: 0;
  transition: opacity 0.3s;
}
.border-glow:hover::before {
  opacity: 1;
}`,
      example: '/images/cards/yellow-soccer-ball.jpg'
    },
    {
      name: 'Image Reveal Animation',
      popularity: 'Trending',
      difficulty: 'Medium',
      description: 'Image slides in with a reveal animation on scroll',
      useCases: ['Content sections', 'Feature highlights', 'Storytelling'],
      code: `/* CSS + Intersection Observer */
.reveal-left {
  transform: translateX(-100px);
  opacity: 0;
}
.reveal-left.active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.6s ease;
}`,
      example: '/images/galleries/stone-lion-statues.jpg'
    },
    {
      name: 'Zoom Pulse',
      popularity: 'Trendy',
      difficulty: 'Easy',
      description: 'Subtle pulsing zoom animation draws attention',
      useCases: ['New badges', 'Sales items', 'Featured content'],
      code: `/* CSS */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.pulse {
  animation: pulse 2s ease-in-out infinite;
}`,
      example: '/images/testimonials/mother-baby.jpg'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container-pixieset py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2 flex items-center gap-3">
                <Sparkles className="h-10 w-10 text-primary" />
                Popular Image Effects
              </h1>
              <p className="text-lg text-muted-foreground font-light">
                Modern, trending effects researched from top websites in 2024-2025
              </p>
            </div>
            <Button asChild className="btn-primary">
              <Link href="/admin/photo-upload">
                Back to Upload
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="card-shadow border border-border bg-gradient-to-br from-primary/10 to-secondary/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Total Effects</div>
              </CardContent>
            </Card>
            <Card className="card-shadow border border-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">6</div>
                <div className="text-sm text-muted-foreground">Easy to Implement</div>
              </CardContent>
            </Card>
            <Card className="card-shadow border border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-sm text-muted-foreground">Trending Now</div>
              </CardContent>
            </Card>
            <Card className="card-shadow border border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">4</div>
                <div className="text-sm text-muted-foreground">Very Popular</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Effects Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {effects.map((effect, idx) => (
            <Card key={idx} className="card-shadow border border-border overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{effect.name}</CardTitle>
                    <CardDescription>{effect.description}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={effect.popularity === 'Very Popular' ? 'default' : 'secondary'}
                      className={
                        effect.popularity === 'Very Popular' ? 'bg-purple-600' :
                        effect.popularity === 'Trending' ? 'bg-blue-600' :
                        'bg-green-600'
                      }
                    >
                      {effect.popularity === 'Trending' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {effect.popularity === 'Trendy' && <Zap className="h-3 w-3 mr-1" />}
                      {effect.popularity}
                    </Badge>
                    <Badge variant="outline">
                      {effect.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div className="relative h-48 rounded-lg overflow-hidden bg-secondary/30">
                  <Image
                    src={effect.example}
                    alt={effect.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Badge className="bg-white/90 text-foreground">
                      Hover to preview
                    </Badge>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Best for:</h4>
                  <div className="flex flex-wrap gap-2">
                    {effect.useCases.map((useCase, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {useCase}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Code */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Code:</h4>
                  <pre className="bg-secondary/50 p-3 rounded text-xs overflow-x-auto">
                    {effect.code}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Implementation Note */}
        <Card className="mt-12 card-shadow border border-border bg-gradient-to-r from-primary/10 to-secondary/30">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How to Use These Effects
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p>
                1. <strong className="text-foreground">Upload your photos</strong> using the Photo Upload Center
              </p>
              <p>
                2. <strong className="text-foreground">Select an effect</strong> from the dropdown menu when uploading
              </p>
              <p>
                3. <strong className="text-foreground">Tell me where to use them</strong> - I&apos;ll implement the effects for you
              </p>
              <p className="text-sm pt-4 border-t border-border">
                💡 <strong className="text-foreground">Pro Tip:</strong> Mix and match effects across different sections for variety. Hero sections work best with subtle parallax or Ken Burns, while cards shine with hover zoom or slide-up text.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

