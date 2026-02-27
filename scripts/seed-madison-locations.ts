// C:\Users\natha\.cursor\Photo Vault\photovault-hub\scripts\seed-madison-locations.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { locationsData } from './seed-madison-locations-data';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in .env.local');
}

// --- Safety Guards ---
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isProductionConfirmed = args.includes('--confirm-production');

// Environment guard: require explicit confirmation for production
if (supabaseUrl.includes('supabase.co') && !isProductionConfirmed && !isDryRun) {
  console.error('');
  console.error('⚠️  PRODUCTION DATABASE DETECTED');
  console.error(`   URL: ${supabaseUrl}`);
  console.error('');
  console.error('   To run against production, use one of:');
  console.error('     --dry-run              Preview changes without executing');
  console.error('     --confirm-production   Execute changes against production');
  console.error('');
  console.error('   RECOMMENDED: Take a Supabase database snapshot before running.');
  console.error('   Dashboard → Project Settings → Database → Backups → Create backup');
  console.error('');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('');
  console.log('📍 PhotoVault Location Seed Script');
  console.log('═══════════════════════════════════');
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN (no changes will be made)' : '🚀 LIVE'}`);
  console.log(`   Target: ${supabaseUrl}`);
  console.log(`   Locations: ${locationsData.length}`);
  console.log('');

  if (!isDryRun) {
    console.log('⚠️  REMINDER: Make sure you have a recent Supabase backup before proceeding.');
    console.log('');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const { location, intelligence } of locationsData) {
    if (isDryRun) {
      console.log(`[DRY RUN] Would upsert: ${location.name} (${location.slug})`);
      console.log(`          City: ${location.city}, Permit: ${intelligence.permit_status}`);
      if (intelligence.nearby_location_slugs) {
        console.log(`          Nearby: ${intelligence.nearby_location_slugs.join(', ')}`);
      }
      successCount++;
      continue;
    }

    // Upsert the location. 'slug' is the unique identifier.
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .upsert(location, { onConflict: 'slug' })
      .select()
      .single();

    if (locationError) {
      console.error(`❌ Error upserting location ${location.name}:`, locationError.message);
      errorCount++;
      continue;
    }

    console.log(`✅ Upserted location: ${locationData.name}`);

    // Upsert the business intelligence data, linking it to the location.
    const intelligenceToInsert = {
      location_id: locationData.id,
      ...intelligence
    };

    const { error: intelligenceError } = await supabase
      .from('location_business_intelligence')
      .upsert(intelligenceToInsert, { onConflict: 'location_id' });

    if (intelligenceError) {
      console.error(`❌ Error upserting intelligence for ${location.name}:`, intelligenceError.message);
      errorCount++;
    } else {
      console.log(`   ✅ Intelligence updated for: ${locationData.name}`);
      successCount++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════');
  console.log(`   ${isDryRun ? 'DRY RUN' : 'SEED'} COMPLETE`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('═══════════════════════════════════');
}

seedDatabase();
