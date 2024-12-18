import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { User } from '../types/user';
import { useToast } from '../components/ui/use-toast';

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedAdminSession = localStorage.getItem('adminSession');
    if (storedAdminSession) {
      const adminUser = JSON.parse(storedAdminSession);

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          supabase.auth.signInWithPassword({
            email: 'admin@admin.flier.local',
            password: 'Tokai@4240904'
          }).then(({ error }) => {
            if (error) {
              console.error('Failed to restore admin session:', error);
              localStorage.removeItem('adminSession');
              setUser(null);
            } else {
              setUser(adminUser);
            }
            setLoading(false);
          });
        } else {
          setUser(adminUser);
          setLoading(false);
        }
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === 'admin@admin.flier.local') {
        const adminUser: User = {
          id: session.user.id,
          email: 'admin',
          role: 'admin',
          created_at: session.user.created_at,
          isAdmin: true,
          settings: {
            notifications: true,
            emailUpdates: true,
            theme: 'light'
          }
        };
        setUser(adminUser);
        localStorage.setItem('adminSession', JSON.stringify(adminUser));
      } else if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role || 'user',
          created_at: session.user.created_at,
          isAdmin: session.user.user_metadata?.isAdmin || false,
          settings: {
            notifications: true,
            emailUpdates: true,
            theme: 'light'
          }
        };
        setUser(userData);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === 'admin@admin.flier.local') {
        const adminUser: User = {
          id: session.user.id,
          email: 'admin',
          role: 'admin',
          created_at: session.user.created_at,
          isAdmin: true,
          settings: {
            notifications: true,
            emailUpdates: true,
            theme: 'light'
          }
        };
        setUser(adminUser);
      } else if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role || 'user',
          created_at: session.user.created_at,
          isAdmin: session.user.user_metadata?.isAdmin || false,
          settings: {
            notifications: true,
            emailUpdates: true,
            theme: 'light'
          }
        };
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ isAdmin: boolean }> => {
    setError(null);
    try {
      console.log('Attempting login with:', { email });

      if (email === 'admin') {
        console.log('Admin login path detected');
        if (password === 'Tokai@4240904') {
          console.log('Admin password match, creating admin session');

          const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
            email: 'admin@admin.flier.local',
            password
          });
          console.log('Supabase auth response:', {
            data: adminAuthData,
            error: adminAuthError,
            user: adminAuthData?.user,
            session: adminAuthData?.session
          });

          if (adminAuthError) {
            console.error('Admin auth error:', adminAuthError);
            throw adminAuthError;
          }

          if (!adminAuthData?.user) {
            console.error('No user data returned from Supabase');
            throw new Error('認証に失敗しました');
          }

          console.log('Creating admin user object...');
          const adminUser: User = {
            id: adminAuthData.user.id,
            email: 'admin',
            role: 'admin',
            created_at: new Date().toISOString(),
            isAdmin: true,
            settings: {
              notifications: true,
              emailUpdates: true,
              theme: 'light'
            }
          };
          console.log('Admin user object created:', adminUser);

          setUser(adminUser);
          localStorage.setItem('adminSession', JSON.stringify(adminUser));
          console.log('Admin session stored in localStorage');

          toast({
            title: 'ログイン成功',
            description: '管理者としてログインしました',
          });

          return { isAdmin: true };
        }
        console.log('Admin password mismatch');
        toast({
          title: 'エラー',
          description: '管理者認証に失敗しました。パスワードを確認してください。',
          variant: 'destructive'
        });
        throw new Error('管理者認証に失敗しました。パスワードを確認してください。');
      }

      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        toast({
          title: 'エラー',
          description: '認証に失敗しました。認証情報を確認してください。',
          variant: 'destructive'
        });
        throw supabaseError;
      }

      if (!data?.user) {
        toast({
          title: 'エラー',
          description: 'ユーザーが見つかりません。',
          variant: 'destructive'
        });
        throw new Error('ユーザーが見つかりません。');
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email!,
        role: data.user.user_metadata?.role || 'user',
        created_at: data.user.created_at,
        isAdmin: data.user.user_metadata?.isAdmin || false,
        settings: {
          notifications: true,
          emailUpdates: true,
          theme: 'light'
        }
      };
      setUser(userData);
      toast({
        title: 'ログイン成功',
        description: 'ログインしました',
      });
      return { isAdmin: false };
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
      throw err;
    }
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      if (email === 'admin') {
        toast({
          title: 'エラー',
          description: '管理者アカウントは登録できません',
          variant: 'destructive'
        });
        throw new Error('管理者アカウントは登録できません');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            isAdmin: false
          }
        }
      });

      if (error) {
        toast({
          title: 'エラー',
          description: '登録に失敗しました',
          variant: 'destructive'
        });
        throw error;
      }

      toast({
        title: '登録完了',
        description: 'アカウントが作成されました',
      });

      return data;
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : '登録に失敗しました。');
      throw err;
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      if (user?.role === 'admin') {
        localStorage.removeItem('adminSession');
        setUser(null);
        toast({
          title: 'ログアウト',
          description: '管理者アカウントからログアウトしました',
        });
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) {
          toast({
            title: 'エラー',
            description: 'ログアウトに失敗しました',
            variant: 'destructive'
          });
          throw error;
        }
        setUser(null);
        toast({
          title: 'ログアウト',
          description: 'ログアウトしました',
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました。');
      throw err;
    }
  }, [user, toast]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
};

export default useAuth;
