import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

async function applyMigration() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Applying Clients & Galleries Migration to Supabase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'database', 'clients-galleries-schema.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Error: SQL file not found at ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📄 SQL file loaded successfully\n');
  console.log('⚠️  NOTE: The Supabase REST API does not support DDL operations.');
  console.log('   You need to apply this migration manually via the Supabase SQL Editor.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 INSTRUCTIONS:\n');
  console.log(`1. Open: ${supabaseUrl}/project/_/sql`);
  console.log('2. Click "New query"');
  console.log('3. Copy and paste the SQL below');
  console.log('4. Click "Run"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 SQL TO COPY:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(sql);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ This will create:');
  console.log('   • clients table with photographer_id, name, email, phone, status');
  console.log('   • galleries table with photographer_id, client_id, gallery_name, etc.');
  console.log('   • RLS policies for secure access');
  console.log('   • Indexes for better performance');
  console.log('   • Automatic updated_at triggers\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

applyMigration();
