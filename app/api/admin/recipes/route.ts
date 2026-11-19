import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listRecipes } from "@/lib/recipes";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }
  return NextResponse.json({ recipes: await listRecipes() });
}
