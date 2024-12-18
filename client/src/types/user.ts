import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  settings?: {
    notifications: boolean;
    emailUpdates: boolean;
    theme: 'light' | 'dark';
  };
}

export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' ||
         user.user_metadata?.role === 'admin' ||
         user.user_metadata?.isAdmin === true;
};
