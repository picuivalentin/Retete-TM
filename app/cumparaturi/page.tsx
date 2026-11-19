import { ShoppingList } from "@/components/ShoppingList";
import { listRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export const metadata = { title: "Cumpărături" };

export default async function ShoppingPage() {
  const recipes = await listRecipes();
  return <ShoppingList recipes={recipes} />;
}
