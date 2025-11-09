import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined');
}

async function createTables() {
  console.log('Creating directory tables via Supabase REST API...\n');

  // Read the SQL file
  const sqlPath = path.join(process.cwd(), 'database', 'directory-schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement via the Supabase management API
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey as string,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        } as HeadersInit,
        body: JSON.stringify({
          query: statement + ';'
        })
      });

      if (response.ok || response.status === 404) {
        // 404 means the RPC function doesn't exist, which is expected
        // Try using SQL query endpoint instead
        const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey as string,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/sql',
          } as HeadersInit,
          body: statement + ';'
        });

        if (sqlResponse.ok) {
          console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
        } else {
          console.log(`⚠ [${i + 1}/${statements.length}] ${preview}... (${sqlResponse.status})`);
        }
      } else {
        const errorText = await response.text();
        console.log(`✗ [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`  Error: ${errorText.substring(0, 100)}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(`✗ [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nNOTE: The Supabase REST API does not support DDL operations.');
  console.log('To create the tables, please use the Supabase SQL Editor:\n');
  console.log('1. Open: https://gqmycgopitxpjkxzrnyv.supabase.co/project/_/sql');
  console.log('2. Create a new query');
  console.log('3. Paste the contents from: database/directory-schema.sql');
  console.log('4. Click "Run"\n');
  console.log('Alternatively, copy the SQL below:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(sql);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createTables();
