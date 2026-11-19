"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Rețete" },
  { href: "/cumparaturi", label: "Cumpărături" },
];

function linkClass(active: boolean) {
  return active ? "text-tm" : "text-ink-soft hover:text-ink";
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gate = pathname === "/intrare";

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <a
        href="#continut"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Sari la conținut
      </a>
      <header className="sticky top-0 z-20 border-b-2 border-tm bg-[#f4eee4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            {/* Local copy of the official wordmark. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thermomix-logo.svg" alt="Thermomix" className="h-7 w-auto md:h-8" />
            <span className="font-display text-2xl tracking-tight text-ink">Rețete Thermomix</span>
          </Link>
          {gate ? null : (
          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} className={linkClass(active)}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          )}
        </div>
      </header>
      <main id="continut" className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {children}
      </main>
      {gate ? null : (
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-tm bg-[#fffaf4]/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-2">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-4 text-center text-sm font-semibold ${linkClass(active)}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
