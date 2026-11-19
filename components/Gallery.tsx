"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RecipeImage } from "@/components/RecipeImage";
import { CATEGORIES } from "@/lib/categories";
import { formatMinutes, formatServings } from "@/lib/format";
import { fold } from "@/lib/text";
import { type Recipe } from "@/lib/types";

const TIME_OPTIONS = [
  { id: "all", label: "Orice timp" },
  { id: "30", label: "Sub 30 min" },
  { id: "60", label: "Sub 1 oră" },
  { id: "120", label: "Sub 2 ore" },
];

const SORT_OPTIONS = [
  { id: "ordine", label: "Ordinea mea" },
  { id: "data", label: "După dată" },
  { id: "nume", label: "După nume" },
];

function metaLine(recipe: Recipe) {
  return [
    recipe.prepMinutes != null ? `${formatMinutes(recipe.prepMinutes)} prep` : null,
    formatMinutes(recipe.totalMinutes),
    formatServings(recipe.servings, recipe.yieldText),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function Gallery({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toate");
  const [time, setTime] = useState("all");
  const [tool, setTool] = useState("toate");
  const [sort, setSort] = useState("ordine");

  const tools = useMemo(() => {
    const names = new Set<string>();
    for (const recipe of recipes) {
      for (const item of recipe.tools) names.add(item);
    }
    return [...names].sort();
  }, [recipes]);

  const visible = useMemo(() => {
    const filtered = recipes.filter((recipe) => {
      if (category !== "Toate" && recipe.category !== category) return false;
      if (time !== "all") {
        if (recipe.totalMinutes == null || recipe.totalMinutes > Number(time)) return false;
      }
      if (tool !== "toate") {
        const wanted = tool.toLowerCase();
        if (!recipe.tools.some((item) => item.toLowerCase().includes(wanted))) return false;
      }
      const needle = fold(query);
      if (!needle) return true;
      const haystack = fold(`${recipe.title} ${recipe.ingredients.join(" ")}`);
      return haystack.includes(needle);
    });

    return filtered.sort((a, b) => {
      if (sort === "nume") {
        return a.title.localeCompare(b.title, "ro", { sensitivity: "base" });
      }
      if (sort === "data") return b.createdAt - a.createdAt;
      return a.sortOrder - b.sortOrder;
    });
  }, [recipes, query, category, time, tool, sort]);

  const categories = ["Toate", ...CATEGORIES.filter((item) => recipes.some((recipe) => recipe.category === item))];

  if (recipes.length === 0) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <p className="font-display text-4xl text-ink">Nicio rețetă încă</p>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Adaugă un link Cookidoo sau mai multe din pagina de administrare, la
          adresa <span className="font-semibold text-ink">/admin</span>.
        </p>
      </section>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Rețete</h1>
          <p className="mt-2 text-ink-soft">
            {visible.length === recipes.length
              ? `${recipes.length} ${recipes.length === 1 ? "rețetă" : "rețete"}`
              : `${visible.length} din ${recipes.length}`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12.5rem_15rem_14rem]">
        <label className="block">
          <span className="sr-only">Caută</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută în titlu și ingrediente"
            className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
          />
        </label>
        <label className="block">
          <span className="sr-only">Timp</span>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Thermomix</span>
          <select
            value={tool}
            onChange={(event) => setTool(event.target.value)}
            className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
          >
            <option value="toate">Toate modelele</option>
            {tools.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Sortare</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-full rounded-2xl border border-[#e4d5c3] bg-card px-4 py-3 text-ink outline-none focus:border-terracotta"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                active ? "bg-terracotta text-white" : "bg-card text-ink hover:bg-cream-deep"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-lg text-ink-soft">Nicio rețetă nu se potrivește.</p>
      ) : (
        <ul className="mt-6 grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((recipe) => (
            <li key={recipe.id} className="h-full">
              <Link
                href={`/reteta/${recipe.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#eadfce] bg-card shadow-[0_20px_50px_-36px_rgba(36,28,22,0.8)]"
              >
                <RecipeImage
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="aspect-square w-full shrink-0 object-cover"
                />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex h-7 items-center gap-2">
                    <span className="rounded-full bg-cream-deep px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
                      {recipe.category}
                    </span>
                  </div>
                  <h2 className="line-clamp-2 min-h-[3.75rem] font-display text-2xl leading-tight tracking-tight group-hover:text-terracotta-deep">
                    {recipe.title}
                  </h2>
                  <p className="text-sm text-ink-soft">{metaLine(recipe) || "Cookidoo"}</p>
                  <p className="mt-auto text-sm font-semibold text-tm">
                    {recipe.tools.join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
