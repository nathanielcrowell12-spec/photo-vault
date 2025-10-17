# 📸 Image Download Guide

Quick guide for downloading and using images from legal sources.

## ✅ Downloaded Images

### Cards Category (4 images)
- ✅ `elegant-accessories-bejeweled-sandals.jpg` (177.6KB)
  - Source: Pexels #34193227 by TLK GentooExpressions
  - Usage: `/images/cards/elegant-accessories-bejeweled-sandals.jpg`
- ✅ `hands-close-up.jpg` (179KB)
  - Source: Pexels #27399921 by Emily Feine
  - Usage: `/images/cards/hands-close-up.jpg`
- ✅ `chess-piece.jpg` (71.7KB)
  - Source: Pexels #260024 by Pixabay
  - Usage: `/images/cards/chess-piece.jpg`
- ✅ `yellow-soccer-ball.jpg` (65.2KB)
  - Source: Pexels #31759373 by Anil Sharma
  - Usage: `/images/cards/yellow-soccer-ball.jpg`

### Hero Category (5 images)
- ✅ `rio-aerial-landscape.jpg` (151.6KB)
  - Source: Pexels #34217896 by Silas Guadagnini
  - Usage: `/images/hero/rio-aerial-landscape.jpg`
- ✅ `city-dawn-aerial.jpg` (189.6KB)
  - Source: Pexels #2093323 by Chait Goli
  - Usage: `/images/hero/city-dawn-aerial.jpg`
- ✅ `coastal-cityscape-aerial.jpg` (105.6KB)
  - Source: Pexels #13338739 by Josh Sorenson
  - Usage: `/images/hero/coastal-cityscape-aerial.jpg`
- ✅ `landscape-cloudy-sky.jpg` (124.1KB)
  - Source: Pexels #248837 by Pixabay
  - Usage: `/images/hero/landscape-cloudy-sky.jpg`
- ✅ `waterfront-city-sunset.jpg` (169.6KB)
  - Source: Pexels #13332184 by Josh Sorenson
  - Usage: `/images/hero/waterfront-city-sunset.jpg`

### Galleries Category (5 images)
- ✅ `elegant-statue-botanical.jpg` (352.9KB)
  - Source: Pexels #34174834 by Vinícius Vieira ft
  - Usage: `/images/galleries/elegant-statue-botanical.jpg`
- ✅ `stone-lion-statues.jpg` (279.2KB)
  - Source: Pexels #34164534 by YI REN
  - Usage: `/images/galleries/stone-lion-statues.jpg`
- ✅ `lighthouse-boats.jpg` (181.2KB)
  - Source: Pexels #34225022 by Ahmet
  - Usage: `/images/galleries/lighthouse-boats.jpg`
- ✅ `capitol-stairs.jpg` (123.8KB)
  - Source: Pexels #18845130 by Quang Vuong
  - Usage: `/images/galleries/capitol-stairs.jpg`
- ✅ `capitol-painting.jpg` (146.4KB)
  - Source: Pexels #18845147 by Quang Vuong
  - Usage: `/images/galleries/capitol-painting.jpg`

### Testimonials Category (2 images)
- ✅ `mother-baby.jpg` (65.4KB)
  - Source: Pexels #19550896 by Jonathan Borba
  - Usage: `/images/testimonials/mother-baby.jpg`
- ✅ `white-goat.jpg` (63.7KB)
  - Source: Pexels #593899 by Kat Smith
  - Usage: `/images/testimonials/white-goat.jpg`

### ❌ Failed Downloads (4 images - older Pexels photos may have been removed)
- Pexels #63320 (mascara)
- Pexels #45201 (kitten)
- Pexels #35537 (toddler)
- Pexels #64242 (baby finger)

## 🚀 How to Download More Images

### Quick Method (Pexels & Unsplash)

```bash
node scripts/add-image.js "<URL>" <category> [custom-name]
```

### Examples

```bash
# Download to cards folder
node scripts/add-image.js "https://www.pexels.com/photo/..." cards

# Download to hero folder with custom name
node scripts/add-image.js "https://www.pexels.com/photo/..." hero my-custom-name

# Download from Unsplash
node scripts/add-image.js "https://unsplash.com/photos/..." testimonials
```

### Categories

- `hero` - Full-width hero backgrounds (1920x1080px)
- `cards` - Card images with hover effects (400x300px)
- `logos` - Company and brand logos (200x60px)
- `icons` - Custom icons and graphics (64x64px)
- `testimonials` - Customer photos (300x300px)
- `galleries` - Sample photo galleries (400x300px)
- `backgrounds` - Patterns and textures (1920x1080px)

## 💻 Using Images in Code

### React/Next.js Components

```tsx
// Simple usage
<img 
  src="/images/cards/elegant-accessories-bejeweled-sandals.jpg" 
  alt="Elegant accessories" 
/>

// With Next.js Image component
import Image from 'next/image'

<Image
  src="/images/cards/elegant-accessories-bejeweled-sandals.jpg"
  alt="Elegant accessories"
  width={400}
  height={300}
  className="rounded-lg"
/>

// With hover effects
<div className="image-card">
  <img 
    src="/images/cards/elegant-accessories-bejeweled-sandals.jpg" 
    alt="Elegant accessories" 
  />
  <div className="image-card-content">
    <h3>Your Title</h3>
    <p>Your description</p>
  </div>
</div>
```

### Card Example (How It Works Section)

```tsx
{[
  {
    step: "1",
    title: "Elegant Memories",
    description: "Capture life's precious moments",
    image: "/images/cards/elegant-accessories-bejeweled-sandals.jpg"
  }
].map((item) => (
  <Card className="image-card">
    <div className="h-48">
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-full object-cover"
      />
    </div>
    <CardContent>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </CardContent>
  </Card>
))}
```

## 📋 Legal Sources

### Pexels.com
- ✅ Free for commercial use
- ✅ No attribution required (but appreciated)
- ✅ Modify, distribute, and use
- ❌ Don't sell exact copies
- ❌ Don't portray identifiable people in bad light

### Unsplash.com
- ✅ Free for commercial and non-commercial use
- ✅ No permission needed
- ✅ Attribution not required (but appreciated)
- ❌ Don't compile photos to replicate a similar service
- ❌ Don't sell exact copies

### Best Practices
1. **Always verify license** on the source website
2. **Give credit** when possible (good practice)
3. **Keep records** of where images came from
4. **Respect photographers** - consider donations or follows

## 🎨 Image Optimization Tips

### Before Downloading
- Choose high-resolution images (1200px+ width)
- Look for images that match your brand colors
- Consider composition and focal points

### After Downloading
- Images auto-download at 1200px width
- Further optimization with tools like:
  - TinyPNG.com (compression)
  - Squoosh.app (format conversion)
  - ImageOptim (Mac) / FileOptimizer (Windows)

### File Formats
- **JPG**: Photos, complex images
- **PNG**: Logos, graphics with transparency
- **WebP**: Modern format, best compression
- **SVG**: Icons, logos, simple graphics

## 📁 Folder Organization

Current structure:
```
public/images/
├── hero/
├── cards/
│   └── elegant-accessories-bejeweled-sandals.jpg ✅
├── logos/
├── icons/
├── testimonials/
├── galleries/
├── competitors/
└── backgrounds/
```

## 🔄 Quick Download Workflow

1. **Find image** on Pexels or Unsplash
2. **Copy the page URL** (not the image URL)
3. **Run command**: `node scripts/add-image.js "<URL>" <category>`
4. **Use in code**: `/images/<category>/<filename>.jpg`
5. **Test**: Refresh your website to see the image

## 💡 Pro Tips

- Use descriptive filenames (e.g., `hero-family-beach-sunset.jpg`)
- Keep consistent naming conventions
- Organize by category first, then by theme
- Document where images came from
- Update this file when adding new images

---

**Need to add an image?** Just give me the Pexels/Unsplash URL and tell me:
1. Which category? (hero, cards, logos, etc.)
2. Custom filename? (optional)

I'll download it and organize it for you! 🚀

