# PhotoVault Interface Contract Lexicon

## Purpose
This document serves as a centralized registry of all TypeScript interfaces and their usage patterns to prevent interface drift and ensure consistency across the codebase.

## Core Interfaces

### PlatformCredentials
**Location:** `src/components/PlatformConnectionModal.tsx` (exported)
**Usage:** Platform connection modals, dashboard imports, client imports
**Contract:**
```typescript
interface PlatformCredentials {
  platform: string
  platformUrl?: string
  username?: string
  password: string
  galleryUrl?: string
  connectionType: 'gallery_link' | 'account_login'
}
```
**Usage Sites:**
- `src/app/dashboard/page.tsx` - handlePlatformConnect, handleDirectImport
- `src/app/client/import/page.tsx` - handlePlatformConnect
- `src/components/PlatformConnectionModal.tsx` - props interface

### PhotoSession
**Location:** `src/app/photographers/sessions/page.tsx` (local interface)
**Usage:** Photographer sessions management
**Contract:**
```typescript
interface PhotoSession {
  id: string
  client_id: string
  photographer_id: string
  session_date: string
  session_type: string
  description?: string  // Added during deployment fixes
  gallery_id?: string
  commission_reset: boolean
  created_at: string
  clients?: {
    id: string
    email: string
    name: string
  }
}
```
**Usage Sites:**
- `src/app/photographers/sessions/page.tsx` - sessions state, UI rendering

### PaymentOption
**Location:** `src/lib/payment-models.ts` (exported)
**Usage:** Payment plans, subscription management
**Contract:**
```typescript
interface PaymentOption {
  id: string
  name: string
  description: string
  price: number
  duration: number  // in months
  photographer_commission: number
  gallery_status: 'active' | 'inactive'
  reactivation_fee: number
  commission_applies: boolean
  terms: string[]
}
```
**Usage Sites:**
- `src/app/invite/[photographerId]/[paymentOption]/page.tsx` - payment state
- `src/lib/payment-models.ts` - PAYMENT_OPTIONS array

### AuthContextType
**Location:** `src/contexts/AuthContext.tsx` (exported interface)
**Usage:** Authentication state management
**Contract:**
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean  // NOT authLoading - this was a source of errors
  signUp: (email: string, password: string, userType: 'client' | 'photographer' | 'admin', fullName?: string) => Promise<{ error: unknown }>
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  userType: 'client' | 'photographer' | 'admin' | null
  userFullName: string | null
  paymentStatus: string | null
  isPaymentActive: boolean
}
```
**Usage Sites:**
- `src/app/photographers/clients/page.tsx` - destructured as `loading: authLoading`
- Multiple pages using `useAuth()` hook

## Migration History

### 2024-01-XX: PhotoSession Interface Updates
- **Added:** `description?: string` property
- **Reason:** UI was conditionally rendering `session.description` but interface was missing this property
- **Files Updated:** `src/app/photographers/sessions/page.tsx`

### 2024-01-XX: AuthContext Loading Property
- **Issue:** Code was using `authLoading` but interface provides `loading`
- **Fix:** Use destructuring alias: `const { loading: authLoading } = useAuth()`
- **Files Updated:** `src/app/photographers/clients/page.tsx`

## Interface Usage Rules

1. **Export Strategy:** Always export interfaces from their primary definition file
2. **Import Pattern:** Import interfaces explicitly: `import { InterfaceName } from './path'`
3. **Property Naming:** Use consistent naming (e.g., `business_name` not `business`)
4. **Optional Properties:** Mark optional properties with `?` and handle undefined cases
5. **State Alignment:** Ensure state interfaces match the data structures they represent

## Future Improvements

- [ ] Move shared interfaces to dedicated `src/types/` directory
- [ ] Add JSDoc comments to all interface properties
- [ ] Create automated interface validation tests
- [ ] Implement interface versioning for breaking changes

---
*This lexicon will be updated as interfaces evolve and new usage patterns are discovered.*
