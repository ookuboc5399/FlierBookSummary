import { createClient } from '@supabase/supabase-js';
import type { Express } from "express";
import { users } from "@db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { supabase, createAdminUser } from './supabase-auth';

// extend express user object with our schema
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: string;
      isAdmin: boolean;
    }
  }
}

export function setupAuth(app: Express) {
  // Initialize admin user during setup
  createAdminUser().catch(console.error);

  // Setup admin endpoint
  app.post("/api/auth/setup-admin", async (req, res) => {
    try {
      const adminUser = await createAdminUser();
      res.json({ message: "管理者アカウントを設定しました", user: adminUser });
    } catch (error: any) {
      console.error('Setup admin error:', error);
      res.status(500).json({
        message: "管理者アカウントの設定に失敗しました",
        error: error.message
      });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Don't allow registration with admin email
      if (email === 'admin') {
        return res.status(400).json({
          message: '管理者アカウントは登録できません'
        });
      }

      const { data: user, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user'
          }
        }
      });

      if (error) throw error;

      res.json({
        message: "登録が完了しました",
        user: {
          id: user.user?.id,
          email: user.user?.email,
          role: 'user',
          isAdmin: false
        }
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || '登録に失敗しました'
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: email === 'admin' ? 'admin@example.com' : email,
        password
      });

      if (error) throw error;

      if (!user) {
        throw new Error('ユーザー情報が見つかりません');
      }

      const isAdmin = user.email === 'admin@example.com';

      res.json({
        message: "ログインに成功しました",
        user: {
          id: user.id,
          email: user.email || '',
          role: isAdmin ? 'admin' : 'user',
          isAdmin
        }
      });
    } catch (error: any) {
      res.status(401).json({
        message: '認証に失敗しました。認証情報を確認してください。'
      });
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      res.json({ message: "ログアウトしました" });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'ログアウトに失敗しました'
      });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        return res.status(401).json({
          message: 'ログインしていません'
        });
      }

      const isAdmin = user.email === 'admin@example.com';

      res.json({
        id: user.id,
        email: user.email,
        role: isAdmin ? 'admin' : 'user',
        isAdmin
      });
    } catch (error: any) {
      res.status(401).json({
        message: error.message || 'ユーザー情報の取得に失敗しました'
      });
    }
  });
}
