export const CATEGORIES = [
  "Mic dejun",
  "Aperitiv",
  "Supă",
  "Fel principal",
  "Garnitură",
  "Salată",
  "Desert",
  "Pâine",
  "Băutură",
  "Sos",
  "Altele",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
