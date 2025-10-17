# 🎯 Pixieset Integration Test Plan

**Goal:** Customer signup → Login → Connect Pixieset → Import Gallery → View Photos

**Date:** October 12, 2025  
**Status:** Ready to Start

---

## 📋 **Phase 1: Pre-Flight Checklist** ✅

### Files Status
| File | Status | Notes |
|------|--------|-------|
| `/signup` page | ✅ Built | Customer signup form |
| `/login` page | ✅ Built | Login for all user types |
| `/dashboard` (customer) | ✅ Built | Customer dashboard view |
| `/client/import` page | ✅ Built | Pixieset import interface |
| `/client/galleries` page | ❌ Missing | Need to build |
| Supabase Schema | ✅ Ready | Tables for users, galleries, photos |
| Auth Context | ✅ Working | User authentication |

---

## 🧪 **Phase 2: Core Flow Testing**

### Test 1: Customer Signup ✅
**URL:** http://localhost:3000/signup

**Steps:**
1. Visit signup page
2. Fill out form:
   - Full Name: "Test Customer"
   - Email: "customer@test.com"
   - Password: "TestPass123!"
3. Click "Create Account"
4. Verify redirect to dashboard
5. Check Supabase:
   ```sql
   SELECT * FROM user_profiles WHERE user_type = 'client';
   ```

**Expected Results:**
- ✅ Account created in Supabase
- ✅ user_type = 'client'
- ✅ Redirected to customer dashboard
- ✅ No console errors

**Potential Issues:**
- ⚠️ Supabase connection
- ⚠️ RLS policies might block insert
- ⚠️ Email validation

---

### Test 2: Customer Login ✅
**URL:** http://localhost:3000/login

**Steps:**
1. Visit login page
2. Enter credentials:
   - Email: "customer@test.com"
   - Password: "TestPass123!"
3. Click "Log In"
4. Verify redirect to dashboard
5. Check dashboard shows customer view

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to /dashboard
- ✅ Dashboard shows customer interface (not photographer)
- ✅ Navigation shows customer links

**Potential Issues:**
- ⚠️ Wrong redirect for user type
- ⚠️ Session not persisting

---

### Test 3: Dashboard Access ✅
**URL:** http://localhost:3000/dashboard

**Steps:**
1. While logged in as customer
2. Visit dashboard
3. Verify customer interface shows:
   - Welcome message
   - Import photos card
   - Gallery count
   - Timeline link

**Expected Results:**
- ✅ Customer dashboard renders
- ✅ No photographer-specific UI
- ✅ "Import Photos" button visible
- ✅ Links to /client/* pages work

**Potential Issues:**
- ⚠️ View mode confusion (admin switcher)
- ⚠️ Missing customer data

---

### Test 4: Import Page Load ✅
**URL:** http://localhost:3000/client/import

**Steps:**
1. Click "Import Photos" from dashboard
2. Verify import page loads
3. Check Pixieset card shows
4. Verify no console errors

**Expected Results:**
- ✅ Page loads without errors
- ✅ Shows 4 platform cards (Pixieset, ShootProof, SmugMug, Pic-Time)
- ✅ Pixieset card shows "Available"
- ✅ Click Pixieset opens connection modal

**Potential Issues:**
- ⚠️ Router redirect error (now fixed)
- ⚠️ User type check failing

---

## 🔌 **Phase 3: Pixieset Integration** 

### Research: Pixieset API Options

**Option A: Official Pixieset API** 🔍
- **Status:** Need to research if public API exists
- **Pros:** Official, supported, structured data
- **Cons:** Might not be public, requires API key

**Option B: Gallery URL Import** ✅ (Recommended Start)
- **Status:** Can implement immediately
- **Pros:** No API key needed, works with any gallery link
- **Cons:** May need to scrape HTML (or manual input)

**Option C: OAuth Integration** 🔒
- **Status:** Advanced
- **Pros:** Secure, automatic syncing
- **Cons:** Complex setup, requires Pixieset partnership

---

### Implementation: Gallery URL Import (Start Here)

**User Flow:**
```
1. Customer clicks "Connect Pixieset"
2. Modal opens asking for:
   - Gallery URL (e.g., https://yourphotographer.pixieset.com/gallery-name/)
   - Gallery password (if protected)
3. Click "Import Gallery"
4. System fetches gallery data
5. Photos imported to PhotoVault
6. Success message shown
7. Redirect to gallery view
```

**What We Need to Build:**

#### 1. Gallery URL Form (Update Import Page) ✏️
```typescript
// In /client/import/page.tsx - Connection Modal
<Input
  placeholder="https://yourphotographer.pixieset.com/gallery-name/"
  value={connectionForm.galleryUrl}
  onChange={(e) => setConnectionForm({...connectionForm, galleryUrl: e.target.value})}
/>
<Input
  type="password"
  placeholder="Gallery password (if required)"
  value={connectionForm.password}
/>
<Button onClick={handlePixiesetImport}>
  Import Gallery
</Button>
```

#### 2. API Endpoint: `/api/import/pixieset` 🔨
**File:** `src/app/api/import/pixieset/route.ts`

**Functionality:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Get gallery URL and password from request
  // 2. Fetch gallery page (or use Pixieset API if available)
  // 3. Extract:
  //    - Gallery name
  //    - Photographer name
  //    - Photo URLs
  //    - Photo metadata
  // 4. Create gallery in Supabase
  // 5. Download/link photos to Supabase Storage
  // 6. Create photo records in database
  // 7. Return success with gallery ID
}
```

#### 3. Gallery Display Page: `/client/galleries` 🖼️
**File:** `src/app/client/galleries/page.tsx`

**Features:**
- List all imported galleries
- Show gallery thumbnails
- Click to view full gallery
- Filter by photographer
- Search functionality

#### 4. Single Gallery View: `/client/galleries/[id]` 🎨
**File:** `src/app/client/galleries/[id]/page.tsx`

**Features:**
- Display all photos from gallery
- Grid view
- Lightbox for full-size
- Download photos
- Mark favorites
- Share gallery

---

## 🗄️ **Phase 4: Database Structure**

### Tables Needed (Already in schema.sql ✅)

**1. galleries** ✅
```sql
CREATE TABLE galleries (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES user_profiles(id),
  name VARCHAR(255),
  photographer_name VARCHAR(255),
  photographer_business VARCHAR(255),
  session_date DATE,
  session_type VARCHAR(50),
  platform_source VARCHAR(50), -- 'pixieset'
  external_url TEXT, -- Original Pixieset URL
  created_at TIMESTAMP
);
```

**2. photos** ✅
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  client_id UUID,
  filename VARCHAR(255),
  url TEXT, -- Supabase Storage URL or external
  thumbnail_url TEXT,
  size BIGINT,
  type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  date_taken TIMESTAMP,
  is_favorite BOOLEAN DEFAULT false,
  upload_source VARCHAR(50), -- 'pixieset_import'
  created_at TIMESTAMP
);
```

**3. platform_connections** ✅
```sql
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES user_profiles(id),
  platform_name VARCHAR(50), -- 'pixieset'
  connection_type VARCHAR(50), -- 'gallery_url'
  status VARCHAR(50), -- 'connected', 'active'
  last_sync TIMESTAMP,
  galleries_count INTEGER DEFAULT 0,
  photos_count INTEGER DEFAULT 0,
  created_at TIMESTAMP
);
```

---

## 🔧 **Phase 5: Build Plan**

### Priority 1: Quick Win (Can do today) ⚡
1. ✅ Fix import page redirect (DONE)
2. ✅ Test signup flow
3. ✅ Test login flow
4. ✅ Test dashboard access
5. ✅ Test import page loads
6. 🔨 Build simple gallery URL input
7. 🔨 Create galleries list page
8. 🔨 Test manual gallery creation

### Priority 2: Basic Import (Tomorrow) 📸
1. 🔨 Build `/api/import/pixieset` endpoint
2. 🔨 Implement gallery URL parsing
3. 🔨 Fetch gallery data (scrape or API)
4. 🔨 Store in Supabase
5. 🔨 Display imported gallery
6. 🔨 Test end-to-end import

### Priority 3: Full Features (This Week) 🚀
1. 🔨 Photo lightbox view
2. 🔨 Download functionality
3. 🔨 Favorite marking
4. 🔨 Gallery sharing
5. 🔨 Automatic syncing
6. 🔨 Multiple platform support

---

## 📝 **Testing Checklist**

### Manual Testing Steps
```
□ Create customer account
□ Verify in Supabase user_profiles table
□ Log out
□ Log back in
□ Access customer dashboard
□ Click "Import Photos"
□ Verify import page loads
□ Enter Pixieset gallery URL
□ Import gallery (once API built)
□ View imported gallery
□ View individual photos
□ Mark photo as favorite
□ Download photo
```

### Required Test Data
```
Test Customer Account:
- Email: customer@test.com
- Password: TestPass123!
- Name: Test Customer

Test Pixieset Gallery:
- URL: [Need a public test gallery]
- Password: [If required]
- Expected Photos: [Number]
```

---

## 🚦 **Current Status**

### ✅ **Ready to Test**
- Customer signup
- Customer login
- Dashboard access
- Import page loading

### 🔨 **Need to Build**
- Pixieset API integration
- Gallery URL import
- Galleries list page
- Single gallery view
- Photo download

### 🔍 **Need to Research**
- Does Pixieset have a public API?
- How to fetch gallery data?
- Photo storage strategy (link or download?)

---

## 🎯 **Today's Goals**

### Goal 1: Complete Flow Testing (30 min)
1. Test customer signup ✅
2. Test customer login ✅
3. Test dashboard access ✅
4. Test import page ✅
5. Document any issues

### Goal 2: Build Galleries Page (1 hour)
1. Create `/client/galleries/page.tsx`
2. List imported galleries
3. Show gallery cards
4. Link to gallery view

### Goal 3: Start Pixieset Research (30 min)
1. Research Pixieset API
2. Find test gallery URL
3. Determine best import method

### Goal 4: Build Basic Import (2 hours)
1. Create API endpoint
2. Test with sample URL
3. Store in database
4. Display imported gallery

---

## 📞 **Questions to Answer**

1. **How should we store Pixieset photos?**
   - Option A: Download to Supabase Storage (full backup)
   - Option B: Link to external URLs (faster, less storage)
   - **Recommendation:** Start with links, add download later

2. **Do we need Pixieset API key?**
   - Check if public API exists
   - If not, use gallery URL method
   - **Next Step:** Research Pixieset developer docs

3. **How often to sync?**
   - Manual only (start here)
   - Daily automatic
   - Real-time webhooks

---

## 🚀 **Let's Start!**

**First Steps:**
1. Run the dev server (if not running)
2. Visit http://localhost:3000/signup
3. Create a test customer account
4. Test the complete flow
5. Document what works and what needs building

**Ready to begin testing?** 🎉

