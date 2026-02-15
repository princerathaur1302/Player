
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We might want to save history of played videos
export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  referrer: text("referrer"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHistorySchema = createInsertSchema(history).omit({ id: true, createdAt: true });

export type HistoryItem = typeof history.$inferSelect;
export type InsertHistory = z.infer<typeof insertHistorySchema>;

// Request types
export const streamRequestSchema = z.object({
  url: z.string().url(),
  referrer: z.string().optional(),
});

export type StreamRequest = z.infer<typeof streamRequestSchema>;
