// Reset user password using Supabase Admin API
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPassword(email, newPassword) {
  console.log('🔐 Resetting password for:', email)
  console.log('')

  // First, find the user
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error fetching users:', listError.message)
    return
  }

  const user = authUsers.users.find(u => u.email === email)

  if (!user) {
    console.error('❌ User not found:', email)
    return
  }

  console.log('✅ Found user:', user.id)

  // Update the password using admin API
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword,
      email_confirm: true // Ensure email is confirmed
    }
  )

  if (error) {
    console.error('❌ Error updating password:', error.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
  } else {
    console.log('✅ Password updated successfully!')
    console.log('')
    console.log('You can now log in with:')
    console.log('   Email:', email)
    console.log('   Password:', newPassword)
  }
}

// Usage: node reset-user-password.js <email> <new-password>
const email = process.argv[2] || 'nathaniel.crowell12@gmail.com'
const newPassword = process.argv[3]

if (!newPassword) {
  console.error('❌ Usage: node reset-user-password.js <email> <new-password>')
  console.error('')
  console.error('Example:')
  console.error('   node scripts/reset-user-password.js nathaniel.crowell12@gmail.com MyNewPassword123!')
  process.exit(1)
}

resetPassword(email, newPassword)
