import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  language: text("language").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  prepMinutes: integer("prep_minutes"),
  totalMinutes: integer("total_minutes"),
  servings: integer("servings"),
  yieldText: text("yield_text"),
  tools: text("tools").notNull(),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  category: text("category").notNull(),
  categoryLocked: integer("category_locked").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY NOT NULL,
  source_url TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  prep_minutes INTEGER,
  total_minutes INTEGER,
  servings INTEGER,
  yield_text TEXT,
  tools TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  category TEXT NOT NULL,
  category_locked INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

type Database = LibSQLDatabase<Record<string, never>>;

const globalForDb = globalThis as unknown as {
  tmClient?: Client;
  tmDb?: Database;
  tmSchema?: Promise<void>;
};

function client() {
  if (!globalForDb.tmClient) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      const authToken = process.env.TURSO_AUTH_TOKEN;
      if (!authToken) throw new Error("TURSO_AUTH_TOKEN lipsește.");
      globalForDb.tmClient = createClient({ url, authToken });
    } else {
      const dir = path.join(process.cwd(), "data");
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, "cookbook.sqlite").replace(/\\/g, "/");
      globalForDb.tmClient = createClient({ url: `file:${file}` });
    }
  }
  return globalForDb.tmClient;
}

export function db() {
  if (!globalForDb.tmDb) globalForDb.tmDb = drizzle(client());
  return globalForDb.tmDb;
}

export function ensureSchema() {
  if (!globalForDb.tmSchema) {
    globalForDb.tmSchema = client()
      .execute(CREATE_SQL)
      .then(() => undefined)
      .catch((error) => {
        globalForDb.tmSchema = undefined;
        throw error;
      });
  }
  return globalForDb.tmSchema;
}
