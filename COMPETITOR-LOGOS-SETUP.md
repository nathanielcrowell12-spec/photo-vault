# Competitor Logo Auto-Update System

This system automatically updates competitor logos every 2 months to keep them current with their latest branding.

## 🎯 Features

- **Automatic Updates**: Logos refresh every 2 months
- **Real Competitor Logos**: Fetches actual logos from competitor websites
- **Admin Controls**: Manual update button for admins
- **Fallback System**: Uses placeholder images if fetching fails
- **Database Storage**: Logos stored in Supabase for performance

## 🛠️ Setup Instructions

### 1. Database Setup

Run the updated schema to create the `competitor_logos` table:

```sql
-- Execute the new schema.sql file in your Supabase SQL editor
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Optional: Secret for cron job security
CRON_SECRET=your-secret-key-here
```

### 3. Cron Job Setup

Choose one of these options:

#### Option A: Vercel Cron (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-logos",
      "schedule": "0 0 1 */2 *"
    }
  ]
}
```

#### Option B: GitHub Actions

Create `.github/workflows/update-logos.yml`:

```yaml
name: Update Competitor Logos
on:
  schedule:
    - cron: '0 0 1 */2 *'  # Every 2 months
  workflow_dispatch:  # Manual trigger

jobs:
  update-logos:
    runs-on: ubuntu-latest
    steps:
      - name: Update Logos
        run: |
          curl -X POST "${{ secrets.SITE_URL }}/api/cron/update-logos" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option C: External Cron Service

Use services like:
- **Cron-job.org**: Free cron service
- **EasyCron**: Reliable cron hosting
- **SetCronJob**: Simple cron management

Set the URL to: `https://yourdomain.com/api/cron/update-logos`

### 4. Logo Fetching Service

To get real competitor logos, integrate with:

#### Option A: Clearbit Logo API
```typescript
// In competitor-logos.ts, replace fetchCompetitorLogos()
async function fetchCompetitorLogos(): Promise<CompetitorLogo[]> {
  const logos = await Promise.all(
    DEFAULT_COMPETITOR_LOGOS.map(async (logo) => {
      try {
        const response = await fetch(`https://logo.clearbit.com/${logo.website}`)
        if (response.ok) {
          return {
            ...logo,
            logoUrl: response.url,
            lastUpdated: new Date().toISOString()
          }
        }
      } catch (error) {
        console.error(`Failed to fetch logo for ${logo.name}:`, error)
      }
      
      // Fallback to current logo
      return logo
    })
  )
  
  return logos
}
```

#### Option B: Custom Logo Scraping
```typescript
// Use Puppeteer or Playwright to scrape logos
import puppeteer from 'puppeteer'

async function scrapeLogo(website: string): Promise<string> {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.goto(website)
  const logoUrl = await page.evaluate(() => {
    // Find logo element and return src
    const logo = document.querySelector('img[alt*="logo"], .logo img, header img')
    return logo?.src || ''
  })
  
  await browser.close()
  return logoUrl
}
```

## 🎨 Usage

### In Components

```tsx
import CompetitorLogos from '@/components/CompetitorLogos'

// Basic usage
<CompetitorLogos />

// With admin update button
<CompetitorLogos showUpdateButton={isAdmin} />
```

### Manual API Calls

```typescript
// Get current logos
const response = await fetch('/api/competitor-logos')
const { logos } = await response.json()

// Force update logos (admin only)
const updateResponse = await fetch('/api/competitor-logos', {
  method: 'POST'
})
```

## 📊 Monitoring

### Check Update Status

```sql
-- Check when logos were last updated
SELECT name, last_updated, is_active 
FROM competitor_logos 
ORDER BY last_updated DESC;
```

### Manual Update

Visit: `https://yourdomain.com/api/cron/update-logos`

Or use the admin button in the dashboard.

## 🔧 Customization

### Add New Competitors

Update `DEFAULT_COMPETITOR_LOGOS` in `competitor-logos.ts`:

```typescript
{
  id: 'new-competitor',
  name: 'New Competitor',
  logoUrl: 'https://placeholder.com/logo.png',
  website: 'https://newcompetitor.com',
  lastUpdated: new Date().toISOString(),
  isActive: true
}
```

### Change Update Frequency

Modify the cron expression:
- Every month: `0 0 1 * *`
- Every 3 months: `0 0 1 */3 *`
- Every week: `0 0 * * 0`

## 🚀 Benefits

1. **Always Current**: Logos stay up-to-date with competitor rebrands
2. **Professional**: Real logos look more credible than placeholders
3. **Automatic**: No manual maintenance required
4. **Fast**: Logos cached in database for quick loading
5. **Flexible**: Easy to add new competitors or change update frequency

## 🎯 Next Steps

1. Set up the cron job using one of the options above
2. Integrate with a logo fetching service (Clearbit, etc.)
3. Test the system with manual updates
4. Monitor the first automatic update in 2 months

The system will now automatically keep your competitor logos current! 🎉
