import React from 'react';
import useAuth from '../../hooks/use-auth';
import { Button } from '../../components/ui/button';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNavigateToBooks = () => {
    setLocation('/admin/books');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">管理者ダッシュボード</h1>
          <Button onClick={handleSignOut} variant="outline">
            ログアウト
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>本の管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">本の追加、編集、要約の管理を行います。</p>
              <Button onClick={handleNavigateToBooks}>本の管理へ</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
