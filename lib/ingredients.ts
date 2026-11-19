import { fold } from "@/lib/text";

const UNITS = [
  "lingurite",
  "lingurita",
  "linguri",
  "lingura",
  "grame",
  "gram",
  "kg",
  "gr",
  "g",
  "ml",
  "litri",
  "litru",
  "l",
  "bucati",
  "bucata",
  "buc",
  "cesti",
  "ceasca",
  "cani",
  "cana",
  "catei",
  "catel",
  "plicuri",
  "plic",
  "legaturi",
  "legatura",
];

const CANONICAL: Record<string, string> = {
  g: "g",
  gr: "g",
  gram: "g",
  grame: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  litru: "l",
  litri: "l",
  lingura: "lingură",
  linguri: "lingură",
  lingurita: "linguriță",
  lingurite: "linguriță",
  buc: "buc",
  bucata: "buc",
  bucati: "buc",
  cana: "cană",
  cani: "cană",
  ceasca: "ceașcă",
  cesti: "ceașcă",
  catel: "cățel",
  catei: "cățel",
  plic: "plic",
  plicuri: "plic",
  legatura: "legătură",
  legaturi: "legătură",
};

export type ShopItem = {
  key: string;
  label: string;
  name: string;
};

function parseQty(raw: string) {
  const compact = raw.replace(/\s+/g, "");
  if (compact.includes("/")) {
    const [left, right] = compact.split("/").map(Number);
    if (!left || !right) return null;
    return left / right;
  }
  const value = Number(compact.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function formatQty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

function parseLine(line: string) {
  const trimmed = line.trim();
  const match = trimmed.match(/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return { qty: null, unit: null as string | null, name: trimmed };

  const qty = parseQty(match[1]);
  const rest = match[2].trim();
  const parts = rest.split(/\s+/).filter(Boolean);
  const token = fold(parts[0]?.replace(/\.$/, "") ?? "");
  if (token && UNITS.includes(token) && parts.length > 1) {
    return {
      qty,
      unit: CANONICAL[token] ?? token,
      name: parts.slice(1).join(" "),
    };
  }

  return { qty, unit: null, name: rest || trimmed };
}

export function aggregateIngredients(lines: string[]): ShopItem[] {
  const groups = new Map<
    string,
    { qty: number | null; unit: string | null; name: string; countable: boolean }
  >();

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed.name) continue;
    const countable = parsed.qty != null;
    const key = `${countable ? "q" : "n"}|${parsed.unit ?? ""}|${fold(parsed.name)}`;
    const current = groups.get(key);
    if (!current) {
      groups.set(key, {
        qty: parsed.qty,
        unit: parsed.unit,
        name: parsed.name,
        countable,
      });
      continue;
    }
    if (current.countable && parsed.qty != null && current.qty != null) {
      current.qty += parsed.qty;
    }
  }

  return [...groups.entries()].map(([key, item]) => {
    const amount = [item.qty != null ? formatQty(item.qty) : "", item.unit ?? ""]
      .filter(Boolean)
      .join(" ");
    return {
      key,
      name: item.name,
      label: amount ? `${amount} ${item.name}` : item.name,
    };
  });
}
