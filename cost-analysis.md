# PhotoVault Cost Analysis: Is $8/Month Sustainable?

## Executive Summary
**Bottom Line:** Yes, $8/month per customer is sustainable and profitable, but margins are thin. You need volume to succeed.

---

## Your Current Model

### Revenue Per Customer (Monthly)
```
Customer pays: $8/month
├─ Photographer commission: $4/month (50%)
└─ PhotoVault keeps: $4/month (50%)
```

**Your gross revenue: $4/month per customer**

---

## Cost Breakdown: What Does It Actually Cost?

### 1. Storage Costs (AWS S3 via Supabase)

#### Industry Standard Gallery Sizes:
- **Wedding Photography:** 400-800 photos, ~5-15 GB (high-res JPEGs)
- **Family Session:** 50-150 photos, ~1-3 GB
- **Newborn Session:** 100-300 photos, ~2-5 GB
- **Average per gallery:** ~5 GB
- **Average galleries per customer:** 3-5 galleries (multi-photographer network)
- **Average total per customer:** 15-25 GB

#### AWS S3 Standard Pricing (2024):
- **Storage:** $0.023 per GB/month (first 50 TB)
- **Data transfer OUT:** $0.09 per GB (downloads)
- **PUT requests:** $0.005 per 1,000 requests

#### Cost Per Customer (Conservative Estimate):

**Scenario A: Average Customer (20 GB, moderate usage)**
```
Storage: 20 GB × $0.023 = $0.46/month
Bandwidth (10% monthly downloads): 2 GB × $0.09 = $0.18/month
API requests (uploads/views): ~$0.01/month
────────────────────────────────────────────
Total Storage Cost: ~$0.65/month per customer
```

**Scenario B: Heavy User (50 GB, high usage)**
```
Storage: 50 GB × $0.023 = $1.15/month
Bandwidth (20% downloads): 10 GB × $0.09 = $0.90/month
API requests: ~$0.05/month
────────────────────────────────────────────
Total Storage Cost: ~$2.10/month per customer
```

### 2. Infrastructure Costs (Supabase/Hosting)

#### Supabase Pricing Tiers:
- **Free Tier:** Up to 500 MB database, 1 GB file storage (not viable)
- **Pro Tier:** $25/month
  - 8 GB database
  - 100 GB file storage
  - 250 GB bandwidth
  
- **Team Tier:** $599/month
  - Unlimited database
  - Unlimited storage
  - Unlimited bandwidth

#### Cost Per Customer:

**At Scale (1,000 customers on Team plan):**
```
Supabase: $599/month ÷ 1,000 customers = $0.60/customer
```

**At Small Scale (100 customers on Pro plan):**
```
Supabase: $25/month ÷ 100 customers = $0.25/customer
(Plus overages if you exceed 100 GB storage or 250 GB bandwidth)
```

### 3. Additional Costs Per Customer

#### Payment Processing (Stripe):
```
Stripe fee: 2.9% + $0.30 per transaction
On $8 payment: ($8 × 0.029) + $0.30 = $0.53/month
```

#### Email/Notifications (SendGrid/Postmark):
```
Payment reminders, updates, etc: ~$0.05/month per customer
```

#### Support & Operations:
```
Customer support (averaged): ~$0.10/month per customer
```

---

## Total Cost Per Customer

### Conservative Estimate (Average Customer):
```
Storage (AWS S3):           $0.65/month
Infrastructure (Supabase):  $0.60/month
Payment processing:         $0.53/month
Email notifications:        $0.05/month
Support/operations:         $0.10/month
────────────────────────────────────────────
Total Cost:                 $1.93/month per customer
```

### Your Profit Per Customer:
```
Revenue (your 50%):         $4.00/month
Total costs:               -$1.93/month
────────────────────────────────────────────
Net Profit:                 $2.07/month per customer
────────────────────────────────────────────
Profit Margin:              51.75%
```

---

## Worst-Case Scenario (Heavy User):

### Heavy Customer Costs:
```
Storage (50 GB):            $2.10/month
Infrastructure:             $0.60/month
Payment processing:         $0.53/month
Email notifications:        $0.05/month
Support:                    $0.10/month
────────────────────────────────────────────
Total Cost:                 $3.38/month per customer
────────────────────────────────────────────
Net Profit:                 $0.62/month per customer
────────────────────────────────────────────
Profit Margin:              15.5%
```

**Still profitable, but thin margins on power users.**

---

## How Many Galleries Per Customer?

### Your Core Value Proposition:
**"Access all your photos from every photographer in your city"**

### Expected Gallery Count:
- **Year 1:** 1-2 galleries (initial photographer)
- **Year 2-3:** 3-5 galleries (wedding, newborn, family sessions from various photographers)
- **Year 5+:** 5-10 galleries (multiple photographers over time)

### Storage Growth Over Time:

**Conservative Customer Journey:**
```
Year 1:  2 galleries × 5 GB = 10 GB → Cost: $0.23/mo
Year 3:  4 galleries × 5 GB = 20 GB → Cost: $0.46/mo
Year 5:  6 galleries × 5 GB = 30 GB → Cost: $0.69/mo
Year 10: 10 galleries × 5 GB = 50 GB → Cost: $1.15/mo
```

**Storage costs increase slowly over time, but you lock in $4/month revenue.**

---

## Break-Even Analysis

### At What Customer Volume Are You Profitable?

**Fixed Costs (Monthly):**
- Supabase Team Plan: $599
- Domain/hosting: ~$20
- Email service: ~$30
- Tools/subscriptions: ~$50
- **Total Fixed:** ~$700/month

**Variable Profit Per Customer:**
- Average: $2.07/month
- Heavy user: $0.62/month

**Break-Even Customer Count:**
```
$700 fixed costs ÷ $2.07 profit per customer = 338 customers
```

**You need ~340 customers to break even on fixed costs.**

---

## Profitability Scenarios

### Scenario 1: Small Launch (500 Customers)
```
Revenue:
500 customers × $4/mo = $2,000/month

Costs:
Storage (avg $0.65): 500 × $0.65 = $325
Infrastructure: $599 (Supabase Team)
Payment processing: 500 × $0.53 = $265
Email/support: 500 × $0.15 = $75
Fixed costs: $100
────────────────────────────────────────
Total Costs: $1,364/month
────────────────────────────────────────
Net Profit: $636/month ($7,632/year)
────────────────────────────────────────
Profit Margin: 31.8%
```

### Scenario 2: Growth Phase (2,000 Customers)
```
Revenue:
2,000 customers × $4/mo = $8,000/month

Costs:
Storage (avg $0.65): 2,000 × $0.65 = $1,300
Infrastructure: $599 (still on Team plan)
Payment processing: 2,000 × $0.53 = $1,060
Email/support: 2,000 × $0.15 = $300
Fixed costs: $200
────────────────────────────────────────
Total Costs: $3,459/month
────────────────────────────────────────
Net Profit: $4,541/month ($54,492/year)
────────────────────────────────────────
Profit Margin: 56.8%
```

### Scenario 3: Mature Business (10,000 Customers)
```
Revenue:
10,000 customers × $4/mo = $40,000/month

Costs:
Storage (avg $0.65): 10,000 × $0.65 = $6,500
Infrastructure: $1,500 (custom/enterprise)
Payment processing: 10,000 × $0.53 = $5,300
Email/support: 10,000 × $0.15 = $1,500
Fixed costs: $500
Staff (2 support): $8,000
────────────────────────────────────────
Total Costs: $23,300/month
────────────────────────────────────────
Net Profit: $16,700/month ($200,400/year)
────────────────────────────────────────
Profit Margin: 41.75%
```

---

## Key Risks & Mitigation

### Risk 1: Storage Costs Exceed Revenue
**Problem:** Heavy users (50+ GB) cost $2.10+ in storage alone

**Mitigation Options:**
1. **Storage Limits:** Cap free storage at 30 GB, charge for overages
2. **Compression:** Automatically compress photos (quality vs size tradeoff)
3. **Tiered Pricing:** Offer "Premium" tier for unlimited storage
4. **Archive Old Photos:** Move old galleries to cheaper cold storage (S3 Glacier)

### Risk 2: High Bandwidth Costs (Lots of Downloads)
**Problem:** If customers download entire galleries monthly, bandwidth costs spike

**Mitigation Options:**
1. **Download Limits:** 3-5 full gallery downloads per month
2. **Streaming:** Encourage viewing vs downloading
3. **Selective Downloads:** Download individual photos, not entire galleries
4. **Bandwidth Pooling:** Heavy users subsidized by light users

### Risk 3: Low Customer Retention
**Problem:** If customers cancel after 1-2 years, you lose recurring revenue

**Mitigation Options:**
1. **Memory Features:** Annual highlight reels keep them engaged
2. **Multi-Photographer Value:** More galleries = more value
3. **Family Sharing:** Get entire family invested
4. **Mobile App:** Make it sticky with daily use

---

## Recommendations

### ✅ $8/Month is Viable IF:

1. **You Hit Volume:** Need 500+ customers to be meaningfully profitable
2. **You Control Costs:** 
   - Use storage optimization (compression, limits)
   - Efficient CDN usage
   - Automated support systems
3. **You Drive Value:**
   - Multi-photographer galleries
   - Memory features
   - High retention

### 🚨 Watch Out For:

1. **Power Users:** 10% of customers may use 50%+ of storage
2. **Bandwidth Spikes:** Viral gallery sharing could spike costs
3. **Growth Scaling:** Need to reach 340+ customers to cover fixed costs

### 💡 Pricing Alternatives to Consider:

#### Option A: Keep $8/month, Add Tiers
```
Basic: $8/month (30 GB limit, 3 galleries)
Plus: $15/month (100 GB, unlimited galleries)
Premium: $25/month (unlimited storage)
```

#### Option B: Increase to $10/month
```
Customer pays: $10/month
Photographer gets: $5/month (same 50%)
You keep: $5/month
────────────────────────────────────────
Extra profit: +$1/month per customer
At 1,000 customers: +$12,000/year more profit
```

#### Option C: Dynamic Pricing Based on Storage
```
Base: $8/month (up to 25 GB)
+$1 per 10 GB over base
Heavy users pay more, subsidize average users
```

---

## Final Verdict

### ✅ YES, $8/month Works

**At 1,000 active customers:**
- Revenue: $4,000/month from your 50%
- Costs: ~$2,500/month
- **Profit: ~$1,500/month ($18,000/year)**
- **Profit margin: 37-40%**

**At 5,000 customers:**
- Revenue: $20,000/month
- Costs: ~$11,000/month
- **Profit: ~$9,000/month ($108,000/year)**
- **Profit margin: 45%**

### 🎯 Keys to Success:

1. **Reach 500-1,000 customers quickly** (break-even at ~340)
2. **Implement storage optimization** (compression, limits)
3. **Focus on retention** (multi-photographer value, memory features)
4. **Monitor heavy users** (consider tiered pricing if needed)
5. **Leverage photographer network** (they bring customers, you keep costs low)

### 💰 The Math Works Because:

1. **Storage is cheap:** $0.023/GB = $0.46 for 20 GB
2. **Infrastructure scales:** $599/month supports 1,000+ customers
3. **Photographer commission is revenue share:** You only pay when you earn
4. **Multi-photographer model:** Customers with 5+ galleries still cost ~$1-2/month to serve

**Your $4/month keeps $2-2.50 profit after costs = 50-62% margin**

---

## Recommended Actions

### Immediate (MVP):
1. ✅ Keep $8/month pricing
2. ✅ Monitor storage per customer
3. ✅ Set soft limit alerts at 30 GB per customer
4. ✅ Implement image compression on upload

### After 1,000 Customers:
1. Review actual storage costs
2. Consider tiered pricing if needed
3. Evaluate $10/month pricing test
4. Implement cold storage for old galleries

### Long-Term:
1. Negotiate enterprise Supabase pricing
2. Direct AWS contract (cheaper than Supabase)
3. Tiered pricing based on usage
4. Premium features for upsell

---

## Competitor Comparison

### What Others Charge:

**Pixieset:**
- Photographer pays: $0-40/month
- Customer: Gallery expires unless photographer pays

**SmugMug:**
- Photographer pays: $55-90/year
- Customer: No direct fee

**ShootProof:**
- Photographer pays: $10-35/month
- Customer: No direct fee

**Your Model:**
- Photographer pays: $22/month + earns $4/month per client
- Customer: $8/month (with first year included)

**Your advantage:** Customer pays directly, photographer earns commission. This is unique in the market.

---

## The Verdict: Sustainable? YES ✅

**Why it works:**
1. Storage is incredibly cheap ($0.46 for 20 GB)
2. Infrastructure costs are fixed (doesn't scale linearly)
3. You have 50% gross margins before any optimization
4. Volume makes it highly profitable (1,000+ customers)

**Watch out for:**
1. Power users (1-2% may use 50+ GB)
2. Bandwidth spikes from viral sharing
3. Need to reach critical mass (500+ customers)

**Recommendation:** Stick with $8/month for MVP, monitor costs closely, optimize storage, and consider tiered pricing once you hit 2,000+ customers.

