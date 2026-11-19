"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function nextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/acces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Parolă greșită");
      setPending(false);
      return;
    }
    router.push(nextPath(params.get("next")));
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-10 max-w-md rounded-[28px] border border-[#eadfce] bg-card p-7"
    >
      <h1 className="font-display text-4xl">Intră în rețete</h1>
      <p className="mt-2 text-ink-soft">
        Parola se cere la prima vizită și rămâne ținută minte pe telefonul sau calculatorul
        ăsta timp de 30 de zile.
      </p>
      <label className="mt-6 block">
        <span className="text-sm font-semibold">Parolă</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          className="mt-2 w-full rounded-2xl border border-[#e4d5c3] bg-white px-4 py-3 outline-none focus:border-terracotta"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-terracotta-deep">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-full bg-terracotta px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        Intră
      </button>
    </form>
  );
}

export function AccessGate() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Se încarcă…</p>}>
      <GateForm />
    </Suspense>
  );
}
