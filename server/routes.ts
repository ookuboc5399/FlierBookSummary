import type { Express, Request, Response, RequestHandler } from "express";
import { createServer } from "http";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { setupAuth } from "./auth";
import { processBookSummary } from "./openai";
import type { CreateBookInput } from "../client/src/types";
import type { User } from "../db/schema";
import { supabase } from './supabase-auth';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool, { schema });

// Type aliases for route handlers
type BookParams = { bookId: string };
type PreferencesBody = {
  displayName: string;
  preferredCategories: string[];
  preferredTags: string[];
  emailNotifications: boolean;
  darkMode: boolean;
};

// Use Express's built-in types with our extended Request
type AuthenticatedHandler<P = any, ResBody = any, ReqBody = any> = RequestHandler<P, ResBody, ReqBody>;

export function registerRoutes(app: Express) {
  setupAuth(app);

  const getSummaries: AuthenticatedHandler = async (req, res) => {
    const userId = req.user?.id;
    const results = await db.query.books.findMany({
      with: {
        summary: true,
        favorites: true,
        views: true,
      },
    });

    if (userId) {
      const now = new Date();
      await db.insert(schema.bookViews).values(
        results.map((book: any) => ({
          userId,
          bookId: book.id,
          viewedAt: now,
        }))
      );
    }

    const [userHistory, userFavorites] = await Promise.all([
      userId ? db.query.bookViews.findMany({
        where: eq(schema.bookViews.userId, userId),
        with: {
          book: {
            with: {
              summary: true,
            }
          }
        },
        orderBy: desc(schema.bookViews.viewedAt),
      }) : Promise.resolve([]),
      userId ? db.query.favorites.findMany({
        where: eq(schema.favorites.userId, userId),
        with: {
          book: true,
        }
      }) : Promise.resolve([]),
    ]);

    const userPreferences = [...userHistory, ...userFavorites].reduce((acc, item) => {
      const book = 'book' in item ? item.book : item;
      if (book.category) {
        acc.categories[book.category] = (acc.categories[book.category] || 0) + 1;
      }
      book.tags?.forEach((tag: string) => {
        acc.tags[tag] = (acc.tags[tag] || 0) + 1;
      });
      if ('userId' in item) {
        if (book.category) {
          acc.categories[book.category] += 2;
        }
        book.tags?.forEach((tag: string) => {
          acc.tags[tag] += 2;
        });
      }
      return acc;
    }, { categories: {}, tags: {} } as { categories: Record<string, number>, tags: Record<string, number> });

    const booksWithScore = results.map((book: any) => {
      let score = 0;

      if (book.category && userPreferences.categories[book.category]) {
        score += userPreferences.categories[book.category] * 2;
      }

      const uniqueTags = new Set<string>(book.tags || []);
      Array.from(uniqueTags).forEach((tag: string) => {
        if (userPreferences.tags[tag]) {
          score += userPreferences.tags[tag];
        }
      });

      const ageInDays = (Date.now() - new Date(book.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - Math.floor(ageInDays / 30));

      return {
        ...book,
        summary: book.summary?.[0] || null,
        isFavorite: book.favorites?.some((f: { userId: number }) => f.userId === userId),
        recommendationScore: score,
      };
    });

    const sortedBooks = booksWithScore.sort((a: any, b: any) => b.recommendationScore - a.recommendationScore);

    res.json(sortedBooks);
  };

  const createBook: AuthenticatedHandler<{}, any, CreateBookInput> = async (req, res) => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.email !== 'admin') {
      return res.status(403).send("管理者権限が必要です");
    }

    const input = req.body as CreateBookInput;

    try {
      const { content, audioUrl } = await processBookSummary(input);

      const [book] = await db.insert(schema.books).values({
        title: input.title,
        author: input.author,
        coverUrl: input.coverUrl,
      }).returning();

      await db.insert(schema.summaries).values({
        bookId: book.id,
        content,
        audioUrl,
      });

      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  };

  const toggleFavorite: AuthenticatedHandler<BookParams> = async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Authentication required");
    }

    const bookId = parseInt(req.params.bookId);

    try {
      const [existing] = await db
        .select()
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.userId, req.user.id),
            eq(schema.favorites.bookId, bookId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .delete(schema.favorites)
          .where(eq(schema.favorites.id, existing.id));
      } else {
        await db.insert(schema.favorites).values({
          userId: req.user.id,
          bookId,
        });
      }

      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  };

  const updatePreferences: AuthenticatedHandler<{}, any, PreferencesBody> = async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Authentication required");
    }

    try {
      const [updatedUser] = await db
        .update(schema.users)
        .set({
          displayName: req.body.displayName,
          preferredCategories: req.body.preferredCategories,
          preferredTags: req.body.preferredTags,
          emailNotifications: req.body.emailNotifications,
          darkMode: req.body.darkMode,
        })
        .where(eq(schema.users.id, req.user.id))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  };

  app.get("/api/summaries", getSummaries);
  app.post("/api/books", createBook);
  app.post("/api/books/:bookId/favorite", toggleFavorite);
  app.put("/api/user/preferences", updatePreferences);

  const httpServer = createServer(app);
  return httpServer;
}
