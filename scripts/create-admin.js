import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createAdminUser() {
  const adminEmail = 'admin@admin.flier.local'
  const adminPassword = process.env.ADMIN_PASSWORD

  console.log('Creating admin user with:', {
    url: process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    adminEmail,
    adminPassword
  })

  try {
    // Create new admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    })

    if (error) throw error

    console.log('Admin user created successfully:', data.user)

    // Update user role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      { user_metadata: { role: 'admin' } }
    )

    if (updateError) throw updateError
    console.log('Admin role set successfully')

  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
