import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Rețete Thermomix",
    template: "%s · Rețete Thermomix",
  },
  description: "Rețete Thermomix - create cu pasiune.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
