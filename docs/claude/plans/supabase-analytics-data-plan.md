# Supabase Analytics Data Plan

**Date:** 2026-01-05
**Author:** Supabase Expert (Claude Code Subagent)
**Status:** Ready for QA Critic Review

---

## Executive Summary

This plan defines the database queries and data structures needed to power admin analytics charts for PhotoVault. The focus is on **database-only** analytics (no PostHog integration), leveraging existing Supabase tables with `created_at` timestamps for time-series data.

---

## Current State Analysis

### Existing Analytics Service
Located at `src/lib/server/admin-analytics-service.ts`, the current service provides:
- Total users count
- Photos uploaded count
- Storage used (formatted)
- Active users today (approximate)
- Recent events (signups, galleries, photos)

### Available Tables with Timestamps

| Table | `created_at` | Row Count | Key for Analytics |
|-------|-------------|-----------|-------------------|
| `user_profiles` | Yes (timestamptz) | 15 | User growth |
| `photo_galleries` | Yes (timestamptz) | 44 | Gallery creation trends |
| `gallery_photos` | Yes (timestamptz) | 90 | Photo uploads (primary) |
| `photos` | Yes (timestamptz) | 89 | Photo uploads (alternate) |
| `commissions` | Yes (timestamptz) | 15 | Revenue tracking |

### Existing Indexes (Relevant)

```sql
-- user_profiles
idx_user_profiles_user_type ON user_profiles (user_type)

-- photo_galleries
idx_galleries_status ON photo_galleries (gallery_status)
idx_photo_galleries_payment_status ON photo_galleries (payment_status)

-- gallery_photos
idx_gallery_photos_gallery_id ON gallery_photos (gallery_id)
```

**Note:** No indexes exist on `created_at` columns. For production scale, consider adding:
```sql
CREATE INDEX idx_user_profiles_created_at ON user_profiles (created_at);
CREATE INDEX idx_photo_galleries_created_at ON photo_galleries (created_at);
CREATE INDEX idx_gallery_photos_created_at ON gallery_photos (created_at);
```

---

## Data Requirements

### 1. User Growth Chart (Line Chart)

**Purpose:** Show user signups over time with breakdown by user_type

**Time Granularities Supported:**
- Daily (last 30 days)
- Weekly (last 12 weeks)
- Monthly (last 12 months)

#### SQL Query

```sql
-- User signups by period with user_type breakdown
-- Replace 'day' with 'week' or 'month' for different granularities
SELECT
    date_trunc('day', created_at) as period,
    user_type,
    COUNT(*) as count
FROM user_profiles
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND created_at IS NOT NULL
GROUP BY date_trunc('day', created_at), user_type
ORDER BY period ASC;
```

#### Optimized Query with Fill (No Gaps)

```sql
-- Generate complete date series with zero-filled gaps
WITH date_series AS (
    SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '30 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
    ) as period
),
user_types AS (
    SELECT DISTINCT user_type FROM user_profiles WHERE user_type IS NOT NULL
),
signup_counts AS (
    SELECT
        date_trunc('day', created_at) as period,
        user_type,
        COUNT(*) as count
    FROM user_profiles
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND created_at IS NOT NULL
    GROUP BY date_trunc('day', created_at), user_type
)
SELECT
    ds.period,
    ut.user_type,
    COALESCE(sc.count, 0) as count
FROM date_series ds
CROSS JOIN user_types ut
LEFT JOIN signup_counts sc
    ON ds.period = sc.period AND ut.user_type = sc.user_type
ORDER BY ds.period ASC, ut.user_type;
```

#### TypeScript Types

```typescript
export type UserGrowthGranularity = 'day' | 'week' | 'month';

export type UserGrowthDataPoint = {
  period: string;  // ISO date string
  photographer: number;
  client: number;
  admin: number;
  secondary: number;
  total: number;
};

export type UserGrowthData = {
  granularity: UserGrowthGranularity;
  startDate: string;
  endDate: string;
  dataPoints: UserGrowthDataPoint[];
  totals: {
    photographer: number;
    client: number;
    admin: number;
    secondary: number;
    total: number;
  };
};
```

---

### 2. Platform Usage Breakdown (Pie Charts)

**Purpose:** Show distribution of galleries, photos, and storage

#### 2a. Gallery Status Distribution

```sql
SELECT
    COALESCE(gallery_status, 'unknown') as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM photo_galleries
GROUP BY gallery_status
ORDER BY count DESC;
```

#### 2b. Gallery Payment Status Distribution

```sql
SELECT
    COALESCE(payment_status, 'unknown') as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM photo_galleries
GROUP BY payment_status
ORDER BY count DESC;
```

#### 2c. Photos Per Gallery Distribution

```sql
SELECT
    CASE
        WHEN photo_count = 0 THEN '0 photos'
        WHEN photo_count BETWEEN 1 AND 10 THEN '1-10 photos'
        WHEN photo_count BETWEEN 11 AND 50 THEN '11-50 photos'
        WHEN photo_count BETWEEN 51 AND 100 THEN '51-100 photos'
        ELSE '100+ photos'
    END as range,
    COUNT(*) as gallery_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
    SELECT g.id, COUNT(p.id) as photo_count
    FROM photo_galleries g
    LEFT JOIN gallery_photos p ON p.gallery_id = g.id
    GROUP BY g.id
) sub
GROUP BY range
ORDER BY
    CASE range
        WHEN '0 photos' THEN 1
        WHEN '1-10 photos' THEN 2
        WHEN '11-50 photos' THEN 3
        WHEN '51-100 photos' THEN 4
        ELSE 5
    END;
```

#### 2d. Storage Usage by Photo Table

```sql
SELECT
    source_table,
    photo_count,
    total_bytes,
    CASE
        WHEN total_bytes >= 1073741824 THEN ROUND(total_bytes / 1073741824.0, 2) || ' GB'
        WHEN total_bytes >= 1048576 THEN ROUND(total_bytes / 1048576.0, 2) || ' MB'
        WHEN total_bytes >= 1024 THEN ROUND(total_bytes / 1024.0, 2) || ' KB'
        ELSE total_bytes || ' B'
    END as formatted_size
FROM (
    SELECT
        'gallery_photos' as source_table,
        COUNT(*) as photo_count,
        COALESCE(SUM(file_size), 0) as total_bytes
    FROM gallery_photos
    UNION ALL
    SELECT
        'photos' as source_table,
        COUNT(*) as photo_count,
        COALESCE(SUM(file_size), 0) as total_bytes
    FROM photos
) storage_breakdown;
```

#### TypeScript Types

```typescript
export type PieChartSegment = {
  label: string;
  value: number;
  percentage: number;
  color?: string;  // For UI rendering
};

export type GalleryStatusDistribution = {
  segments: PieChartSegment[];
  totalGalleries: number;
};

export type PaymentStatusDistribution = {
  segments: PieChartSegment[];
  totalGalleries: number;
};

export type PhotosPerGalleryDistribution = {
  segments: PieChartSegment[];
  totalGalleries: number;
};

export type StorageBreakdown = {
  galleryPhotos: {
    count: number;
    bytes: number;
    formatted: string;
  };
  photos: {
    count: number;
    bytes: number;
    formatted: string;
  };
  total: {
    count: number;
    bytes: number;
    formatted: string;
  };
};

export type PlatformUsageData = {
  galleryStatus: GalleryStatusDistribution;
  paymentStatus: PaymentStatusDistribution;
  photosPerGallery: PhotosPerGalleryDistribution;
  storage: StorageBreakdown;
};
```

---

### 3. Health Check Data

**Purpose:** Simple DB connectivity and performance monitoring

#### 3a. Connectivity Check with Timing

```sql
-- Simple query to verify connectivity and measure latency
SELECT
    NOW() as server_time,
    current_database() as database_name,
    version() as postgres_version;
```

#### 3b. Row Counts for Key Tables

```sql
SELECT
    'user_profiles' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('user_profiles')) as table_size
FROM user_profiles
UNION ALL
SELECT 'photographers', COUNT(*), pg_size_pretty(pg_total_relation_size('photographers')) FROM photographers
UNION ALL
SELECT 'clients', COUNT(*), pg_size_pretty(pg_total_relation_size('clients')) FROM clients
UNION ALL
SELECT 'photo_galleries', COUNT(*), pg_size_pretty(pg_total_relation_size('photo_galleries')) FROM photo_galleries
UNION ALL
SELECT 'gallery_photos', COUNT(*), pg_size_pretty(pg_total_relation_size('gallery_photos')) FROM gallery_photos
UNION ALL
SELECT 'photos', COUNT(*), pg_size_pretty(pg_total_relation_size('photos')) FROM photos
UNION ALL
SELECT 'commissions', COUNT(*), pg_size_pretty(pg_total_relation_size('commissions')) FROM commissions;
```

#### TypeScript Types

```typescript
export type TableHealth = {
  tableName: string;
  rowCount: number;
  tableSize: string;
};

export type HealthCheckData = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  serverTime: string;
  databaseName: string;
  postgresVersion: string;
  queryLatencyMs: number;
  tables: TableHealth[];
  lastChecked: string;
};
```

---

## API Response Structure

### Combined Analytics API Response

```typescript
export type AdminAnalyticsChartsResponse = {
  success: boolean;
  timestamp: string;
  data: {
    userGrowth: UserGrowthData;
    platformUsage: PlatformUsageData;
    healthCheck: HealthCheckData;
  };
  cacheInfo?: {
    cached: boolean;
    cachedAt?: string;
    expiresAt?: string;
  };
};
```

---

## Implementation Recommendations

### 1. Query Execution Strategy

**Option A: Parallel Queries (Recommended)**
```typescript
const [userGrowth, platformUsage, healthCheck] = await Promise.all([
  fetchUserGrowthData(granularity),
  fetchPlatformUsageData(),
  fetchHealthCheckData(),
]);
```

**Option B: Single Complex Query**
Use CTEs to combine all data in one round trip. Better for latency-sensitive scenarios but harder to maintain.

### 2. Caching Strategy

For admin dashboards, implement server-side caching:
- **User Growth:** Cache for 5 minutes (data changes slowly)
- **Platform Usage:** Cache for 1 minute
- **Health Check:** No cache (always real-time)

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedUserGrowth = unstable_cache(
  async (granularity: UserGrowthGranularity) => fetchUserGrowthData(granularity),
  ['admin-user-growth'],
  { revalidate: 300 } // 5 minutes
);
```

### 3. Performance Considerations

1. **Current Scale:** With 15 users and 44 galleries, all queries will be fast (<50ms)

2. **At Scale (1000+ users):**
   - Add indexes on `created_at` columns
   - Consider materialized views for heavy aggregations
   - Implement query result caching

3. **Recommended Indexes:**
```sql
-- Only add these when table size exceeds 10,000 rows
CREATE INDEX CONCURRENTLY idx_user_profiles_created_at
    ON user_profiles (created_at DESC);

CREATE INDEX CONCURRENTLY idx_photo_galleries_created_at
    ON photo_galleries (created_at DESC);

CREATE INDEX CONCURRENTLY idx_gallery_photos_created_at
    ON gallery_photos (created_at DESC);

-- Composite index for user growth queries
CREATE INDEX CONCURRENTLY idx_user_profiles_type_created
    ON user_profiles (user_type, created_at DESC);
```

### 4. Error Handling

```typescript
export async function fetchAdminAnalyticsCharts(): Promise<AdminAnalyticsChartsResponse> {
  const startTime = Date.now();

  try {
    const supabase = createServiceRoleClient();

    // Execute queries with individual error handling
    const userGrowthResult = await fetchUserGrowthData('day').catch(err => {
      logger.error('[analytics] User growth query failed', err);
      return getDefaultUserGrowthData();
    });

    // ... similar for other queries

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: { userGrowth, platformUsage, healthCheck },
    };
  } catch (error) {
    logger.error('[analytics] Failed to fetch analytics', error);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      data: getDefaultAnalyticsData(),
    };
  }
}
```

---

## File Structure Recommendation

```
src/lib/server/
  admin-analytics-service.ts    # Existing - extend or keep
  admin-analytics-charts.ts     # New - chart-specific queries

src/types/
  admin-analytics.ts            # TypeScript types

src/app/api/admin/analytics/
  charts/route.ts               # API endpoint for chart data
```

---

## Summary of Queries

| Chart | Query Type | Tables | Expected Latency |
|-------|------------|--------|-----------------|
| User Growth | Aggregate by date | user_profiles | <20ms |
| Gallery Status | Group by status | photo_galleries | <10ms |
| Payment Status | Group by status | photo_galleries | <10ms |
| Photos/Gallery | Join + Group | photo_galleries, gallery_photos | <30ms |
| Storage Usage | Sum file_size | gallery_photos, photos | <20ms |
| Health Check | Counts + metadata | Multiple | <50ms |

---

## Next Steps

1. **QA Critic Review:** This plan requires review before implementation
2. **Implementation:** Create `admin-analytics-charts.ts` with the queries above
3. **API Endpoint:** Create `/api/admin/analytics/charts` route
4. **Frontend:** Build chart components using Recharts or similar library

---

## Appendix: Sample Data from Production

### User Signups (Recent)
| Date | User Type | Count |
|------|-----------|-------|
| 2026-01-03 | client | 1 |
| 2026-01-01 | client | 1 |
| 2025-12-20 | client | 1 |
| 2025-12-18 | photographer | 1 |
| 2025-12-14 | photographer | 1 |

### Gallery Status Distribution
| Status | Count |
|--------|-------|
| draft | 36 |
| ready | 8 |

### Payment Status Distribution
| Status | Count |
|--------|-------|
| pending | 37 |
| paid | 7 |

### Photos Per Gallery
| Range | Gallery Count |
|-------|---------------|
| 0 photos | 25 |
| 1-10 photos | 16 |
| 11-50 photos | 3 |

### Storage Usage
| Source | Photo Count | Total Bytes |
|--------|-------------|-------------|
| gallery_photos | 90 | 392,353,056 (~374 MB) |
| photos | 89 | 58,381,559 (~56 MB) |

---

*Plan generated by Supabase Expert subagent. Awaiting QA Critic review.*
