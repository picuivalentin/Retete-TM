"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { type Recipe } from "@/lib/types";

type ImportResult = {
  url: string;
  ok: boolean;
  title?: string;
  category?: string;
  updated?: boolean;
  error?: string;
};

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "Cererea a eșuat";
  } catch {
    return "Cererea a eșuat";
  }
}

export function AdminConsole() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { category: string; note: string }>>({});
  const [message, setMessage] = useState("");

  async function loadRecipes() {
    const response = await fetch("/api/admin/recipes");
    if (!response.ok) return;
    const body = (await response.json()) as { recipes: Recipe[] };
    setRecipes(body.recipes);
    setDrafts(
      Object.fromEntries(
        body.recipes.map((recipe) => [
          recipe.id,
          { category: recipe.category, note: recipe.note },
        ]),
      ),
    );
  }

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then(async (body: { ok: boolean }) => {
        setAuthed(body.ok);
        if (body.ok) await loadRecipes();
      })
      .finally(() => setReady(true));
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setAuthError(await readError(response));
      return;
    }
    setPassword("");
    setAuthed(true);
    await loadRecipes();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRecipes([]);
    setResults([]);
  }

  async function importLinks(event: React.FormEvent) {
    event.preventDefault();
    setImporting(true);
    setMessage("");
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setImporting(false);
    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }
    const body = (await response.json()) as { results: ImportResult[] };
    setResults(body.results);
    if (body.results.every((item) => item.ok)) setText("");
    await loadRecipes();
  }

  async function save(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setMessage("");
    const response = await fetch(`/api/admin/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }
    setMessage("Salvat.");
    await loadRecipes();
  }

  async function remove(recipe: Recipe) {
    if (!window.confirm(`Ștergi rețeta „${recipe.title}”?`)) return;
    const response = await fetch(`/api/admin/recipes/${recipe.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }
    await loadRecipes();
  }

  if (!ready) return <p className="text-ink-soft">Se încarcă…</p>;

  if (!authed) {
    return (
      <form
        onSubmit={login}
        className="mx-auto mt-10 max-w-md rounded-[28px] border border-[#eadfce] bg-card p-7"
      >
        <h1 className="font-display text-4xl">Administrare</h1>
        <p className="mt-2 text-ink-soft">Doar de aici se adaugă rețete.</p>
        <label className="mt-6 block">
          <span className="text-sm font-semibold">Parolă</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-2xl border border-[#e4d5c3] bg-white px-4 py-3 outline-none focus:border-terracotta"
          />
        </label>
        {authError ? <p className="mt-3 text-sm text-terracotta-deep">{authError}</p> : null}
        <button
          type="submit"
          className="mt-5 rounded-full bg-terracotta px-5 py-3 font-semibold text-white"
        >
          Intră
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Import</h1>
          <p className="mt-2 text-ink-soft">Un link Cookidoo pe linie, sau mai multe în același text.</p>
        </div>
        <button type="button" onClick={logout} className="text-sm font-semibold text-ink-soft hover:text-ink">
          Ieși
        </button>
      </div>

      <form onSubmit={importLinks} className="rounded-[28px] border border-[#eadfce] bg-card p-5 md:p-7">
        <label className="block">
          <span className="font-semibold">Linkuri</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={7}
            placeholder={"https://cookidoo.international/created-recipes/public/recipes/ro/...\nhttps://cookidoo.international/created-recipes/public/recipes/ro/..."}
            className="mt-2 w-full rounded-2xl border border-[#e4d5c3] bg-white px-4 py-3 outline-none focus:border-terracotta"
          />
        </label>
        <button
          type="submit"
          disabled={importing || text.trim().length === 0}
          className="mt-4 rounded-full bg-terracotta px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {importing ? "Se importă…" : "Importă"}
        </button>
        {message ? <p className="mt-4 text-sm text-ink-soft">{message}</p> : null}
        {results.length > 0 ? (
          <ul className="mt-5 space-y-2 text-sm">
            {results.map((result) => (
              <li key={result.url} className={result.ok ? "text-olive" : "text-terracotta-deep"}>
                {result.ok
                  ? `${result.updated ? "Actualizat" : "Adăugat"}: ${result.title} · ${result.category}`
                  : `${result.url} — ${result.error}`}
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <section>
        <h2 className="font-display text-3xl">Rețete salvate</h2>
        {recipes.length === 0 ? (
          <p className="mt-4 text-ink-soft">Încă nu ai importat nimic.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {recipes.map((recipe) => {
              const draft = drafts[recipe.id] ?? { category: recipe.category, note: recipe.note };
              return (
                <li key={recipe.id} className="rounded-[28px] border border-[#eadfce] bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl leading-tight">{recipe.title}</h3>
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm text-terracotta-deep underline"
                      >
                        Deschide pe Cookidoo
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(recipe)}
                      className="text-sm font-semibold text-terracotta-deep"
                    >
                      Șterge
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
                    <label className="block">
                      <span className="text-sm font-semibold">Categorie</span>
                      <select
                        value={draft.category}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [recipe.id]: { ...draft, category: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-2xl border border-[#e4d5c3] bg-white px-3 py-3"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">Notiță</span>
                      <textarea
                        value={draft.note}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [recipe.id]: { ...draft, note: event.target.value },
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-[#e4d5c3] bg-white px-3 py-3"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => save(recipe.id)}
                    className="mt-4 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white"
                  >
                    Salvează
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
