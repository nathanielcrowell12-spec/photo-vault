# Founding Photographer Badge - Implementation Plan

**Created:** January 4, 2026
**Based on:** Research of existing codebase patterns
**Estimated Effort:** 30-45 minutes

---

## Research Summary

### 1. Database Schema (ALREADY EXISTS)

The `photographers` table already has the required columns:
- `is_beta_tester` (boolean, nullable)
- `beta_start_date` (timestamptz, nullable)
- `price_locked_at` (numeric, nullable)

**No database migration needed.**

### 2. Current Dashboard Data Flow

**File:** `src/app/photographer/dashboard/page.tsx`

The dashboard currently:
- Uses `useAuth()` hook for user data (lines 40-41)
- Fetches stats from `/api/photographer/stats` endpoint (lines 61-78)
- Does NOT have access to beta tester fields currently

**The stats API** (`src/app/api/photographer/stats/route.ts`) only returns:
- `activeClients`, `totalGalleries`, `monthlyEarnings`, `totalEarnings`, `totalPhotos`, `clientRating`, `ratingCount`

**It does NOT return:** `is_beta_tester`, `beta_start_date`, or `price_locked_at`

### 3. Current Settings Page Structure

**File:** `src/app/photographers/settings/page.tsx`

The settings page has:
- Multiple `<Card>` sections with consistent patterns (lines 315-762)
- Uses `<CardHeader>`, `<CardTitle>`, `<CardContent>` from shadcn/ui
- Icons from lucide-react in card titles
- `<Badge>` component already imported (line 16)
- No access to beta tester fields currently

### 4. Existing Badge Component

**File:** `src/components/ui/badge.tsx`

Standard shadcn/ui Badge with variants:
- `default`, `secondary`, `destructive`, `outline`
- Supports custom className for color overrides
- Already used throughout the codebase

### 5. Existing Badge Usage Patterns

From `src/components/photovault/data-display/StatusBadge.tsx`:
```tsx
<Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
  Founding Photographer
</Badge>
```

This shows the pattern for custom amber/gold colored badges with dark mode support.

---

## Implementation Plan

### Step 1: Create FoundingPhotographerBadge Component

**Create:** `src/components/photographer/FoundingPhotographerBadge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface FoundingPhotographerBadgeProps {
  isBetaTester: boolean
  className?: string
}

/**
 * Badge component for founding/beta photographers
 * Only renders if isBetaTester is true
 */
export function FoundingPhotographerBadge({
  isBetaTester,
  className = ''
}: FoundingPhotographerBadgeProps) {
  if (!isBetaTester) return null

  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700 ${className}`}
    >
      <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
      Founding Photographer
    </Badge>
  )
}
```

**Accessibility Notes:**
- Badge uses `<span>` by default which is appropriate
- Star icon is decorative (text provides meaning)
- Color contrast meets WCAG AA for both light and dark modes

---

### Step 2: Update Stats API to Include Beta Tester Fields

**Modify:** `src/app/api/photographer/stats/route.ts`

Add to the existing response by querying the `photographers` table:

**At line 19 (after getting authenticated user), add:**
```typescript
    // Get photographer beta tester status
    const { data: photographerProfile } = await supabase
      .from('photographers')
      .select('is_beta_tester, beta_start_date, price_locked_at')
      .eq('id', user.id)
      .single()
```

**At line 76-87 (in the return statement), add to the stats object:**
```typescript
    return NextResponse.json({
      success: true,
      stats: {
        activeClients: clientsCount || 0,
        totalGalleries: galleriesCount || 0,
        monthlyEarnings: monthlyEarnings,
        totalEarnings: totalEarnings,
        totalPhotos: photosCount || 0,
        clientRating: Math.round(clientRating * 10) / 10,
        ratingCount: ratingCount,
      },
      profile: {
        isBetaTester: photographerProfile?.is_beta_tester || false,
        betaStartDate: photographerProfile?.beta_start_date || null,
        priceLockedAt: photographerProfile?.price_locked_at || null,
      }
    })
```

---

### Step 3: Update Dashboard to Display Badge

**Modify:** `src/app/photographer/dashboard/page.tsx`

#### 3a. Add import (after line 37):
```typescript
import { FoundingPhotographerBadge } from '@/components/photographer/FoundingPhotographerBadge'
```

#### 3b. Add profile state (after line 47):
```typescript
  const [profile, setProfile] = useState({
    isBetaTester: false,
    betaStartDate: null as string | null,
    priceLockedAt: null as number | null,
  })
```

#### 3c. Update fetchStats to include profile data (lines 61-78):
Replace the existing `fetchStats` function:
```typescript
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/photographer/stats')
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
          if (data.profile) {
            setProfile(data.profile)
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])
```

#### 3d. Add badge to dashboard header

**Location:** Lines 292-294 (after the "Premium Member" badge in the hero section)

Replace:
```tsx
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                    <Star size={12} fill="currentColor" /> Premium Member
                  </div>
```

With:
```tsx
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
                      <Star size={12} fill="currentColor" /> Premium Member
                    </div>
                    <FoundingPhotographerBadge isBetaTester={profile.isBetaTester} />
                  </div>
```

---

### Step 4: Add Founding Photographer Status Card to Settings Page

**Modify:** `src/app/photographers/settings/page.tsx`

#### 4a. Add import (after line 34):
```typescript
import { Star } from 'lucide-react'
```

#### 4b. Add profile state (after line 73):
```typescript
  // Beta tester profile state
  const [betaProfile, setBetaProfile] = useState<{
    isBetaTester: boolean
    betaStartDate: string | null
    priceLockedAt: number | null
  } | null>(null)
```

#### 4c. Fetch beta profile data

**In the existing `useEffect` that fetches Stripe status (lines 103-108)**, add a call to fetch stats:
```typescript
  // Fetch Stripe Connect status and beta profile
  useEffect(() => {
    if (user && userType === 'photographer') {
      fetchStripeStatus()
      fetchSubscriptionStatus()
      fetchBetaProfile()
    }
  }, [user, userType])
```

**Add the fetch function (after `fetchSubscriptionStatus`):**
```typescript
  const fetchBetaProfile = async () => {
    try {
      const response = await fetch('/api/photographer/stats')
      const data = await response.json()
      if (data.success && data.profile) {
        setBetaProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching beta profile:', error)
    }
  }
```

#### 4d. Add Founding Photographer Status Card

**Location:** After the Stripe Success Alert (line 306) and before Payment Settings Card (line 314)

```tsx
            {/* Founding Photographer Status */}
            {betaProfile?.isBetaTester && (
              <Card className="border-2 border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    Founding Photographer Status
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300">
                    You're one of our founding photographers! Here's what that means:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Free Platform Access</p>
                        <p className="text-sm text-muted-foreground">
                          {betaProfile.betaStartDate ? (
                            <>Platform fee waived until {
                              new Date(
                                new Date(betaProfile.betaStartDate).setMonth(
                                  new Date(betaProfile.betaStartDate).getMonth() + 12
                                )
                              ).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            }</>
                          ) : (
                            <>12 months of free platform access</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Lifetime Price Lock</p>
                        <p className="text-sm text-muted-foreground">
                          ${betaProfile.priceLockedAt || 22}/month forever - immune to future price increases
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Direct Founder Access</p>
                        <p className="text-sm text-muted-foreground">
                          Priority support and direct line to the founder for feedback
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Standard 50/50 Commission</p>
                        <p className="text-sm text-muted-foreground">
                          Earn 50% commission on all client payments
                        </p>
                      </div>
                    </div>
                  </div>

                  {betaProfile.betaStartDate && (
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Member since {new Date(betaProfile.betaStartDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
```

---

## Files to Create/Modify Summary

| File | Action | Lines Changed |
|------|--------|--------------|
| `src/components/photographer/FoundingPhotographerBadge.tsx` | CREATE | ~25 lines |
| `src/app/api/photographer/stats/route.ts` | MODIFY | ~15 lines |
| `src/app/photographer/dashboard/page.tsx` | MODIFY | ~25 lines |
| `src/app/photographers/settings/page.tsx` | MODIFY | ~80 lines |

---

## Testing Steps

### 1. Unit Test: Badge Component
```typescript
// Test that badge renders only when isBetaTester is true
expect(FoundingPhotographerBadge({ isBetaTester: false })).toBeNull()
expect(FoundingPhotographerBadge({ isBetaTester: true })).toContainText('Founding Photographer')
```

### 2. Manual Testing Checklist

- [ ] Log in as a photographer with `is_beta_tester = false` - badge should NOT appear
- [ ] Update a photographer record to `is_beta_tester = true`:
  ```sql
  UPDATE photographers
  SET is_beta_tester = true,
      beta_start_date = NOW(),
      price_locked_at = 22.00
  WHERE id = 'your-test-user-id';
  ```
- [ ] Refresh dashboard - "Founding Photographer" badge should appear next to "Premium Member"
- [ ] Navigate to Settings - "Founding Photographer Status" card should appear
- [ ] Verify dark mode colors look correct in both locations
- [ ] Test responsive layout - badge should wrap properly on mobile
- [ ] Verify free period end date calculates correctly (beta_start_date + 12 months)

### 3. API Test
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/photographer/stats

# Expected response should now include:
# {
#   "success": true,
#   "stats": { ... },
#   "profile": {
#     "isBetaTester": true,
#     "betaStartDate": "2026-01-04T12:00:00.000Z",
#     "priceLockedAt": 22
#   }
# }
```

---

## Accessibility Considerations

1. **Color Contrast:** Amber/gold colors (amber-700 on amber-50 background) meet WCAG AA contrast ratio of 4.5:1
2. **Dark Mode:** Custom dark mode classes ensure readability (`dark:text-amber-200` on `dark:bg-amber-900/30`)
3. **Icon Purpose:** Star icon is decorative; text provides all meaning
4. **Screen Readers:** Badge text "Founding Photographer" is readable; no aria-label needed
5. **Focus States:** Inherits shadcn/ui Badge focus-visible styles

---

## Notes

1. **Why modify stats API instead of creating new endpoint?**
   - Dashboard already fetches `/api/photographer/stats` on load
   - No additional network request needed
   - Profile data is small (3 fields)

2. **Why not use AuthContext?**
   - AuthContext fetches from `user_profiles` table
   - Beta tester fields are in `photographers` table
   - Would require changing AuthContext which affects many pages

3. **Settings page re-uses stats endpoint**
   - Alternative: Create `/api/photographer/profile` endpoint
   - Current approach is simpler for MVP
   - Can refactor later if needed

---

**END OF PLAN**

*This plan is based on actual codebase research, not the spec document. Ready for implementation.*
