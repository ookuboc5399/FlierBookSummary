import type { Express } from "express";
import { createServer } from "http";
import { db } from "../db";
import { books, summaries, favorites, bookViews, users } from "@db/schema"; // Added users import
import { eq, and, desc } from "drizzle-orm";
import { setupAuth } from "./auth";
import { processBookSummary } from "./openai";
import type { CreateBookInput } from "../client/src/types";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Get all summaries with favorite status and recommendations for current user
  app.get("/api/summaries", async (req, res) => {
    const userId = req.user?.id;
    const results = await db.query.books.findMany({
      with: {
        summary: true,
        favorites: true,
        views: true,
      },
    });

    // Record view for analytics if user is logged in
    if (userId) {
      const now = new Date();
      await db.insert(bookViews).values(
        results.map(book => ({
          userId,
          bookId: book.id,
          viewedAt: now,
        }))
      );
    }

    // Get user's reading history and favorites for recommendations
    const [userHistory, userFavorites] = await Promise.all([
      userId ? db.query.bookViews.findMany({
        where: eq(bookViews.userId, userId),
        with: {
          book: {
            with: {
              summary: true,
            }
          }
        },
        orderBy: desc(bookViews.viewedAt),
      }) : Promise.resolve([]),
      userId ? db.query.favorites.findMany({
        where: eq(favorites.userId, userId),
        with: {
          book: true,
        }
      }) : Promise.resolve([]),
    ]);

    // Create a map of categories and tags from user's history and favorites
    const userPreferences = [...userHistory, ...userFavorites].reduce((acc, item) => {
      const book = 'book' in item ? item.book : item;
      if (book.category) {
        acc.categories[book.category] = (acc.categories[book.category] || 0) + 1;
      }
      book.tags?.forEach(tag => {
        acc.tags[tag] = (acc.tags[tag] || 0) + 1;
      });
      // Favorites get higher weight
      if ('userId' in item) {
        if (book.category) {
          acc.categories[book.category] += 2;
        }
        book.tags?.forEach(tag => {
          acc.tags[tag] += 2;
        });
      }
      return acc;
    }, { categories: {}, tags: {} } as { categories: Record<string, number>, tags: Record<string, number> });

    // Score books based on user preferences with improved weighting
    const booksWithScore = results.map(book => {
      let score = 0;
      
      // Base score for category matching
      if (book.category && userPreferences.categories[book.category]) {
        score += userPreferences.categories[book.category] * 2; // カテゴリーマッチの重みを増加
      }

      // Weighted tag matching
      const uniqueTags = new Set(book.tags || []);
      uniqueTags.forEach(tag => {
        if (userPreferences.tags[tag]) {
          score += userPreferences.tags[tag];
        }
      });

      // Recency boost - newer books get slightly higher scores
      const ageInDays = (Date.now() - new Date(book.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - Math.floor(ageInDays / 30)); // 5ポイントから始まり、毎月1ポイント減少

      return {
        ...book,
        summary: book.summary[0] || null,
        isFavorite: book.favorites.some((f) => f.userId === userId),
        recommendationScore: score,
      };
    });

    // Sort by recommendation score (higher first) and limit to most relevant
    const sortedBooks = booksWithScore.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json(sortedBooks);
  });

  // Create new book with AI-enhanced summary
  app.post("/api/summaries", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Unauthorized");
    }

    const input = req.body as CreateBookInput;
    
    try {
      // Process the summary with OpenAI
      const { content, audioUrl } = await processBookSummary(input);

      // Create book and summary in transaction
      const [book] = await db.insert(books).values({
        title: input.title,
        author: input.author,
        coverUrl: input.coverUrl,
      }).returning();

      await db.insert(summaries).values({
        bookId: book.id,
        content,
        audioUrl,
      });

      res.json({ ok: true });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // Toggle favorite status
  app.post("/api/favorites/:bookId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const bookId = parseInt(req.params.bookId);
    
    try {
      const [existing] = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, req.user.id),
            eq(favorites.bookId, bookId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .delete(favorites)
          .where(eq(favorites.id, existing.id));
      } else {
        await db.insert(favorites).values({
          userId: req.user.id,
          bookId,
        });
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          displayName: req.body.displayName,
          preferredCategories: req.body.preferredCategories,
          preferredTags: req.body.preferredTags,
          emailNotifications: req.body.emailNotifications,
          darkMode: req.body.darkMode,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}