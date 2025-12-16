'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera } from 'lucide-react'

export default function TestImagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-pixieset py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
            📸 Image Gallery Test
          </h1>
          <p className="text-lg text-muted-foreground font-light">
            Testing downloaded images from Pexels
          </p>
        </div>

        {/* Downloaded Images Stats */}
        <Card className="mb-8 card-shadow border border-border bg-gradient-to-r from-primary/10 to-secondary/50">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">10</div>
                <div className="text-sm text-muted-foreground">Total Images</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">4</div>
                <div className="text-sm text-muted-foreground">Cards</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Galleries</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">~1.6MB</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Images */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            🎴 Card Images (4)
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                src: '/images/cards/elegant-accessories-bejeweled-sandals.jpg',
                title: 'Elegant Accessories',
                photographer: 'TLK GentooExpressions'
              },
              {
                src: '/images/cards/hands-close-up.jpg',
                title: 'Hands Close-up',
                photographer: 'Emily Feine'
              },
              {
                src: '/images/cards/chess-piece.jpg',
                title: 'Chess Piece',
                photographer: 'Pixabay'
              },
              {
                src: '/images/cards/yellow-soccer-ball.jpg',
                title: 'Soccer Ball',
                photographer: 'Anil Sharma'
              }
            ].map((img, idx) => (
              <div key={idx} className="image-card h-48 group">
                <img
                  src={img.src}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="image-card-content">
                  <h3 className="text-foreground font-semibold text-sm">{img.title}</h3>
                  <p className="text-foreground/80 text-xs">by {img.photographer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Images */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            🎯 Hero Backgrounds (1)
          </h2>
          
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img
              src="/images/hero/rio-aerial-landscape.jpg"
              loading="lazy"
              alt="Rio aerial landscape"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-foreground">
                <h3 className="text-2xl font-bold mb-2">Rio Aerial Landscape</h3>
                <p className="text-foreground/90">by Silas Guadagnini</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            🖼️ Gallery Samples (3)
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                src: '/images/galleries/elegant-statue-botanical.jpg',
                title: 'Botanical Garden Statue',
                photographer: 'Vinícius Vieira ft'
              },
              {
                src: '/images/galleries/stone-lion-statues.jpg',
                title: 'Stone Lion Statues',
                photographer: 'YI REN'
              },
              {
                src: '/images/galleries/lighthouse-boats.jpg',
                title: 'Lighthouse & Boats',
                photographer: 'Ahmet'
              }
            ].map((img, idx) => (
              <Card key={idx} className="overflow-hidden card-shadow-hover border border-border group">
                <div className="h-48 overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{img.title}</h3>
                  <p className="text-sm text-muted-foreground">by {img.photographer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonial Images */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            💬 Testimonial Photos (2)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                src: '/images/testimonials/mother-baby.jpg',
                title: 'Mother & Baby',
                photographer: 'Jonathan Borba'
              },
              {
                src: '/images/testimonials/white-goat.jpg',
                title: 'White Goat',
                photographer: 'Kat Smith'
              }
            ].map((img, idx) => (
              <Card key={idx} className="card-shadow border border-border">
                <CardContent className="p-6 flex items-center gap-4">
                  <img
                    src={img.src}
                    alt={img.title}
                    loading="lazy"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{img.title}</h3>
                    <p className="text-sm text-muted-foreground">by {img.photographer}</p>
                    <p className="text-xs text-muted-foreground mt-2">Perfect for customer testimonials</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Use */}
        <Card className="card-shadow border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              How to Add More Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Find an Image</h3>
              <p className="text-sm text-muted-foreground">
                Browse Pexels.com or Unsplash.com for free, legal images
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 2: Copy the URL</h3>
              <p className="text-sm text-muted-foreground">
                Copy the page URL (e.g., https://www.pexels.com/photo/...)
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 3: Download</h3>
              <code className="block bg-secondary p-3 rounded text-xs">
                node scripts/add-image.js &quot;URL&quot; category custom-name
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 4: Use in Code</h3>
              <code className="block bg-secondary p-3 rounded text-xs">
                {`<img src="/images/category/filename.jpg" alt="Description" />`}
              </code>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-2">📁 Categories:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><code className="bg-secondary px-2 py-1 rounded">hero</code> - Hero backgrounds</div>
                <div><code className="bg-secondary px-2 py-1 rounded">cards</code> - Card images</div>
                <div><code className="bg-secondary px-2 py-1 rounded">logos</code> - Brand logos</div>
                <div><code className="bg-secondary px-2 py-1 rounded">icons</code> - UI icons</div>
                <div><code className="bg-secondary px-2 py-1 rounded">testimonials</code> - Customer photos</div>
                <div><code className="bg-secondary px-2 py-1 rounded">galleries</code> - Sample galleries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            💡 Usage Examples
          </h2>
          
          <div className="space-y-4">
            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="text-sm">Example: Hero Section</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary p-4 rounded text-xs overflow-x-auto">
{`<div className="relative h-96 overflow-hidden">
  <img
    src="/images/hero/your-hero-image.jpg"
    alt="Hero background"
    loading="lazy"
    className="w-full h-full object-cover"
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <h1 className="text-5xl font-bold text-foreground">
      Your Heading
    </h1>
  </div>
</div>`}
                </pre>
              </CardContent>
            </Card>

            <Card className="card-shadow border border-border">
              <CardHeader>
                <CardTitle className="text-sm">Example: Card with Hover</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary p-4 rounded text-xs overflow-x-auto">
{`<div className="image-card h-64">
  <img
    src="/images/cards/elegant-accessories-bejeweled-sandals.jpg"
    alt="Card image"
    loading="lazy"
    className="w-full h-full object-cover"
  />
  <div className="image-card-content">
    <h3 className="text-foreground text-lg font-semibold">
      Your Title
    </h3>
    <p className="text-foreground/90">
      Your description appears on hover
    </p>
  </div>
</div>`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

