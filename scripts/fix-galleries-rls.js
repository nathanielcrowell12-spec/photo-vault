// Script to fix RLS policies for galleries table
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLS() {
  try {
    console.log('🔧 Fixing RLS policies for galleries table...\n')
    
    // Drop existing policies
    console.log('📝 Dropping existing policies...')
    await supabase.rpc('exec_sql', { 
      sql: `
        DROP POLICY IF EXISTS "Users can view own galleries" ON galleries;
        DROP POLICY IF EXISTS "Users can create own galleries" ON galleries;
        DROP POLICY IF EXISTS "Users can update own galleries" ON galleries;
        DROP POLICY IF EXISTS "Users can delete own galleries" ON galleries;
        DROP POLICY IF EXISTS "Photographers can view their client galleries" ON galleries;
        DROP POLICY IF EXISTS "Admins can view all galleries" ON galleries;
      `
    })
    
    // Enable RLS
    console.log('🔒 Enabling RLS on galleries table...')
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;'
    })
    
    // Create new policies
    console.log('✏️  Creating new RLS policies...')
    await supabase.rpc('exec_sql', { 
      sql: `
        -- Allow users to view their own galleries
        CREATE POLICY "Users can view own galleries" ON galleries
        FOR SELECT 
        USING (auth.uid() = user_id);

        -- Allow users to create their own galleries
        CREATE POLICY "Users can create own galleries" ON galleries
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        -- Allow users to update their own galleries
        CREATE POLICY "Users can update own galleries" ON galleries
        FOR UPDATE 
        USING (auth.uid() = user_id);

        -- Allow users to delete their own galleries
        CREATE POLICY "Users can delete own galleries" ON galleries
        FOR DELETE 
        USING (auth.uid() = user_id);

        -- Allow photographers to view galleries they created for clients
        CREATE POLICY "Photographers can view their client galleries" ON galleries
        FOR SELECT 
        USING (
          photographer_name IN (
            SELECT full_name FROM user_profiles WHERE id = auth.uid()
          )
        );

        -- Allow admins to view all galleries
        CREATE POLICY "Admins can view all galleries" ON galleries
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
          )
        );
      `
    })
    
    console.log('\n✅ RLS policies fixed successfully!')
    console.log('\n📝 Policies created:')
    console.log('   - Users can view own galleries')
    console.log('   - Users can create own galleries')
    console.log('   - Users can update own galleries')
    console.log('   - Users can delete own galleries')
    console.log('   - Photographers can view their client galleries')
    console.log('   - Admins can view all galleries')
    
  } catch (error) {
    console.error('❌ Error fixing RLS:', error)
    console.log('\n💡 Note: If exec_sql function doesn\'t exist, you need to run the SQL directly in Supabase dashboard:')
    console.log('\nGo to: Supabase Dashboard > SQL Editor > New Query')
    console.log('Then run the contents of database/galleries-table.sql')
  }
}

fixRLS()



