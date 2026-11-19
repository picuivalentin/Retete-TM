import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeImage } from "@/components/RecipeImage";
import { formatMinutes, formatServings } from "@/lib/format";
import { getRecipe } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  return { title: recipe?.title ?? "Rețetă" };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const prep = formatMinutes(recipe.prepMinutes);
  const total = formatMinutes(recipe.totalMinutes);
  const servings = formatServings(recipe.servings, recipe.yieldText);

  return (
    <article>
      <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Toate rețetele
      </Link>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-[280px_1fr] lg:grid-cols-[360px_1fr]">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.title}
          className="aspect-square w-full rounded-[28px] object-cover"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream-deep px-3 py-1 text-sm font-semibold">
              {recipe.category}
            </span>
            {recipe.tools.map((tool) => (
              <span key={tool} className="rounded-full bg-tm-soft px-3 py-1 text-sm font-semibold text-tm">
                {tool}
              </span>
            ))}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">
            {recipe.title}
          </h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {prep ? <Stat label="Preparare" value={prep} /> : null}
            {total ? <Stat label="Total" value={total} /> : null}
            {servings ? <Stat label="Porții" value={servings} /> : null}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] border border-[#eadfce] bg-card p-6 md:p-8">
          <h2 className="font-display text-3xl">Ingrediente</h2>
          {recipe.ingredients.length === 0 ? (
            <p className="mt-4 text-ink-soft">Nu am găsit ingrediente pe pagina publică.</p>
          ) : (
            <ul className="mt-5 space-y-3 text-xl leading-relaxed">
              {recipe.ingredients.map((item) => (
                <li key={item} className="border-b border-[#f0e4d6] pb-3 last:border-0">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#eadfce] bg-card p-6 md:p-8">
            <h2 className="font-display text-3xl">Pași</h2>
            {recipe.instructions.length === 0 ? (
              <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-soft">
                <p>Pașii sunt disponibili doar în Cookidoo.</p>
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-terracotta px-5 py-3 font-semibold text-white"
                >
                  Deschide pe Cookidoo
                </a>
              </div>
            ) : (
              <ol className="mt-5 space-y-5">
                {recipe.instructions.map((step, index) => (
                  <li key={`${index}-${step.slice(0, 24)}`} className="flex gap-4 text-lg leading-relaxed">
                    <span className="font-display text-3xl text-terracotta">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {recipe.note.trim() ? (
            <section className="rounded-[28px] border border-[#d7e3d6] bg-[#f4f8f3] p-6 md:p-8">
              <h2 className="font-display text-3xl">Notiță</h2>
              <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">{recipe.note}</p>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
