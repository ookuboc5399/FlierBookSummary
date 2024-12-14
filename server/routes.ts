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

  // Get all summaries with favorite status for current user
  app.get("/api/summaries", async (req, res) => {
    const userId = req.user?.id;
    const results = await db.query.books.findMany({
      with: {
        summary: true,
        favorites: true,
      },
    });

    const booksWithFavorites = results.map((book) => ({
      ...book,
      summary: book.summary[0] || null,
      isFavorite: book.favorites.some((f) => f.userId === userId),
    }));

    res.json(booksWithFavorites);
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
