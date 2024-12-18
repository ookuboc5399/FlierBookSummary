import React, { useEffect } from 'react';
import useAuth from '../hooks/use-auth';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { isAdmin } from '../types/user';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('AdminRoute - Current user:', user);
    console.log('AdminRoute - Loading state:', loading);
    if (user) {
      console.log('AdminRoute - User metadata:', {
        role: user.role,
        metadata_role: user.user_metadata?.role,
        isAdmin: user.user_metadata?.isAdmin
      });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!isAdmin(user)) {
    console.log('AdminRoute - Access denied, redirecting to auth');
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
};
