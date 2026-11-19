import { Gallery } from "@/components/Gallery";
import { listRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recipes = await listRecipes();
  return <Gallery recipes={recipes} />;
}
