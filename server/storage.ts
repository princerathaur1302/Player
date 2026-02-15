
import { db } from "./db";
import {
  history,
  type InsertHistory,
  type HistoryItem
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getHistory(): Promise<HistoryItem[]>;
  createHistory(item: InsertHistory): Promise<HistoryItem>;
  clearHistory(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getHistory(): Promise<HistoryItem[]> {
    return await db.select().from(history).orderBy(desc(history.createdAt)).limit(10);
  }

  async createHistory(item: InsertHistory): Promise<HistoryItem> {
    const [newItem] = await db.insert(history).values(item).returning();
    return newItem;
  }

  async clearHistory(): Promise<void> {
    await db.delete(history);
  }
}

export const storage = new DatabaseStorage();
