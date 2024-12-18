import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from './user';

export function transformSupabaseUser(user: SupabaseUser | null): User | null {
  if (!user) return null;

  // Check if user is admin based on environment variable
  const isAdmin = user.email === import.meta.env.VITE_ADMIN_USERNAME;

  return {
    id: user.id,
    email: user.email!,
    role: isAdmin ? 'admin' : 'user',
    created_at: user.created_at,
    isAdmin,
    darkMode: false,
    displayName: user.email?.split('@')[0] || '',
    preferredCategories: [],
    settings: {
      notifications: true,
      emailUpdates: true,
      theme: 'light'
    }
  };
}
