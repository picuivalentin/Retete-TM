import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { reorderRecipes } from "@/lib/recipes";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  if (!body || !Array.isArray(body.ids) || body.ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Lista de ordine este invalidă." }, { status: 400 });
  }

  await reorderRecipes(body.ids);
  return NextResponse.json({ ok: true });
}
