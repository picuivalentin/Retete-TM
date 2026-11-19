import { type Category } from "@/lib/categories";
import { fold } from "@/lib/text";

type Term = { text: string; titleOnly?: boolean };

type Rule = {
  category: Category;
  priority: number;
  terms: Term[];
};

const RULES: Rule[] = [
  {
    category: "Băutură",
    priority: 3,
    terms: [
      { text: "smoothie" },
      { text: "limonadă" },
      { text: "cafea" },
      { text: "cappuccino" },
      { text: "ceai" },
      { text: "cocktail" },
      { text: "milkshake" },
      { text: "frappe" },
      { text: "ciocolată caldă" },
      { text: "băutură" },
    ],
  },
  {
    category: "Supă",
    priority: 1,
    terms: [
      { text: "supă" },
      { text: "ciorbă" },
      { text: "borș" },
      { text: "gazpacho" },
      { text: "cremă de legume" },
    ],
  },
  {
    category: "Salată",
    priority: 2,
    terms: [{ text: "salată" }, { text: "salad" }],
  },
  {
    category: "Pâine",
    priority: 4,
    terms: [
      { text: "pâine" },
      { text: "focaccia" },
      { text: "covrig" },
      { text: "baghetă" },
      { text: "lipie" },
    ],
  },
  {
    category: "Sos",
    priority: 5,
    terms: [
      { text: "sos" },
      { text: "maioneză" },
      { text: "pesto" },
      { text: "vinaigrette" },
      { text: "dressing" },
      { text: "bechamel" },
      { text: "beșamel" },
      { text: "gem" },
      { text: "dulceață" },
    ],
  },
  {
    category: "Mic dejun",
    priority: 6,
    terms: [
      { text: "omletă" },
      { text: "porridge" },
      { text: "granola" },
      { text: "fulgi de ovăz" },
      { text: "mic dejun" },
      { text: "pancakes" },
    ],
  },
  {
    category: "Aperitiv",
    priority: 7,
    terms: [
      { text: "aperitiv" },
      { text: "bruschete" },
      { text: "hummus" },
      { text: "guacamole" },
      { text: "tartinabil" },
      { text: "dip" },
    ],
  },
  {
    category: "Desert",
    priority: 8,
    terms: [
      { text: "tort" },
      { text: "prăjitură" },
      { text: "prăjituri" },
      { text: "budincă" },
      { text: "cheesecake" },
      { text: "brownie" },
      { text: "fursec" },
      { text: "fursecuri" },
      { text: "înghețată" },
      { text: "clătite" },
      { text: "negresă" },
      { text: "amandină" },
      { text: "savarină" },
      { text: "ecler" },
      { text: "tiramisu" },
      { text: "cozonac" },
      { text: "pască" },
      { text: "gogoși" },
      { text: "brioșe" },
      { text: "muffin" },
      { text: "biscuiți" },
      { text: "pandișpan" },
      { text: "panna cotta" },
      { text: "mousse" },
      { text: "chec" },
      { text: "desert" },
      { text: "ciocolată", titleOnly: true },
      { text: "cacao", titleOnly: true },
    ],
  },
  {
    category: "Fel principal",
    priority: 9,
    terms: [
      { text: "pui" },
      { text: "porc" },
      { text: "vită" },
      { text: "vițel" },
      { text: "pește" },
      { text: "somon" },
      { text: "ton" },
      { text: "creveți" },
      { text: "curcan" },
      { text: "miel" },
      { text: "rață" },
      { text: "mușchi" },
      { text: "tocăniță" },
      { text: "tocană" },
      { text: "sarmale" },
      { text: "chiftele" },
      { text: "șnițel" },
      { text: "lasagna" },
      { text: "lasagne" },
      { text: "risotto" },
      { text: "paste" },
      { text: "spaghete" },
      { text: "pizza" },
      { text: "burger" },
      { text: "gulaș" },
      { text: "musaca" },
      { text: "quiche" },
      { text: "friptură" },
      { text: "ghiveci" },
      { text: "mâncare" },
    ],
  },
  {
    category: "Garnitură",
    priority: 10,
    terms: [
      { text: "piure" },
      { text: "garnitură" },
      { text: "orez" },
      { text: "couscous" },
      { text: "cușcuș" },
      { text: "cartofi" },
    ],
  },
];

function hasTerm(padded: string, term: string) {
  return padded.includes(` ${fold(term)} `);
}

export function categorize(title: string, ingredients: string[]): Category {
  const titleText = ` ${fold(title)} `;
  const ingredientText = ` ${fold(ingredients.join(" "))} `;
  let best: Category = "Altele";
  let bestScore = 0;
  let bestPriority = Number.POSITIVE_INFINITY;

  for (const rule of RULES) {
    let score = 0;
    for (const term of rule.terms) {
      if (hasTerm(titleText, term.text)) score += 3;
      else if (!term.titleOnly && hasTerm(ingredientText, term.text)) score += 1;
    }
    if (score === 0) continue;
    if (score > bestScore || (score === bestScore && rule.priority < bestPriority)) {
      best = rule.category;
      bestScore = score;
      bestPriority = rule.priority;
    }
  }

  return best;
}
