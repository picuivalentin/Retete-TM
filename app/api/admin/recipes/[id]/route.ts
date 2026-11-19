import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isCategory } from "@/lib/categories";
import { deleteRecipe, updateRecipe } from "@/lib/recipes";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { category?: unknown; note?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: "Date lipsă" }, { status: 400 });

  const patch: { category?: string; note?: string; categoryLocked?: boolean } = {};
  if ("category" in body) {
    if (typeof body.category !== "string" || !isCategory(body.category)) {
      return NextResponse.json({ error: "Categorie necunoscută" }, { status: 400 });
    }
    patch.category = body.category;
    patch.categoryLocked = true;
  }
  if ("note" in body) {
    if (typeof body.note !== "string" || body.note.length > 4000) {
      return NextResponse.json({ error: "Notița e prea lungă" }, { status: 400 });
    }
    patch.note = body.note;
  }

  const recipe = await updateRecipe(id, patch);
  if (!recipe) return NextResponse.json({ error: "Rețeta nu există" }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }
  const { id } = await context.params;
  const removed = await deleteRecipe(id);
  if (!removed) return NextResponse.json({ error: "Rețeta nu există" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
