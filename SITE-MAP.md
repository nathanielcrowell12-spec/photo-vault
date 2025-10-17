# 🗺️ PhotoVault Complete Site Map

Complete list of all pages and their URLs.

**Base URL (Development):** http://localhost:3000  
**Base URL (Production):** https://your-domain.vercel.app

---

## 🏠 **Public Pages** (No Login Required)

### Landing Pages
| Page | URL | Description |
|------|-----|-------------|
| **Customer Homepage** | `/` | Main landing page for customers/families |
| **Photographer Homepage** | `/photographers` | Landing page for photographers |
| **Commission Details** | `/photographers/commission-details` | Detailed commission structure and rules |

### Authentication
| Page | URL | Description |
|------|-----|-------------|
| **Login** | `/login` | Login for all user types (admin, photographer, customer) |
| **Customer Signup** | `/signup` | Signup page for customers |
| **Photographer Signup** | `/photographers/signup` | Signup page for photographers |

---

## 👤 **Customer Pages** (Customer Login Required)

### Main Dashboard
| Page | URL | Description |
|------|-----|-------------|
| **Customer Dashboard** | `/dashboard` | Main customer dashboard (when logged in as customer) |

### Gallery Management
| Page | URL | Description |
|------|-----|-------------|
| **All Galleries** | `/client/galleries` | View all photo galleries |
| **Timeline View** | `/client/timeline` | Chronological photo timeline |
| **Import Photos** | `/client/import` | Import photos from other platforms |

### Settings & Profile
| Page | URL | Description |
|------|-----|-------------|
| **Account Settings** | `/client/settings` | Customer account settings |
| **Subscription** | `/client/subscription` | Manage $8/month subscription |

---

## 📸 **Photographer Pages** (Photographer Login Required)

### Main Dashboard
| Page | URL | Description |
|------|-----|-------------|
| **Photographer Dashboard** | `/dashboard` | Main photographer dashboard (when logged in as photographer) |

### Client Management
| Page | URL | Description |
|------|-----|-------------|
| **Client List** | `/photographers/clients` | Manage all clients |
| **Client Details** | `/photographers/clients/[id]` | Individual client details |

### Session Management
| Page | URL | Description |
|------|-----|-------------|
| **Sessions** | `/photographers/sessions` | Manage photo sessions |
| **Upload Session** | `/photographers/sessions/upload` | Upload photos from a session |

### Revenue & Analytics
| Page | URL | Description |
|------|-----|-------------|
| **Revenue Dashboard** | `/photographers/revenue` | Track earnings and commissions |
| **Reports** | `/photographers/reports` | Analytics and reports |

### Settings
| Page | URL | Description |
|------|-----|-------------|
| **Photographer Settings** | `/photographers/settings` | Photographer account settings |

---

## 🔐 **Admin Pages** (Admin Login Required)

### Main Dashboard
| Page | URL | Description |
|------|-----|-------------|
| **Admin Dashboard** | `/dashboard` | Admin control center with view switcher |

### Business Tools
| Page | URL | Description |
|------|-----|-------------|
| **Business Analytics** | `/admin/business-analytics` | Profitability calculator, projections, valuation metrics |
| **Photo Upload Center** | `/admin/photo-upload` | Drag & drop photo upload with effects |
| **Image Effects Showcase** | `/admin/image-effects` | Browse 12 popular image effects |
| **Image Manager** | `/admin/image-upload` | Manage website decoration images |

### Testing & Development
| Page | URL | Description |
|------|-----|-------------|
| **Test Dashboard** | `/test-dashboard` | Test all features and functionality |
| **Dev Dashboard** | `/dev-dashboard` | Development tools and utilities |
| **Test Images** | `/test-images` | View all uploaded images with effects |

---

## 📊 **Complete Page List (Alphabetical)**

### A-C
- `/` - Customer Homepage
- `/admin/business-analytics` - Business Analytics Dashboard
- `/admin/image-effects` - Image Effects Showcase
- `/admin/image-upload` - Image Manager (old)
- `/admin/photo-upload` - Photo Upload Center (new)
- `/client/galleries` - Customer Galleries
- `/client/import` - Import Photos
- `/client/settings` - Customer Settings
- `/client/subscription` - Subscription Management
- `/client/timeline` - Photo Timeline

### D-L
- `/dashboard` - Main Dashboard (role-dependent)
- `/dev-dashboard` - Development Dashboard
- `/login` - Login Page

### P-S
- `/photographers` - Photographer Homepage
- `/photographers/clients` - Client Management
- `/photographers/clients/[id]` - Client Details
- `/photographers/commission-details` - Commission Details
- `/photographers/reports` - Photographer Reports
- `/photographers/revenue` - Revenue Dashboard
- `/photographers/sessions` - Session Management
- `/photographers/sessions/upload` - Upload Session Photos
- `/photographers/settings` - Photographer Settings
- `/photographers/signup` - Photographer Signup
- `/signup` - Customer Signup

### T-Z
- `/test-dashboard` - Test Dashboard
- `/test-images` - Test Image Gallery

---

## 🎨 **Static Asset URLs**

### Website Decoration Images
| Category | URL Pattern | Count |
|----------|-------------|-------|
| **Hero Backgrounds** | `/images/hero/[filename].jpg` | 5 images |
| **Card Images** | `/images/cards/[filename].jpg` | 4 images |
| **Gallery Samples** | `/images/galleries/[filename].jpg` | 5 images |
| **Testimonials** | `/images/testimonials/[filename].jpg` | 2 images |
| **Logos** | `/images/logos/[filename].png` | 0 images |
| **Icons** | `/images/icons/[filename].svg` | 0 images |
| **Backgrounds** | `/images/backgrounds/[filename].jpg` | 0 images |

### Example Image URLs
```
http://localhost:3000/images/hero/city-dawn-aerial.jpg
http://localhost:3000/images/cards/elegant-accessories-bejeweled-sandals.jpg
http://localhost:3000/images/galleries/lighthouse-boats.jpg
http://localhost:3000/images/testimonials/mother-baby.jpg
```

---

## 🔄 **API Endpoints**

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | User signup |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |

### Photo Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/client/upload` | POST | Upload customer photos |
| `/api/client/upload` | GET | Get upload sessions |

### Competitor Logos
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/competitor-logos` | GET | Get competitor logos (auto-updates) |
| `/api/competitor-logos` | POST | Force update logos (admin) |

### Cron Jobs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/update-logos` | GET/POST | Auto-update competitor logos every 2 months |

---

## 🎯 **Navigation by User Type**

### Customer Flow
```
/ (Homepage)
  → /signup (Sign Up)
  → /login (Login)
  → /dashboard (Customer Dashboard)
      → /client/galleries (View Galleries)
      → /client/timeline (Timeline View)
      → /client/import (Import Photos)
      → /client/settings (Settings)
      → /client/subscription (Subscription)
```

### Photographer Flow
```
/photographers (Homepage)
  → /photographers/signup (Sign Up)
  → /login (Login)
  → /dashboard (Photographer Dashboard)
      → /photographers/clients (Manage Clients)
      → /photographers/sessions (Manage Sessions)
      → /photographers/revenue (View Revenue)
      → /photographers/reports (Analytics)
      → /photographers/settings (Settings)
```

### Admin Flow
```
/login (Login as Admin)
  → /dashboard (Admin Dashboard)
      → View as Photographer ↔ View as Customer (Switcher)
      → /admin/business-analytics (Business Metrics)
      → /admin/photo-upload (Upload Photos)
      → /admin/image-effects (View Effects)
      → /test-dashboard (Testing)
      → /dev-dashboard (Development)
      → /test-images (Image Gallery)
```

---

## 📱 **Quick Access URLs**

### Most Used (Customer)
```
http://localhost:3000/dashboard
http://localhost:3000/client/galleries
http://localhost:3000/client/timeline
```

### Most Used (Photographer)
```
http://localhost:3000/dashboard
http://localhost:3000/photographers/clients
http://localhost:3000/photographers/revenue
```

### Most Used (Admin)
```
http://localhost:3000/dashboard
http://localhost:3000/admin/photo-upload
http://localhost:3000/admin/business-analytics
http://localhost:3000/test-images
```

---

## 🔗 **External Links**

### Supabase
- **Dashboard:** https://app.supabase.com/project/gqmycgopitxpjkxzrnyv
- **SQL Editor:** https://app.supabase.com/project/gqmycgopitxpjkxzrnyv/sql
- **Storage:** https://app.supabase.com/project/gqmycgopitxpjkxzrnyv/storage/buckets

### Vercel (After Deployment)
- **Dashboard:** https://vercel.com/dashboard
- **Your Project:** https://vercel.com/your-username/photovault-hub

---

## 📊 **Page Count Summary**

| Category | Count |
|----------|-------|
| **Public Pages** | 5 |
| **Customer Pages** | 5 |
| **Photographer Pages** | 8 |
| **Admin Pages** | 7 |
| **API Endpoints** | 8 |
| **TOTAL** | **33 pages/endpoints** |

---

## 🎨 **Page Status**

| Status | Count | Pages |
|--------|-------|-------|
| ✅ **Fully Built** | 20 | Most pages complete with UI |
| 🔄 **Backend Only** | 8 | API routes functional |
| 🎨 **UI Complete** | 12 | Styled with Pixieset theme |
| 📊 **With Data** | 3 | Connected to Supabase |

---

## 🚀 **Testing Your Site**

### Quick Test Route
```
1. Visit: http://localhost:3000
2. Click "Log In" or visit: http://localhost:3000/login
3. Click "Quick Access" boxes to test as different users
4. Admin dashboard at: http://localhost:3000/dashboard
```

### Photo Upload Test
```
1. Visit: http://localhost:3000/admin/photo-upload
2. Drag & drop photos
3. Choose category and effects
4. Click "Upload All"
5. View at: http://localhost:3000/test-images
```

---

**Your complete site map! All 33 pages ready for testing and deployment.** 🗺️✨

