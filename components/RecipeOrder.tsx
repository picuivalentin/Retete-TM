"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RecipeImage } from "@/components/RecipeImage";
import { type Recipe } from "@/lib/types";

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "Cererea a eșuat";
  } catch {
    return "Cererea a eșuat";
  }
}

function moveItem(list: Recipe[], from: number, to: number) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function RecipeOrder() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const draggingRef = useRef<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRecipes() {
    const response = await fetch("/api/admin/recipes");
    if (!response.ok) return;
    const body = (await response.json()) as { recipes: Recipe[] };
    setRecipes(body.recipes);
    setDirty(false);
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

  function place(from: number, to: number) {
    setRecipes((current) => moveItem(current, from, to));
    setDirty(true);
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: recipes.map((recipe) => recipe.id) }),
    });
    setSaving(false);
    if (!response.ok) {
      setMessage(await readError(response));
      return;
    }
    setDirty(false);
    setMessage("Ordinea a fost salvată.");
  }

  if (!ready) return <p className="text-ink-soft">Se încarcă…</p>;

  if (!authed) {
    return (
      <form
        onSubmit={login}
        className="mx-auto mt-10 max-w-md rounded-[28px] border border-[#eadfce] bg-card p-7"
      >
        <h1 className="font-display text-4xl">Ordinea rețetelor</h1>
        <p className="mt-2 text-ink-soft">Intră cu parola de administrare.</p>
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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Ordinea rețetelor</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Prima din listă apare prima pe site. Trage un rând sau folosește săgețile, apoi
            salvează.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-semibold text-tm">
          Înapoi la import
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-full bg-terracotta px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Se salvează…" : "Salvează ordinea"}
        </button>
        {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
      </div>

      <ul className="mt-6 space-y-2">
        {recipes.map((recipe, index) => (
          <li
            key={recipe.id}
            draggable
            onDragStart={() => {
              draggingRef.current = index;
              setDragging(index);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingRef.current != null) place(draggingRef.current, index);
              draggingRef.current = null;
              setDragging(null);
            }}
            className={`flex items-center gap-3 rounded-2xl border bg-card px-3 py-2 ${
              dragging === index ? "border-terracotta" : "border-[#eadfce]"
            }`}
          >
            <span className="w-8 shrink-0 text-center text-sm font-semibold text-ink-soft">
              {index + 1}
            </span>
            <RecipeImage
              src={recipe.imageUrl}
              alt=""
              className="size-14 shrink-0 rounded-xl bg-[#efe2d2] object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{recipe.title}</span>
              <span className="text-sm text-ink-soft">{recipe.category}</span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label={`Mută ${recipe.title} mai sus`}
                disabled={index === 0}
                onClick={() => place(index, index - 1)}
                className="rounded-full border border-[#eadfce] px-3 py-2 text-sm font-semibold disabled:opacity-30"
              >
                Sus
              </button>
              <button
                type="button"
                aria-label={`Mută ${recipe.title} mai jos`}
                disabled={index === recipes.length - 1}
                onClick={() => place(index, index + 1)}
                className="rounded-full border border-[#eadfce] px-3 py-2 text-sm font-semibold disabled:opacity-30"
              >
                Jos
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
