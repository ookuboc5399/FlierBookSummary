import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const booksRelations = relations(books, ({ one, many }) => ({
  summary: one(summaries, {
    fields: [books.id],
    references: [summaries.bookId],
  }),
  favorites: many(favorites),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  book: one(books, {
    fields: [summaries.bookId],
    references: [books.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [favorites.bookId],
    references: [books.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertBookSchema = createInsertSchema(books);
export const selectBookSchema = createSelectSchema(books);

export const insertSummarySchema = createInsertSchema(summaries);
export const selectSummarySchema = createSelectSchema(summaries);

export const insertFavoriteSchema = createInsertSchema(favorites);
export const selectFavoriteSchema = createSelectSchema(favorites);

// Types
export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Summary = typeof summaries.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
