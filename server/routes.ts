import type { Express } from "express";
import { createServer } from "http";
import { db } from "../db";
import { books, summaries, favorites } from "@db/schema";
import { eq, and } from "drizzle-orm";
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

    // Get user's reading history for recommendations
    const userHistory = userId ? await db.query.bookViews.findMany({
      where: eq(bookViews.userId, userId),
      with: {
        book: {
          with: {
            summary: true,
          }
        }
      },
      limit: 10,
      orderBy: desc(bookViews.viewedAt),
    }) : [];

    // Create a map of categories and tags from user's history
    const userPreferences = userHistory.reduce((acc, view) => {
      if (view.book.category) {
        acc.categories[view.book.category] = (acc.categories[view.book.category] || 0) + 1;
      }
      view.book.tags?.forEach(tag => {
        acc.tags[tag] = (acc.tags[tag] || 0) + 1;
      });
      return acc;
    }, { categories: {}, tags: {} } as { categories: Record<string, number>, tags: Record<string, number> });

    // Score books based on user preferences
    const booksWithScore = results.map(book => {
      let score = 0;
      
      // Category matching
      if (book.category && userPreferences.categories[book.category]) {
        score += userPreferences.categories[book.category];
      }

      // Tag matching
      book.tags?.forEach(tag => {
        if (userPreferences.tags[tag]) {
          score += userPreferences.tags[tag];
        }
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
