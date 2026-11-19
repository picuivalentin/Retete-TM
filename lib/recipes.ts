import { desc, eq } from "drizzle-orm";
import { categorize } from "@/lib/categorize";
import { type CookidooLink, fetchCookidooRecipe, fullImageUrl } from "@/lib/cookidoo";
import { db, ensureSchema, recipes } from "@/lib/db";
import { type Recipe } from "@/lib/types";

type RecipeRow = typeof recipes.$inferSelect;

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    language: row.language,
    title: row.title,
    imageUrl: fullImageUrl(row.imageUrl),
    prepMinutes: row.prepMinutes,
    totalMinutes: row.totalMinutes,
    servings: row.servings,
    yieldText: row.yieldText,
    tools: parseList(row.tools),
    ingredients: parseList(row.ingredients),
    instructions: parseList(row.instructions),
    category: row.category,
    categoryLocked: row.categoryLocked === 1,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listRecipes() {
  await ensureSchema();
  const rows = await db().select().from(recipes).orderBy(desc(recipes.createdAt));
  return rows.map(toRecipe);
}

export async function getRecipe(id: string) {
  await ensureSchema();
  const rows = await db().select().from(recipes).where(eq(recipes.id, id)).limit(1);
  return rows[0] ? toRecipe(rows[0]) : null;
}

export async function importCookidooLink(link: CookidooLink) {
  const parsed = await fetchCookidooRecipe(link);
  const category = categorize(parsed.title, parsed.ingredients);
  const now = Date.now();
  await ensureSchema();
  const existingRows = await db()
    .select()
    .from(recipes)
    .where(eq(recipes.id, link.id))
    .limit(1);
  const existing = existingRows[0];

  const shared = {
    sourceUrl: link.url,
    language: link.language,
    title: parsed.title,
    imageUrl: parsed.imageUrl,
    prepMinutes: parsed.prepMinutes,
    totalMinutes: parsed.totalMinutes,
    servings: parsed.servings,
    yieldText: parsed.yieldText,
    tools: JSON.stringify(parsed.tools),
    ingredients: JSON.stringify(parsed.ingredients),
    instructions: JSON.stringify(parsed.instructions),
    updatedAt: now,
  };

  if (existing) {
    await db()
      .update(recipes)
      .set({
        ...shared,
        category: existing.categoryLocked ? existing.category : category,
        categoryLocked: existing.categoryLocked,
        note: existing.note,
      })
      .where(eq(recipes.id, link.id));
    const saved = await getRecipe(link.id);
    return { recipe: saved!, updated: true };
  }

  await db().insert(recipes).values({
    id: link.id,
    ...shared,
    category,
    categoryLocked: 0,
    note: "",
    createdAt: now,
  });
  const saved = await getRecipe(link.id);
  return { recipe: saved!, updated: false };
}

export async function updateRecipe(
  id: string,
  patch: { category?: string; note?: string; categoryLocked?: boolean },
) {
  await ensureSchema();
  const current = await getRecipe(id);
  if (!current) return null;
  await db()
    .update(recipes)
    .set({
      category: patch.category ?? current.category,
      note: patch.note ?? current.note,
      categoryLocked:
        patch.categoryLocked == null
          ? current.categoryLocked
            ? 1
            : 0
          : patch.categoryLocked
            ? 1
            : 0,
      updatedAt: Date.now(),
    })
    .where(eq(recipes.id, id));
  return getRecipe(id);
}

export async function deleteRecipe(id: string) {
  await ensureSchema();
  const current = await getRecipe(id);
  if (!current) return false;
  await db().delete(recipes).where(eq(recipes.id, id));
  return true;
}
