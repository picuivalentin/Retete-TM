import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { extractCookidooLinks } from "@/lib/cookidoo";
import { importCookidooLink } from "@/lib/recipes";

const MAX_LINKS = 30;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text : "";
  if (text.length > 20000) {
    return NextResponse.json({ error: "Textul e prea lung" }, { status: 400 });
  }

  const { links, rejected } = extractCookidooLinks(text);
  if (links.length === 0 && rejected.length === 0) {
    return NextResponse.json(
      { error: "Lipește cel puțin un link Cookidoo" },
      { status: 400 },
    );
  }
  if (links.length > MAX_LINKS) {
    return NextResponse.json(
      { error: `Poți importa cel mult ${MAX_LINKS} linkuri odată` },
      { status: 400 },
    );
  }

  const results = [];
  for (const url of rejected) {
    results.push({ url, ok: false, error: "Nu e un link de rețetă Cookidoo" });
  }
  for (const link of links) {
    try {
      const saved = await importCookidooLink(link);
      results.push({
        url: link.url,
        ok: true,
        title: saved.recipe.title,
        category: saved.recipe.category,
        updated: saved.updated,
      });
    } catch (error) {
      results.push({
        url: link.url,
        ok: false,
        error: error instanceof Error ? error.message : "Import eșuat",
      });
    }
  }

  return NextResponse.json({ results });
}
