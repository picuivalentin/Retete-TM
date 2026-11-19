import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Pune TURSO_DATABASE_URL și TURSO_AUTH_TOKEN în .env.local, apoi rulează din nou.");
  process.exit(1);
}

const localFile = path.join(process.cwd(), "data", "cookbook.sqlite").replace(/\\/g, "/");
if (!fs.existsSync(localFile)) {
  console.error("Nu există data/cookbook.sqlite de copiat.");
  process.exit(1);
}

const local = createClient({ url: `file:${localFile}` });
const remote = createClient({ url, authToken });

await remote.execute(`
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
)`);

const rows = await local.execute("SELECT * FROM recipes");
for (const row of rows.rows) {
  await remote.execute({
    sql: `INSERT INTO recipes (
      id, source_url, language, title, image_url, prep_minutes, total_minutes,
      servings, yield_text, tools, ingredients, instructions, category,
      category_locked, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source_url = excluded.source_url,
      language = excluded.language,
      title = excluded.title,
      image_url = excluded.image_url,
      prep_minutes = excluded.prep_minutes,
      total_minutes = excluded.total_minutes,
      servings = excluded.servings,
      yield_text = excluded.yield_text,
      tools = excluded.tools,
      ingredients = excluded.ingredients,
      instructions = excluded.instructions,
      category = excluded.category,
      category_locked = excluded.category_locked,
      note = excluded.note,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at`,
    args: [
      row.id,
      row.source_url,
      row.language,
      row.title,
      row.image_url,
      row.prep_minutes,
      row.total_minutes,
      row.servings,
      row.yield_text,
      row.tools,
      row.ingredients,
      row.instructions,
      row.category,
      row.category_locked,
      row.note,
      row.created_at,
      row.updated_at,
    ],
  });
}

console.log(`Copiate ${rows.rows.length} rețete în Turso.`);
