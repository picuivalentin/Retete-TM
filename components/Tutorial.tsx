"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Device = "desktop" | "mobile";

type Step = {
  src: string;
  title: string;
  text: string;
};

const STEPS: Record<Device, Step[]> = {
  desktop: [
    {
      src: "/tutorial/desktop-1.jpeg",
      title: "Deschide pe Cookidoo",
      text: "Din pagina cu rețete, apasă pe butonul „Deschide pe Cookidoo”.",
    },
    {
      src: "/tutorial/desktop-2.jpeg",
      title: "Autentificare",
      text: "Pe site-ul Cookidoo, apasă Autentificare, în dreapta sus.",
    },
    {
      src: "/tutorial/desktop-3.jpeg",
      title: "E-mail și parolă",
      text: "Introdu adresa de e-mail și parola contului Cookidoo, apoi apasă Autentificare.",
    },
    {
      src: "/tutorial/desktop-4.jpeg",
      title: "Rețete create",
      text: "Apasă pe cele trei puncte și alege „Adăugare la Rețete create”.",
    },
    {
      src: "/tutorial/desktop-5.jpeg",
      title: "Finalizare",
      text: "Apasă pe Finalizare. Rețeta rămâne salvată la tine și o poți găti pe Thermomix.",
    },
  ],
  mobile: [
    {
      src: "/tutorial/mobile-1.jpeg",
      title: "Deschide pe Cookidoo",
      text: "Din pagina cu rețete, apasă pe butonul „Deschide pe Cookidoo”.",
    },
    {
      src: "/tutorial/mobile-2.jpeg",
      title: "Deschide meniul",
      text: "Pe Cookidoo, apasă pe Meniu (☰) din stânga sus.",
    },
    {
      src: "/tutorial/mobile-3.jpeg",
      title: "Alege Autentificare",
      text: "Din meniu, alege Autentificare.",
    },
    {
      src: "/tutorial/mobile-4.jpeg",
      title: "E-mail și parolă",
      text: "Introdu e-mailul și parola contului Cookidoo, apoi apasă Autentificare.",
    },
    {
      src: "/tutorial/mobile-5.jpeg",
      title: "Rețete create",
      text: "Apasă pe cele trei puncte și alege „Adăugare la Rețete create”.",
    },
    {
      src: "/tutorial/mobile-6.jpeg",
      title: "Finalizare",
      text: "Apasă pe Finalizare. Rețeta este o copie privată și o găsești în rețetele tale de pe Thermomix.",
    },
  ],
};

export function Tutorial() {
  const [device, setDevice] = useState<Device | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    setDevice(mobile ? "mobile" : "desktop");
  }, []);

  const steps = device ? STEPS[device] : [];
  const step = steps[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!device) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(current + 1, STEPS[device].length - 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(current - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [device]);

  function choose(next: Device) {
    setDevice(next);
    setIndex(0);
  }

  return (
    <div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Cum salvezi o rețetă</h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            Deschide rețeta pe Cookidoo, autentifică-te și adaug-o la Rețete create. Apoi o găsești pe
            Thermomix.
          </p>
        </div>
        <div
          className="inline-flex w-fit rounded-full border border-[#e4d5c3] bg-card p-1"
          role="tablist"
          aria-label="Varianta tutorialului"
        >
          {(
            [
              ["desktop", "Calculator"],
              ["mobile", "Telefon"],
            ] as const
          ).map(([id, label]) => {
            const active = device === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => choose(id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                  active ? "bg-terracotta text-white" : "text-ink hover:bg-cream-deep"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {device && step ? (
        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start">
          <div className="order-1 lg:col-start-1 lg:row-start-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Pasul {index + 1} din {steps.length}
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-tight">{step.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{step.text}</p>
          </div>

          <figure className="order-2 overflow-hidden rounded-[28px] border border-[#eadfce] bg-card shadow-[0_20px_50px_-36px_rgba(36,28,22,0.8)] lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={step.src}
              src={step.src}
              alt={`${step.title}. ${step.text}`}
              className="mx-auto max-h-[72vh] w-full bg-[#f7f1e8] object-contain"
            />
          </figure>

          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <ol className="grid gap-2">
              {steps.map((item, itemIndex) => {
                const active = itemIndex === index;
                return (
                  <li key={item.src}>
                    <button
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      aria-current={active ? "step" : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold ${
                        active ? "bg-terracotta text-white" : "bg-card text-ink hover:bg-cream-deep"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                          active ? "bg-white/20" : "bg-cream-deep text-ink"
                        }`}
                      >
                        {itemIndex + 1}
                      </span>
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIndex((current) => Math.max(current - 1, 0))}
                disabled={index === 0}
                className="rounded-full border border-[#e4d5c3] bg-card px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
              >
                Înapoi
              </button>
              {index === steps.length - 1 ? (
                <Link
                  href="/"
                  className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Înapoi la rețete
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIndex((current) => current + 1)}
                  className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Pasul următor
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 h-[28rem] animate-pulse rounded-[28px] bg-card" />
      )}
    </div>
  );
}
