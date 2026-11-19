import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="font-display text-4xl">Nu găsesc pagina</h1>
      <Link href="/" className="mt-6 inline-block font-semibold text-terracotta">
        Înapoi la rețete
      </Link>
    </div>
  );
}
