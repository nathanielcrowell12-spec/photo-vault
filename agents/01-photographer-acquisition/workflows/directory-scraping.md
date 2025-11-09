# Workflow: Directory Scraping

## Purpose
Systematically collect photographer leads from public photography directories.

## Frequency
Run daily at 2:00 AM EST

## Target Directories

### Priority 1 (High Quality Leads)
- [ ] The Knot - Wedding photographers
- [ ] WeddingWire - Event photographers
- [ ] Thumbtack - Local service photographers
- [ ] Bark - UK/International photographers

### Priority 2 (Good Quality Leads)
- [ ] Google My Business - Local listings
- [ ] Yelp - Local photographers
- [ ] Facebook Business Pages
- [ ] Instagram Business Accounts

### Priority 3 (Volume Leads)
- [ ] Yellow Pages
- [ ] Local chamber of commerce directories
- [ ] Photography association member lists

## Scraping Process

### Step 1: Target Selection
1. Select one directory from Priority 1
2. Choose geographic region (start with top metros)
3. Define search parameters (family/event photography)

### Step 2: Data Collection
For each photographer found, collect:
```json
{
  "name": "Photographer Name",
  "businessName": "Business Name (if different)",
  "website": "URL",
  "email": "extracted or guessed",
  "phone": "phone number",
  "location": {
    "city": "City",
    "state": "State",
    "country": "Country"
  },
  "specialty": ["family", "wedding", "events"],
  "foundOn": "directory name",
  "profileUrl": "URL to directory profile",
  "scrapedDate": "2024-11-07",
  "status": "new"
}
```

### Step 3: Email Discovery
If email not listed:
1. Check website contact page
2. Try common patterns: info@, contact@, hello@, firstname@
3. Use email finding tools (Hunter.io, etc.)
4. Mark as "email_needed" if not found

### Step 4: Deduplication
1. Check against existing prospect database
2. Skip if already contacted in last 90 days
3. Update record if found with new information
4. Flag duplicates for manual review

### Step 5: Storage
1. Save to `prospect_database` table
2. Log activity to daily log file
3. Update scraping statistics

## Rate Limiting

- Maximum 10 requests per minute per directory
- Wait 5 seconds between requests
- Stop if blocked or rate-limited
- Resume from last successful page

## Error Handling

**If blocked:**
- Stop scraping that directory
- Log the block
- Wait 24 hours before retry
- Notify maintainer if repeated

**If page structure changed:**
- Log the error with page URL
- Save HTML for manual review
- Skip that directory
- Alert maintainer

## Success Criteria

- Collect minimum 20 new leads per day
- Less than 5% duplicate rate
- Zero directory blocks
- 90%+ email discovery rate

## Output

Daily log entry:
```json
{
  "date": "2024-11-07",
  "directory": "The Knot",
  "leadsFound": 45,
  "leadsAdded": 32,
  "duplicates": 13,
  "emailsFound": 29,
  "emailsNeeded": 3,
  "errors": 0,
  "blocked": false
}
```

## Next Workflow

After scraping completes, trigger: `lead-qualification.md`

---

**Status:** TEMPLATE - Fill in API keys and credentials before use
**Last Updated:** 2024-11-07
