# 📸 Image Inventory

Complete list of all downloaded images for PhotoVault website decoration.

**Last Updated:** October 9, 2025  
**Total Images:** 16  
**Total Size:** ~2.6 MB

---

## 📊 Summary by Category

| Category | Count | Total Size |
|----------|-------|------------|
| Cards | 4 | ~493 KB |
| Hero | 5 | ~740 KB |
| Galleries | 5 | ~1,083 KB |
| Testimonials | 2 | ~129 KB |
| **TOTAL** | **16** | **~2.6 MB** |

---

## 🎴 Cards (4 images)

Perfect for card hover effects, "How It Works" sections, and feature cards.

### 1. Elegant Accessories
- **File:** `elegant-accessories-bejeweled-sandals.jpg`
- **Size:** 177.6 KB
- **Dimensions:** ~1200px width
- **Source:** Pexels #34193227 by TLK GentooExpressions
- **Best for:** Luxury, elegance, detail-focused sections
- **Usage:** `/images/cards/elegant-accessories-bejeweled-sandals.jpg`

### 2. Hands Close-up
- **File:** `hands-close-up.jpg`
- **Size:** 179 KB
- **Source:** Pexels #27399921 by Emily Feine
- **Best for:** Connection, personal touch, relationships
- **Usage:** `/images/cards/hands-close-up.jpg`

### 3. Chess Piece
- **File:** `chess-piece.jpg`
- **Size:** 71.7 KB
- **Source:** Pexels #260024 by Pixabay
- **Best for:** Strategy, planning, business intelligence
- **Usage:** `/images/cards/chess-piece.jpg`

### 4. Yellow Soccer Ball
- **File:** `yellow-soccer-ball.jpg`
- **Size:** 65.2 KB
- **Source:** Pexels #31759373 by Anil Sharma
- **Best for:** Energy, sports, active lifestyle
- **Usage:** `/images/cards/yellow-soccer-ball.jpg`

---

## 🎯 Hero (5 images)

Full-width background images for hero sections.

### 1. Rio Aerial Landscape
- **File:** `rio-aerial-landscape.jpg`
- **Size:** 151.6 KB
- **Source:** Pexels #34217896 by Silas Guadagnini
- **Best for:** Main hero section, expansive views, travel/memories theme
- **Usage:** `/images/hero/rio-aerial-landscape.jpg`

### 2. City at Dawn
- **File:** `city-dawn-aerial.jpg`
- **Size:** 189.6 KB
- **Source:** Pexels #2093323 by Chait Goli
- **Best for:** Morning themes, new beginnings, urban landscapes
- **Usage:** `/images/hero/city-dawn-aerial.jpg`

### 3. Coastal Cityscape Aerial
- **File:** `coastal-cityscape-aerial.jpg`
- **Size:** 105.6 KB
- **Source:** Pexels #13338739 by Josh Sorenson
- **Best for:** Waterfront themes, coastal living, travel
- **Usage:** `/images/hero/coastal-cityscape-aerial.jpg`

### 4. Landscape with Cloudy Sky
- **File:** `landscape-cloudy-sky.jpg`
- **Size:** 124.1 KB
- **Source:** Pexels #248837 by Pixabay
- **Best for:** Nature themes, outdoor memories, atmospheric
- **Usage:** `/images/hero/landscape-cloudy-sky.jpg`

### 5. Waterfront City at Sunset
- **File:** `waterfront-city-sunset.jpg`
- **Size:** 169.6 KB
- **Source:** Pexels #13332184 by Josh Sorenson
- **Best for:** Sunset themes, romantic, evening ambiance
- **Usage:** `/images/hero/waterfront-city-sunset.jpg`

---

## 🖼️ Galleries (5 images)

Sample gallery images and portfolio showcases.

### 1. Elegant Statue in Botanical Garden
- **File:** `elegant-statue-botanical.jpg`
- **Size:** 352.9 KB
- **Source:** Pexels #34174834 by Vinícius Vieira ft
- **Best for:** Art, culture, outdoor photography examples
- **Usage:** `/images/galleries/elegant-statue-botanical.jpg`

### 2. Stone Lion Statues
- **File:** `stone-lion-statues.jpg`
- **Size:** 279.2 KB
- **Source:** Pexels #34164534 by YI REN
- **Best for:** Architecture, monuments, cultural photography
- **Usage:** `/images/galleries/stone-lion-statues.jpg`

### 3. Lighthouse and Boats
- **File:** `lighthouse-boats.jpg`
- **Size:** 181.2 KB
- **Source:** Pexels #34225022 by Ahmet
- **Best for:** Coastal scenes, maritime, travel photography
- **Usage:** `/images/galleries/lighthouse-boats.jpg`

### 4. Capitol Building Stairs
- **File:** `capitol-stairs.jpg`
- **Size:** 123.8 KB
- **Source:** Pexels #18845130 by Quang Vuong
- **Best for:** Architecture, government buildings, grand interiors
- **Usage:** `/images/galleries/capitol-stairs.jpg`

### 5. Capitol Building Painting
- **File:** `capitol-painting.jpg`
- **Size:** 146.4 KB
- **Source:** Pexels #18845147 by Quang Vuong
- **Best for:** Art, ceiling murals, historic architecture
- **Usage:** `/images/galleries/capitol-painting.jpg`

---

## 💬 Testimonials (2 images)

Customer photos and emotional connection images.

### 1. Mother and Baby
- **File:** `mother-baby.jpg`
- **Size:** 65.4 KB
- **Source:** Pexels #19550896 by Jonathan Borba
- **Best for:** Family, parenting, emotional connection
- **Usage:** `/images/testimonials/mother-baby.jpg`

### 2. White Goat
- **File:** `white-goat.jpg`
- **Size:** 63.7 KB
- **Source:** Pexels #593899 by Kat Smith
- **Best for:** Nature, pets, outdoor photography
- **Usage:** `/images/testimonials/white-goat.jpg`

---

## 💻 Quick Reference

### React/Next.js Usage

```tsx
// Simple image
<img 
  src="/images/cards/elegant-accessories-bejeweled-sandals.jpg" 
  alt="Elegant accessories" 
  className="w-full h-48 object-cover rounded-lg"
/>

// Hero background
<div 
  className="h-96 bg-cover bg-center"
  style={{ backgroundImage: 'url(/images/hero/rio-aerial-landscape.jpg)' }}
>
  <h1>Your Hero Title</h1>
</div>

// Image card with hover effect
<div className="image-card h-64">
  <img
    src="/images/cards/chess-piece.jpg"
    alt="Strategy"
    className="w-full h-full object-cover"
  />
  <div className="image-card-content">
    <h3 className="text-white font-semibold">Strategic Planning</h3>
    <p className="text-white/90">Plan your photo legacy</p>
  </div>
</div>
```

---

## 🎨 Suggested Usage

### Homepage Hero Section
```tsx
<div className="relative h-96" style={{ 
  backgroundImage: 'url(/images/hero/rio-aerial-landscape.jpg)' 
}}>
  <div className="absolute inset-0 bg-black/40" />
  <div className="relative z-10 text-white">
    <h1>Preserve Your Memories Forever</h1>
  </div>
</div>
```

### How It Works Cards
```tsx
const steps = [
  {
    image: '/images/cards/hands-close-up.jpg',
    title: 'Connect with Your Photographer',
    description: 'Personal relationships matter'
  },
  {
    image: '/images/cards/chess-piece.jpg',
    title: 'Plan Your Strategy',
    description: 'Organize your photo legacy'
  },
  {
    image: '/images/cards/yellow-soccer-ball.jpg',
    title: 'Capture Life\'s Moments',
    description: 'Active and vibrant memories'
  }
]
```

### Gallery Showcase
```tsx
const galleries = [
  {
    image: '/images/galleries/elegant-statue-botanical.jpg',
    title: 'Art & Culture',
    count: '450 photos'
  },
  {
    image: '/images/galleries/lighthouse-boats.jpg',
    title: 'Travel & Adventure',
    count: '320 photos'
  },
  {
    image: '/images/galleries/stone-lion-statues.jpg',
    title: 'Architecture',
    count: '280 photos'
  }
]
```

### Testimonials
```tsx
<div className="testimonial-card">
  <img 
    src="/images/testimonials/mother-baby.jpg" 
    alt="Happy family"
    className="w-16 h-16 rounded-full"
  />
  <p>"PhotoVault helped us preserve our most precious moments..."</p>
  <cite>- Sarah J., Happy Mom</cite>
</div>
```

---

## 📋 Legal & Attribution

All images sourced from **Pexels.com** under the Pexels License:
- ✅ Free for commercial and personal use
- ✅ No attribution required (but appreciated)
- ✅ Can modify, distribute, and use in products
- ❌ Cannot sell exact copies
- ❌ Cannot portray identifiable people in a bad light

### Photographer Credits (Optional but Recommended)

- TLK GentooExpressions
- Emily Feine
- Pixabay
- Anil Sharma
- Silas Guadagnini
- Vinícius Vieira ft
- YI REN
- Ahmet
- Jonathan Borba
- Kat Smith

---

## 🔄 Need More Images?

Use the download script:

```bash
node scripts/add-image.js "PEXELS_URL" category custom-name
```

Or ask me and I'll download them for you! 🚀

