"use client";

import { useEffect, useMemo, useState } from "react";
import { RecipeImage } from "@/components/RecipeImage";
import { CATEGORIES } from "@/lib/categories";
import { aggregateIngredients } from "@/lib/ingredients";
import { fold } from "@/lib/text";
import { type Recipe } from "@/lib/types";

const STORAGE_KEY = "thermomix-shop";

export function ShoppingList({ recipes }: { recipes: Recipe[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toate");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { selected?: unknown; checked?: unknown };
        const known = new Set(recipes.map((recipe) => recipe.id));
        if (Array.isArray(parsed.selected)) {
          setSelected(parsed.selected.filter((id): id is string => typeof id === "string" && known.has(id)));
        }
        if (Array.isArray(parsed.checked)) {
          setChecked(parsed.checked.filter((id): id is string => typeof id === "string"));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, [recipes]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected, checked }));
  }, [selected, checked, hydrated]);

  const chosen = recipes.filter((recipe) => selected.includes(recipe.id));
  const items = useMemo(
    () => aggregateIngredients(chosen.flatMap((recipe) => recipe.ingredients)),
    [chosen],
  );
  const categories = [
    "Toate",
    ...CATEGORIES.filter((item) => recipes.some((recipe) => recipe.category === item)),
  ];
  const visible = useMemo(() => {
    const needle = fold(query);
    return recipes.filter((recipe) => {
      if (category !== "Toate" && recipe.category !== category) return false;
      if (!needle) return true;
      return fold(`${recipe.title} ${recipe.ingredients.join(" ")}`).includes(needle);
    });
  }, [recipes, query, category]);

  function toggleRecipe(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setCopied(false);
  }

  function toggleItem(key: string) {
    setChecked((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
    setCopied(false);
  }

  async function copyList() {
    const remaining = items.filter((item) => !checked.includes(item.key));
    const titles = chosen.map((recipe) => recipe.title).join(", ");
    const body = remaining.map((item) => `- ${item.label}`).join("\n");
    const text = `Rețete: ${titles}\n\n${body || "Totul e bifat."}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight md:text-5xl">Cumpărături</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Bifează rețetele. Ingredientele cu aceeași unitate se adună. Lista rămâne pe
        telefonul sau calculatorul ăsta.
      </p>

      {recipes.length === 0 ? (
        <p className="mt-10 text-lg text-ink-soft">Nu există rețete din care să faci lista.</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Rețete</h2>
              <button
                type="button"
                onClick={() => {
                  setSelected([]);
                  setCopied(false);
                }}
                className="text-sm font-semibold text-ink-soft hover:text-ink"
              >
                Golește
              </button>
            </div>
            <div className="mb-3 flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Caută</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Caută în titlu și ingrediente"
                  className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
                />
              </label>
              <label className="w-48 shrink-0">
                <span className="sr-only">Categorie</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {visible.length === 0 ? (
              <p className="text-ink-soft">Nicio rețetă nu se potrivește.</p>
            ) : (
            <ul className="space-y-2">
              {visible.map((recipe) => {
                const active = selected.includes(recipe.id);
                return (
                  <li key={recipe.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 ${
                        active ? "border-terracotta bg-[#fff4ec]" : "border-[#eadfce] bg-card"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleRecipe(recipe.id)}
                        className="size-5 accent-terracotta"
                      />
                      <RecipeImage
                        src={recipe.imageUrl}
                        alt=""
                        className="size-16 shrink-0 rounded-xl bg-[#efe2d2] object-contain"
                      />
                      <span>
                        <span className="block font-semibold leading-snug">{recipe.title}</span>
                        <span className="text-sm text-ink-soft">{recipe.category}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            )}
          </section>

          <section className="rounded-[28px] border border-[#eadfce] bg-card p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl">De luat</h2>
              <button
                type="button"
                onClick={copyList}
                disabled={chosen.length === 0}
                className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? "Copiat" : "Copiază ce a rămas"}
              </button>
            </div>
            {chosen.length === 0 ? (
              <p className="mt-6 text-ink-soft">Alege rețetele pentru care faci cumpărăturile.</p>
            ) : items.length === 0 ? (
              <p className="mt-6 text-ink-soft">Rețetele alese nu au ingrediente salvate.</p>
            ) : (
              <ul className="mt-5 space-y-2">
                {items.map((item) => {
                  const done = checked.includes(item.key);
                  return (
                    <li key={item.key}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl px-2 py-2 hover:bg-cream">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleItem(item.key)}
                          className="mt-1 size-5 accent-olive"
                        />
                        <span className={`text-lg leading-snug ${done ? "text-ink-soft line-through" : ""}`}>
                          {item.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
