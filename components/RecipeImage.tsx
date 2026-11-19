"use client";

export function RecipeImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[#efe2d2] font-display text-5xl text-terracotta ${className ?? ""}`}
        aria-hidden
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    // Photos are served by Cookidoo and already include the largest public size.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
