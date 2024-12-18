import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@example.com';

    // Check if admin user already exists
    const { data: { users }, error: searchError } = await adminSupabase.auth.admin.listUsers();

    if (searchError) {
      console.error('Error searching for admin user:', searchError);
      throw searchError;
    }

    const adminUser = users?.find(user => user.email === adminEmail);

    if (adminUser) {
      console.log('Admin user already exists');
      return adminUser;
    }

    // Create admin user with email pre-confirmed
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD!,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      throw createError;
    }

    console.log('Admin user created successfully');
    return newUser;
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    throw error;
  }
};

// Initialize admin user
createAdminUser().catch(console.error);
